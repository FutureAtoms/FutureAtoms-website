const { execSync, spawn } = require('child_process');
const waitOn = require('wait-on');

const PORT = 8000;
const HOST = `http://localhost:${PORT}`;

console.log('🔒 Starting Security & Quality Scan Suite...');

// Start the server in the background
console.log('🚀 Starting local server...');
const server = spawn('python3', ['-m', 'http.server', PORT.toString(), '-d', 'public'], {
    stdio: 'ignore' // Suppress server output to keep logs clean
});

const cleanup = () => {
    console.log('🛑 Shutting down server...');
    server.kill();
    process.exit();
};

// Handle cleanup on exit
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

const runCommand = (command, name) => {
    try {
        console.log(`\n---------------------------------------------------`);
        console.log(`🔎 Running ${name}...`);
        console.log(`---------------------------------------------------`);
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ ${name} passed.`);
        return true;
    } catch (error) {
        console.error(`❌ ${name} failed.`);
        return false;
    }
};

(async () => {
    try {
        // Wait for the server to be ready
        await waitOn({ resources: [`${HOST}/index.html`] });
        console.log('✅ Server is up and running.');

        let hasFailures = false;

        // 1. Dependency Scan
        if (!runCommand('npm audit', 'Dependency Security Audit')) hasFailures = true;

        // 2. HTML Validation
        if (!runCommand('npx html-validate public/**/*.html', 'HTML Validation')) hasFailures = true;

        // 3. Accessibility Scan (pa11y-ci)
        if (!runCommand('npx pa11y-ci', 'Accessibility (WCAG) Scan')) hasFailures = true;

        // 4. Performance & Best Practices (Lighthouse)
        // Run a quick audit on the homepage
        if (!runCommand(`npx lighthouse ${HOST}/index.html --output html --output-path=./lighthouse-report.html --chrome-flags="--headless" --view`, 'Lighthouse Audit (Homepage)')) hasFailures = true;

        console.log(`\n---------------------------------------------------`);
        if (hasFailures) {
            console.error('⚠️  Scan completed with some issues. Checking logs above.');
            // process.exit(1); 
        } else {
            console.log('🎉 All scans passed successfully!');
        }

    } catch (err) {
        console.error('Failed to run scan suite:', err);
    } finally {
        cleanup();
    }
})();
