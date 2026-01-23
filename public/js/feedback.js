document.addEventListener('DOMContentLoaded', () => {
    injectFeedbackSystem();
});

// Sanitize text to prevent XSS
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function injectFeedbackSystem() {
    // 1. Inject CSS if not present (fallback)
    if (!document.querySelector('link[href*="feedback.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/feedback.css';
        document.head.appendChild(link);
    }

    // Check for inline container
    const inlineContainer = document.getElementById('feedback-inline-container');
    const isInline = !!inlineContainer;

    // Get product from URL if available - SANITIZED to prevent XSS
    const urlParams = new URLSearchParams(window.location.search);
    const rawProduct = urlParams.get('product') || 'General';
    // Sanitize: only allow alphanumeric, spaces, and hyphens
    const product = escapeHTML(rawProduct.replace(/[^a-zA-Z0-9\s\-]/g, '').substring(0, 50));

    // 2. Create HTML Structure
    const htmlContent = `
        <div class="${isInline ? 'feedback-inline-wrapper' : 'feedback-modal'}">
            ${!isInline ? '<button class="feedback-close" id="feedback-close">&times;</button>' : ''}

            <div class="feedback-header">
                ${isInline ? '' : '<h3 class="feedback-title">Share Your Feedback</h3>'}
                <p class="feedback-subtitle">How's your experience with <span style="color:#00ffff">${product}</span>?</p>
            </div>

            <!-- Rating System -->
            <div class="atom-rating-container" id="atom-rating-container">
                ${[1, 2, 3, 4, 5].map(i => `
                    <label class="atom-label" data-value="${i}">
                        <i class="fas fa-atom atom-icon"></i>
                    </label>
                `).join('')}
            </div>

            <!-- Dynamic Form Content -->
            <form id="feedback-form">
                <div id="feedback-dynamic-content"></div>
                
                <div class="feedback-form-group" id="feedback-submit-group">
                    <button type="submit" class="feedback-submit-btn">Submit Feedback</button>
                </div>
            </form>
        </div>
    `;

    if (isInline) {
        inlineContainer.innerHTML = htmlContent;
        initFeedbackLogic(true, product);
    } else {
        const container = document.createElement('div');
        container.id = 'feedback-system-root';
        container.innerHTML = `
            <!-- Trigger Button -->
            <div class="feedback-trigger" id="feedback-trigger">
                <i class="fas fa-atom"></i>
            </div>

            <!-- Modal -->
            <div class="feedback-modal-overlay" id="feedback-modal-overlay">
                ${htmlContent}
            </div>
        `;
        document.body.appendChild(container);
        initFeedbackLogic(false, product);
    }
}

function initFeedbackLogic(isInline, product) {
    const ratingContainer = document.getElementById('atom-rating-container');
    const atomLabels = document.querySelectorAll('.atom-label');
    const dynamicContent = document.getElementById('feedback-dynamic-content');
    const submitGroup = document.getElementById('feedback-submit-group');
    const form = document.getElementById('feedback-form');

    let currentRating = 0;

    if (!isInline) {
        const trigger = document.getElementById('feedback-trigger');
        const overlay = document.getElementById('feedback-modal-overlay');
        const closeBtn = document.getElementById('feedback-close');

        // Toggle Modal
        trigger.addEventListener('click', () => overlay.classList.add('active'));
        closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    }

    // Rating Logic
    atomLabels.forEach(label => {
        label.addEventListener('mouseenter', () => {
            const val = parseInt(label.dataset.value);
            highlightAtoms(val);
        });

        label.addEventListener('mouseleave', () => {
            highlightAtoms(currentRating);
        });

        label.addEventListener('click', () => {
            currentRating = parseInt(label.dataset.value);
            highlightAtoms(currentRating);
            renderFormFields(currentRating);
        });
    });

    function highlightAtoms(count) {
        atomLabels.forEach(l => {
            const val = parseInt(l.dataset.value);
            if (val <= count) {
                l.classList.add('active');
            } else {
                l.classList.remove('active');
            }
        });
    }

    function renderFormFields(rating) {
        submitGroup.classList.add('visible');
        dynamicContent.innerHTML = ''; // Clear previous

        if (rating <= 3) {
            // --- Bug Report Mode ---
            dynamicContent.innerHTML = `
                <div class="feedback-mode-title mode-support">
                    <i class="fas fa-bug"></i> Report an Issue
                </div>
                <div class="feedback-form-group visible">
                    <label class="feedback-label">Which product?</label>
                    <select class="feedback-input feedback-select" name="selected_product" required>
                        <option value="">Select a product...</option>
                        <option value="ChipOS">ChipOS</option>
                        <option value="SystemVerilog">SystemVerilog</option>
                        <option value="BevyBeats">BevyBeats</option>
                        <option value="Savitri">Savitri</option>
                        <option value="Zaphy">Zaphy</option>
                        <option value="Agentic">Agentic</option>
                        <option value="Yuj">Yuj</option>
                        <option value="AdaptiveVision">AdaptiveVision</option>
                        <option value="Website">FutureAtoms Website</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="feedback-form-group visible">
                    <label class="feedback-label">Your Name</label>
                    <input type="text" class="feedback-input" name="name" placeholder="John Doe" required>
                </div>
                <div class="feedback-form-group visible">
                    <label class="feedback-label">Email</label>
                    <input type="email" class="feedback-input" name="email" placeholder="you@company.com" required>
                </div>
                <div class="feedback-form-group visible">
                    <label class="feedback-label">What went wrong?</label>
                    <textarea class="feedback-textarea" name="issue" placeholder="Describe the issue and how we can reproduce it..." required></textarea>
                </div>
                <div class="feedback-form-group visible">
                    <label class="feedback-label">Screenshot <span style="opacity:0.5">(optional)</span></label>
                    <input type="url" class="feedback-input" name="screenshot_url" placeholder="Paste image URL (use imgur.com, snipboard.io, etc.)">
                    <p class="feedback-hint">Tip: Take a screenshot, upload to <a href="https://imgur.com/upload" target="_blank" style="color:#00ffff">imgur.com</a>, paste the link here</p>
                </div>
            `;
        } else {
            // --- Testimonial Mode ---
            dynamicContent.innerHTML = `
                <div class="feedback-mode-title mode-social">
                    <i class="fas fa-heart"></i> We'd Love a Testimonial!
                </div>
                <div class="feedback-form-group visible">
                    <label class="feedback-label">Your Name</label>
                    <input type="text" class="feedback-input" name="name" placeholder="John Doe" required>
                </div>
                <div class="feedback-form-group visible">
                    <label class="feedback-label">Role & Company</label>
                    <input type="text" class="feedback-input" name="role_company" placeholder="e.g. CTO @ Acme Inc" required>
                </div>
                <div class="feedback-form-group visible">
                    <label class="feedback-label">What do you love about our product?</label>
                    <textarea class="feedback-textarea" name="favorite_feature" placeholder="Share what made a difference for you..." required></textarea>
                </div>
                <div class="feedback-form-group visible">
                    <div class="feedback-checkbox-group">
                        <input type="checkbox" id="feature-permission" name="permission" class="feedback-checkbox" checked>
                        <label for="feature-permission">You can feature my testimonial on your website.</label>
                    </div>
                </div>
                <div class="feedback-form-group visible" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(0,255,255,0.2);">
                    <p class="feedback-hint" style="text-align: center;">
                        Still have an issue to report?
                        <a href="#" id="switch-to-bug" style="color:#ff6b6b; text-decoration: underline;">Report a bug instead</a>
                    </p>
                </div>
            `;

            // Add click handler for switching to bug mode
            setTimeout(() => {
                const switchLink = document.getElementById('switch-to-bug');
                if (switchLink) {
                    switchLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        currentRating = 2; // Set to bug report mode
                        highlightAtoms(currentRating);
                        renderFormFields(currentRating);
                    });
                }
            }, 0);
        }
    }

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.rating = currentRating;
        data.url = window.location.href;
        data.product = product;

        const btn = form.querySelector('.feedback-submit-btn');
        const originalText = btn.innerText;
        btn.innerText = 'Submitting...';
        btn.disabled = true;

        // Use selected product for bug reports, fallback to URL param
        if (data.selected_product) {
            data.product = data.selected_product;
        }

        try {
            // Bug reports (ratings 1-3) go to GitHub
            if (currentRating <= 3) {
                const response = await fetch('/api/report-bug', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    btn.innerHTML = `Thanks! Issue <a href="${escapeHTML(result.issueUrl)}" target="_blank" style="color:#00ffff;text-decoration:underline;">#${result.issueNumber}</a> created`;
                    btn.style.borderColor = '#00ff00';
                    btn.style.color = '#00ff00';
                } else {
                    throw new Error(result.error || 'Failed to submit report');
                }
            } else {
                // Testimonials (ratings 4-5) - store locally for now
                console.log('Testimonial Received:', data);
                btn.innerText = 'Thanks for the love!';
                btn.style.borderColor = '#00ff00';
                btn.style.color = '#00ff00';
            }

            // Reset form after delay
            setTimeout(() => {
                if (!isInline) {
                    const overlay = document.getElementById('feedback-modal-overlay');
                    overlay.classList.remove('active');
                }
                setTimeout(() => {
                    form.reset();
                    currentRating = 0;
                    highlightAtoms(0);
                    dynamicContent.innerHTML = '';
                    submitGroup.classList.remove('visible');
                    btn.innerText = originalText;
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    btn.style.borderColor = '';
                    btn.style.color = '';
                }, 500);
            }, 2500);

        } catch (error) {
            console.error('Feedback submission error:', error);
            btn.innerText = 'Something went wrong. Try again?';
            btn.style.borderColor = '#ff4444';
            btn.style.color = '#ff4444';

            setTimeout(() => {
                btn.innerText = originalText;
                btn.disabled = false;
                btn.style.borderColor = '';
                btn.style.color = '';
            }, 3000);
        }
    });
}
