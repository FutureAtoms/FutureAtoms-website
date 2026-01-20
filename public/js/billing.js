/**
 * ChipOS Billing - Stripe Checkout Integration
 * Handles subscription checkout and payment flows
 */

// Configuration
const BILLING_CONFIG = {
    // Supabase configuration (same as ChipOS ACF)
    supabaseUrl: 'https://wpgrhvdwdvmknhjzpkwz.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZ3JodmR3ZHZta25oanpwa3d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2ODg2MjAsImV4cCI6MjA1MjI2NDYyMH0.segfUE_LbyWJYcKvYne9W4u1E1lLpJKbF5VFJN7Lels',

    // Stripe configuration (to be set up)
    stripePublishableKey: null, // Will be loaded from Supabase settings

    // Pricing (in EUR cents for Stripe)
    plans: {
        free: {
            name: 'Free',
            monthlyPrice: 0,
            yearlyPrice: 0,
            stripePriceIdMonthly: null,
            stripePriceIdYearly: null
        },
        pro: {
            name: 'Pro',
            monthlyPrice: 1800, // €18.00
            yearlyPrice: 18000, // €180.00 (€15/mo)
            stripePriceIdMonthly: null, // Will be set from Stripe
            stripePriceIdYearly: null
        },
        enterprise: {
            name: 'Enterprise',
            monthlyPrice: 5900, // €59.00
            yearlyPrice: 59000, // €590.00 (€49/mo)
            stripePriceIdMonthly: null,
            stripePriceIdYearly: null
        },
        'enterprise-plus': {
            name: 'Enterprise Plus',
            monthlyPrice: 0, // Custom pricing
            yearlyPrice: 0,
            stripePriceIdMonthly: null,
            stripePriceIdYearly: null,
            isCustom: true
        }
    },

    // Add-on packs
    addons: {
        'web-crawl': { name: 'Web Crawl Pack', price: 2500 }, // €25
        'repo-ingestion': { name: 'Repo Ingestion Pack', price: 3000 }, // €30
        'doc-upload': { name: 'Doc Upload Pack', price: 2000 }, // €20
        'vector-storage': { name: 'Vector Storage Pack', price: 1500 }, // €15
        'agent-minutes': { name: 'Agent Minutes Pack', price: 4000 }, // €40
        'rag-evaluation': { name: 'RAG Evaluation Pack', price: 2000 } // €20
    }
};

// Supabase client
let supabase = null;

/**
 * Initialize the billing module
 */
async function initBilling() {
    // Initialize Supabase client
    if (window.supabase) {
        supabase = window.supabase.createClient(
            BILLING_CONFIG.supabaseUrl,
            BILLING_CONFIG.supabaseAnonKey
        );

        // Try to load Stripe configuration from Supabase
        await loadStripeConfig();
    } else {
        console.warn('Supabase SDK not loaded. Billing features limited.');
    }
}

/**
 * Load Stripe configuration from Supabase settings
 */
async function loadStripeConfig() {
    if (!supabase) return;

    try {
        const { data, error } = await supabase
            .from('archon_settings')
            .select('value')
            .eq('key', 'stripe_publishable_key')
            .single();

        if (data && data.value) {
            BILLING_CONFIG.stripePublishableKey = data.value;
        }

        // Load price IDs
        const { data: priceData } = await supabase
            .from('archon_settings')
            .select('key, value')
            .like('key', 'stripe_price_%');

        if (priceData) {
            priceData.forEach(item => {
                const match = item.key.match(/stripe_price_(\w+)_(monthly|yearly)/);
                if (match && BILLING_CONFIG.plans[match[1]]) {
                    const priceKey = match[2] === 'monthly' ? 'stripePriceIdMonthly' : 'stripePriceIdYearly';
                    BILLING_CONFIG.plans[match[1]][priceKey] = item.value;
                }
            });
        }
    } catch (err) {
        console.warn('Could not load Stripe config:', err.message);
    }
}

/**
 * Get the current user session
 */
async function getCurrentUser() {
    if (!supabase) return null;

    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
}

/**
 * Check if user is authenticated
 */
async function isAuthenticated() {
    const user = await getCurrentUser();
    return !!user;
}

/**
 * Redirect to login if not authenticated
 */
function redirectToLogin(returnUrl) {
    const loginUrl = `https://app.chipos.dev/login?returnUrl=${encodeURIComponent(returnUrl || window.location.href)}`;
    window.location.href = loginUrl;
}

/**
 * Start a subscription checkout
 * @param {string} planId - Plan ID (pro, enterprise)
 * @param {string} billingCycle - 'monthly' or 'yearly'
 */
async function startCheckout(planId, billingCycle = 'monthly') {
    const plan = BILLING_CONFIG.plans[planId];

    if (!plan) {
        showError('Invalid plan selected');
        return;
    }

    // Handle custom pricing for Enterprise+
    if (plan.isCustom) {
        window.location.href = 'contact.html?subject=Enterprise+%20Pricing%20Inquiry';
        return;
    }

    // Handle free tier
    if (planId === 'free') {
        window.location.href = 'https://app.chipos.dev/signup';
        return;
    }

    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
        // Save intended plan and redirect to login
        sessionStorage.setItem('pendingCheckout', JSON.stringify({ planId, billingCycle }));
        redirectToLogin();
        return;
    }

    // Get the appropriate price ID
    const priceId = billingCycle === 'yearly' ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;

    if (!priceId) {
        // Stripe not configured yet - show message
        showSetupMessage(plan, billingCycle);
        return;
    }

    // Create checkout session via Supabase Edge Function
    try {
        showLoading(true);

        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: {
                priceId: priceId,
                planId: planId,
                billingCycle: billingCycle,
                successUrl: `${window.location.origin}/chipos-pricing.html?success=true&plan=${planId}`,
                cancelUrl: `${window.location.origin}/chipos-pricing.html?canceled=true`
            }
        });

        if (error) throw error;

        if (data?.url) {
            // Redirect to Stripe Checkout
            window.location.href = data.url;
        } else {
            throw new Error('No checkout URL returned');
        }
    } catch (err) {
        console.error('Checkout error:', err);
        showError('Unable to start checkout. Please try again or contact support.');
    } finally {
        showLoading(false);
    }
}

/**
 * Purchase an add-on pack
 * @param {string} addonId - Add-on ID
 */
async function purchaseAddon(addonId) {
    const addon = BILLING_CONFIG.addons[addonId];

    if (!addon) {
        showError('Invalid add-on selected');
        return;
    }

    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
        sessionStorage.setItem('pendingAddon', addonId);
        redirectToLogin();
        return;
    }

    // Create checkout session for one-time purchase
    try {
        showLoading(true);

        const { data, error } = await supabase.functions.invoke('create-addon-checkout', {
            body: {
                addonId: addonId,
                successUrl: `${window.location.origin}/chipos-pricing.html?addon_success=true&addon=${addonId}`,
                cancelUrl: `${window.location.origin}/chipos-pricing.html?canceled=true`
            }
        });

        if (error) throw error;

        if (data?.url) {
            window.location.href = data.url;
        } else {
            throw new Error('No checkout URL returned');
        }
    } catch (err) {
        console.error('Addon checkout error:', err);
        showError('Unable to process purchase. Please try again or contact support.');
    } finally {
        showLoading(false);
    }
}

/**
 * Open the customer portal for subscription management
 */
async function openCustomerPortal() {
    const user = await getCurrentUser();
    if (!user) {
        redirectToLogin();
        return;
    }

    try {
        showLoading(true);

        const { data, error } = await supabase.functions.invoke('create-portal-session', {
            body: {
                returnUrl: window.location.href
            }
        });

        if (error) throw error;

        if (data?.url) {
            window.location.href = data.url;
        }
    } catch (err) {
        console.error('Portal error:', err);
        showError('Unable to open billing portal. Please try again.');
    } finally {
        showLoading(false);
    }
}

/**
 * Show loading state
 */
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Show error message
 */
function showError(message) {
    // Try to use existing toast/notification system
    if (window.showToast) {
        window.showToast(message, 'error');
        return;
    }

    // Fallback to alert
    alert(message);
}

/**
 * Show setup message when Stripe is not yet configured
 */
function showSetupMessage(plan, billingCycle) {
    const price = billingCycle === 'yearly'
        ? `€${(plan.yearlyPrice / 100).toFixed(0)}/year`
        : `€${(plan.monthlyPrice / 100).toFixed(0)}/month`;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm';
    modal.innerHTML = `
        <div class="bg-[#0a0a1a] border border-cyan-500/30 rounded-2xl p-8 max-w-md mx-4 text-center">
            <div class="text-5xl mb-4 text-cyan-400"><i class="fas fa-rocket"></i></div>
            <h3 class="text-2xl font-['Orbitron'] text-white mb-4">Coming Soon!</h3>
            <p class="text-gray-300 mb-6">
                Online checkout for <strong>${plan.name}</strong> (${price}) is launching soon.
                <br><br>
                In the meantime, you can get started by downloading ChipOS and using the free tier.
            </p>
            <div class="flex flex-col gap-3">
                <a href="chipos.html#download" class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded-full font-['Orbitron'] hover:bg-cyan-500/30 transition-all">
                    <i class="fas fa-download"></i> Download ChipOS
                </a>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white transition-colors">
                    Close
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

/**
 * Handle URL parameters after checkout
 */
function handleCheckoutResult() {
    const params = new URLSearchParams(window.location.search);

    if (params.get('success') === 'true') {
        const plan = params.get('plan');
        showSuccessMessage(plan);
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('addon_success') === 'true') {
        const addon = params.get('addon');
        showAddonSuccessMessage(addon);
        window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('canceled') === 'true') {
        // User canceled - no action needed
        window.history.replaceState({}, '', window.location.pathname);
    }

    // Check for pending checkout from before login
    const pendingCheckout = sessionStorage.getItem('pendingCheckout');
    if (pendingCheckout) {
        sessionStorage.removeItem('pendingCheckout');
        const { planId, billingCycle } = JSON.parse(pendingCheckout);
        // Small delay to let page load
        setTimeout(() => startCheckout(planId, billingCycle), 500);
    }
}

/**
 * Show success message after subscription
 */
function showSuccessMessage(planId) {
    const plan = BILLING_CONFIG.plans[planId];
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm';
    modal.innerHTML = `
        <div class="bg-[#0a0a1a] border border-green-500/30 rounded-2xl p-8 max-w-md mx-4 text-center">
            <div class="text-6xl mb-4 text-green-400"><i class="fas fa-check-circle"></i></div>
            <h3 class="text-2xl font-['Orbitron'] text-white mb-4">Welcome to ${plan?.name || 'ChipOS'}!</h3>
            <p class="text-gray-300 mb-6">
                Your subscription is now active. You can start using all the features right away.
            </p>
            <div class="flex flex-col gap-3">
                <a href="https://app.chipos.dev" class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500/20 border border-green-500 text-green-400 rounded-full font-['Orbitron'] hover:bg-green-500/30 transition-all">
                    <i class="fas fa-external-link-alt"></i> Open ChipOS
                </a>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white transition-colors">
                    Close
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

/**
 * Show success message after addon purchase
 */
function showAddonSuccessMessage(addonId) {
    const addon = BILLING_CONFIG.addons[addonId];
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm';
    modal.innerHTML = `
        <div class="bg-[#0a0a1a] border border-green-500/30 rounded-2xl p-8 max-w-md mx-4 text-center">
            <div class="text-6xl mb-4 text-green-400"><i class="fas fa-check-circle"></i></div>
            <h3 class="text-2xl font-['Orbitron'] text-white mb-4">Purchase Complete!</h3>
            <p class="text-gray-300 mb-6">
                Your <strong>${addon?.name || 'pack'}</strong> has been added to your account.
            </p>
            <button onclick="this.closest('.fixed').remove()" class="px-6 py-3 bg-green-500/20 border border-green-500 text-green-400 rounded-full font-['Orbitron'] hover:bg-green-500/30 transition-all">
                Continue
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initBilling();
    handleCheckoutResult();
});

// Export for use in other scripts
window.ChipOSBilling = {
    startCheckout,
    purchaseAddon,
    openCustomerPortal,
    isAuthenticated,
    getCurrentUser,
    config: BILLING_CONFIG
};
