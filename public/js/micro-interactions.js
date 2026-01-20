/**
 * Premium Micro-Interactions
 * Enhances UI with subtle, delightful animations
 * Compatible with GSAP (if loaded) and vanilla JS
 */

(function() {
    'use strict';

    // Wait for DOM
    document.addEventListener('DOMContentLoaded', initMicroInteractions);

    function initMicroInteractions() {
        initMagneticButtons();
        initRippleEffect();
        initTiltCards();
        initScrollAnimations();
        initCounterAnimations();
        initSmoothHovers();
        initParallaxElements();
    }

    /**
     * Magnetic Button Effect
     * Buttons subtly follow cursor on hover
     */
    function initMagneticButtons() {
        const buttons = document.querySelectorAll('.magnetic-btn, .apply-btn, .apply-submit-btn');

        buttons.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0, 0)';
            });
        });
    }

    /**
     * Ripple Effect on Click
     * Material design inspired click feedback
     */
    function initRippleEffect() {
        const buttons = document.querySelectorAll('.ripple-btn, .apply-btn, button[type="submit"]');

        buttons.forEach(btn => {
            btn.classList.add('ripple-btn');

            btn.addEventListener('click', function(e) {
                const rect = this.getBoundingClientRect();
                const ripple = document.createElement('span');
                const size = Math.max(rect.width, rect.height);

                ripple.className = 'ripple';
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
                ripple.style.top = e.clientY - rect.top - size / 2 + 'px';

                this.appendChild(ripple);

                setTimeout(() => ripple.remove(), 600);
            });
        });
    }

    /**
     * 3D Tilt Effect on Cards
     * Premium card hover with perspective
     */
    function initTiltCards() {
        const cards = document.querySelectorAll('.tilt-card, .value-card, .job-card, .perk-card, .glass-panel');

        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            });
        });
    }

    /**
     * Scroll-Triggered Animations
     * Elements animate in as they enter viewport
     */
    function initScrollAnimations() {
        // Add stagger-fade class to animatable elements
        const animatableSelectors = [
            '.value-card',
            '.job-card',
            '.perk-card',
            '.faq-item',
            '.form-section',
            'section > div',
            '.glass-panel'
        ];

        const elements = document.querySelectorAll(animatableSelectors.join(', '));

        elements.forEach((el, index) => {
            if (!el.classList.contains('stagger-fade')) {
                el.classList.add('stagger-fade');
                el.style.transitionDelay = `${(index % 6) * 0.1}s`;
            }
        });

        // Use GSAP ScrollTrigger if available, otherwise use IntersectionObserver
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);

            gsap.utils.toArray('.stagger-fade').forEach((el, i) => {
                gsap.fromTo(el,
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 85%',
                            toggleActions: 'play none none none'
                        },
                        delay: (i % 6) * 0.1
                    }
                );
            });
        } else {
            // Fallback to IntersectionObserver
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            document.querySelectorAll('.stagger-fade').forEach(el => observer.observe(el));
        }
    }

    /**
     * Animated Number Counters
     * Numbers count up when visible
     */
    function initCounterAnimations() {
        const counters = document.querySelectorAll('[data-count], .counter-animate');

        const animateCounter = (el) => {
            const target = parseInt(el.getAttribute('data-count') || el.textContent.replace(/\D/g, ''));
            const suffix = el.textContent.replace(/[\d,]/g, '');
            const duration = 2000;
            const start = 0;
            const startTime = performance.now();

            const updateCounter = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(start + (target - start) * easeOut);

                el.textContent = current.toLocaleString() + suffix;

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                }
            };

            requestAnimationFrame(updateCounter);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(el => observer.observe(el));
    }

    /**
     * Smooth Hover Effects
     * Enhanced hover states for interactive elements
     */
    function initSmoothHovers() {
        // Add glow effect to buttons
        document.querySelectorAll('.apply-btn, .cta-btn, a[href].border').forEach(el => {
            el.classList.add('glow-hover');
        });

        // Add scale effect to cards
        document.querySelectorAll('.job-card, .value-card').forEach(el => {
            el.classList.add('scale-hover');
        });

        // Add underline slide to nav links
        document.querySelectorAll('nav a:not(.border)').forEach(el => {
            el.classList.add('underline-slide');
        });

        // Add icon bounce to icon containers
        document.querySelectorAll('.culture-icon, .text-cyan-400 > i').forEach(el => {
            el.classList.add('icon-bounce');
        });
    }

    /**
     * Parallax Elements
     * Subtle depth on scroll
     */
    function initParallaxElements() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');

        if (parallaxElements.length === 0) return;

        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollY = window.scrollY;

                    parallaxElements.forEach(el => {
                        const speed = parseFloat(el.getAttribute('data-parallax')) || 0.5;
                        const rect = el.getBoundingClientRect();
                        const visible = rect.top < window.innerHeight && rect.bottom > 0;

                        if (visible) {
                            const yPos = -(scrollY * speed);
                            el.style.transform = `translateY(${yPos}px)`;
                        }
                    });

                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    /**
     * Text Split Animation Helper
     * Splits text into spans for character animations
     */
    window.splitTextForAnimation = function(selector) {
        document.querySelectorAll(selector).forEach(el => {
            const text = el.textContent;
            el.innerHTML = '';
            el.classList.add('text-reveal');

            text.split('').forEach((char, i) => {
                const span = document.createElement('span');
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.style.transitionDelay = `${i * 0.03}s`;
                el.appendChild(span);
            });
        });
    };

    /**
     * Trigger text reveal animation
     */
    window.revealText = function(selector) {
        document.querySelectorAll(selector).forEach(el => {
            el.classList.add('revealed');
        });
    };

    /**
     * Smooth scroll to element
     */
    window.smoothScrollTo = function(target, offset = 0) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const y = element.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({
            top: y,
            behavior: 'smooth'
        });
    };

    // Add page transition class to body
    document.body.classList.add('page-transition');

})();
