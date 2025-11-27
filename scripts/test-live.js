// const fetch = require('node-fetch'); // Built-in in Node 18+

async function testEndpoint() {
    const url = 'https://futureatoms-website.web.app/api/chat';
    // Alternatively try the direct function URL if the rewrite is the issue
    // const url = 'https://chat-ircmybhz4q-uc.a.run.app'; 

    console.log(`Testing ${url}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Hello, what is FutureAtoms?',
                history: []
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log('Response:', text);

    } catch (error) {
        console.error('Error:', error);
    }
}

testEndpoint();
