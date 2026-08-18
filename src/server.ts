import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import {
  extractTikTokPost,
  listUserPosts,
  type TikTokPostData,
} from "./lib/tiktokApi.js";
import {
  savePostToFolder,
  computeAccountSummary,
  downloadImagesToFolder,
  downloadVideoToFolder,
} from "./lib/downloader.js";

export function createTikTokMcpServer(): McpServer {
  const server = new McpServer({
    name: "tiktok-downloader-mcp",
    version: "1.1.0",
  });

  // ── 1. Tool: Extract single TikTok post (Photos or Video) ─────────────────────
  server.tool(
    "tiktok_extract_post",
    "Extract unwatermarked HD photos, video download URL, audio, and full engagement metrics (views, likes, comments, shares, saves) from any TikTok URL.",
    {
      url: z.string().describe("TikTok post URL (e.g. https://www.tiktok.com/@user/video/123... or https://www.tiktok.com/@user/photo/123... or https://vm.tiktok.com/...)"),
    },
    async ({ url }) => {
      try {
        const post = await extractTikTokPost(url);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(post, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error extracting TikTok post: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    }
  );

  // ── 2. Tool: Get user posts list ─────────────────────────────────────────────
  server.tool(
    "tiktok_get_user_posts",
    "List recent post IDs, upload dates, and URLs for a TikTok user or profile URL.",
    {
      username: z.string().describe("TikTok username (e.g. @username or username) or profile URL"),
      max: z.number().optional().default(50).describe("Maximum number of posts to fetch (default: 50)"),
    },
    async ({ username, max }) => {
      try {
        const posts = await listUserPosts(username, max);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ username, total: posts.length, posts }, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error listing user posts: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    }
  );

  // ── 3. Tool: Download single post (Photo Slideshow or Video) ─────────────────
  server.tool(
    "tiktok_download_post",
    "Download a TikTok post (unwatermarked HD MP4 video or photo slides) into a date-named folder (YYYY-MM-DD_<id>) with full post.json metadata.",
    {
      url: z.string().describe("TikTok post URL"),
      output_dir: z.string().optional().default("./tiktok_downloads").describe("Target directory (default: ./tiktok_downloads)"),
    },
    async ({ url, output_dir }) => {
      try {
        const post = await extractTikTokPost(url);
        const resolvedOut = path.resolve(process.cwd(), output_dir);
        const { folderPath, mediaType, downloadedCount } = await savePostToFolder(post, resolvedOut);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  post_id: post.id,
                  author: post.author.uniqueId,
                  media_type: mediaType,
                  date: post.formattedDate,
                  items_downloaded: downloadedCount,
                  folder_path: folderPath,
                  stats: post.stats,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error downloading TikTok post: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    }
  );

  // ── 4. Tool: Download all user media (Photos & Videos) ───────────────────────
  server.tool(
    "tiktok_download_user_media",
    "Download all media (photos slideshows and/or HD MP4 videos) from a TikTok account into organized date folders (YYYY-MM-DD_<id>), with post.json in each folder and full account_summary.json.",
    {
      username: z.string().describe("TikTok username (e.g. @username) or profile URL"),
      max: z.number().optional().default(50).describe("Maximum number of posts to check (default: 50)"),
      output_dir: z.string().optional().default("./tiktok_downloads").describe("Target output directory"),
      media_type: z.enum(["all", "photos", "videos"]).optional().default("all").describe("Filter media type to download: 'all', 'photos', or 'videos' (default: 'all')"),
    },
    async ({ username, max, output_dir, media_type }) => {
      try {
        const cleanUser = username.replace(/^@/, "").replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/, "").replace(/[?#/].*$/, "").trim();
        const resolvedOut = path.resolve(process.cwd(), output_dir);
        const userAccountDir = path.join(resolvedOut, cleanUser);

        const listed = await listUserPosts(cleanUser, max);
        const processedPosts: Array<{ postFolder: string; post: TikTokPostData }> = [];
        let authorProfile: TikTokPostData["author"] | undefined;

        for (const item of listed) {
          try {
            const data = await extractTikTokPost(item.postUrl);
            if (media_type === "photos" && data.mediaType !== "slideshow") continue;
            if (media_type === "videos" && data.mediaType !== "video") continue;

            if (!authorProfile && data.author) {
              authorProfile = data.author;
            }

            const folderName = `${data.formattedDate}_${data.id}`;
            const postFolder = path.join(userAccountDir, folderName);

            if (data.mediaType === "slideshow") {
              await downloadImagesToFolder(data.images, postFolder, data.cover);
            } else if (data.videoUrl) {
              await downloadVideoToFolder(data.videoUrl, postFolder, data.cover);
            }

            processedPosts.push({ postFolder, post: data });
          } catch {
            // Skip failed item
          }
        }

        const summary = computeAccountSummary(
          cleanUser,
          authorProfile,
          processedPosts.map((p) => p.post)
        );

        // Save account_summary.json and account_activity.json in root user directory
        if (!fs.existsSync(userAccountDir)) fs.mkdirSync(userAccountDir, { recursive: true });
        fs.writeFileSync(path.join(userAccountDir, "account_summary.json"), JSON.stringify(summary, null, 2));
        fs.writeFileSync(
          path.join(userAccountDir, "account_activity.json"),
          JSON.stringify({ ...summary, all_posts: processedPosts.map((p) => p.post) }, null, 2)
        );

        // Write post.json and account_activity_recap.json in each individual post folder
        for (const { postFolder, post } of processedPosts) {
          const postJsonContent = {
            post_details: {
              id: post.id,
              user: cleanUser,
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

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  account: summary.account,
                  total_posts_downloaded: processedPosts.length,
                  slideshows_count: summary.activityTotals.totalSlideshowsCount,
                  videos_count: summary.activityTotals.totalVideosCount,
                  total_photos: summary.activityTotals.totalImagesCount,
                  totals: summary.activityTotals,
                  averages: summary.performanceAverages,
                  top_posts: summary.topPerformingPosts,
                  output_directory: userAccountDir,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error downloading user media: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    }
  );

  // ── 5. Tool: Get user analytics summary (without downloading files) ─────────
  server.tool(
    "tiktok_get_user_analytics",
    "Analyze a TikTok profile's recent engagement metrics, total views, likes, comments, shares, engagement rate, and top performing posts without downloading files.",
    {
      username: z.string().describe("TikTok username or profile URL"),
      max: z.number().optional().default(30).describe("Number of recent posts to analyze (default: 30)"),
    },
    async ({ username, max }) => {
      try {
        const cleanUser = username.replace(/^@/, "").replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/, "").replace(/[?#/].*$/, "").trim();
        const listed = await listUserPosts(cleanUser, max);
        const posts: TikTokPostData[] = [];
        let authorProfile: TikTokPostData["author"] | undefined;

        for (const item of listed) {
          try {
            const data = await extractTikTokPost(item.postUrl);
            if (!authorProfile && data.author) authorProfile = data.author;
            posts.push(data);
          } catch {}
        }

        const summary = computeAccountSummary(cleanUser, authorProfile, posts);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error analyzing user analytics: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    }
  );

  return server;
}
