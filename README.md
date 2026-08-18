# 📱 TikTok Media Downloader & Analytics MCP Server

[![npm version](https://img.shields.io/npm/v/tiktok-downloader-mcp.svg)](https://www.npmjs.com/package/tiktok-downloader-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A **Model Context Protocol (MCP)** server that enables AI assistants (**Claude Code**, **Claude Desktop**, **Cursor**, **Windsurf**, **Antigravity**) to **extract, analyze, and bulk-download TikTok videos (HD MP4) and photo slideshows/carousels in original quality without watermarks**, complete with automated date-based folder organization (`YYYY-MM-DD_<id>`) and in-depth account engagement analytics.

---

## ✨ Features

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

## 🛠️ MCP Tools

| Tool | Description | Parameters |
| :--- | :--- | :--- |
| `tiktok_extract_post` | Extract unwatermarked HD video MP4 or photos, audio, and complete metrics (views, likes, comments, shares, saves) from any TikTok URL. | `url` (string) |
| `tiktok_get_user_posts` | List recent post IDs, upload dates, and URLs for a TikTok user or profile URL. | `username` (string), `max` (number, optional) |
| `tiktok_download_post` | Download a single TikTok post (`video.mp4` or `slide_01.jpg`...) into a date-named folder (`YYYY-MM-DD_<id>`) with `post.json`. | `url` (string), `output_dir` (string, optional) |
| `tiktok_download_user_media` | Bulk download all videos and/or photo carousels from an account into date folders, with `post.json` in each and global `account_summary.json`. | `username` (string), `max` (number), `output_dir` (string), `media_type` (`"all"` \| `"photos"` \| `"videos"`) |
| `tiktok_get_user_analytics` | Analyze a profile's performance metrics, totals, averages, and engagement rate without downloading files. | `username` (string), `max` (number) |

---

## 🚀 Quick Setup & Installation

### 1. Claude Code CLI (Recommended)

Add this MCP server directly to **Claude Code** with a single command:

```bash
# Using NPX (Registry)
claude mcp add tiktok-downloader -- npx -y tiktok-downloader-mcp

# Or directly from GitHub
claude mcp add tiktok-downloader -- npx -y github:abdouldotdev/tiktok-downloader-mcp
```

Verify the connection inside Claude Code by typing:
```bash
/mcp
# or in terminal:
claude mcp list
```

---

### 2. Claude Desktop

Add this configuration to your `claude_desktop_config.json`:

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

---

### 3. Cursor & Windsurf

Add to your project's `.cursor/mcp.json` or `.mcp.json`:

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

---

### 4. Antigravity CLI

Add directly via the `agy` CLI tool:

```bash
agy mcp add tiktok-downloader -- npx -y tiktok-downloader-mcp
```

---

### 5. Standalone NPX Run

Run the MCP server directly via NPX without installation:

```bash
npx -y tiktok-downloader-mcp
```

---

## 📁 Output Directory Structure

```text
tiktok_downloads/
  └── example_user/
      ├── account_summary.json            # Cumulative totals, averages, engagement & top posts
      ├── account_activity.json           # Complete chronological history of all posts
      ├── 2026-08-16_7674774636999003406/ # Photo Slideshow post folder
      │   ├── slide_01.jpg
      │   ├── slide_02.jpg
      │   ├── cover.jpg
      │   ├── post.json                   # Individual post metrics + global account recap
      │   └── account_activity_recap.json
      └── 2026-08-15_7674392602606619917/ # Video post folder
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

# Run MCP server locally
npm start
```

---

## 📄 License

MIT © [abdouldotdev](https://github.com/abdouldotdev)
