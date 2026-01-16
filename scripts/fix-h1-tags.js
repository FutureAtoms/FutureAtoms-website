const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Pattern: Logo H1 in header that needs to change to <p>
const logoH1Pattern = /<h1\s+class="font-\['Orbitron'\]\s+text-2xl\s+md:text-3xl\s+font-bold\s+tracking-wider\s+text-white">\s*\n?\s*FUTURE<span\s+class="text-cyan-400">ATOMS<\/span>\s*\n?\s*<\/h1>/g;

function fixFile(filename) {
    const filePath = path.join(publicDir, filename);
    if (!fs.existsSync(filePath)) {
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Count H1 tags
    const h1Count = (content.match(/<h1/gi) || []).length;

    if (h1Count <= 1) {
        return false;
    }

    // Replace logo H1 with <p> tag
    const originalContent = content;
    content = content.replace(logoH1Pattern,
        `<p class="font-['Orbitron'] text-2xl md:text-3xl font-bold tracking-wider text-white">
                    FUTURE<span class="text-cyan-400">ATOMS</span>
                </p>`);

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }

    return false;
}

// Get all HTML files
const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

console.log('🔧 Fixing Multiple H1 Tags\n');
console.log('=' .repeat(60) + '\n');

let fixed = 0;
for (const file of htmlFiles) {
    const wasFixed = fixFile(file);
    if (wasFixed) {
        console.log(`  ✅ ${file}: Changed logo H1 to <p>`);
        fixed++;
    }
}

console.log('\n' + '=' .repeat(60));
console.log(`\n✅ Fixed ${fixed} files`);
