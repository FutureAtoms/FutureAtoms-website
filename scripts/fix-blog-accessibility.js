const fs = require('fs');
const path = require('path');

const blogPath = path.join(__dirname, '..', 'public', 'blog.html');
let content = fs.readFileSync(blogPath, 'utf8');

// Pattern 1: Featured article
content = content.replace(
    /<article class="glass-panel p-8 md:p-12 rounded-2xl metallic-border blog-card group cursor-pointer"\s*\n?\s*onclick="window\.location\.href='([^']+)'">/g,
    '<a href="$1" class="block"><article class="glass-panel p-8 md:p-12 rounded-2xl metallic-border blog-card group cursor-pointer">'
);

// Pattern 2: Grid articles
content = content.replace(
    /<article\s*\n?\s*class="glass-panel p-6 rounded-2xl metallic-border blog-card group cursor-pointer flex flex-col h-full"\s*\n?\s*onclick="window\.location\.href='([^']+)'">/g,
    '<a href="$1" class="block flex flex-col h-full"><article class="glass-panel p-6 rounded-2xl metallic-border blog-card group cursor-pointer flex flex-col h-full">'
);

// Close the </article> tags with </a> properly
// Find all <a href="..." class="block"><article...>...</article> and add </a> after </article>
// This is tricky - we need to add </a> after each </article> that follows our new <a> tags

// Count how many articles we've wrapped
const wrappedCount = (content.match(/<a href="[^"]*" class="block[^"]*"><article/g) || []).length;
console.log(`Found ${wrappedCount} articles to wrap`);

// Find each </article> and if it's inside our wrapped structure, add </a>
// We need to track which </article> tags need </a> after them

// Let's use a different approach - find and replace entire article blocks
const lines = content.split('\n');
let inWrappedArticle = false;
const newLines = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if we're starting a wrapped article
    if (line.includes('<a href="') && line.includes('class="block')) {
        inWrappedArticle = true;
    }

    // Check if we're closing an article that was wrapped
    if (inWrappedArticle && line.includes('</article>')) {
        newLines.push(line.replace('</article>', '</article></a>'));
        inWrappedArticle = false;
        continue;
    }

    newLines.push(line);
}

content = newLines.join('\n');

fs.writeFileSync(blogPath, content, 'utf8');
console.log('✅ Fixed blog.html accessibility - converted onclick articles to anchor tags');
