require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function checkStore() {
    const apiKey = process.env.GEMINI_API_KEY;
    const storeName = process.env.GEMINI_STORE_NAME;

    console.log(`Checking store: ${storeName}`);
    console.log(`Using Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'MISSING'}`);

    const client = new GoogleGenAI({ apiKey });

    try {
        // Try to get the specific store
        const store = await client.fileSearchStores.get({
            name: storeName
        });
        console.log('✅ Store found:', store);

        // Try to generate content with it
        console.log('Testing generation...');
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: 'What is FutureAtoms?' }] }],
            config: {
                tools: [{
                    fileSearch: {
                        fileSearchStoreNames: [storeName]
                    }
                }]
            }
        });
        console.log('✅ Generation success:', response.text ? response.text().substring(0, 50) + '...' : 'No text');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkStore();
