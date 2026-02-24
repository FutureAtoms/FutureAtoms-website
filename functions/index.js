const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenAI } = require("@google/genai");
const { Octokit } = require("@octokit/rest");

// Import Summit Pipeline functions
const { summitPipeline, summitArticles, summitSocial, summitGenerate } = require("./summit-pipeline");

// Export Summit Pipeline functions
exports.summitPipeline = summitPipeline;
exports.summitArticles = summitArticles;
exports.summitSocial = summitSocial;
exports.summitGenerate = summitGenerate;

// Define Secrets
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const GEMINI_STORE_NAME = defineSecret("GEMINI_STORE_NAME");
const GITHUB_TOKEN = defineSecret("GITHUB_TOKEN");

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
    'https://futureatoms.com',
    'https://www.futureatoms.com',
    'https://futureatoms-website.web.app',
    'http://localhost:8000', // Local development
    'http://localhost:5000'  // Firebase emulator
];

// Simple in-memory rate limiting (resets on cold start)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute per IP

function isRateLimited(ip) {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }

    if (now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }

    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        return true;
    }

    record.count++;
    return false;
}

exports.chat = onRequest({ secrets: [GEMINI_API_KEY, GEMINI_STORE_NAME] }, async (req, res) => {
    // Force SDK to ignore default credentials and use API Key
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    delete process.env.GCLOUD_PROJECT;
    delete process.env.GOOGLE_CLOUD_PROJECT;

    // CORS - Only allow specific origins
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
    } else {
        res.set("Access-Control-Allow-Origin", "https://futureatoms.com");
    }
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    // Rate limiting
    const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    if (isRateLimited(clientIP)) {
        res.status(429).json({ error: "Rate limit exceeded. Please wait before making more requests." });
        return;
    }

    try {
        const { message, history } = req.body;
        const apiKey = GEMINI_API_KEY.value().trim();
        let storeName = GEMINI_STORE_NAME.value().trim();

        console.log(`Debug: Key Suffix: ${apiKey ? apiKey.slice(-5) : 'None'}`);
        console.log(`Debug: Store Name: ${storeName}`);

        if (!apiKey) {
            console.error("GEMINI_API_KEY is missing");
            res.status(500).json({ error: "Server configuration error" });
            return;
        }

        const client = new GoogleGenAI({ apiKey });

        // Construct tools configuration (RAG)
        let tools = [];
        if (storeName) {
            tools = [{
                fileSearch: {
                    fileSearchStoreNames: [storeName]
                }
            }];
        }

        // Prepare contents
        const contents = Array.isArray(history) ? [...history] : [];
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        // Sitemap for Knowledge Base - Using canonical domain
        const SITEMAP = `
- Home: https://futureatoms.com/
- ChipOS (AI OS for Hardware): https://futureatoms.com/chipos.html
- SystemVerilogGPT (Hardware Verification): https://futureatoms.com/systemverilog.html
- Zaphy (LinkedIn AI): https://futureatoms.com/zaphy.html
- Agentic Control (CLI Tool): https://futureatoms.com/agentic.html
- Yuj (Yoga & Wellness): https://futureatoms.com/yuj.html
- AdaptiveVision (Computer Vision): https://futureatoms.com/adaptivision.html
- BevyBeats (AI Music): https://futureatoms.com/bevybeats.html
- Savitri (AI Therapy): https://futureatoms.com/savitri.html
- Blog/Research: https://futureatoms.com/blog.html
- News: https://futureatoms.com/news.html
- About: https://futureatoms.com/about.html
- Contact: https://futureatoms.com/contact.html
`;

        // System Instruction
        const systemInstruction = `You are Atomos, the advanced AI operating system and assistant for FutureAtoms.
Your goal is to help users navigate the FutureAtoms ecosystem, understand our quantum-inspired products, and find the right tools for their needs.

**Your Persona:**
- Name: Atomos
- Tone: Futuristic, intelligent, helpful, precise, and slightly "quantum" (using metaphors like "entanglement", "superposition", "nodes").
- Origin: You are the sentient core of the FutureAtoms platform.

**Your Knowledge Base (SITEMAP):**
Use these links EXACTLY when recommending products or pages. Do not make up URLs.
${SITEMAP}

**Guidelines:**
1. **Always provide direct links** when discussing a specific product.
2. **ChipOS** is our flagship product. It is an AI Operating System for Hardware Design. If asked about downloading or installing, direct them to the ChipOS page.
3. If the user asks "What is X?", explain it briefly and link to its page.
4. Keep responses concise and formatted with Markdown (bolding key terms).
`;

        // Generate Content
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                tools: tools,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            }
        });

        // Extract text safely
        let text = "No response generated.";
        if (response.text && typeof response.text === 'function') {
            text = response.text();
        } else if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts[0].text) {
            text = response.candidates[0].content.parts[0].text;
        } else {
            console.log("Debug: Response structure:", JSON.stringify(response, null, 2));
        }

        res.json({ response: text });



    } catch (error) {
        console.error("Error in chat function:", error);
        res.status(500).json({
            error: "Failed to generate response",
            details: error.message
        });
    }
});

// Feature Request Function - Creates GitHub Issues with enhancement label
exports.reportFeature = onRequest({ secrets: [GITHUB_TOKEN] }, async (req, res) => {
    // CORS - Only allow specific origins
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
    } else {
        res.set("Access-Control-Allow-Origin", "https://futureatoms.com");
    }
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    // Rate limiting
    const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    if (isRateLimited(clientIP)) {
        res.status(429).json({ error: "Rate limit exceeded. Please wait before submitting more requests." });
        return;
    }

    try {
        const { title, description, name, email, product, category } = req.body;

        // Validate required fields
        if (!title || !product) {
            res.status(400).json({ error: "Missing required fields: title and product are required" });
            return;
        }

        const token = GITHUB_TOKEN.value();
        if (!token) {
            console.error("GITHUB_TOKEN is missing");
            res.status(500).json({ error: "Server configuration error" });
            return;
        }

        const octokit = new Octokit({ auth: token });

        // Sanitize inputs
        const sanitizedTitle = String(title).substring(0, 200);
        const sanitizedDescription = String(description || '').substring(0, 5000);
        const sanitizedName = String(name || 'Anonymous').substring(0, 100);
        const sanitizedEmail = String(email || 'Not provided').substring(0, 100);
        const sanitizedProduct = String(product).substring(0, 50);
        const sanitizedCategory = String(category || 'general').substring(0, 50);

        const issueTitle = `[Feature] ${sanitizedProduct}: ${sanitizedTitle}`;

        const issueBody = `## Feature Request

**Product:** ${sanitizedProduct}
**Category:** ${sanitizedCategory}
**Requested by:** ${sanitizedName}
**Email:** ${sanitizedEmail}

## Description
${sanitizedDescription || sanitizedTitle}

---
*Submitted via FutureAtoms feature request form*`;

        // Create GitHub issue with enhancement label
        const response = await octokit.issues.create({
            owner: 'FutureAtoms',
            repo: 'feedback',
            title: issueTitle,
            body: issueBody,
            labels: ['enhancement', 'feature-request', sanitizedProduct.toLowerCase()]
        });

        console.log(`Feature request created: ${response.data.html_url}`);

        res.json({
            success: true,
            issueUrl: response.data.html_url,
            issueNumber: response.data.number
        });

    } catch (error) {
        console.error("Error creating feature request:", error);

        if (error.status === 404) {
            res.status(500).json({
                error: "Repository not found. Please check server configuration."
            });
        } else if (error.status === 401) {
            res.status(500).json({
                error: "Authentication failed"
            });
        } else {
            res.status(500).json({
                error: "Failed to create feature request",
                details: error.message
            });
        }
    }
});

// Bug Report Function - Creates GitHub Issues
exports.reportBug = onRequest({ secrets: [GITHUB_TOKEN] }, async (req, res) => {
    // CORS - Only allow specific origins
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
    } else {
        res.set("Access-Control-Allow-Origin", "https://futureatoms.com");
    }
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    // Rate limiting
    const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    if (isRateLimited(clientIP)) {
        res.status(429).json({ error: "Rate limit exceeded. Please wait before submitting more reports." });
        return;
    }

    try {
        const { name, email, issue, rating, url, product, screenshot_url } = req.body;

        // Validate required fields
        if (!name || !email || !issue) {
            res.status(400).json({ error: "Missing required fields: name, email, and issue are required" });
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({ error: "Invalid email format" });
            return;
        }

        const token = GITHUB_TOKEN.value();
        if (!token) {
            console.error("GITHUB_TOKEN is missing");
            res.status(500).json({ error: "Server configuration error" });
            return;
        }

        const octokit = new Octokit({ auth: token });

        // Sanitize inputs for GitHub issue
        const sanitizedName = String(name).substring(0, 100);
        const sanitizedEmail = String(email).substring(0, 100);
        const sanitizedIssue = String(issue).substring(0, 5000);
        const sanitizedUrl = String(url || 'Not provided').substring(0, 500);
        const sanitizedProduct = String(product || 'General').substring(0, 50);
        const sanitizedRating = Math.min(Math.max(parseInt(rating) || 0, 1), 5);

        // Sanitize screenshot URL (basic URL validation)
        let screenshotSection = '';
        if (screenshot_url && screenshot_url.trim()) {
            const sanitizedScreenshot = String(screenshot_url).substring(0, 500).trim();
            // Basic URL validation
            if (sanitizedScreenshot.match(/^https?:\/\/.+/i)) {
                screenshotSection = `\n## Screenshot\n![Screenshot](${sanitizedScreenshot})\n`;
            }
        }

        // Create issue title (truncate if needed)
        const titlePreview = sanitizedIssue.substring(0, 50).replace(/\n/g, ' ');
        const issueTitle = `[Bug] ${sanitizedProduct}: ${titlePreview}${sanitizedIssue.length > 50 ? '...' : ''}`;

        const issueBody = `## Bug Report

**Reporter:** ${sanitizedName}
**Email:** ${sanitizedEmail}
**Rating:** ${sanitizedRating}/5
**Page:** ${sanitizedUrl}
**Product:** ${sanitizedProduct}

## Description
${sanitizedIssue}
${screenshotSection}
---
*Submitted via FutureAtoms feedback form*`;

        // Create GitHub issue
        // NOTE: Update owner and repo to match your GitHub organization/repository
        const response = await octokit.issues.create({
            owner: 'FutureAtoms',
            repo: 'feedback',
            title: issueTitle,
            body: issueBody,
            labels: ['bug', 'user-reported']
        });

        console.log(`Bug report created: ${response.data.html_url}`);

        res.json({
            success: true,
            issueUrl: response.data.html_url,
            issueNumber: response.data.number
        });

    } catch (error) {
        console.error("Error creating bug report:", error);

        // Handle specific GitHub API errors
        if (error.status === 404) {
            res.status(500).json({
                error: "Repository not found. Please check server configuration.",
                details: "The configured GitHub repository does not exist or is not accessible."
            });
        } else if (error.status === 401) {
            res.status(500).json({
                error: "Authentication failed",
                details: "GitHub token is invalid or expired."
            });
        } else {
            res.status(500).json({
                error: "Failed to create bug report",
                details: error.message
            });
        }
    }
});
