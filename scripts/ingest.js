require('dotenv').config();
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const cheerio = require('cheerio');
const { GoogleGenAI } = require('@google/genai');

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const PUBLIC_DIR = path.join(__dirname, '../public');
const OUTPUT_FILE = 'website_content.txt';

async function ingestContent() {
    console.log('🚀 Starting content ingestion...');

    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ Error: GEMINI_API_KEY is not set in .env file.');
        process.exit(1);
    }

    // 1. Find all HTML files
    const files = glob.sync('**/*.html', { cwd: PUBLIC_DIR });
    console.log(`📂 Found ${files.length} HTML files.`);

    let combinedContent = '';

    // 2. Extract text from each file
    for (const file of files) {
        const filePath = path.join(PUBLIC_DIR, file);
        const html = fs.readFileSync(filePath, 'utf-8');
        const $ = cheerio.load(html);

        // Remove scripts, styles, and hidden elements to clean up text
        $('script').remove();
        $('style').remove();
        $('[hidden]').remove();

        const title = $('title').text().trim();
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

        combinedContent += `--- START DOCUMENT: ${file} ---\n`;
        combinedContent += `Title: ${title}\n`;
        combinedContent += `URL: ${file}\n`;
        combinedContent += `Content:\n${bodyText}\n`;
        combinedContent += `--- END DOCUMENT ---\n\n`;
    }

    // 3. Save to a temporary text file
    fs.writeFileSync(OUTPUT_FILE, combinedContent);
    console.log(`📝 Compiled content to ${OUTPUT_FILE} (${combinedContent.length} characters).`);

    // 4. Upload to Gemini FileSearch
    /*
    try {
        console.log('☁️  Uploading to Gemini FileSearch...');
        // ... (upload logic) ...
    } catch (error) {
        console.error('❌ Error during Gemini upload:', error);
    }
    */
    console.log(`✅ Generated ${OUTPUT_FILE} for manual upload.`);
}

ingestContent();
