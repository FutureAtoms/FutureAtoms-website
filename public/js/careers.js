// Careers Page JavaScript - Application Form with Supabase Integration

// Supabase Configuration
const SUPABASE_URL = 'https://wpgrhvdwdvmknhjzpkwz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZ3JodmR3ZHZta25oanpwa3d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTYyODQsImV4cCI6MjA3Mjk5MjI4NH0.qdeRc4qFAFP3nFj2HuVAhGTikZrCCkwxCAfDL5Jq4VM';

// Sanitize input to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initApplicationModal();
    initFAQAccordion();
});

// Application Modal Functions
function initApplicationModal() {
    const modal = document.getElementById('apply-modal');
    const closeBtn = document.getElementById('apply-modal-close');
    const form = document.getElementById('apply-form');

    if (!modal) return;

    // Close modal on X click
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Close modal on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Form submission
    if (form) {
        form.addEventListener('submit', handleApplicationSubmit);
    }
}

// Open modal with position data
function openApplyModal(position, positionType = 'full-time') {
    const modal = document.getElementById('apply-modal');
    const positionDisplay = document.getElementById('modal-position');
    const positionInput = document.getElementById('apply-position');
    const positionTypeInput = document.getElementById('apply-position-type');
    const formContainer = document.getElementById('apply-form-container');
    const successContainer = document.getElementById('apply-success-container');

    if (!modal) return;

    // Reset form state
    if (formContainer) formContainer.style.display = 'block';
    if (successContainer) successContainer.style.display = 'none';

    // Set position
    if (positionDisplay) positionDisplay.textContent = escapeHTML(position);
    if (positionInput) positionInput.value = position;
    if (positionTypeInput) positionTypeInput.value = positionType;

    // Reset form
    const form = document.getElementById('apply-form');
    if (form) form.reset();

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus first input
    setTimeout(() => {
        const firstInput = form?.querySelector('input:not([type="hidden"])');
        if (firstInput) firstInput.focus();
    }, 100);
}

function closeModal() {
    const modal = document.getElementById('apply-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Handle form submission
async function handleApplicationSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('.apply-submit-btn');
    const originalText = submitBtn.innerHTML;

    // Validate form
    if (!validateForm(form)) return;

    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SUBMITTING...';
    submitBtn.disabled = true;

    // Gather form data
    const formData = new FormData(form);
    const data = {
        full_name: formData.get('full_name')?.trim(),
        email: formData.get('email')?.trim().toLowerCase(),
        phone: formData.get('phone')?.trim() || null,
        linkedin_url: formData.get('linkedin_url')?.trim() || null,
        portfolio_url: formData.get('portfolio_url')?.trim() || null,
        position: formData.get('position'),
        position_type: formData.get('position_type') || 'full-time',
        experience_years: formData.get('experience_years') || null,
        cover_letter: formData.get('cover_letter')?.trim() || null,
        resume_url: formData.get('resume_url')?.trim() || null,
        how_did_you_hear: formData.get('how_did_you_hear') || null,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent
    };

    try {
        // Submit to Supabase
        const response = await fetch(`${SUPABASE_URL}/rest/v1/job_applications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to submit application');
        }

        // Show success
        showSuccess();

        // Send email notification (optional - would need edge function)
        // await sendNotificationEmail(data);

    } catch (error) {
        console.error('Application submission error:', error);
        submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> SUBMISSION FAILED';
        submitBtn.classList.add('error');

        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.classList.remove('error');
            submitBtn.disabled = false;
        }, 3000);
    }
}

function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');

    // Clear previous errors
    form.querySelectorAll('.form-error').forEach(el => el.remove());
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            showFieldError(field, 'This field is required');
        } else if (field.type === 'email' && !isValidEmail(field.value)) {
            isValid = false;
            showFieldError(field, 'Please enter a valid email');
        }
    });

    // Validate LinkedIn URL if provided
    const linkedinField = form.querySelector('[name="linkedin_url"]');
    if (linkedinField?.value && !isValidLinkedIn(linkedinField.value)) {
        isValid = false;
        showFieldError(linkedinField, 'Please enter a valid LinkedIn URL');
    }

    return isValid;
}

function showFieldError(field, message) {
    field.classList.add('error');
    const error = document.createElement('div');
    error.className = 'form-error';
    error.textContent = message;
    field.parentNode.appendChild(error);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidLinkedIn(url) {
    return /^https?:\/\/(www\.)?linkedin\.com\/(in|pub|company)\/[\w-]+\/?$/i.test(url) ||
           /^linkedin\.com\/(in|pub|company)\/[\w-]+\/?$/i.test(url);
}

function showSuccess() {
    const formContainer = document.getElementById('apply-form-container');
    const successContainer = document.getElementById('apply-success-container');

    if (formContainer) formContainer.style.display = 'none';
    if (successContainer) successContainer.style.display = 'block';

    // Auto-close after delay
    setTimeout(() => {
        closeModal();
        // Reset for next use
        setTimeout(() => {
            if (formContainer) formContainer.style.display = 'block';
            if (successContainer) successContainer.style.display = 'none';
        }, 300);
    }, 4000);
}

// FAQ Accordion
function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                // Close others
                faqItems.forEach(other => {
                    if (other !== item) other.classList.remove('open');
                });
                // Toggle current
                item.classList.toggle('open');
            });
        }
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
