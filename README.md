# 📱 TikTok Media Downloader & Analytics (CLI & MCP Server)

[![npm version](https://img.shields.io/npm/v/tiktok-downloader-mcp.svg)](https://www.npmjs.com/package/tiktok-downloader-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A dual-purpose tool that works both as a **Standalone CLI Downloader** (in your terminal without any AI required) and as a **Model Context Protocol (MCP) Server** for AI assistants (**Claude Code**, **Claude Desktop**, **Cursor**, **Windsurf**, **Antigravity**).

Extract, analyze, and bulk-download **TikTok videos (HD MP4) and photo slideshows/carousels in original quality without watermarks**, complete with automated date-based folder categorization (`YYYY-MM-DD_<id>`) and in-depth account engagement analytics.

---

## ✨ Key Features

- 🖥️ **Dual Mode**: Use it directly in your terminal as a CLI tool or plug it into your AI assistant via MCP.
- 🎥 **HD No-Watermark Videos**: Download high-definition `.mp4` video files with original cover thumbnails.
- 📸 **No-Watermark Photo Slideshows**: Extract full-resolution original photos and carousel slides.
- 📁 **Date-Based Folder Hierarchy**: Each post is stored in its own subfolder named after the post's creation date (`YYYY-MM-DD_<id>/video.mp4` or `YYYY-MM-DD_<id>/slide_01.jpg`).
- 📊 **Comprehensive Account Analytics**:
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
- 🚀 **Zero Login Required**: Works out-of-the-box with short URLs (`vm.tiktok.com`, `vt.tiktok.com`), user handles (`@username`), and direct post links.

---

## 🖥️ 1. Standalone CLI Usage (Without MCP)

You can run the downloader directly in your terminal using `npx` without configuring any MCP server or AI tool:

### 📥 Single Post Download (Video or Photo Slideshow)
```bash
# Download a photo slideshow:
npx tiktok-downloader-mcp "https://www.tiktok.com/@username/photo/123456789"

# Download an HD video (MP4):
npx tiktok-downloader-mcp "https://www.tiktok.com/@username/video/987654321"

# Short links (vm.tiktok.com):
npx tiktok-downloader-mcp "https://vm.tiktok.com/xxxxxx/"
```

### 👥 Bulk Profile Download (Entire Account)
```bash
# Download recent 50 posts from a TikTok user:
npx tiktok-downloader-mcp @username

# Analyze & download the last 20 posts:
npx tiktok-downloader-mcp @username --max 20

# Download ALL posts from the entire profile:
npx tiktok-downloader-mcp @username --max all
```

### 🎯 Filter by Media Type (Photos vs Videos)
```bash
# 📸 Only photo carousels / slideshows:
npx tiktok-downloader-mcp @username --media photos
# or:
npx tiktok-downloader-mcp @username --photos-only

# 🎬 Only HD MP4 videos:
npx tiktok-downloader-mcp @username --media videos
# or:
npx tiktok-downloader-mcp @username --videos-only

# 🌟 Download everything (Both photos and videos):
npx tiktok-downloader-mcp @username --media all
```

### 🛠️ CLI Options
| Flag | Description | Default |
| :--- | :--- | :--- |
| `--media <all\|photos\|videos>` | Filter type of media to download | `all` |
| `--photos-only` | Download only photo slideshows | `false` |
| `--videos-only` | Download only video files | `false` |
| `--max <N>` | Maximum number of posts to fetch (or `"all"`) | `50` |
| `--out <dir>` | Destination directory | `./tiktok_downloads` |
| `--help`, `-h` | Display CLI help menu | - |

---

## 🤖 2. Model Context Protocol (MCP) Setup

Connect the server to your favorite AI assistant to let the LLM extract, analyze, and download TikTok content for you.

### 🛠️ Available MCP Tools

| Tool | Description | Parameters |
| :--- | :--- | :--- |
| `tiktok_extract_post` | Extract unwatermarked HD video MP4 or photos, audio, and complete metrics (views, likes, comments, shares, saves) from any TikTok URL. | `url` (string) |
| `tiktok_get_user_posts` | List recent post IDs, upload dates, and URLs for a TikTok user or profile URL. | `username` (string), `max` (number, optional) |
| `tiktok_download_post` | Download a single TikTok post (`video.mp4` or `slide_01.jpg`...) into a date-named folder (`YYYY-MM-DD_<id>`) with `post.json`. | `url` (string), `output_dir` (string, optional) |
| `tiktok_download_user_media` | Bulk download all videos and/or photo carousels from an account into date folders, with `post.json` in each and global `account_summary.json`. | `username` (string), `max` (number), `output_dir` (string), `media_type` (`"all"` \| `"photos"` \| `"videos"`) |
| `tiktok_get_user_analytics` | Analyze a profile's performance metrics, totals, averages, and engagement rate without downloading files. | `username` (string), `max` (number) |

---

### ⚙️ MCP Installation Guides

#### A. Claude Code CLI (Recommended)
```bash
# Add with NPX
claude mcp add tiktok-downloader -- npx -y tiktok-downloader-mcp

# Or directly from GitHub
claude mcp add tiktok-downloader -- npx -y github:abdouldotdev/tiktok-downloader-mcp
```

Verify in Claude Code:
```bash
/mcp
```

#### B. Claude Desktop (`claude_desktop_config.json`)
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

#### C. Cursor & Windsurf (`.cursor/mcp.json` or `.mcp.json`)
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

#### D. Antigravity CLI
```bash
agy mcp add tiktok-downloader -- npx -y tiktok-downloader-mcp
```

---

## 📁 Output Directory Structure

```text
tiktok_downloads/
  └── example_user/
      ├── account_summary.json            # Cumulative totals, averages, engagement & top posts
      ├── account_activity.json           # Complete chronological history of all posts
      │
      ├── 2026-08-16_7674774636999003406/ # 📸 Photo Slideshow post folder
      │   ├── slide_01.jpg
      │   ├── slide_02.jpg
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

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/abdouldotdev/tiktok-downloader-mcp.git
cd tiktok-downloader-mcp

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run CLI directly
node dist/index.js @username --max 10

# Run MCP server on stdio
node dist/index.js --stdio
```

---

## 📄 License

MIT © [abdouldotdev](https://github.com/abdouldotdev)
