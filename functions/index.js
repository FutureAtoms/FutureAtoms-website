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

        // Generate Content
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
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
