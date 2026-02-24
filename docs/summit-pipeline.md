# India AI Summit 2026 — Automated 24x7 News Pipeline

## System Overview

The Summit Pipeline is a fully automated 24x7 news generation system running on Firebase Cloud Functions. It monitors multiple data sources (YouTube, X/Twitter, Instagram), generates articles using Kimi K2.5 via HuggingFace, and stores everything in Supabase for display on the FutureAtoms website.

### Architecture

```
                    ┌─────────────────────────────┐
                    │  Firebase Scheduled Function │
                    │  (runs every 2 hours, 24x7) │
                    └──────────┬──────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     ┌────────────┐   ┌─────────────┐  ┌──────────────┐
     │  YouTube   │   │  X/Twitter  │  │  Instagram   │
     │ Transcript │   │   Search    │  │  Engagement  │
     │  (npm pkg) │   │  (Twikit)   │  │ (private API)│
     └─────┬──────┘   └──────┬──────┘  └──────┬───────┘
           │                 │                 │
           └────────────┬────┴─────────────────┘
                        ▼
              ┌──────────────────┐
              │  Kimi K2.5 via   │
              │  HuggingFace     │
              │  Router API      │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │    Supabase      │
              │  content_pieces  │
              │  social_posts    │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │  Frontend Page   │
              │  auto-refreshes  │
              │  every 5 min     │
              └──────────────────┘
```

### Data Flow

1. **Scheduled function** fires every 2 hours (Asia/Kolkata timezone)
2. **YouTube RSS** feed scanned for @indiaai channel videos during summit dates (Feb 16-22)
3. **Transcripts** extracted via `youtube-transcript` npm package
4. **Deduplication** check against `content_pieces.metadata->>'source_video_id'`
5. **Kimi K2.5** generates article (headline, category, lede, body HTML, readTime)
6. **Supabase** stores article in `content_pieces` with `ai_generated=true`
7. **Social mentions** from X/Twitter and Instagram stored in `social_posts`
8. **Frontend** polls `/api/summit/articles` and `/api/summit/social` every 5 minutes

---

## Setup Guide

### Prerequisites

- Firebase CLI installed (`npm i -g firebase-tools`)
- Firebase project configured (`firebase login`)
- Node.js 20+

### 1. Install Dependencies

```bash
cd functions
npm install
```

New dependencies added:
- `@supabase/supabase-js` ^2.39.0
- `youtube-transcript` ^1.2.0
- `node-fetch` ^2.7.0

### 2. Firebase Secrets

**Already configured (no action needed):**

| Secret | Created | Purpose |
|--------|---------|---------|
| `HF_TOKEN` | 2025-12-28 | HuggingFace token for Kimi K2.5 |
| `SUPABASE_URL` | 2025-11-21 | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | 2025-11-21 | Supabase service role key |
| `GEMINI_API_KEY` | 2025-11-27 | Google Gemini (existing, not used by pipeline) |

**New secrets to add (required for social monitoring):**

The summit pipeline monitors X/Twitter and Instagram for mentions of FutureAtoms, ChipOS, and the India AI Summit. These require account credentials stored as Firebase secrets.

```bash
# ─── X/Twitter Secrets ───────────────────────────────────────
# Required for social mention tracking via Twikit (free, no API key needed)
# Create an X account first, then set these secrets:
firebase functions:secrets:set TWITTER_USERNAME   # Your X handle (without @)
firebase functions:secrets:set TWITTER_EMAIL      # Email associated with the X account
firebase functions:secrets:set TWITTER_PASSWORD   # Account password

# ─── Instagram Secrets ────────────────────────────────────────
# Required for hashtag monitoring via Instagram's public web API
# Uses your existing Instagram account credentials:
firebase functions:secrets:set INSTAGRAM_USERNAME  # Instagram username
firebase functions:secrets:set INSTAGRAM_PASSWORD  # Account password
```

> **Important Notes:**
> - The pipeline **gracefully skips** Twitter/Instagram if credentials are not configured — YouTube article generation still works independently.
> - X/Twitter uses the **syndication endpoint** (free, no paid API keys needed). Rate limits are handled automatically with backoff.
> - Instagram uses the **public hashtag endpoint** (`/explore/tags/{hashtag}/?__a=1`). No API key required.
> - Secrets are encrypted at rest in Google Cloud Secret Manager and only accessible to the deployed function.
> - After setting secrets, **redeploy functions** for them to take effect: `cd functions && npm run deploy`

**Verifying secrets are set:**

```bash
# List all secrets
firebase functions:secrets:access TWITTER_USERNAME
firebase functions:secrets:access INSTAGRAM_USERNAME

# If a secret doesn't exist, the command will return an error
```

### 3. Deploy

```bash
# Deploy functions only
cd functions && npm run deploy

# Or full deploy
cd .. && npm run deploy
```

---

## MCP Server Reference

| Platform | Server | Auth | Tools | Status |
|----------|--------|------|-------|--------|
| YouTube | `youtube-transcript` (npm) | None | `YoutubeTranscript.fetchTranscript(videoId)` | Active |
| YouTube MCP | `mcp-server-youtube-transcript` | None | `get_transcript(url)` | Available |
| X/Twitter | `x-mcp` (Twikit) | Username/password | `search_twitter`, `get_trending` (40+ tools) | Pending credentials |
| Instagram | `instagram-engagement-mcp` | Username/password | `analyze_post_comments` (5 tools) | Pending credentials |
| HF Space | `kirbah/mcp-youtube-transcript` | None | Gradio API | Available |
| AI Writer | Kimi K2.5 via HF Router | HF token | `chat.completions` | Active |

### YouTube Transcript Integration

The pipeline uses the `youtube-transcript` npm package directly (not the MCP server) for simplicity in Firebase Functions. The MCP server is available for Claude Code interactive use.

```javascript
const { YoutubeTranscript } = require("youtube-transcript");
const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
```

### X/Twitter Integration (Twikit approach)

Uses Twitter's syndication endpoint for free search without API keys:
```
https://syndication.twitter.com/srv/timeline-profile/screen-name/search?q=...
```

Search queries:
- `"FutureAtoms"`, `"ChipOS"`, `"#IndiaAISummit"`
- `"India AI Summit" semiconductor`, `"Abhilash Chadhar"`

### Instagram Integration

Uses Instagram's public hashtag endpoint:
```
https://www.instagram.com/explore/tags/{hashtag}/?__a=1&__d=dis
```

Monitored hashtags: `#IndiaAISummit2026`, `#IndiaAISummit`, `#ChipOS`, `#FutureAtoms`

---

## Article Generation

### Kimi K2.5 Configuration

- **Endpoint**: `https://router.huggingface.co/v1/chat/completions`
- **Model**: `moonshotai/Kimi-K2.5`
- **Max tokens**: 4096
- **Temperature**: 0.7

### Article Types

| Type | Structure | Use Case |
|------|-----------|----------|
| `news_report` | Headline → Lede → Key facts → Quotes → Context → Implications | Breaking news, announcements |
| `feature` | Headline → Narrative hook → Background → Deep analysis → Forward look | Product launches, profiles |
| `analysis` | Headline → Thesis → Evidence → Counter-arguments → Verdict | Market analysis, opinion |
| `event_recap` | Headline → Day highlights → Key announcements → What's next | Daily summaries |

### System Prompt

The system prompt (`SUMMIT_JOURNALIST_PROMPT`) includes:
- Identity: FutureAtoms Summit Bureau journalist
- Voice: Bloomberg precision + Wired narrative + The Information clarity
- Pre-loaded summit facts (verified)
- FutureAtoms/ChipOS context
- Writing rules (no fabricated quotes, specific numbers, "Why This Matters" required)
- Output format: JSON with `headline`, `category`, `lede`, `body` (HTML), `source`, `readTime`

### Output JSON Schema

```json
{
  "headline": "Article Title (60-100 chars)",
  "category": "LAUNCH|POLICY|INVESTMENT|RESEARCH|PARTNERSHIP|ANALYSIS|RECAP",
  "lede": "One-paragraph summary (50-80 words)",
  "body": "Full article in HTML (800-1500 words)",
  "source": "summit|press-release|social|analysis",
  "readTime": 4
}
```

---

## API Reference

### GET /api/summit/articles

Retrieve published summit articles from Supabase.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `day` | string | all | Filter by summit day (e.g., `2026-02-18`) |
| `category` | string | all | Filter by category (e.g., `LAUNCH`) |
| `limit` | integer | 50 | Max results (capped at 100) |

**Example:**
```bash
curl "https://futureatoms.com/api/summit/articles?day=2026-02-18&category=LAUNCH"
```

**Response:**
```json
{
  "articles": [
    {
      "id": "uuid",
      "title": "FutureAtoms Unveils ChipOS...",
      "slug": "futureatoms-unveils-chipos...",
      "content_html": "<h2>...</h2><p>...</p>",
      "excerpt": "...",
      "tags": ["india-ai-summit-2026", "launch"],
      "categories": ["summit-coverage"],
      "ai_generated": true,
      "ai_provider": "huggingface",
      "ai_model": "moonshotai/Kimi-K2.5",
      "published_at": "2026-02-18T11:00:00+05:30",
      "reading_time_minutes": 5,
      "word_count": 420,
      "metadata": {
        "summit_day": "2026-02-18",
        "category": "LAUNCH",
        "source": "press-release"
      }
    }
  ],
  "count": 1,
  "timestamp": "2026-02-19T12:00:00Z"
}
```

### GET /api/summit/social

Retrieve social media mentions.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `platform` | string | all | Filter by platform (`twitter`, `instagram`, `youtube`) |
| `limit` | integer | 30 | Max results (capped at 100) |

**Example:**
```bash
curl "https://futureatoms.com/api/summit/social?platform=twitter&limit=10"
```

### POST /api/summit/generate

Manually generate an article from a transcript.

**Request Body:**
```json
{
  "transcript": "Full transcript text (min 50 chars)...",
  "articleType": "news_report",
  "day": "2026-02-18",
  "videoUrl": "https://youtube.com/watch?v=...",
  "hfTokenOverride": "hf_..."
}
```

**Response:**
```json
{
  "success": true,
  "articleId": "uuid",
  "article": {
    "headline": "...",
    "category": "LAUNCH",
    "lede": "...",
    "body": "<h2>...</h2>...",
    "readTime": 4
  }
}
```

---

## Supabase Schema

### content_pieces (articles)

| Column | Type | Description |
|--------|------|-------------|
| `organization_id` | uuid | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| `title` | text | Article headline |
| `slug` | text | URL-safe slug |
| `type` | enum | `article` |
| `status` | enum | `published` |
| `content` | text | Plain text content |
| `content_html` | text | HTML formatted body |
| `excerpt` | text | Article lede / summary |
| `tags` | text[] | `['india-ai-summit-2026', 'launch']` |
| `categories` | text[] | `['summit-coverage']` |
| `ai_generated` | boolean | `true` |
| `ai_provider` | text | `huggingface` |
| `ai_model` | text | `moonshotai/Kimi-K2.5` |
| `metadata` | jsonb | Summit day, source video, category, etc. |

### social_posts (mentions)

| Column | Type | Description |
|--------|------|-------------|
| `organization_id` | uuid | Same org ID |
| `platform` | enum | `twitter`, `instagram`, `youtube` |
| `content` | text | Post content |
| `external_post_id` | text | Platform-specific ID |
| `external_url` | text | Link to original post |
| `hashtags` | text[] | Related hashtags |
| `likes`, `comments`, `shares` | integer | Engagement metrics |

---

## Monitoring & Troubleshooting

### View Logs

```bash
# All function logs
firebase functions:log

# Specific function
firebase functions:log --only summitPipeline

# Real-time streaming
firebase functions:log --only summitPipeline --follow
```

### Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to Functions → summitPipeline
3. View execution history, errors, and timing

### Manually Trigger Pipeline

The scheduled function can be triggered via Firebase Console or by calling the `summitGenerate` HTTP endpoint with a transcript.

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "HF API 429" | HuggingFace rate limit | Wait 60s, pipeline has built-in delays |
| "Transcript unavailable" | Video has no captions | Skipped automatically, check logs |
| "Empty response from Kimi" | Model overloaded | Retry on next pipeline run |
| "Twitter search error" | Rate limited or blocked | Uses syndication endpoint, self-healing |
| "Supabase insert error" | Schema mismatch | Check enum values match DB schema |
| Secrets not found | Not deployed | Run `firebase functions:secrets:set <NAME>` |

### Health Check

```bash
# Check articles are being generated
curl -s "https://futureatoms.com/api/summit/articles?limit=1" | jq '.count'

# Check social mentions
curl -s "https://futureatoms.com/api/summit/social?limit=1" | jq '.count'
```

---

## Cost Analysis

| Service | Free Tier | Projected Usage | Monthly Cost |
|---------|-----------|-----------------|--------------|
| Firebase Functions | 2M invocations/mo | ~360 invocations/mo (12/day) | **$0** |
| Firebase Scheduler | 3 jobs free | 1 job | **$0** |
| HuggingFace Router | Free tier (rate limited) | ~50 articles/week | **$0** (or $9/mo PRO for 20x) |
| Supabase | 500MB DB, 5GB bandwidth | ~50MB articles + 10MB social | **$0** |
| X/Twitter (Twikit) | Free (scraping) | ~100 searches/day | **$0** |
| Instagram | Free (web API) | ~50 lookups/day | **$0** |
| **Total** | | | **$0/mo** (Free tier) |

---

## Files Reference

| File | Status | Purpose |
|------|--------|---------|
| `functions/summit-pipeline.js` | NEW | Scheduled pipeline + HTTP endpoints |
| `functions/index.js` | MODIFIED | Imports and exports summit functions |
| `functions/package.json` | MODIFIED | Added supabase-js, youtube-transcript, node-fetch |
| `firebase.json` | MODIFIED | Added /api/summit/* routes |
| `public/india-ai-summit-2026.html` | NEW | Frontend page with auto-refresh |
| `public/news.html` | MODIFIED | Added summit featured card |
| `public/sitemap.xml` | MODIFIED | Added summit page URL |
| `docs/summit-pipeline.md` | NEW | This documentation |

---

## Seeded Content

17 articles pre-populated covering Feb 16-22:

| # | Date | Headline | Category |
|---|------|----------|----------|
| 1 | Feb 16 | PM Modi Inaugurates India AI Summit Expo | POLICY |
| 2 | Feb 16 | Adani Group Commits $100B to AI Data Centers | INVESTMENT |
| 3 | Feb 17 | Health AI Sessions Spotlight 1.4B-Person Opportunity | RESEARCH |
| 4 | Feb 17 | Google, Microsoft, Amazon Pledge $50B+ | INVESTMENT |
| 5 | **Feb 18** | **FutureAtoms Unveils ChipOS** | **LAUNCH** |
| 6 | **Feb 18** | **CDAC Explores ChipOS for DHRUV64 RISC-V** | **PARTNERSHIP** |
| 7 | Feb 18 | Hassabis, Bengio, LeCun Joint Keynote | RESEARCH |
| 8 | Feb 18 | India Launches Semiconductor Mission 2.0 | POLICY |
| 9 | Feb 18 | Micron Sanand Begins Commercial Production | LAUNCH |
| 10 | Feb 19 | PM Modi Opens Leaders' Plenary | POLICY |
| 11 | Feb 19 | Altman, Pichai, Macron CEO Roundtable | PARTNERSHIP |
| 12 | Feb 19 | India Adds 20,000 GPUs (38K to 58K) | POLICY |
| 13 | Feb 20 | Summit Wrap: Five Days That Redefined AI | RECAP |
| 14 | Feb 20 | Summit Sets Guinness World Record | INVESTMENT |
| 15 | Feb 20 | Google-Jio Cloud AI Cluster Partnership | PARTNERSHIP |
| 16 | Feb 21 | What ChipOS Means for India's $200B Ambition | ANALYSIS |
| 17 | Feb 22 | The Numbers That Defined Summit Week | RECAP |
