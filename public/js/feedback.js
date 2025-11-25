document.addEventListener('DOMContentLoaded', () => {
    injectFeedbackSystem();
});

function injectFeedbackSystem() {
    // 1. Inject CSS if not present (fallback)
    if (!document.querySelector('link[href*="feedback.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/feedback.css';
        document.head.appendChild(link);
    }

    // 2. Create HTML Structure
    const container = document.createElement('div');
    container.id = 'feedback-system-root';
    container.innerHTML = `
        <!-- Trigger Button -->
        <div class="feedback-trigger" id="feedback-trigger">
            <i class="fas fa-atom"></i>
        </div>

        <!-- Modal -->
        <div class="feedback-modal-overlay" id="feedback-modal-overlay">
            <div class="feedback-modal">
                <button class="feedback-close" id="feedback-close">&times;</button>
                
                <div class="feedback-header">
                    <h3 class="feedback-title">FEEDBACK LOOP</h3>
                    <p class="feedback-subtitle">Help us evolve the FutureAtoms ecosystem.</p>
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
                        <button type="submit" class="feedback-submit-btn">TRANSMIT DATA</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(container);

    // 3. Initialize Logic
    initFeedbackLogic();
}

function initFeedbackLogic() {
    const trigger = document.getElementById('feedback-trigger');
    const overlay = document.getElementById('feedback-modal-overlay');
    const closeBtn = document.getElementById('feedback-close');
    const ratingContainer = document.getElementById('atom-rating-container');
    const atomLabels = document.querySelectorAll('.atom-label');
    const dynamicContent = document.getElementById('feedback-dynamic-content');
    const submitGroup = document.getElementById('feedback-submit-group');
    const form = document.getElementById('feedback-form');

    let currentRating = 0;

    // Toggle Modal
    trigger.addEventListener('click', () => overlay.classList.add('active'));
    closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    });

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
            // --- Support Ticket Mode ---
            dynamicContent.innerHTML = `
                <div class="feedback-mode-title mode-support">
                    <i class="fas fa-wrench"></i> SYSTEM DIAGNOSTIC
                </div>
                <div class="feedback-form-group visible">
                    <label class="feedback-label">Name</label>
                    <input type="text" class="feedback-input" name="name" placeholder="Observer Name" required>
                </div>
                <div class="feedback-form-group visible">
                    <label class="feedback-label">Email</label>
                    <input type="email" class="feedback-input" name="email" placeholder="contact@example.com" required>
                </div>
                <div class="feedback-form-group visible">
                    <label class="feedback-label">What seems to be the issue?</label>
                    <textarea class="feedback-textarea" name="issue" placeholder="Describe the anomaly..." required></textarea>
                </div>
            `;
        } else {
            // --- Social Proof Mode ---
            dynamicContent.innerHTML = `
                <div class="feedback-mode-title mode-social">
                    <i class="fas fa-star"></i> SIGNAL AMPLIFIED
                </div>
                <div class="feedback-form-group visible">
                    <label class="feedback-label">Name</label>
                    <input type="text" class="feedback-input" name="name" placeholder="Visionary Name" required>
                </div>
                <div class="feedback-form-group visible">
                    <label class="feedback-label">Role & Company (Vital for Signal)</label>
                    <input type="text" class="feedback-input" name="role_company" placeholder="e.g. Senior Engineer @ TechCorp" required>
                </div>
                <div class="feedback-form-group visible">
                    <label class="feedback-label">What is your favorite feature?</label>
                    <textarea class="feedback-textarea" name="favorite_feature" placeholder="The quantum interface..." required></textarea>
                </div>
                <div class="feedback-form-group visible">
                    <div class="feedback-checkbox-group">
                        <input type="checkbox" id="feature-permission" name="permission" class="feedback-checkbox">
                        <label for="feature-permission">You may feature this signal publicly.</label>
                    </div>
                </div>
            `;
        }
    }

    // Form Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.rating = currentRating;
        data.url = window.location.href;

        console.log('Feedback Transmitted:', data);

        // Simulate network request
        const btn = form.querySelector('.feedback-submit-btn');
        const originalText = btn.innerText;
        btn.innerText = 'TRANSMITTING...';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerText = 'TRANSMISSION COMPLETE';
            btn.style.borderColor = '#00ff00';
            btn.style.color = '#00ff00';

            setTimeout(() => {
                overlay.classList.remove('active');
                // Reset form after delay
                setTimeout(() => {
                    form.reset();
                    currentRating = 0;
                    highlightAtoms(0);
                    dynamicContent.innerHTML = '';
                    submitGroup.classList.remove('visible');
                    btn.innerText = originalText;
                    btn.disabled = false;
                    btn.style.borderColor = '';
                    btn.style.color = '';
                }, 500);
            }, 1500);
        }, 1000);
    });
}
