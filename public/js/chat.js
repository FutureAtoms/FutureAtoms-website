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

        messageDiv.innerHTML = `
            ${avatar}
            <div class="${bubbleClass} rounded-2xl p-3 text-sm shadow-[0_0_10px_rgba(0,255,255,0.05)] max-w-[80%]">
                <p>${text}</p>
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

        // Simulate AI Delay & Response (Mock for now)
        // In a real implementation, this would call the Gemini API via a backend proxy
        setTimeout(() => {
            loadingElement.remove();

            // Simple Keyword Matching Logic (Mock RAG)
            const lowerText = text.toLowerCase();
            let response = "I'm processing that request through our quantum database...";

            if (lowerText.includes('install') && (lowerText.includes('chip') || lowerText.includes('chipos'))) {
                response = "To install ChipOS, you can visit the product page. Would you like me to take you there?";
                // Optional: Auto-redirect logic could go here
            } else if (lowerText.includes('savitri')) {
                response = "Savitri is our AI therapy app offering CBT and DBT support. It's designed to be a compassionate digital companion.";
            } else if (lowerText.includes('price') || lowerText.includes('cost')) {
                response = "Most of our tools have a free tier for developers. Enterprise solutions are custom quoted.";
            } else {
                response = "I can help you navigate FutureAtoms. Try asking about ChipOS, Savitri, or our research.";
            }

            addMessage(response);
        }, 1500);
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
