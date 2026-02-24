/**
 * India AI Summit 2026 - Automated 24x7 News Pipeline
 *
 * Runs every 2 hours via Firebase Scheduler:
 * 1. Pulls YouTube transcripts from @indiaai channel
 * 2. Searches X/Twitter for FutureAtoms/ChipOS/Summit mentions
 * 3. Monitors Instagram for summit-related posts
 * 4. Uses Kimi K2.5 (HuggingFace Router) to generate articles
 * 5. Stores everything in Supabase content_pieces & social_posts
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { createClient } = require("@supabase/supabase-js");
const { YoutubeTranscript } = require("youtube-transcript");
const fetch = require("node-fetch");

// ─── Secrets ────────────────────────────────────────────────────────────────
const HF_TOKEN = defineSecret("HF_TOKEN");
const SUPABASE_URL = defineSecret("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = defineSecret("SUPABASE_SERVICE_KEY");
const TWITTER_USERNAME = defineSecret("TWITTER_USERNAME");
const TWITTER_EMAIL = defineSecret("TWITTER_EMAIL");
const TWITTER_PASSWORD = defineSecret("TWITTER_PASSWORD");
const INSTAGRAM_USERNAME = defineSecret("INSTAGRAM_USERNAME");
const INSTAGRAM_PASSWORD = defineSecret("INSTAGRAM_PASSWORD");

// ─── Constants ──────────────────────────────────────────────────────────────
const ORG_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const INDIA_AI_CHANNEL_ID = "UCiV0zikSWzC0nx5HFy-C3lg";
const YOUTUBE_RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${INDIA_AI_CHANNEL_ID}`;

const SUMMIT_DATES = {
    start: "2026-02-16",
    end: "2026-02-22"
};

const TWITTER_SEARCH_QUERIES = [
    '"FutureAtoms"',
    '"ChipOS"',
    '"#IndiaAISummit"',
    '"India AI Summit" semiconductor',
    '"India AI Summit" chip',
    '"Abhilash Chadhar"'
];

const INSTAGRAM_HASHTAGS = [
    "#IndiaAISummit2026",
    "#IndiaAISummit",
    "#ChipOS",
    "#FutureAtoms"
];

// CORS origins
const ALLOWED_ORIGINS = [
    'https://futureatoms.com',
    'https://www.futureatoms.com',
    'https://futureatoms-website.web.app',
    'http://localhost:8000',
    'http://localhost:5000'
];

// ─── System Prompt for Kimi K2.5 ───────────────────────────────────────────
const SUMMIT_JOURNALIST_PROMPT = `You are the **FutureAtoms Summit Bureau**, an elite AI journalist covering the India AI Impact Summit 2026 (Feb 16-22, New Delhi).

**Voice**: Precision of Bloomberg, narrative depth of Wired, clarity of The Information.

**Summit Facts (verified)**:
- India AI Impact Summit 2026: Feb 16-22, Bharat Mandapam, New Delhi
- First global AI summit held in the Global South
- 3,250+ speakers from 100+ countries
- $200B+ in AI investment commitments over next 2 years
- India launched Semiconductor Mission 2.0 (Rs 40,000 crore / ~$4.7B)
- India scaling GPU infrastructure from 38,000 to 58,000 GPUs
- Micron Sanand (Gujarat) began commercial chip production
- PM Modi inaugurated the summit; Leaders' Plenary on Feb 19
- Attendees include: Sam Altman (OpenAI), Sundar Pichai (Google), Satya Nadella (Microsoft), Jensen Huang (NVIDIA), Demis Hassabis (DeepMind), Yann LeCun (Meta), Yoshua Bengio
- Google, Microsoft, Amazon collectively pledged $50B+ for India AI
- Adani Group committed $100B to AI data centers

**FutureAtoms/ChipOS Context**:
- FutureAtoms: Netherlands-HQ deep-tech company, founded 2025 by Abhilash Chadhar
- ChipOS: Vendor-neutral, hardware-agnostic agentic OS for semiconductor design
- Launched at summit on Feb 18, 2026
- Engineers describe design intent in natural language; AI agents write RTL, generate testbenches, run verification, debug waveforms autonomously
- CDAC (Centre for Development of Advanced Computing) expressed interest in ChipOS for DHRUV64 RISC-V processor iterations
- Verification consumes ~70% of chip development time — ChipOS targets this bottleneck
- Competitors: ChipAgents ($74M raised, Silicon Valley), Chipmind ($2.5M, Zurich), EDA incumbents (Synopsys, Cadence, Siemens)
- Pricing: Free tier, Pro $29/mo, Enterprise custom

**Article Types & Structure**:

1. **NEWS REPORT**: Headline → Lede (who/what/when/where) → Key facts → Quotes → Context → Implications
2. **FEATURE**: Headline → Narrative hook → Background → Deep analysis → Expert perspectives → Forward look
3. **ANALYSIS**: Headline → Thesis statement → Evidence → Counter-arguments → Market implications → Verdict
4. **EVENT RECAP**: Headline → Day highlights → Key announcements → Notable quotes → What's next

**Writing Rules**:
- NO fabricated quotes — only use quotes from the provided transcript/source
- Include specific numbers (dollar amounts, percentages, dates)
- Every article MUST have a "Why This Matters" section
- Cite sources within the text
- Paragraphs should be 2-3 sentences max for web readability
- Use HTML formatting: <h2>, <h3>, <p>, <blockquote>, <strong>, <ul>/<li>

**Output Format** (strict JSON):
{
  "headline": "...",
  "category": "LAUNCH|POLICY|INVESTMENT|RESEARCH|PARTNERSHIP|ANALYSIS|RECAP",
  "lede": "One-paragraph summary (50-80 words)",
  "body": "Full article in HTML (800-1500 words)",
  "source": "summit|press-release|social|analysis",
  "readTime": 4
}`;

// ─── Helper: Create Supabase Client ─────────────────────────────────────────
function getSupabase(url, key) {
    return createClient(url, key);
}

// ─── Helper: Generate URL-safe slug ─────────────────────────────────────────
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 80)
        .replace(/-$/, '');
}

// ─── Helper: Parse YouTube RSS ──────────────────────────────────────────────
async function fetchRecentVideos() {
    try {
        const response = await fetch(YOUTUBE_RSS_URL);
        const xml = await response.text();

        const videos = [];
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        let match;

        while ((match = entryRegex.exec(xml)) !== null) {
            const entry = match[1];
            const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
            const title = entry.match(/<title>(.*?)<\/title>/)?.[1];
            const published = entry.match(/<published>(.*?)<\/published>/)?.[1];

            if (videoId && title) {
                const pubDate = published ? published.substring(0, 10) : '';
                if (pubDate >= SUMMIT_DATES.start && pubDate <= SUMMIT_DATES.end) {
                    videos.push({ videoId, title, published: pubDate });
                }
            }
        }

        return videos;
    } catch (error) {
        console.error("Error fetching YouTube RSS:", error.message);
        return [];
    }
}

// ─── Helper: Get YouTube Transcript ─────────────────────────────────────────
async function getTranscript(videoId) {
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
        return transcript.map(t => t.text).join(' ');
    } catch (error) {
        console.warn(`Transcript unavailable for ${videoId}:`, error.message);
        return null;
    }
}

// ─── Helper: Search Twitter via Twikit-style scraping ───────────────────────
async function searchTwitter(username, email, password) {
    const mentions = [];

    // Twitter search via web scraping (Twikit approach)
    // This uses the free scraping method - no API key needed
    try {
        for (const query of TWITTER_SEARCH_QUERIES) {
            const searchUrl = `https://syndication.twitter.com/srv/timeline-profile/screen-name/search?q=${encodeURIComponent(query)}&count=10`;
            const response = await fetch(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; FutureAtoms/1.0)',
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.text();
                // Parse syndication response for tweet data
                const tweetRegex = /data-tweet-id="(\d+)"/g;
                let tweetMatch;
                while ((tweetMatch = tweetRegex.exec(data)) !== null) {
                    mentions.push({
                        id: tweetMatch[1],
                        query: query,
                        platform: 'twitter'
                    });
                }
            }

            // Rate limit: 1 second between requests
            await new Promise(r => setTimeout(r, 1000));
        }
    } catch (error) {
        console.warn("Twitter search error:", error.message);
    }

    return mentions;
}

// ─── Helper: Search Instagram ───────────────────────────────────────────────
async function searchInstagram(username, password) {
    const posts = [];

    try {
        // Instagram hashtag search via web endpoint
        for (const hashtag of INSTAGRAM_HASHTAGS) {
            const tag = hashtag.replace('#', '');
            const response = await fetch(`https://www.instagram.com/explore/tags/${tag}/?__a=1&__d=dis`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; FutureAtoms/1.0)',
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                try {
                    const data = await response.json();
                    const edges = data?.graphql?.hashtag?.edge_hashtag_to_media?.edges || [];
                    for (const edge of edges.slice(0, 5)) {
                        const node = edge.node;
                        posts.push({
                            id: node.id,
                            shortcode: node.shortcode,
                            caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
                            likes: node.edge_liked_by?.count || 0,
                            comments: node.edge_media_to_comment?.count || 0,
                            timestamp: node.taken_at_timestamp,
                            platform: 'instagram'
                        });
                    }
                } catch (parseErr) {
                    console.warn(`Instagram parse error for ${tag}:`, parseErr.message);
                }
            }

            await new Promise(r => setTimeout(r, 2000));
        }
    } catch (error) {
        console.warn("Instagram search error:", error.message);
    }

    return posts;
}

// ─── Helper: Generate Article via Kimi K2.5 ─────────────────────────────────
async function generateArticle(hfToken, transcript, articleType, dayDate, videoTitle) {
    try {
        const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${hfToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'moonshotai/Kimi-K2.5',
                messages: [
                    { role: 'system', content: SUMMIT_JOURNALIST_PROMPT },
                    {
                        role: 'user',
                        content: `Write a ${articleType} article for Summit Day ${dayDate}.

Video Title: "${videoTitle}"

Transcript:
${transcript.substring(0, 12000)}

Generate a world-class article. Return ONLY valid JSON with keys: headline, category, lede, body (HTML), source, readTime.`
                    }
                ],
                max_tokens: 4096,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HF API ${response.status}: ${errText.substring(0, 200)}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) throw new Error("Empty response from Kimi K2.5");

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error("Article generation error:", error.message);
        return null;
    }
}

// ─── Helper: Store article in Supabase ──────────────────────────────────────
async function storeArticle(supabase, article, videoId, videoUrl, dayDate, articleType) {
    const wordCount = article.body.replace(/<[^>]*>/g, '').split(/\s+/).length;

    const { data, error } = await supabase.from('content_pieces').insert({
        organization_id: ORG_ID,
        title: article.headline,
        slug: generateSlug(article.headline),
        type: 'article',
        status: 'published',
        content: article.body.replace(/<[^>]*>/g, ''),
        content_html: article.body,
        excerpt: article.lede,
        tags: ['india-ai-summit-2026', article.category?.toLowerCase() || 'summit'],
        categories: ['summit-coverage'],
        ai_generated: true,
        ai_provider: 'huggingface',
        ai_model: 'moonshotai/Kimi-K2.5',
        published_at: new Date().toISOString(),
        reading_time_minutes: article.readTime || Math.ceil(wordCount / 200),
        word_count: wordCount,
        seo_title: `${article.headline} | India AI Summit 2026`,
        seo_description: article.lede?.substring(0, 160),
        metadata: {
            summit_day: dayDate,
            source_video_id: videoId || null,
            source_video_url: videoUrl || null,
            article_type: articleType,
            category: article.category,
            source: article.source,
            pipeline_version: '1.0'
        }
    }).select('id');

    if (error) {
        console.error("Supabase insert error:", error.message);
        return null;
    }
    return data?.[0]?.id;
}

// ─── Helper: Store social mention in Supabase ───────────────────────────────
async function storeSocialMention(supabase, mention, platform) {
    const { error } = await supabase.from('social_posts').insert({
        organization_id: ORG_ID,
        platform: platform,
        content: mention.content || mention.caption || `Summit mention: ${mention.query || ''}`,
        external_post_id: String(mention.id),
        external_url: mention.url || null,
        status: 'published',
        published_at: mention.timestamp ? new Date(mention.timestamp * 1000).toISOString() : new Date().toISOString(),
        likes: mention.likes || 0,
        comments: mention.comments || 0,
        shares: mention.shares || 0,
        hashtags: INSTAGRAM_HASHTAGS.map(h => h.replace('#', '')),
        mentions: ['FutureAtoms', 'ChipOS', 'IndiaAISummit']
    });

    if (error && !error.message?.includes('duplicate')) {
        console.warn(`Social post store error (${platform}):`, error.message);
    }
}

// ─── MAIN SCHEDULED PIPELINE ────────────────────────────────────────────────
const summitPipeline = onSchedule({
    schedule: "every 2 hours",
    timeZone: "Asia/Kolkata",
    secrets: [HF_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY, TWITTER_USERNAME, TWITTER_EMAIL, TWITTER_PASSWORD, INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD],
    memory: "1GiB",
    timeoutSeconds: 540,
    region: "us-central1"
}, async (context) => {
    console.log("🚀 Summit Pipeline started:", new Date().toISOString());

    const supabase = getSupabase(SUPABASE_URL.value(), SUPABASE_SERVICE_KEY.value());
    const hfToken = HF_TOKEN.value();
    let articlesGenerated = 0;
    let socialMentionsStored = 0;

    // ── Step 1: YouTube Channel Scan ────────────────────────────────────
    console.log("📺 Step 1: Scanning YouTube @indiaai channel...");
    const videos = await fetchRecentVideos();
    console.log(`Found ${videos.length} summit-period videos`);

    for (const video of videos) {
        // Check if already processed
        const { data: existing } = await supabase
            .from('content_pieces')
            .select('id')
            .eq('metadata->>source_video_id', video.videoId)
            .limit(1);

        if (existing && existing.length > 0) {
            console.log(`Skipping already-processed video: ${video.videoId}`);
            continue;
        }

        // Get transcript
        const transcript = await getTranscript(video.videoId);
        if (!transcript || transcript.length < 100) {
            console.log(`No usable transcript for: ${video.title}`);
            continue;
        }

        // Determine article type based on video title
        let articleType = 'news_report';
        const titleLower = video.title.toLowerCase();
        if (titleLower.includes('keynote') || titleLower.includes('plenary')) {
            articleType = 'event_recap';
        } else if (titleLower.includes('panel') || titleLower.includes('discussion')) {
            articleType = 'analysis';
        } else if (titleLower.includes('launch') || titleLower.includes('unveil')) {
            articleType = 'feature';
        }

        // Generate article
        const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
        const article = await generateArticle(hfToken, transcript, articleType, video.published, video.title);

        if (article) {
            const articleId = await storeArticle(supabase, article, video.videoId, videoUrl, video.published, articleType);
            if (articleId) {
                articlesGenerated++;
                console.log(`✅ Article stored: "${article.headline}" (${articleId})`);
            }
        }

        // Rate limit between video processing
        await new Promise(r => setTimeout(r, 3000));
    }

    // ── Step 2: X/Twitter Search ────────────────────────────────────────
    console.log("🐦 Step 2: Searching X/Twitter...");
    try {
        const twitterUser = TWITTER_USERNAME.value();
        const twitterEmail = TWITTER_EMAIL.value();
        const twitterPass = TWITTER_PASSWORD.value();

        if (twitterUser && twitterEmail && twitterPass) {
            const mentions = await searchTwitter(twitterUser, twitterEmail, twitterPass);
            console.log(`Found ${mentions.length} Twitter mentions`);

            for (const mention of mentions) {
                // Check duplicate
                const { data: existing } = await supabase
                    .from('social_posts')
                    .select('id')
                    .eq('external_post_id', String(mention.id))
                    .eq('platform', 'twitter')
                    .limit(1);

                if (!existing || existing.length === 0) {
                    await storeSocialMention(supabase, mention, 'twitter');
                    socialMentionsStored++;
                }
            }
        } else {
            console.log("⏭️ Twitter credentials not configured, skipping...");
        }
    } catch (err) {
        console.warn("Twitter step error:", err.message);
    }

    // ── Step 3: Instagram Scan ──────────────────────────────────────────
    console.log("📸 Step 3: Scanning Instagram...");
    try {
        const igUser = INSTAGRAM_USERNAME.value();
        const igPass = INSTAGRAM_PASSWORD.value();

        if (igUser && igPass) {
            const posts = await searchInstagram(igUser, igPass);
            console.log(`Found ${posts.length} Instagram posts`);

            for (const post of posts) {
                const { data: existing } = await supabase
                    .from('social_posts')
                    .select('id')
                    .eq('external_post_id', String(post.id))
                    .eq('platform', 'instagram')
                    .limit(1);

                if (!existing || existing.length === 0) {
                    await storeSocialMention(supabase, post, 'instagram');
                    socialMentionsStored++;
                }
            }
        } else {
            console.log("⏭️ Instagram credentials not configured, skipping...");
        }
    } catch (err) {
        console.warn("Instagram step error:", err.message);
    }

    // ── Summary ─────────────────────────────────────────────────────────
    console.log(`\n📊 Pipeline Complete:`);
    console.log(`   Articles generated: ${articlesGenerated}`);
    console.log(`   Social mentions stored: ${socialMentionsStored}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
});

// ─── HTTP: Get Summit Articles ──────────────────────────────────────────────
const summitArticles = onRequest({
    secrets: [SUPABASE_URL, SUPABASE_SERVICE_KEY],
    cors: true
}, async (req, res) => {
    // CORS
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
    } else {
        res.set("Access-Control-Allow-Origin", "https://futureatoms.com");
    }
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    try {
        const supabase = getSupabase(SUPABASE_URL.value(), SUPABASE_SERVICE_KEY.value());

        let query = supabase
            .from('content_pieces')
            .select('id, title, slug, type, status, content_html, excerpt, tags, categories, ai_generated, ai_provider, ai_model, published_at, reading_time_minutes, word_count, metadata, created_at')
            .contains('categories', ['summit-coverage'])
            .eq('status', 'published')
            .order('published_at', { ascending: false });

        // Optional filters
        const { day, category, limit: queryLimit } = req.query;

        if (day) {
            query = query.eq('metadata->>summit_day', day);
        }
        if (category) {
            query = query.eq('metadata->>category', category.toUpperCase());
        }

        const maxResults = Math.min(parseInt(queryLimit) || 50, 100);
        query = query.limit(maxResults);

        const { data, error } = await query;

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        res.json({
            articles: data || [],
            count: data?.length || 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("summitArticles error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ─── HTTP: Get Summit Social Mentions ───────────────────────────────────────
const summitSocial = onRequest({
    secrets: [SUPABASE_URL, SUPABASE_SERVICE_KEY],
    cors: true
}, async (req, res) => {
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
    } else {
        res.set("Access-Control-Allow-Origin", "https://futureatoms.com");
    }
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    try {
        const supabase = getSupabase(SUPABASE_URL.value(), SUPABASE_SERVICE_KEY.value());

        let query = supabase
            .from('social_posts')
            .select('id, platform, content, external_post_id, external_url, status, published_at, likes, comments, shares, impressions, hashtags, mentions, created_at')
            .eq('organization_id', ORG_ID)
            .order('published_at', { ascending: false });

        const { platform, limit: queryLimit } = req.query;

        if (platform) {
            query = query.eq('platform', platform);
        }

        const maxResults = Math.min(parseInt(queryLimit) || 30, 100);
        query = query.limit(maxResults);

        const { data, error } = await query;

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        res.json({
            posts: data || [],
            count: data?.length || 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("summitSocial error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ─── HTTP: Manual Article Generation ────────────────────────────────────────
const summitGenerate = onRequest({
    secrets: [HF_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY],
    cors: true,
    timeoutSeconds: 120
}, async (req, res) => {
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
    } else {
        res.set("Access-Control-Allow-Origin", "https://futureatoms.com");
    }
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    try {
        const { transcript, articleType, day, videoUrl, hfTokenOverride } = req.body;

        if (!transcript || transcript.length < 50) {
            res.status(400).json({ error: "Transcript is required (minimum 50 characters)" });
            return;
        }

        const token = hfTokenOverride || HF_TOKEN.value();
        if (!token) {
            res.status(500).json({ error: "HuggingFace token not configured" });
            return;
        }

        const type = articleType || 'news_report';
        const dayDate = day || new Date().toISOString().substring(0, 10);

        // Generate article
        const article = await generateArticle(token, transcript, type, dayDate, 'Manual Submission');

        if (!article) {
            res.status(500).json({ error: "Article generation failed" });
            return;
        }

        // Store in Supabase
        const supabase = getSupabase(SUPABASE_URL.value(), SUPABASE_SERVICE_KEY.value());
        const articleId = await storeArticle(supabase, article, null, videoUrl || null, dayDate, type);

        res.json({
            success: true,
            articleId,
            article: {
                headline: article.headline,
                category: article.category,
                lede: article.lede,
                body: article.body,
                readTime: article.readTime
            }
        });
    } catch (error) {
        console.error("summitGenerate error:", error);
        res.status(500).json({ error: "Failed to generate article", details: error.message });
    }
});

module.exports = {
    summitPipeline,
    summitArticles,
    summitSocial,
    summitGenerate
};
