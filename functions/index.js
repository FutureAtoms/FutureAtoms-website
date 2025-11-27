const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require("@google/genai");

// Define Secrets
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const GEMINI_STORE_NAME = defineSecret("GEMINI_STORE_NAME");

exports.chat = onRequest({ secrets: [GEMINI_API_KEY, GEMINI_STORE_NAME] }, async (req, res) => {
    // Force SDK to ignore default credentials and use API Key
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    delete process.env.GCLOUD_PROJECT;
    delete process.env.GOOGLE_CLOUD_PROJECT;

    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
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

        // Sitemap for Knowledge Base
        const SITEMAP = `
- Home: https://futureatoms-website.web.app/index.html
- ChipOS (AI OS for Hardware): https://futureatoms-website.web.app/chipos.html
- SystemVerilogGPT (Hardware Verification): https://futureatoms-website.web.app/systemverilog.html
- Zaphy (LinkedIn AI): https://futureatoms-website.web.app/zaphy.html
- Agentic Control (CLI Tool): https://futureatoms-website.web.app/agentic.html
- Yuj (Yoga & Wellness): https://futureatoms-website.web.app/yuj.html
- AdaptiveVision (Computer Vision): https://futureatoms-website.web.app/adaptivision.html
- BevyBeats (AI Music): https://futureatoms-website.web.app/bevybeats.html
- Savitri (AI Therapy): https://futureatoms-website.web.app/savitri.html
- Blog/Research: https://futureatoms-website.web.app/blog.html
- News: https://futureatoms-website.web.app/news.html
- About: https://futureatoms-website.web.app/about.html
- Contact: https://futureatoms-website.web.app/contact.html
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
