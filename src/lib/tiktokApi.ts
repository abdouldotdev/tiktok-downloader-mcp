import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface TikTokAuthor {
  id?: string;
  uniqueId: string;
  nickname: string;
  avatar?: string;
  profileUrl?: string;
}

export interface TikTokPostStats {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  favorites: number;
  downloads: number;
  totalInteractions: number;
  engagementRatePercent: number;
}

export interface TikTokPostData {
  id: string;
  url: string;
  title: string;
  contentDesc?: string;
  author: TikTokAuthor;
  mediaType: "slideshow" | "video";
  images: string[];
  cover?: string;
  videoUrl?: string;
  music?: {
    id?: string;
    title?: string;
    author?: string;
    album?: string;
    duration?: number;
    playUrl?: string;
  };
  createTime: number;
  formattedDate: string;
  stats: TikTokPostStats;
  rawData?: Record<string, unknown>;
}

export interface AccountSummary {
  account: {
    username: string;
    nickname: string;
    userId?: string;
    avatar?: string;
    profileUrl: string;
  };
  activityTotals: {
    totalPostsAnalyzed: number;
    totalSlidesCount: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalFavoritesSaves: number;
    totalDownloads: number;
    totalAllInteractions: number;
  };
  performanceAverages: {
    avgViewsPerPost: number;
    avgLikesPerPost: number;
    avgCommentsPerPost: number;
    avgSharesPerPost: number;
    avgFavoritesPerPost: number;
    avgEngagementRatePercent: number;
  };
  dateRange: {
    newestPostDate?: string;
    oldestPostDate?: string;
  };
  topPerformingPosts: {
    mostViewed?: { id: string; date: string; views: number; title: string } | null;
    mostLiked?: { id: string; date: string; likes: number; title: string } | null;
    mostShared?: { id: string; date: string; shares: number; title: string } | null;
    mostCommented?: { id: string; date: string; comments: number; title: string } | null;
  };
  updatedAt: string;
}

/**
 * Format timestamp into YYYY-MM-DD
 */
export function formatDate(timestampInSeconds?: number): string {
  if (!timestampInSeconds) {
    return new Date().toISOString().slice(0, 10);
  }
  const d = new Date(timestampInSeconds * 1000);
  if (isNaN(d.getTime())) return "unknown-date";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Resolves shortened TikTok URLs (vm.tiktok.com, vt.tiktok.com)
 */
export async function resolveTikTokUrl(rawUrl: string): Promise<string> {
  const clean = rawUrl.replace(/[?#].*$/, "").trim();
  if (rawUrl.includes("vm.tiktok.com") || rawUrl.includes("vt.tiktok.com")) {
    try {
      const res = await fetch(rawUrl, {
        method: "HEAD",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        },
      });
      return res.url || clean;
    } catch {
      return clean;
    }
  }
  return clean;
}

/**
 * Extract full post data and HD unwatermarked images
 */
export async function extractTikTokPost(rawUrl: string): Promise<TikTokPostData> {
  const targetUrl = await resolveTikTokUrl(rawUrl);

  const endpoint = `https://www.tikwm.com/api/?url=${encodeURIComponent(targetUrl)}&hd=1`;
  const res = await fetch(endpoint, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`TikTok API network error (${res.status})`);
  }

  const json = (await res.json()) as { code?: number; msg?: string; data?: any };
  if (json.code !== 0 || !json.data) {
    throw new Error(json.msg || "Failed to extract TikTok media.");
  }

  const d = json.data;
  const images: string[] = [];

  if (Array.isArray(d.images) && d.images.length > 0) {
    for (const img of d.images) {
      if (typeof img === "string" && img.startsWith("http")) images.push(img);
    }
  } else {
    const cover = d.origin_cover || d.cover;
    if (cover) images.push(cover);
  }

  const createTime = Number(d.create_time) || Math.floor(Date.now() / 1000);
  const userHandle = d.author?.unique_id || "unknown_user";

  const playCount = Number(d.play_count) || 0;
  const diggCount = Number(d.digg_count) || 0;
  const commentCount = Number(d.comment_count) || 0;
  const shareCount = Number(d.share_count) || 0;
  const collectCount = Number(d.collect_count) || 0;
  const downloadCount = Number(d.download_count) || 0;

  const totalInteractions = diggCount + commentCount + shareCount + collectCount;
  const engagementRate = playCount > 0 ? (totalInteractions / playCount) * 100 : 0;

  return {
    id: String(d.id || d.video_id || Date.now()),
    url: targetUrl,
    title: d.title || "",
    contentDesc: d.content_desc || d.title || "",
    author: {
      id: d.author?.id,
      uniqueId: userHandle,
      nickname: d.author?.nickname || userHandle,
      avatar: d.author?.avatar,
      profileUrl: `https://www.tiktok.com/@${userHandle}`,
    },
    mediaType: Array.isArray(d.images) && d.images.length > 0 ? "slideshow" : "video",
    images,
    cover: d.origin_cover || d.cover,
    videoUrl: d.play || d.wmplay,
    music: d.music_info
      ? {
          id: d.music_info.id,
          title: d.music_info.title,
          author: d.music_info.author,
          album: d.music_info.album,
          duration: d.music_info.duration,
          playUrl: d.music_info.play,
        }
      : undefined,
    createTime,
    formattedDate: formatDate(createTime),
    stats: {
      views: playCount,
      likes: diggCount,
      comments: commentCount,
      shares: shareCount,
      favorites: collectCount,
      downloads: downloadCount,
      totalInteractions,
      engagementRatePercent: Number(engagementRate.toFixed(2)),
    },
    rawData: d,
  };
}

/**
 * List all post URLs & IDs from a user profile
 */
export async function listUserPosts(
  usernameOrUrl: string,
  max: number = 50
): Promise<Array<{ id: string; user: string; title: string; formattedDate: string; postUrl: string }>> {
  let user = usernameOrUrl.replace(/^@/, "").trim();
  if (user.includes("tiktok.com/@")) {
    user = user.split("tiktok.com/@")[1].replace(/[?#/].*$/, "");
  }

  const profileUrl = `https://www.tiktok.com/@${user}`;
  const flags = [
    "--flat-playlist",
    "--no-warnings",
    "--playlist-end",
    String(max),
    "--print",
    "%(id)s|%(upload_date)s|%(title)s|%(url)s",
    profileUrl,
  ];

  const { stdout } = await execFileAsync("yt-dlp", flags, { timeout: 120_000 });
  const lines = stdout.trim().split("\n").filter(Boolean);

  return lines.map((l) => {
    const parts = l.split("|");
    const id = parts[0];
    const rawDate = parts[1] || "";
    const title = parts[2] || "";
    const postUrl = parts[3] || `https://www.tiktok.com/@${user}/video/${id}`;

    let formattedDate = "";
    if (rawDate && rawDate.length === 8) {
      formattedDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    }

    return { id, user, title, formattedDate, postUrl };
  });
}
