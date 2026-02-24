#!/usr/bin/env node

/**
 * generate-reel.js — Assembles reel PNGs into an MP4 video with optional audio.
 *
 * Usage:
 *   node scripts/carousel/generate-reel.js [audio-file]
 *
 * Prerequisites:
 *   - Reel PNGs must exist (run: node scripts/carousel/generate-carousel.js reel)
 *   - ffmpeg must be installed and in PATH
 *
 * Output: content/social-posts/india-ai-summit-2026/output/video/reel.mp4
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'content/social-posts/india-ai-summit-2026');
const REEL_DIR = path.join(CONTENT_DIR, 'output/reel');
const VIDEO_DIR = path.join(CONTENT_DIR, 'output/video');
const OUTPUT_FILE = path.join(VIDEO_DIR, 'reel.mp4');

const SLIDE_DURATION = 3; // seconds per slide
const FPS = 30;
const CROSSFADE_DURATION = 0.5; // seconds

function checkDependencies() {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
  } catch {
    console.error('Error: ffmpeg is not installed or not in PATH.');
    console.error('Install with: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)');
    process.exit(1);
  }
}

function getReelPngs() {
  const files = fs.readdirSync(REEL_DIR)
    .filter(f => f.match(/^slide-\d+\.png$/))
    .sort();

  if (files.length === 0) {
    console.error('Error: No reel PNGs found. Run this first:');
    console.error('  node scripts/carousel/generate-carousel.js reel');
    process.exit(1);
  }

  return files.map(f => path.join(REEL_DIR, f));
}

function buildConcatFile(pngs) {
  // ffmpeg concat demuxer input file
  const concatPath = path.join(VIDEO_DIR, 'concat.txt');
  const lines = pngs.map(p => `file '${p}'\nduration ${SLIDE_DURATION}`);
  // Add last file again (ffmpeg concat quirk)
  lines.push(`file '${pngs[pngs.length - 1]}'`);
  fs.writeFileSync(concatPath, lines.join('\n'));
  return concatPath;
}

function buildVideo(concatFile, audioFile) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  let cmd;

  if (audioFile && fs.existsSync(audioFile)) {
    // With audio: map video + audio, trim to shorter stream
    cmd = [
      'ffmpeg -y',
      `-f concat -safe 0 -i "${concatFile}"`,
      `-i "${audioFile}"`,
      '-vf "fps=30"',
      '-c:v libx264 -pix_fmt yuv420p -preset medium -crf 18',
      '-c:a aac -b:a 192k',
      '-shortest',
      '-movflags +faststart',
      `"${OUTPUT_FILE}"`,
    ].join(' ');
  } else {
    // No audio
    cmd = [
      'ffmpeg -y',
      `-f concat -safe 0 -i "${concatFile}"`,
      '-vf "fps=30"',
      '-c:v libx264 -pix_fmt yuv420p -preset medium -crf 18',
      '-an',
      '-movflags +faststart',
      `"${OUTPUT_FILE}"`,
    ].join(' ');
  }

  console.log('  Building video...');
  execSync(cmd, { stdio: 'inherit' });
}

function main() {
  const audioFile = process.argv[2] || null;

  console.log('\n  Reel Video Assembler');
  console.log('  ────────────────────────────\n');

  checkDependencies();

  const pngs = getReelPngs();
  console.log(`  Found ${pngs.length} reel slides`);
  console.log(`  Duration: ${pngs.length * SLIDE_DURATION}s @ ${FPS}fps`);

  if (audioFile) {
    if (fs.existsSync(audioFile)) {
      console.log(`  Audio: ${path.basename(audioFile)}`);
    } else {
      console.log(`  [!] Audio file not found: ${audioFile} — proceeding without audio`);
    }
  } else {
    console.log('  Audio: none (pass audio file path as argument)');
  }

  const concatFile = buildConcatFile(pngs);
  buildVideo(concatFile, audioFile);

  // Clean up concat file
  fs.unlinkSync(concatFile);

  const stats = fs.statSync(OUTPUT_FILE);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
  console.log(`\n  Done! ${sizeMB} MB`);
  console.log(`  ${OUTPUT_FILE}\n`);
}

main();
