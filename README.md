# 📱 TikTok Downloader & Analytics MCP Server

[![npm version](https://img.shields.io/npm/v/tiktok-downloader-mcp.svg)](https://www.npmjs.com/package/tiktok-downloader-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A **Model Context Protocol (MCP)** server that allows AI models and assistants (Claude, Cursor, Windsurf, Antigravity, etc.) to **extract, analyze, and bulk-download TikTok photo slideshows/carousels in original HD without watermarks**, with automated post date folder categorization (`YYYY-MM-DD_<id>`) and complete account engagement analytics.

---

## ✨ Features

- 📸 **No-Watermark HD Extraction**: Extract full-resolution photos and slide carousels directly from TikTok links.
- 📁 **Date-Based Organization**: Each post is stored in its own subfolder named after the post's creation date (`YYYY-MM-DD_<id>/slide_01.jpg`).
- 📊 **Comprehensive Account Analytics**:
  - Total Views (`play_count`)
  - Total Likes (`digg_count`)
  - Total Comments (`comment_count`)
  - Total Shares (`share_count`)
  - Total Favorites / Saves (`collect_count`)
  - Average Engagement Rate (%)
  - Top Performing Posts (Most viewed, most liked, most shared, most commented)
- 📝 **Dual-Layer JSON Summaries**:
  - `account_summary.json` & `account_activity.json` in the root account folder.
  - `post.json` & `account_activity_recap.json` inside **every single post folder**.
- 🚀 **Zero Login Required**: Works reliably with short URLs (`vm.tiktok.com`, `vt.tiktok.com`), user handles (`@username`), and direct post links.

---

## 🛠️ MCP Tools

| Tool | Description | Parameters |
| :--- | :--- | :--- |
| `tiktok_extract_post` | Extract unwatermarked HD images and complete metrics (views, likes, comments, shares, saves, audio) from a TikTok URL. | `url` (string) |
| `tiktok_get_user_posts` | List recent post IDs, upload dates, and URLs for a TikTok user or profile URL. | `username` (string), `max` (number, optional) |
| `tiktok_download_post` | Download all HD photos of a single TikTok post into a date-named folder (`YYYY-MM-DD_<id>`) with `post.json`. | `url` (string), `output_dir` (string, optional) |
| `tiktok_download_user_slideshows` | Download all photo carousels from an account into date folders, with `post.json` in each and global `account_summary.json`. | `username` (string), `max` (number), `output_dir` (string), `photos_only` (boolean) |
| `tiktok_get_user_analytics` | Analyze a profile's performance metrics and engagement rate without downloading files. | `username` (string), `max` (number) |

---

## 📦 Installation & Setup

### Requirements
- Node.js >= 18
- `yt-dlp` (optional for profile listing): `brew install yt-dlp` or `pip install yt-dlp`

### Quick Start with NPX

You can run this server directly without installing:

```bash
npx tiktok-downloader-mcp
```

---

## ⚙️ Configuration

### 1. Claude Desktop
Add this to your `claude_desktop_config.json`:

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

### 2. Cursor / Windsurf / Antigravity
Add to your project `.mcp.json` or global MCP settings:

```json
{
  "mcpServers": {
    "tiktok-downloader": {
      "command": "node",
      "args": ["/path/to/tiktok-downloader-mcp/dist/index.js"]
    }
  }
}
```

---

## 📁 Output Directory Structure

```text
tiktok_downloads/
  └── styleshareapp/
      ├── account_summary.json            # Totaux, moyennes d'engagement et top posts
      ├── account_activity.json           # Historique chronologique complet
      ├── 2026-08-16_7674774636999003406/ # Dossier par post nommé avec la date
      │   ├── slide_01.jpg
      │   ├── slide_02.jpg
      │   ├── post.json                  # Stats du post + récap global
      │   └── account_activity_recap.json
      └── 2026-08-15_7674392602606619917/
          ├── slide_01.jpg
          ├── slide_02.jpg
          └── post.json
```

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/Prodevking1/tiktok-downloader-mcp.git
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

MIT © [Prodevking](https://github.com/Prodevking1)
