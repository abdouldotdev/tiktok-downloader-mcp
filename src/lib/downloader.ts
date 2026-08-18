import fs from "node:fs";
import path from "node:path";
import type { TikTokPostData, AccountSummary } from "./tiktokApi.js";

/**
 * Downloads a video file (MP4) to a target directory
 */
export async function downloadVideoToFolder(
  videoUrl: string,
  folderPath: string,
  coverUrl?: string
): Promise<{ videoSaved: boolean; coverSaved: boolean }> {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const videoPath = path.join(folderPath, "video.mp4");
  const coverPath = path.join(folderPath, "cover.jpg");
  let videoSaved = false;
  let coverSaved = false;

  // 1. Download video
  if (!fs.existsSync(videoPath) || fs.statSync(videoPath).size < 10000) {
    try {
      const res = await fetch(videoUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Referer: "https://www.tiktok.com/",
        },
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(videoPath, buf);
        videoSaved = true;
      }
    } catch {}
  } else {
    videoSaved = true;
  }

  // 2. Download cover
  if (coverUrl && (!fs.existsSync(coverPath) || fs.statSync(coverPath).size < 1000)) {
    try {
      const res = await fetch(coverUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Referer: "https://www.tiktok.com/",
        },
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(coverPath, buf);
        coverSaved = true;
      }
    } catch {}
  } else if (fs.existsSync(coverPath)) {
    coverSaved = true;
  }

  return { videoSaved, coverSaved };
}

/**
 * Downloads an array of image URLs to a target directory
 */
export async function downloadImagesToFolder(
  images: string[],
  folderPath: string,
  coverUrl?: string
): Promise<number> {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  let count = 0;
  for (let i = 0; i < images.length; i++) {
    const imgUrl = images[i];
    const filename = `slide_${String(i + 1).padStart(2, "0")}.jpg`;
    const filePath = path.join(folderPath, filename);

    // Skip if already downloaded
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
      count++;
      continue;
    }

    try {
      const res = await fetch(imgUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Referer: "https://www.tiktok.com/",
        },
      });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(filePath, buf);
      count++;
    } catch {}
  }

  // Also save cover if available
  if (coverUrl) {
    const coverPath = path.join(folderPath, "cover.jpg");
    if (!fs.existsSync(coverPath)) {
      try {
        const res = await fetch(coverUrl);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(coverPath, buf);
        }
      } catch {}
    }
  }

  return count;
}

/**
 * Saves a single post (slideshow or video) to a dated folder with metadata
 */
export async function savePostToFolder(
  post: TikTokPostData,
  baseOutputDir: string,
  accountSummary?: AccountSummary
): Promise<{ folderPath: string; mediaType: "slideshow" | "video"; downloadedCount: number }> {
  const userFolder = path.join(baseOutputDir, post.author.uniqueId);
  const folderName = `${post.formattedDate}_${post.id}`;
  const postFolder = path.join(userFolder, folderName);

  let downloadedCount = 0;

  if (post.mediaType === "slideshow") {
    downloadedCount = await downloadImagesToFolder(post.images, postFolder, post.cover);
  } else if (post.videoUrl) {
    const { videoSaved } = await downloadVideoToFolder(post.videoUrl, postFolder, post.cover);
    if (videoSaved) downloadedCount = 1;
  }

  const postJsonContent = {
    post_details: {
      id: post.id,
      user: post.author.uniqueId,
      author: post.author,
      title: post.title,
      content_desc: post.contentDesc,
      media_type: post.mediaType,
      date: post.formattedDate,
      timestamp: post.createTime,
      url: post.url,
      slides_count: post.mediaType === "slideshow" ? post.images.length : 0,
      duration: post.duration,
      stats: post.stats,
      music: post.music,
    },
    account_recap: accountSummary
      ? {
          username: accountSummary.account.username,
          nickname: accountSummary.account.nickname,
          activity_totals: accountSummary.activityTotals,
          performance_averages: accountSummary.performanceAverages,
        }
      : undefined,
    raw_tiktok_data: post.rawData,
  };

  fs.writeFileSync(
    path.join(postFolder, "post.json"),
    JSON.stringify(postJsonContent, null, 2)
  );

  if (accountSummary) {
    fs.writeFileSync(
      path.join(postFolder, "account_activity_recap.json"),
      JSON.stringify(accountSummary, null, 2)
    );
  }

  return { folderPath: postFolder, mediaType: post.mediaType, downloadedCount };
}

/**
 * Computes global account summary from a list of post metrics
 */
export function computeAccountSummary(
  username: string,
  authorProfile: { nickname?: string; id?: string; avatar?: string } | undefined,
  posts: TikTokPostData[]
): AccountSummary {
  const totalPosts = posts.length;
  const slideshows = posts.filter((p) => p.mediaType === "slideshow");
  const videos = posts.filter((p) => p.mediaType === "video");
  const totalSlides = slideshows.reduce((acc, p) => acc + p.images.length, 0);

  const totalViews = posts.reduce((acc, p) => acc + p.stats.views, 0);
  const totalLikes = posts.reduce((acc, p) => acc + p.stats.likes, 0);
  const totalComments = posts.reduce((acc, p) => acc + p.stats.comments, 0);
  const totalShares = posts.reduce((acc, p) => acc + p.stats.shares, 0);
  const totalFavorites = posts.reduce((acc, p) => acc + p.stats.favorites, 0);
  const totalDownloads = posts.reduce((acc, p) => acc + p.stats.downloads, 0);
  const totalInteractions = totalLikes + totalComments + totalShares + totalFavorites;
  const globalEngagementRate = totalViews > 0 ? (totalInteractions / totalViews) * 100 : 0;

  const sortedByViews = [...posts].sort((a, b) => b.stats.views - a.stats.views);
  const sortedByLikes = [...posts].sort((a, b) => b.stats.likes - a.stats.likes);
  const sortedByShares = [...posts].sort((a, b) => b.stats.shares - a.stats.shares);
  const sortedByComments = [...posts].sort((a, b) => b.stats.comments - a.stats.comments);

  return {
    account: {
      username,
      nickname: authorProfile?.nickname || username,
      userId: authorProfile?.id,
      avatar: authorProfile?.avatar,
      profileUrl: `https://www.tiktok.com/@${username}`,
    },
    activityTotals: {
      totalPostsAnalyzed: totalPosts,
      totalSlideshowsCount: slideshows.length,
      totalVideosCount: videos.length,
      totalImagesCount: totalSlides,
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      totalFavoritesSaves: totalFavorites,
      totalDownloads,
      totalAllInteractions: totalInteractions,
    },
    performanceAverages: {
      avgViewsPerPost: Math.round(totalViews / (totalPosts || 1)),
      avgLikesPerPost: Math.round(totalLikes / (totalPosts || 1)),
      avgCommentsPerPost: Number((totalComments / (totalPosts || 1)).toFixed(1)),
      avgSharesPerPost: Number((totalShares / (totalPosts || 1)).toFixed(1)),
      avgFavoritesPerPost: Number((totalFavorites / (totalPosts || 1)).toFixed(1)),
      avgEngagementRatePercent: Number(globalEngagementRate.toFixed(2)),
    },
    dateRange: {
      newestPostDate: posts[0]?.formattedDate,
      oldestPostDate: posts[posts.length - 1]?.formattedDate,
    },
    topPerformingPosts: {
      mostViewed: sortedByViews[0]
        ? {
            id: sortedByViews[0].id,
            date: sortedByViews[0].formattedDate,
            views: sortedByViews[0].stats.views,
            title: sortedByViews[0].title,
            type: sortedByViews[0].mediaType,
          }
        : null,
      mostLiked: sortedByLikes[0]
        ? {
            id: sortedByLikes[0].id,
            date: sortedByLikes[0].formattedDate,
            likes: sortedByLikes[0].stats.likes,
            title: sortedByLikes[0].title,
            type: sortedByLikes[0].mediaType,
          }
        : null,
      mostShared: sortedByShares[0]
        ? {
            id: sortedByShares[0].id,
            date: sortedByShares[0].formattedDate,
            shares: sortedByShares[0].stats.shares,
            title: sortedByShares[0].title,
            type: sortedByShares[0].mediaType,
          }
        : null,
      mostCommented: sortedByComments[0]
        ? {
            id: sortedByComments[0].id,
            date: sortedByComments[0].formattedDate,
            comments: sortedByComments[0].stats.comments,
            title: sortedByComments[0].title,
            type: sortedByComments[0].mediaType,
          }
        : null,
    },
    updatedAt: new Date().toISOString(),
  };
}
