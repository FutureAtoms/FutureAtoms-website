const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Improved titles (30-60 characters optimal)
const improvedTitles = {
    'about.html': 'About FutureAtoms - Building Tomorrow\'s Technology',
    'contact.html': 'Contact FutureAtoms - Get In Touch With Us',
    'feedback.html': 'Share Feedback - Help Us Improve FutureAtoms',
    'hub-coming-soon.html': 'ChipOS Hub Coming Soon - FutureAtoms Platform',
    'index.html': 'FutureAtoms - Evolved Intelligence & AI Innovation',
    'news.html': 'Latest News & Updates - FutureAtoms Tech Herald',
    'blog-ai-therapy.html': 'AI Therapy Revolution - Savitri Platform | FutureAtoms',
    'blog-linkedin-automation.html': 'LinkedIn Automation with Zaphy | FutureAtoms',
    'blog-semiconductor-ai.html': 'AI Semiconductor Design - ChipOS | FutureAtoms',
    'chipos-settings.html': 'ChipOS Settings & Configuration Guide',
    'chipos.html': 'ChipOS - AI OS for Chip Development'
};

// Improved meta descriptions (120-160 characters optimal)
const improvedDescriptions = {
    'about.html': 'Learn about FutureAtoms - a technology company building innovative AI solutions for music, therapy, chip design, and professional networking.',
    'blog.html': 'Explore research and insights from FutureAtoms covering AI, semiconductor design, music technology, mental health, and professional automation.',
    'contact.html': 'Get in touch with FutureAtoms. Reach out for partnerships, support, or to learn more about our AI-powered technology solutions.',
    'news.html': 'Stay updated with the latest news, product launches, and technology breakthroughs from FutureAtoms and our innovative product ecosystem.',
    'chipos-docs.html': 'Complete ChipOS documentation - AI OS for chip development featuring 14 AI models, RAG technology, MCP integration, and more.'
};

function fixFile(filename, newTitle, newDesc) {
    const filePath = path.join(publicDir, filename);
    if (!fs.existsSync(filePath)) {
        return { title: false, desc: false };
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let changes = { title: false, desc: false };

    // Fix title
    if (newTitle) {
        const titleRegex = /<title>.*?<\/title>/;
        const match = content.match(titleRegex);
        if (match && match[0] !== `<title>${newTitle}</title>`) {
            content = content.replace(titleRegex, `<title>${newTitle}</title>`);
            changes.title = true;
        }
    }

    // Fix meta description
    if (newDesc) {
        // Handle both single-line and multi-line descriptions
        const descRegex = /<meta name="description"\s*content="[^"]*">/;
        const multiLineDescRegex = /<meta name="description"\s*\n?\s*content="[^"]*">/;

        if (content.match(descRegex)) {
            content = content.replace(descRegex, `<meta name="description" content="${newDesc}">`);
            changes.desc = true;
        } else if (content.match(multiLineDescRegex)) {
            content = content.replace(multiLineDescRegex, `<meta name="description" content="${newDesc}">`);
            changes.desc = true;
        }
    }

    if (changes.title || changes.desc) {
        fs.writeFileSync(filePath, content, 'utf8');
    }

    return changes;
}

console.log('🔧 Fixing SEO Title and Description Lengths\n');
console.log('=' .repeat(60) + '\n');

let fixedTitles = 0;
let fixedDescs = 0;

// Fix titles
for (const [file, title] of Object.entries(improvedTitles)) {
    const changes = fixFile(file, title, null);
    if (changes.title) {
        console.log(`  ✅ ${file}: Updated title (${title.length} chars)`);
        fixedTitles++;
    }
}

console.log('');

// Fix descriptions
for (const [file, desc] of Object.entries(improvedDescriptions)) {
    const changes = fixFile(file, null, desc);
    if (changes.desc) {
        console.log(`  ✅ ${file}: Updated description (${desc.length} chars)`);
        fixedDescs++;
    }
}

console.log('\n' + '=' .repeat(60));
console.log(`\n✅ Fixed ${fixedTitles} titles and ${fixedDescs} descriptions`);
