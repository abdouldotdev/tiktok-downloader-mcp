import fs from "node:fs";
import path from "node:path";
import {
  extractTikTokPost,
  listUserPosts,
  type TikTokPostData,
} from "./lib/tiktokApi.js";
import {
  downloadImagesToFolder,
  downloadVideoToFolder,
  computeAccountSummary,
} from "./lib/downloader.js";

export function printCliHelp() {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📥 TikTok Media Downloader & Analytics (CLI & MCP Tool)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage (Standalone CLI without MCP) :
  npx tiktok-downloader-mcp <@username | profile_url | post_url> [options]

Examples :
  # Download all media from a profile:
  npx tiktok-downloader-mcp @username
  npx tiktok-downloader-mcp @username --max 20

  # Filter by media type:
  npx tiktok-downloader-mcp @username --media photos     # Only photo slideshows
  npx tiktok-downloader-mcp @username --media videos     # Only HD MP4 videos
  npx tiktok-downloader-mcp @username --media all        # Both photos & videos

  # Single post (video or photo slideshow):
  npx tiktok-downloader-mcp "https://www.tiktok.com/@username/video/123456789"
  npx tiktok-downloader-mcp "https://www.tiktok.com/@username/photo/123456789"
  npx tiktok-downloader-mcp "https://vm.tiktok.com/xxxxxx/"

Options :
  --media <all|photos|videos>   Filter media type to download (default: all)
  --photos-only                 Download only photo slideshows
  --videos-only                 Download only videos
  --max <N>                     Maximum number of posts to fetch (default: 50, or "all")
  --out <dir>                   Target output directory (default: ./tiktok_downloads)
  --help, -h                    Show this help message
`);
}

export async function runCli(args: string[]) {
  let targetInput = "";
  let maxPosts = 50;
  let outDir = path.join(process.cwd(), "tiktok_downloads");
  let mediaFilter: "all" | "photos" | "videos" = "all";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--max" && args[i + 1]) {
      maxPosts = args[i + 1].toLowerCase() === "all" ? 9999 : parseInt(args[i + 1], 10) || 50;
      i++;
    } else if (arg === "--out" && args[i + 1]) {
      outDir = path.resolve(process.cwd(), args[i + 1]);
      i++;
    } else if (arg === "--media" && args[i + 1]) {
      const val = args[i + 1].toLowerCase();
      if (val === "photos" || val === "videos" || val === "all") mediaFilter = val;
      i++;
    } else if (arg === "--photos-only") {
      mediaFilter = "photos";
    } else if (arg === "--videos-only") {
      mediaFilter = "videos";
    } else if (arg === "-h" || arg === "--help") {
      printCliHelp();
      process.exit(0);
    } else if (!arg.startsWith("-")) {
      targetInput = arg;
    }
  }

  if (!targetInput) {
    printCliHelp();
    process.exit(1);
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  🚀 TikTok Media Downloader & Analytics (Standalone CLI)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const isDirectPost =
    targetInput.includes("/photo/") ||
    targetInput.includes("/video/") ||
    targetInput.includes("vm.tiktok.com") ||
    targetInput.includes("vt.tiktok.com");

  if (isDirectPost) {
    console.log(`▶ Extracting single post: ${targetInput}`);
    try {
      const post = await extractTikTokPost(targetInput);

      const folderName = `${post.formattedDate}_${post.id}`;
      const userFolder = path.join(outDir, post.author.uniqueId);
      const postFolder = path.join(userFolder, folderName);

      console.log(`  • Author: @${post.author.uniqueId} (${post.author.nickname})`);
      console.log(`  • Type: ${post.mediaType === "slideshow" ? "📸 Photo Slideshow" : "🎬 HD Video"}`);
      console.log(`  • Date: ${post.formattedDate}`);
      console.log(
        `  • Views: ${post.stats.views.toLocaleString()} | Likes: ${post.stats.likes.toLocaleString()} | Comments: ${post.stats.comments.toLocaleString()} | Shares: ${post.stats.shares.toLocaleString()}`
      );
      console.log(`  • Destination: ${path.relative(process.cwd(), postFolder)}/`);

      if (post.mediaType === "slideshow") {
        const downloaded = await downloadImagesToFolder(post.images, postFolder, post.cover);
        console.log(`\n✅ Saved ${downloaded} photo(s) to:\n   📁 ${postFolder}\n`);
      } else if (post.videoUrl) {
        await downloadVideoToFolder(post.videoUrl, postFolder, post.cover);
        console.log(`\n✅ Saved HD video (MP4) to:\n   📁 ${postFolder}/video.mp4\n`);
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
        raw_tiktok_data: post.rawData,
      };

      fs.writeFileSync(path.join(postFolder, "post.json"), JSON.stringify(postJsonContent, null, 2));
    } catch (err) {
      console.error(`\n❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    return;
  }

  // Profile mode
  const cleanUsername = targetInput
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/, "")
    .replace(/[?#/].*$/, "")
    .trim();

  console.log(`▶ Analyzing TikTok Profile: @${cleanUsername}`);
  console.log(`▶ Media Filter: ${mediaFilter.toUpperCase()}`);
  console.log(`▶ Scanning recent ${maxPosts} posts...`);

  let listedPosts: Array<{ id: string; user: string; title: string; formattedDate: string; postUrl: string }> = [];
  try {
    listedPosts = await listUserPosts(cleanUsername, maxPosts);
  } catch (err) {
    console.error(`❌ ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  if (listedPosts.length === 0) {
    console.log(`⚠️ No posts found for @${cleanUsername}.`);
    return;
  }

  console.log(`✓ Found ${listedPosts.length} post(s). Starting download...\n`);

  const processedPosts: Array<{ postFolder: string; post: TikTokPostData }> = [];
  let authorProfile: TikTokPostData["author"] | undefined;
  let totalSlideshows = 0;
  let totalVideos = 0;
  let totalImages = 0;

  for (let i = 0; i < listedPosts.length; i++) {
    const p = listedPosts[i];
    const postLabel = `[${i + 1}/${listedPosts.length}] Post ${p.id}`;

    try {
      const data = await extractTikTokPost(p.postUrl);

      if (mediaFilter === "photos" && data.mediaType !== "slideshow") {
        process.stdout.write(`  ${postLabel} : ⏭️ Video (photos filter active)\n`);
        continue;
      }
      if (mediaFilter === "videos" && data.mediaType !== "video") {
        process.stdout.write(`  ${postLabel} : ⏭️ Slideshow (videos filter active)\n`);
        continue;
      }

      if (!authorProfile && data.author) authorProfile = data.author;

      const datePrefix = data.formattedDate || p.formattedDate || "unknown-date";
      const folderName = `${datePrefix}_${data.id}`;
      const postFolder = path.join(outDir, cleanUsername, folderName);

      if (data.mediaType === "slideshow") {
        const downloaded = await downloadImagesToFolder(data.images, postFolder, data.cover);
        totalSlideshows++;
        totalImages += downloaded;
        console.log(`  ${postLabel} : ✓ 📸 ${downloaded} photos (${data.stats.views.toLocaleString()} views) → 📁 ${folderName}`);
      } else if (data.videoUrl) {
        await downloadVideoToFolder(data.videoUrl, postFolder, data.cover);
        totalVideos++;
        console.log(`  ${postLabel} : ✓ 🎬 HD Video (${data.stats.views.toLocaleString()} views) → 📁 ${folderName}`);
      }

      processedPosts.push({ postFolder, post: data });
    } catch (err) {
      console.log(`  ${postLabel} : ⚠️ ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Summary
  const summary = computeAccountSummary(
    cleanUsername,
    authorProfile,
    processedPosts.map((p) => p.post)
  );

  const userAccountDir = path.join(outDir, cleanUsername);

  // Write account_summary.json and account_activity.json
  if (!fs.existsSync(userAccountDir)) fs.mkdirSync(userAccountDir, { recursive: true });
  fs.writeFileSync(path.join(userAccountDir, "account_summary.json"), JSON.stringify(summary, null, 2));
  fs.writeFileSync(
    path.join(userAccountDir, "account_activity.json"),
    JSON.stringify({ ...summary, all_posts: processedPosts.map((p) => p.post) }, null, 2)
  );

  // Write post.json and account_activity_recap.json in each subfolder
  for (const { postFolder, post } of processedPosts) {
    const postJsonContent = {
      post_details: {
        id: post.id,
        user: cleanUsername,
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
      account_recap: {
        username: summary.account.username,
        nickname: summary.account.nickname,
        activity_totals: summary.activityTotals,
        performance_averages: summary.performanceAverages,
      },
      raw_tiktok_data: post.rawData,
    };
    fs.writeFileSync(path.join(postFolder, "post.json"), JSON.stringify(postJsonContent, null, 2));
    fs.writeFileSync(path.join(postFolder, "account_activity_recap.json"), JSON.stringify(summary, null, 2));
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✨ Completed for @${cleanUsername}!`);
  console.log(`   • ${processedPosts.length} post(s) downloaded (${totalVideos} HD video(s), ${totalSlideshows} slideshow(s))`);
  console.log(`   • ${totalImages} total photo slide(s)`);
  console.log(`   • Account Engagement Summary:`);
  console.log(`       👁️ Total Views: ${summary.activityTotals.totalViews.toLocaleString()}`);
  console.log(`       ❤️ Total Likes: ${summary.activityTotals.totalLikes.toLocaleString()}`);
  console.log(`       💬 Total Comments: ${summary.activityTotals.totalComments.toLocaleString()}`);
  console.log(`       🔄 Total Shares: ${summary.activityTotals.totalShares.toLocaleString()}`);
  console.log(`       ⭐ Total Favorites/Saves: ${summary.activityTotals.totalFavoritesSaves.toLocaleString()}`);
  console.log(`       📈 Avg Engagement Rate: ${summary.performanceAverages.avgEngagementRatePercent}%`);
  console.log(`   • Destination Folder: 📁 ${userAccountDir}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}
