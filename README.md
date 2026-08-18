# 📱 TikTok Media Downloader & Analytics (CLI & MCP Server)

[![npm version](https://img.shields.io/npm/v/tiktok-downloader-mcp.svg)](https://www.npmjs.com/package/tiktok-downloader-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> **All-in-one TikTok extraction suite**: Run it directly from your terminal as a **Standalone CLI tool** (no AI required) or connect it as a **Model Context Protocol (MCP) Server** for AI assistants (**Claude Code**, **Claude Desktop**, **Cursor**, **Windsurf**, **Antigravity**).

Extract, analyze, and bulk-download **TikTok HD videos (.mp4)** and **photo slideshows/carousels in original quality without watermarks**, organized into structured date folders (`YYYY-MM-DD_<id>`) with comprehensive account engagement analytics.

---

## 📑 Table of Contents

- [✨ Key Features](#-key-features)
- [🖥️ Part 1: Standalone CLI Usage (No AI Needed)](#️-part-1-standalone-cli-usage-no-ai-needed)
  - [Installation & Execution Options](#installation--execution-options)
  - [Use Case 1: Single Photo Slideshow](#case-1-single-photo-slideshow)
  - [Use Case 2: Single HD Video (MP4)](#case-2-single-hd-video-mp4)
  - [Use Case 3: Mobile Short Links (`vm.tiktok.com`)](#case-3-mobile-short-links-vmtiktokcom)
  - [Use Case 4: Bulk Profile Download (Everything)](#case-4-bulk-profile-download-everything)
  - [Use Case 5: Bulk Profile - Photos Only](#case-5-bulk-profile---photos-only)
  - [Use Case 6: Bulk Profile - Videos Only](#case-6-bulk-profile---videos-only)
  - [Use Case 7: Custom Output Directory](#case-7-custom-output-directory)
  - [CLI Flags Reference](#cli-flags-reference)
- [🤖 Part 2: Model Context Protocol (MCP) Setup](#-part-2-model-context-protocol-mcp-setup)
  - [AI Setup Guides (Claude Code, Desktop, Cursor, Windsurf, Antigravity)](#mcp-configuration-by-platform)
  - [MCP Tools & Natural Language Examples](#mcp-tools-reference)
- [📊 Metadata & Analytics Schemas](#-metadata--analytics-schemas)
- [📁 Folder Hierarchy](#-folder-hierarchy)
- [❓ FAQ & Troubleshooting](#-faq--troubleshooting)

---

## ✨ Key Features

- ⚡ **Dual Execution**: Use directly in your terminal via `npx` or integrate as an MCP server with LLMs.
- 🎥 **HD No-Watermark Videos**: Download high-resolution `.mp4` video files with original cover thumbnails.
- 📸 **HD No-Watermark Photos**: Extract full-resolution original photos and carousel slides.
- 📁 **Date-Based Organization**: Every post is filed under `YYYY-MM-DD_<id>/`.
- 📊 **Rich Engagement Analytics**:
  - Total Views (`play_count`)
  - Total Likes (`digg_count`)
  - Total Comments (`comment_count`)
  - Total Shares (`share_count`)
  - Total Favorites / Saves (`collect_count`)
  - Total Downloads (`download_count`)
  - Average Engagement Rate (%)
  - Top Performing Posts (Most viewed, most liked, most shared, most commented)
- 📝 **Dual-Layer JSON Summaries**:
  - `account_summary.json` & `account_activity.json` in the root account directory.
  - `post.json` & `account_activity_recap.json` inside **every single post folder**.
- 🚀 **Zero Login / Cookies Needed**: Works seamlessly out of the box with public TikTok endpoints.

---

## 🖥️ Part 1: Standalone CLI Usage (No AI Needed)

You can run the downloader in your terminal without any AI assistant or configuration.

### Installation & Execution Options

```bash
# Option A: One-liner via NPX (No installation needed)
npx tiktok-downloader-mcp <arguments>

# Option B: Global NPM install
npm install -g tiktok-downloader-mcp
tiktok-downloader-mcp <arguments>

# Option C: Local Git Clone
git clone https://github.com/abdouldotdev/tiktok-downloader-mcp.git
cd tiktok-downloader-mcp && npm install && npm run build
node dist/index.js <arguments>
```

---

### Case 1: Single Photo Slideshow
Downloads all slides in full resolution and saves metadata:

```bash
npx tiktok-downloader-mcp "https://www.tiktok.com/@username/photo/7405928371928371234"
```

**Generated structure:**
```text
tiktok_downloads/
  └── username/
      └── 2026-08-16_7405928371928371234/
          ├── slide_01.jpg
          ├── slide_02.jpg
          ├── slide_03.jpg
          ├── cover.jpg
          └── post.json
```

---

### Case 2: Single HD Video (MP4)
Downloads the unwatermarked HD video and its cover thumbnail:

```bash
npx tiktok-downloader-mcp "https://www.tiktok.com/@username/video/7106594312292453675"
```

**Generated structure:**
```text
tiktok_downloads/
  └── username/
      └── 2026-08-15_7106594312292453675/
          ├── video.mp4     # Clean HD video without watermark
          ├── cover.jpg     # Video thumbnail
          └── post.json     # Views, likes, comments, sound metadata
```

---

### Case 3: Mobile Short Links (`vm.tiktok.com`)
Shortened mobile URLs are automatically resolved:

```bash
npx tiktok-downloader-mcp "https://vm.tiktok.com/ZMhNxxxx/"
```

---

### Case 4: Bulk Profile Download (Everything)
Scans a profile, downloads both photos and videos, and computes total account engagement analytics:

```bash
# Download recent 50 posts (default):
npx tiktok-downloader-mcp @username

# Download recent 20 posts:
npx tiktok-downloader-mcp @username --max 20

# Download ALL posts from the profile:
npx tiktok-downloader-mcp @username --max all
```

---

### Case 5: Bulk Profile - Photos Only
Filters out standalone videos and downloads only photo slideshows / carousels:

```bash
npx tiktok-downloader-mcp @username --media photos
# or:
npx tiktok-downloader-mcp @username --photos-only --max 30
```

---

### Case 6: Bulk Profile - Videos Only
Filters out photo slideshows and downloads only HD MP4 video posts:

```bash
npx tiktok-downloader-mcp @username --media videos
# or:
npx tiktok-downloader-mcp @username --videos-only --max 30
```

---

### Case 7: Custom Output Directory
Specify where files should be stored:

```bash
npx tiktok-downloader-mcp @username --out "/Users/me/Desktop/MyTikTokMedia"
```

---

### CLI Flags Reference

| Flag | Values | Default | Description |
| :--- | :--- | :--- | :--- |
| `<target>` | `@username` \| `url` | *Required* | Profile username, profile URL, or direct post URL |
| `--media` | `all` \| `photos` \| `videos` | `all` | Filter media types to download |
| `--photos-only` | - | `false` | Shortcut for `--media photos` |
| `--videos-only` | - | `false` | Shortcut for `--media videos` |
| `--max` | `number` \| `all` | `50` | Maximum number of posts to fetch |
| `--out` | `path` | `./tiktok_downloads` | Target output directory on your system |
| `--help`, `-h` | - | - | Display help menu |

---

## 🤖 Part 2: Model Context Protocol (MCP) Setup

Connect the server to an AI assistant to let the LLM extract, analyze, and download TikTok content for you via natural language.

### MCP Configuration by Platform

#### 1. Claude Code CLI (Recommended)
```bash
# Add via NPX:
claude mcp add tiktok-downloader -- npx -y tiktok-downloader-mcp

# Or directly from GitHub:
claude mcp add tiktok-downloader -- npx -y github:abdouldotdev/tiktok-downloader-mcp
```

Check status inside Claude Code:
```bash
/mcp
```

#### 2. Claude Desktop
Add to your `claude_desktop_config.json`:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tiktok-downloader": {
      "command": "npx",
      "args": ["-y", "tiktok-downloader-mcp"]
    }
  }
}
```

#### 3. Cursor & Windsurf
Add to `.cursor/mcp.json` or project `.mcp.json`:

```json
{
  "mcpServers": {
    "tiktok-downloader": {
      "command": "npx",
      "args": ["-y", "tiktok-downloader-mcp"]
    }
  }
}
```

#### 4. Antigravity CLI
```bash
agy mcp add tiktok-downloader -- npx -y tiktok-downloader-mcp
```

---

### MCP Tools Reference

| Tool | Purpose | Parameters | Natural Language Example |
| :--- | :--- | :--- | :--- |
| **`tiktok_extract_post`** | Extracts unwatermarked media URLs, audio, and metrics without saving files. | `url` (string) | *"Extract the images, audio, and view count from this link: https://www.tiktok.com/@user/photo/123"* |
| **`tiktok_get_user_posts`** | Lists recent post IDs, upload dates, and URLs for a profile. | `username` (string), `max` (number) | *"List the last 15 posts published by @username with their dates."* |
| **`tiktok_download_post`** | Downloads a single post (photos or video) to a date folder with `post.json`. | `url` (string), `output_dir` (string) | *"Download this TikTok video in HD to my downloads folder."* |
| **`tiktok_download_user_media`** | Bulk downloads videos/photos into date folders and creates global `account_summary.json`. | `username` (string), `max` (number), `output_dir` (string), `media_type` (`"all"\|"photos"\|"videos"`) | *"Download all photo carousels from @username and summarize their engagement."* |
| **`tiktok_get_user_analytics`** | Computes account totals, averages, engagement rate, and top posts without downloading files. | `username` (string), `max` (number) | *"Analyze the engagement rate and top performing posts of @username."* |

---

## 📊 Metadata & Analytics Schemas

### 1. `account_summary.json` (Account Level)
Saved at the root of the user folder (`tiktok_downloads/<username>/account_summary.json`):

```json
{
  "account": {
    "username": "example_user",
    "nickname": "Creator Name",
    "user_id": "7582772389835113485",
    "avatar": "https://.../avatar.jpeg",
    "profile_url": "https://www.tiktok.com/@example_user"
  },
  "activity_totals": {
    "total_posts_analyzed": 50,
    "total_slideshows_count": 32,
    "total_videos_count": 18,
    "total_images_count": 312,
    "total_views": 1066188,
    "total_likes": 17388,
    "total_comments": 6078,
    "total_shares": 410,
    "total_favorites_saves": 2579,
    "total_downloads": 74,
    "total_all_interactions": 26455
  },
  "performance_averages": {
    "avg_views_per_post": 21324,
    "avg_likes_per_post": 348,
    "avg_comments_per_post": 121.6,
    "avg_shares_per_post": 8.2,
    "avg_favorites_per_post": 51.6,
    "avg_engagement_rate_percent": 2.48
  },
  "top_performing_posts": {
    "most_viewed": { "id": "7652520719259159822", "date": "2026-06-18", "views": 461748, "type": "slideshow" },
    "most_liked": { "id": "7652520719259159822", "date": "2026-06-18", "likes": 5558, "type": "slideshow" }
  },
  "updated_at": "2026-08-18T15:57:52.024Z"
}
```

### 2. `post.json` (Post Level)
Saved inside each individual post folder (`tiktok_downloads/<username>/YYYY-MM-DD_<id>/post.json`):

```json
{
  "post_details": {
    "id": "7674774636999003406",
    "user": "example_user",
    "author": { "uniqueId": "example_user", "nickname": "Creator Name" },
    "title": "Summer outfit ideas #fashion #summer",
    "media_type": "slideshow",
    "date": "2026-08-16",
    "timestamp": 1787049600,
    "url": "https://www.tiktok.com/@example_user/video/7674774636999003406",
    "slides_count": 10,
    "stats": {
      "views": 1120,
      "likes": 21,
      "comments": 17,
      "shares": 1,
      "favorites": 5,
      "downloads": 0,
      "total_interactions": 44,
      "engagement_rate_percent": 3.93
    },
    "music": {
      "id": "7644346595656730640",
      "title": "Original Sound",
      "author": "Sound Creator",
      "duration": 60,
      "play_url": "https://.../audio.mp4"
    }
  },
  "account_recap": {
    "username": "example_user",
    "activity_totals": { "total_views": 1066188, "total_likes": 17388 },
    "performance_averages": { "avg_engagement_rate_percent": 2.48 }
  }
}
```

---

## 📁 Folder Hierarchy

```text
tiktok_downloads/
  └── example_user/
      ├── account_summary.json            # Cumulative totals, averages, engagement & top posts
      ├── account_activity.json           # Complete chronological history of all posts
      │
      ├── 2026-08-16_7674774636999003406/ # 📸 Photo Slideshow post folder
      │   ├── slide_01.jpg
      │   ├── slide_02.jpg
      │   ├── slide_03.jpg
      │   ├── cover.jpg
      │   ├── post.json                   # Individual post metrics + global account recap
      │   └── account_activity_recap.json
      │
      └── 2026-08-15_7674392602606619917/ # 🎬 Video post folder
          ├── video.mp4                   # HD unwatermarked video
          ├── cover.jpg                   # Video cover thumbnail
          ├── post.json
          └── account_activity_recap.json
```

---

## ❓ FAQ & Troubleshooting

#### Q: Do I need a TikTok account or cookies to use this?
**A:** No. All downloads and metadata extractions work out of the box using public endpoints without any login or session cookies.

#### Q: Are downloaded videos and images watermarked?
**A:** No. 100% of the downloaded media files are clean, original-quality files without the TikTok bouncing watermark.

#### Q: Does it re-download existing files if I re-run the command?
**A:** No. The tool checks file size and presence on disk. If a slide or video has already been downloaded, it will automatically skip it for instant speed.

#### Q: What dependencies are needed?
**A:** Node.js >= 18. For profile scanning, `yt-dlp` is recommended (`brew install yt-dlp` on macOS or `pip install yt-dlp`).

---

## 💻 Local Development & Contributions

```bash
# Clone repository
git clone https://github.com/abdouldotdev/tiktok-downloader-mcp.git
cd tiktok-downloader-mcp

# Install dependencies
npm install

# Compile TypeScript
npm run build

# Run CLI locally
node dist/index.js @username --max 10

# Run MCP Server on stdio
node dist/index.js --stdio
```

---

## 📄 License

MIT © [abdouldotdev](https://github.com/abdouldotdev)
