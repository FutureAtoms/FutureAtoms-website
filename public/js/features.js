/**
 * Feature Request System for FutureAtoms
 * Handles feature submissions, voting, and display
 */

// Supabase Configuration (same as chipos.html)
const SUPABASE_URL = 'https://wpgrhvdwdvmknhjzpkwz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZ3JodmR3ZHZta25oanpwa3d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTYyODQsImV4cCI6MjA3Mjk5MjI4NH0.qdeRc4qFAFP3nFj2HuVAhGTikZrCCkwxCAfDL5Jq4VM';

// Global state
let supabaseClient = null;
let currentProduct = '';
let currentFilter = 'all';
let currentCategory = 'all';
let currentSort = 'votes';
let features = [];
let votedFeatures = new Set();

// Product list (same as bug report form)
const PRODUCTS = [
    { value: 'ChipOS', label: 'ChipOS' },
    { value: 'SystemVerilog', label: 'SystemVerilog' },
    { value: 'BevyBeats', label: 'BevyBeats' },
    { value: 'Savitri', label: 'Savitri' },
    { value: 'Zaphy', label: 'Zaphy' },
    { value: 'Agentic', label: 'Agentic' },
    { value: 'Yuj', label: 'Yuj' },
    { value: 'AdaptiveVision', label: 'AdaptiveVision' },
    { value: 'Website', label: 'FutureAtoms Website' },
    { value: 'Other', label: 'Other' }
];

// Category definitions - can be customized per product
const CATEGORIES = {
    'general': { label: 'General', icon: 'fa-circle', color: '#00ffff' },
    'ui': { label: 'UI/UX', icon: 'fa-palette', color: '#ff6b9d' },
    'performance': { label: 'Performance', icon: 'fa-bolt', color: '#ffd700' },
    'integration': { label: 'Integration', icon: 'fa-plug', color: '#4facfe' },
    'workflow': { label: 'Workflow', icon: 'fa-sitemap', color: '#00ff88' },
    'documentation': { label: 'Docs', icon: 'fa-book', color: '#c084fc' },
    'ai': { label: 'AI/ML', icon: 'fa-brain', color: '#ff8c00' },
    'security': { label: 'Security', icon: 'fa-shield-halved', color: '#ef4444' }
};

// Local storage key for voted features
const VOTED_STORAGE_KEY = 'futureatoms_voted_features';

/**
 * Initialize the feature request system
 * @param {string} product - The product identifier (e.g., 'chipos', 'bevybeats')
 */
function initFeatures(product) {
    currentProduct = product;

    // Initialize Supabase client
    if (window.supabase) {
        const { createClient } = window.supabase;
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error('Supabase SDK not loaded');
        showToast('Failed to initialize. Please refresh the page.', 'error');
        return;
    }

    // Load voted features from local storage
    loadVotedFeatures();

    // Set up event listeners
    setupEventListeners();

    // Load features
    loadFeatures();
}

/**
 * Load voted features from local storage
 */
function loadVotedFeatures() {
    try {
        const stored = localStorage.getItem(VOTED_STORAGE_KEY);
        if (stored) {
            votedFeatures = new Set(JSON.parse(stored));
        }
    } catch (e) {
        console.warn('Could not load voted features from storage:', e);
    }
}

/**
 * Save voted features to local storage
 */
function saveVotedFeatures() {
    try {
        localStorage.setItem(VOTED_STORAGE_KEY, JSON.stringify([...votedFeatures]));
    } catch (e) {
        console.warn('Could not save voted features to storage:', e);
    }
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Status filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.status || 'all';
            renderFeatures();
        });
    });

    // Category filter tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.dataset.category || 'all';
            renderFeatures();
        });
    });

    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderFeatures();
        });
    }

    // Submit button
    const submitBtn = document.getElementById('submit-feature-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', openSubmitModal);
    }

    // Modal close handlers
    const modalOverlay = document.getElementById('submit-modal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeSubmitModal();
        });
    }

    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeSubmitModal);
    }

    // Form submission
    const form = document.getElementById('feature-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Character counter for title
    const titleInput = document.getElementById('feature-title');
    if (titleInput) {
        titleInput.addEventListener('input', updateTitleCounter);
    }

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSubmitModal();
    });
}

/**
 * Load features from Supabase
 */
async function loadFeatures() {
    showLoading();

    try {
        const { data, error } = await supabaseClient
            .from('feature_requests')
            .select('*')
            .eq('product', currentProduct)
            .order('created_at', { ascending: false });

        if (error) throw error;

        features = data || [];
        updateStats();
        renderFeatures();
    } catch (error) {
        console.error('Error loading features:', error);
        showToast('Failed to load features. Please try again.', 'error');
        showEmpty();
    }
}

/**
 * Update the stats display
 */
function updateStats() {
    const totalEl = document.getElementById('stat-total');
    const plannedEl = document.getElementById('stat-planned');
    const progressEl = document.getElementById('stat-progress');
    const completedEl = document.getElementById('stat-completed');

    if (totalEl) totalEl.textContent = features.length;
    if (plannedEl) plannedEl.textContent = features.filter(f => f.status === 'planned').length;
    if (progressEl) progressEl.textContent = features.filter(f => f.status === 'in_progress').length;
    if (completedEl) completedEl.textContent = features.filter(f => f.status === 'completed').length;
}

/**
 * Render features based on current filter, category, and sort
 */
function renderFeatures() {
    const grid = document.getElementById('features-grid');
    if (!grid) return;

    // Filter features by status
    let filtered = features;
    if (currentFilter !== 'all') {
        filtered = features.filter(f => f.status === currentFilter);
    }

    // Filter by category
    if (currentCategory !== 'all') {
        filtered = filtered.filter(f => (f.category || 'general') === currentCategory);
    }

    // Sort features
    filtered = sortFeatures(filtered, currentSort);

    // Update category counts
    updateCategoryCounts();

    // Render
    if (filtered.length === 0) {
        showEmpty();
        return;
    }

    grid.innerHTML = filtered.map(feature => createFeatureCard(feature)).join('');

    // Add click handlers to upvote buttons
    grid.querySelectorAll('.upvote-btn').forEach(btn => {
        btn.addEventListener('click', () => handleUpvote(btn.dataset.id));
    });
}

/**
 * Update category counts in filter tabs
 */
function updateCategoryCounts() {
    const categoryCounts = {};
    features.forEach(f => {
        const cat = f.category || 'general';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    document.querySelectorAll('.category-tab').forEach(tab => {
        const category = tab.dataset.category;
        const countEl = tab.querySelector('.category-count');
        if (countEl && category !== 'all') {
            countEl.textContent = categoryCounts[category] || 0;
        } else if (countEl && category === 'all') {
            countEl.textContent = features.length;
        }
    });
}

/**
 * Sort features array
 */
function sortFeatures(arr, sortBy) {
    const sorted = [...arr];
    switch (sortBy) {
        case 'votes':
            return sorted.sort((a, b) => b.vote_count - a.vote_count);
        case 'newest':
            return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        case 'oldest':
            return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        default:
            return sorted;
    }
}

/**
 * Create HTML for a feature card
 */
function createFeatureCard(feature) {
    const isVoted = votedFeatures.has(feature.id);
    const statusLabel = getStatusLabel(feature.status);
    const timeAgo = getTimeAgo(feature.created_at);
    const submitter = feature.submitter_name
        ? escapeHtml(feature.submitter_name)
        : 'Anonymous';
    const category = feature.category || 'general';
    const categoryInfo = CATEGORIES[category] || CATEGORIES.general;

    return `
        <div class="feature-card" data-id="${feature.id}" style="--card-accent: var(--status-${feature.status.replace('_', '-')})">
            <div class="feature-card-header">
                <div class="feature-badges">
                    <span class="status-badge ${feature.status}">${statusLabel}</span>
                    <span class="category-badge" style="--category-color: ${categoryInfo.color}">
                        <i class="fas ${categoryInfo.icon}"></i>
                        ${categoryInfo.label}
                    </span>
                </div>
                <button class="upvote-btn ${isVoted ? 'voted' : ''}"
                        data-id="${feature.id}"
                        ${isVoted ? 'disabled' : ''}>
                    <i class="fas fa-chevron-up"></i>
                    <span class="upvote-count">${feature.vote_count}</span>
                </button>
            </div>
            <h3 class="feature-card-title">${escapeHtml(feature.title)}</h3>
            ${feature.description ? `<p class="feature-card-description">${escapeHtml(feature.description)}</p>` : ''}
            <div class="feature-card-footer">
                <span class="feature-submitter">
                    <i class="fas fa-user"></i>
                    ${submitter}
                </span>
                <span class="feature-date">
                    <i class="fas fa-clock"></i>
                    ${timeAgo}
                </span>
            </div>
        </div>
    `;
}

/**
 * Get human-readable status label
 */
function getStatusLabel(status) {
    const labels = {
        'submitted': 'Submitted',
        'planned': 'Planned',
        'in_progress': 'In Progress',
        'completed': 'Completed'
    };
    return labels[status] || status;
}

/**
 * Get time ago string
 */
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'week', seconds: 604800 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 }
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
        }
    }

    return 'Just now';
}

/**
 * Handle upvote click
 */
async function handleUpvote(featureId) {
    if (votedFeatures.has(featureId)) {
        showToast('You have already voted for this feature', 'info');
        return;
    }

    const btn = document.querySelector(`.upvote-btn[data-id="${featureId}"]`);
    if (btn) {
        btn.disabled = true;
    }

    try {
        // Get client IP for rate limiting (via Supabase edge function or simple approach)
        const voterIp = await getClientIdentifier();

        // Insert vote
        const { error } = await supabaseClient
            .from('feature_votes')
            .insert({
                feature_id: featureId,
                voter_ip: voterIp
            });

        if (error) {
            // Check if it's a duplicate vote error
            if (error.code === '23505') {
                showToast('You have already voted for this feature', 'info');
                votedFeatures.add(featureId);
                saveVotedFeatures();
            } else {
                throw error;
            }
        } else {
            // Success - update local state
            votedFeatures.add(featureId);
            saveVotedFeatures();

            // Update the feature in local array
            const feature = features.find(f => f.id === featureId);
            if (feature) {
                feature.vote_count++;
            }

            // Update UI
            if (btn) {
                btn.classList.add('voted');
                const countEl = btn.querySelector('.upvote-count');
                if (countEl) {
                    countEl.textContent = parseInt(countEl.textContent) + 1;
                }
            }

            showToast('Vote recorded!', 'success');
        }
    } catch (error) {
        console.error('Error voting:', error);
        showToast('Failed to record vote. Please try again.', 'error');
        if (btn) {
            btn.disabled = false;
        }
    }
}

/**
 * Get a client identifier for rate limiting
 * Uses a combination of fingerprinting since we can't get real IP client-side
 */
async function getClientIdentifier() {
    // Create a simple fingerprint from available browser data
    const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unknown'
    ];

    const fingerprint = components.join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    return 'fp_' + Math.abs(hash).toString(16);
}

/**
 * Open the submit modal
 */
function openSubmitModal() {
    const modal = document.getElementById('submit-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Inject product select if needed
        injectProductSelect();

        // Focus first input
        setTimeout(() => {
            const titleInput = document.getElementById('feature-title');
            if (titleInput) titleInput.focus();
        }, 100);
    }
}

/**
 * Close the submit modal
 */
function closeSubmitModal() {
    const modal = document.getElementById('submit-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // Reset form
        const form = document.getElementById('feature-form');
        if (form) form.reset();

        // Reset button state
        const submitBtn = document.getElementById('form-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading', 'success');
            submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Submit Request';
        }

        // Reset character counter
        updateTitleCounter();
    }
}

/**
 * Update title character counter
 */
function updateTitleCounter() {
    const input = document.getElementById('feature-title');
    const counter = document.getElementById('title-counter');
    if (!input || !counter) return;

    const count = input.value.length;
    const max = 200;
    counter.textContent = `${count}/${max}`;

    counter.classList.remove('warning', 'error');
    if (count > max * 0.9) {
        counter.classList.add('error');
    } else if (count > max * 0.7) {
        counter.classList.add('warning');
    }
}

/**
 * Handle form submission - Routes to GitHub for consolidated tracking
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = document.getElementById('form-submit-btn');

    // Get form data
    const title = document.getElementById('feature-title').value.trim();
    const description = document.getElementById('feature-description').value.trim();
    const name = document.getElementById('submitter-name').value.trim();
    const email = document.getElementById('submitter-email').value.trim();
    const categorySelect = document.getElementById('feature-category');
    const category = categorySelect ? categorySelect.value : 'general';

    // Get product from dropdown (falls back to currentProduct if dropdown doesn't exist)
    const productSelect = document.getElementById('feature-product');
    const selectedProduct = productSelect ? productSelect.value : currentProduct;

    // Validation
    if (!title) {
        showToast('Please enter a title for your feature request', 'error');
        return;
    }

    if (!selectedProduct) {
        showToast('Please select a product', 'error');
        return;
    }

    if (title.length > 200) {
        showToast('Title must be 200 characters or less', 'error');
        return;
    }

    // Email validation if provided
    if (email && !isValidEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Submitting...';

    try {
        // Submit to GitHub via Cloud Function
        const response = await fetch('/api/report-feature', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                description: description,
                name: name,
                email: email,
                product: selectedProduct,
                category: category
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to submit');
        }

        // Success
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('success');
        submitBtn.innerHTML = `<i class="fas fa-check mr-2"></i> Created <a href="${result.issueUrl}" target="_blank" style="color:#00ffff;">#${result.issueNumber}</a>`;

        showToast('Feature request submitted to GitHub!', 'success');

        // Also save to Supabase for voting/display (if available)
        if (supabaseClient) {
            try {
                const { data } = await supabaseClient
                    .from('feature_requests')
                    .insert({
                        product: selectedProduct,
                        title: title,
                        description: description || null,
                        submitter_name: name || null,
                        submitter_email: email || null,
                        category: category,
                        status: 'submitted',
                        vote_count: 0,
                        github_issue_url: result.issueUrl,
                        github_issue_number: result.issueNumber
                    })
                    .select()
                    .single();

                if (data) {
                    features.unshift(data);
                    updateStats();
                    renderFeatures();
                }
            } catch (supabaseError) {
                console.warn('Could not save to Supabase:', supabaseError);
            }
        }

        // Close modal after delay
        setTimeout(() => {
            closeSubmitModal();
        }, 2500);

    } catch (error) {
        console.error('Error submitting feature:', error);
        showToast('Failed to submit feature request. Please try again.', 'error');

        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Submit Request';
    }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Show loading state
 */
function showLoading() {
    const grid = document.getElementById('features-grid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="features-loading" style="grid-column: 1 / -1;">
            <i class="fas fa-atom fa-spin"></i>
            <p>Loading feature requests...</p>
        </div>
    `;
}

/**
 * Show empty state
 */
function showEmpty() {
    const grid = document.getElementById('features-grid');
    if (!grid) return;

    const message = currentFilter === 'all'
        ? 'No feature requests yet. Be the first to submit one!'
        : `No ${getStatusLabel(currentFilter).toLowerCase()} features yet.`;

    grid.innerHTML = `
        <div class="features-empty" style="grid-column: 1 / -1;">
            <i class="fas fa-lightbulb"></i>
            <h3>No Features Found</h3>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    // Remove after delay
    setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s ease-out reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

/**
 * Generate category select options HTML
 */
function generateCategoryOptions() {
    return Object.entries(CATEGORIES).map(([key, info]) =>
        `<option value="${key}">${info.label}</option>`
    ).join('');
}

/**
 * Generate product select options HTML
 */
function generateProductOptions(selectedProduct = '') {
    return PRODUCTS.map(p =>
        `<option value="${p.value}" ${p.value === selectedProduct ? 'selected' : ''}>${p.label}</option>`
    ).join('');
}

/**
 * Inject product select into form if not exists
 */
function injectProductSelect() {
    const form = document.getElementById('feature-form');
    if (!form) return;

    // Check if product select already exists
    if (document.getElementById('feature-product')) return;

    // Find the title form group to insert after
    const titleGroup = form.querySelector('.form-group');
    if (!titleGroup) return;

    // Create product select group
    const productGroup = document.createElement('div');
    productGroup.className = 'form-group';
    productGroup.innerHTML = `
        <label class="form-label" for="feature-product">
            Product <span class="required">*</span>
        </label>
        <select id="feature-product" class="form-select" required>
            <option value="">Select a product...</option>
            ${generateProductOptions(currentProduct)}
        </select>
    `;

    // Insert after title
    titleGroup.after(productGroup);
}

/**
 * Generate category filter tabs HTML
 */
function generateCategoryTabs() {
    let html = `<button class="category-tab active" data-category="all">
        <i class="fas fa-layer-group"></i> All <span class="category-count">0</span>
    </button>`;

    Object.entries(CATEGORIES).forEach(([key, info]) => {
        html += `<button class="category-tab" data-category="${key}" style="--tab-color: ${info.color}">
            <i class="fas ${info.icon}"></i> ${info.label} <span class="category-count">0</span>
        </button>`;
    });

    return html;
}

// Export for use in HTML
window.initFeatures = initFeatures;
window.CATEGORIES = CATEGORIES;
window.PRODUCTS = PRODUCTS;
window.generateCategoryOptions = generateCategoryOptions;
window.generateCategoryTabs = generateCategoryTabs;
window.generateProductOptions = generateProductOptions;
