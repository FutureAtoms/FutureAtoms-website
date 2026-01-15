// AI Chatbox Logic

document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window');
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const closeChatBtn = document.getElementById('close-chat');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');
    const quickActions = document.querySelectorAll('.quick-action');

    let isChatOpen = false;

    // Toggle Chat Window
    function toggleChat() {
        isChatOpen = !isChatOpen;
        if (isChatOpen) {
            chatWindow.classList.remove('hidden');
            // Small delay to allow display:block to apply before opacity transition
            setTimeout(() => {
                chatWindow.classList.remove('scale-90', 'opacity-0');
                chatWindow.classList.add('scale-100', 'opacity-100');
                chatInput.focus();
            }, 10);
        } else {
            chatWindow.classList.remove('scale-100', 'opacity-100');
            chatWindow.classList.add('scale-90', 'opacity-0');
            setTimeout(() => {
                chatWindow.classList.add('hidden');
            }, 300);
        }
    }

    chatToggleBtn.addEventListener('click', toggleChat);
    closeChatBtn.addEventListener('click', toggleChat);

    // Sanitize HTML to prevent XSS attacks
    function sanitizeHTML(html) {
        const allowedTags = ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        const allowedAttributes = { 'a': ['href', 'target', 'rel'] };

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Remove script tags and event handlers
        const scripts = tempDiv.querySelectorAll('script, style, iframe, object, embed, form');
        scripts.forEach(el => el.remove());

        // Remove all elements that aren't in the allowed list
        const allElements = tempDiv.querySelectorAll('*');
        allElements.forEach(el => {
            const tagName = el.tagName.toLowerCase();
            if (!allowedTags.includes(tagName)) {
                // Replace with text content for disallowed tags
                el.replaceWith(document.createTextNode(el.textContent));
                return;
            }

            // Remove all attributes except allowed ones
            const attrs = Array.from(el.attributes);
            attrs.forEach(attr => {
                const allowedAttrs = allowedAttributes[tagName] || [];
                if (!allowedAttrs.includes(attr.name.toLowerCase())) {
                    el.removeAttribute(attr.name);
                }
                // Sanitize href to prevent javascript: URLs
                if (attr.name === 'href' && el.getAttribute('href')?.toLowerCase().startsWith('javascript:')) {
                    el.setAttribute('href', '#');
                }
            });

            // Add security attributes to links
            if (tagName === 'a') {
                el.setAttribute('target', '_blank');
                el.setAttribute('rel', 'noopener noreferrer');
            }
        });

        return tempDiv.innerHTML;
    }

    // Add Message to Chat
    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex gap-3 message-enter ${isUser ? 'flex-row-reverse' : ''}`;

        const avatar = isUser
            ? `<div class="w-8 h-8 rounded-full bg-cyan-900/50 border border-cyan-500/30 flex-shrink-0 flex items-center justify-center mt-1"><i class="fas fa-user text-cyan-400 text-xs"></i></div>`
            : `<div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex-shrink-0 flex items-center justify-center mt-1"><i class="fas fa-robot text-white text-xs"></i></div>`;

        const bubbleClass = isUser
            ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-100 rounded-tr-none'
            : 'bg-cyan-900/20 border border-cyan-500/20 text-gray-200 rounded-tl-none';

        // Parse markdown and sanitize to prevent XSS
        const sanitizedContent = sanitizeHTML(marked.parse(text));

        messageDiv.innerHTML = `
            ${avatar}
            <div class="${bubbleClass} rounded-2xl p-3 text-sm shadow-[0_0_10px_rgba(0,255,255,0.05)] max-w-[90%] chat-content">
                ${sanitizedContent}
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Add Loading Shimmer
    function addLoadingShimmer() {
        const shimmerDiv = document.createElement('div');
        shimmerDiv.id = 'loading-shimmer';
        shimmerDiv.className = 'flex gap-3 message-enter';
        shimmerDiv.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex-shrink-0 flex items-center justify-center mt-1">
                <i class="fas fa-robot text-white text-xs"></i>
            </div>
            <div class="bg-cyan-900/20 border border-cyan-500/20 rounded-2xl rounded-tl-none p-4 text-sm shadow-[0_0_10px_rgba(0,255,255,0.05)] w-48">
                <div class="shimmer-wrapper rounded mb-2 h-2.5 w-full"></div>
                <div class="shimmer-wrapper rounded h-2.5 w-3/4"></div>
            </div>
        `;
        chatMessages.appendChild(shimmerDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return shimmerDiv;
    }

    // Handle User Input
    async function handleUserMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, true);
        chatInput.value = '';

        const loadingElement = addLoadingShimmer();

        // Collect history for context (last 10 messages)
        const history = [];
        const messageElements = chatMessages.querySelectorAll('.message-enter');
        messageElements.forEach(el => {
            const isUser = el.classList.contains('flex-row-reverse');
            const textContent = el.querySelector('p')?.innerText;
            if (textContent) {
                history.push({
                    role: isUser ? 'user' : 'model',
                    parts: [{ text: textContent }]
                });
            }
        });

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: history.slice(-10) // Send last 10 messages for context
                })
            });

            const data = await response.json();
            loadingElement.remove();

            if (data.error) {
                addMessage("I'm having trouble connecting to the quantum field. Please try again later.");
                console.error('API Error:', data.error);
            } else {
                addMessage(data.response);
            }

        } catch (error) {
            loadingElement.remove();
            addMessage("Connection interrupted. Please check your network.");
            console.error('Fetch Error:', error);
        }
    }

    sendBtn.addEventListener('click', handleUserMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserMessage();
    });

    // Quick Actions
    quickActions.forEach(btn => {
        btn.addEventListener('click', () => {
            chatInput.value = btn.innerText;
            handleUserMessage();
        });
    });

    // --- Hero Input Integration ---
    const heroInput = document.getElementById('hero-input');
    const heroSubmitBtn = document.getElementById('hero-submit-btn');
    const heroChips = document.querySelectorAll('.hero-chip');

    if (heroInput && heroSubmitBtn) {
        // Auto-resize textarea
        heroInput.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

        const submitHeroQuery = () => {
            const text = heroInput.value.trim();
            if (!text) return;

            // Open Chat if closed
            if (!isChatOpen) toggleChat();

            // Set text in chat input and submit
            chatInput.value = text;
            handleUserMessage();

            // Clear hero input
            heroInput.value = '';
            heroInput.style.height = 'auto';
        };

        heroSubmitBtn.addEventListener('click', submitHeroQuery);
        heroInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitHeroQuery();
            }
        });

        // Hero Chips
        heroChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const text = chip.innerText.trim();
                if (!isChatOpen) toggleChat();
                chatInput.value = text;
                handleUserMessage();
            });
        });
    }
});
