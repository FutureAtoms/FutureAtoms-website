#!/usr/bin/env node
/**
 * Image Optimization Script using Sharp
 * Analyzes and optimizes images for web performance
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '../public/images');
const OUTPUT_DIR = path.join(__dirname, '../public/images/optimized');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Configuration for different image types
const config = {
    icons: {
        sizes: [32, 64, 128, 192, 512],
        quality: 85
    },
    hero: {
        sizes: [640, 1024, 1920],
        quality: 80
    },
    general: {
        maxWidth: 1200,
        quality: 80
    }
};

async function analyzeImage(filePath) {
    const stats = fs.statSync(filePath);
    const metadata = await sharp(filePath).metadata();
    return {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(1),
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        hasAlpha: metadata.hasAlpha
    };
}

async function optimizeIcon(inputPath, baseName) {
    const results = [];

    for (const size of config.icons.sizes) {
        const outputName = `${baseName}-${size}w.webp`;
        const outputPath = path.join(OUTPUT_DIR, outputName);

        await sharp(inputPath)
            .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: config.icons.quality })
            .toFile(outputPath);

        const stats = fs.statSync(outputPath);
        results.push({
            name: outputName,
            size: size,
            bytes: stats.size
        });
    }

    // Also create a PNG fallback at 192px for older browsers
    const pngPath = path.join(OUTPUT_DIR, `${baseName}-192w.png`);
    await sharp(inputPath)
        .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ quality: 80, compressionLevel: 9 })
        .toFile(pngPath);

    return results;
}

async function optimizeGeneral(inputPath, baseName) {
    const metadata = await sharp(inputPath).metadata();
    const results = [];

    // Resize if larger than maxWidth
    let pipeline = sharp(inputPath);

    if (metadata.width > config.general.maxWidth) {
        pipeline = pipeline.resize(config.general.maxWidth, null, { withoutEnlargement: true });
    }

    // Create WebP version
    const webpPath = path.join(OUTPUT_DIR, `${baseName}.webp`);
    await pipeline.clone().webp({ quality: config.general.quality }).toFile(webpPath);
    results.push({ name: `${baseName}.webp`, bytes: fs.statSync(webpPath).size });

    // Create optimized JPEG fallback (for non-transparent images)
    if (!metadata.hasAlpha) {
        const jpgPath = path.join(OUTPUT_DIR, `${baseName}.jpg`);
        await pipeline.clone().jpeg({ quality: config.general.quality, mozjpeg: true }).toFile(jpgPath);
        results.push({ name: `${baseName}.jpg`, bytes: fs.statSync(jpgPath).size });
    } else {
        // For transparent images, create optimized PNG
        const pngPath = path.join(OUTPUT_DIR, `${baseName}.png`);
        await pipeline.clone().png({ compressionLevel: 9, palette: true }).toFile(pngPath);
        results.push({ name: `${baseName}.png`, bytes: fs.statSync(pngPath).size });
    }

    return results;
}

async function main() {
    console.log('🖼️  Image Optimization Analysis\n');
    console.log('=' .repeat(70));

    // Get all image files
    const files = fs.readdirSync(IMAGES_DIR)
        .filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f))
        .map(f => path.join(IMAGES_DIR, f));

    // Analyze all images
    console.log('\n📊 Current Image Analysis:\n');
    console.log('File'.padEnd(50) + 'Size'.padStart(10) + 'Dimensions'.padStart(15));
    console.log('-'.repeat(75));

    let totalOriginal = 0;
    const analyses = [];

    for (const file of files) {
        try {
            const analysis = await analyzeImage(file);
            analyses.push(analysis);
            totalOriginal += analysis.size;

            const sizeStr = analysis.size > 1024 * 1024
                ? `${analysis.sizeMB} MB`
                : `${analysis.sizeKB} KB`;

            const status = analysis.size > 500 * 1024 ? '⚠️ ' : '✓ ';
            console.log(
                status + analysis.name.padEnd(48) +
                sizeStr.padStart(10) +
                `${analysis.width}x${analysis.height}`.padStart(15)
            );
        } catch (err) {
            console.log(`❌ ${path.basename(file)}: ${err.message}`);
        }
    }

    console.log('-'.repeat(75));
    console.log(`Total: ${(totalOriginal / (1024 * 1024)).toFixed(2)} MB\n`);

    // Identify problematic images
    console.log('\n🚨 Issues Detected:\n');

    const oversized = analyses.filter(a => a.size > 500 * 1024);
    if (oversized.length > 0) {
        console.log('Oversized images (>500KB):');
        oversized.forEach(a => {
            console.log(`  - ${a.name}: ${a.sizeMB} MB`);
        });
    }

    const largeIcons = analyses.filter(a =>
        a.name.includes('icon') && a.size > 50 * 1024
    );
    if (largeIcons.length > 0) {
        console.log('\nOversized icons (should be <50KB):');
        largeIcons.forEach(a => {
            console.log(`  - ${a.name}: ${a.sizeKB} KB (${a.width}x${a.height})`);
        });
    }

    // Optimize images
    console.log('\n\n🔧 Optimizing Images...\n');

    let totalOptimized = 0;

    for (const analysis of analyses) {
        // Skip very large "Generated" images - they should be deleted
        if (analysis.name.startsWith('Generated')) {
            console.log(`⏭️  Skipping ${analysis.name} (should be deleted - ${analysis.sizeMB} MB)`);
            continue;
        }

        const baseName = path.basename(analysis.name, path.extname(analysis.name));

        try {
            let results;

            // Optimize icons differently
            if (analysis.name.includes('icon')) {
                console.log(`🎯 Optimizing icon: ${analysis.name}`);
                results = await optimizeIcon(analysis.path, baseName);
            } else {
                console.log(`📷 Optimizing: ${analysis.name}`);
                results = await optimizeGeneral(analysis.path, baseName);
            }

            results.forEach(r => {
                totalOptimized += r.bytes;
                const savings = ((1 - r.bytes / analysis.size) * 100).toFixed(0);
                console.log(`   → ${r.name}: ${(r.bytes / 1024).toFixed(1)} KB (${savings}% smaller)`);
            });

        } catch (err) {
            console.log(`   ❌ Error: ${err.message}`);
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📈 Optimization Summary:\n');
    console.log(`   Original total: ${(totalOriginal / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   Optimized total: ${(totalOptimized / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   Savings: ${((1 - totalOptimized / totalOriginal) * 100).toFixed(0)}%`);
    console.log('\n✅ Optimized images saved to: public/images/optimized/');

    // Recommendations
    console.log('\n📋 Recommendations:\n');
    console.log('1. Delete unused "Generated Image" files (37MB total)');
    console.log('2. Replace futureatoms-icon.png references with optimized versions');
    console.log('3. Add <picture> elements for responsive image loading');
    console.log('4. Update HTML to use .webp with .png/.jpg fallbacks');
}

main().catch(console.error);
