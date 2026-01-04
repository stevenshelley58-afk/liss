import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Instagram, Mail } from 'lucide-react';
import heroImg from './assets/hero.png';
import trainingImg from './assets/training.jpg';
import groupImg from './assets/group.png';
import wideBannerImg from './assets/wide-banner.png';
import portraitImg from './assets/portrait.png';
import poolImg from './assets/pool.jpg';
import ctaPortraitImg from './assets/cta-portrait.png';

export default function Website() {
    const containerRef = useRef(null);

    useEffect(() => {
        // Add external stylesheets
        const link1 = document.createElement('link');
        link1.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400;1,9..144,500&family=DM+Sans:wght@400;500;600&display=swap';
        link1.rel = 'stylesheet';
        document.head.appendChild(link1);

        // Lenis Smooth Scroll
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/lenis@1.1.20/dist/lenis.min.js';
        script.async = true;
        script.onload = () => {
            // Initialize Lenis after script loads
            if (window.Lenis) {
                const lenis = new window.Lenis({
                    duration: 1.2,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                    smooth: true,
                    smoothTouch: false,
                });

                function raf(time) {
                    lenis.raf(time);
                    requestAnimationFrame(raf);
                }
                requestAnimationFrame(raf);

                // Word Reveal Logic
                function updateWordReveal() {
                    const els = containerRef.current?.querySelectorAll('[data-word-reveal]');
                    if (!els) return;

                    els.forEach(el => {
                        const rect = el.getBoundingClientRect();
                        const windowHeight = window.innerHeight;
                        const elementCenter = rect.top + rect.height / 2;
                        const startPoint = windowHeight;
                        const endPoint = windowHeight * 0.3;

                        const words = el.querySelectorAll('span');
                        words.forEach((word, index) => {
                            const wordProgress = index / words.length;
                            const triggerPoint = startPoint - (startPoint - endPoint) * wordProgress;

                            if (elementCenter < triggerPoint) {
                                word.classList.add('revealed');
                            } else {
                                word.classList.remove('revealed');
                            }
                        });
                    });
                }

                lenis.on('scroll', updateWordReveal);
                window.addEventListener('scroll', updateWordReveal); // Fallback
                updateWordReveal();
            }
        };
        document.body.appendChild(script);

        // Fade In Observer
        const fadeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

        const fadeElements = containerRef.current?.querySelectorAll('.fade-in');
        fadeElements?.forEach(el => fadeObserver.observe(el));

        // Magnetic Buttons
        const handleMagneticMove = (e) => {
            const btn = e.currentTarget;
            const inner = btn.querySelector('.magnetic-btn-inner');
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
            if (inner) inner.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
        };

        const handleMagneticLeave = (e) => {
            const btn = e.currentTarget;
            const inner = btn.querySelector('.magnetic-btn-inner');
            btn.style.transform = 'translate(0, 0)';
            if (inner) inner.style.transform = 'translate(0, 0)';
        };

        const buttons = containerRef.current?.querySelectorAll('.magnetic-btn');
        if (window.innerWidth > 768) {
            buttons?.forEach(btn => {
                btn.addEventListener('mousemove', handleMagneticMove);
                btn.addEventListener('mouseleave', handleMagneticLeave);
            });
        }

        // Prepare Word Reveal Spans
        const words = containerRef.current?.querySelectorAll('[data-word-reveal]');
        words?.forEach(el => {
            if (!el.dataset.processed) {
                const text = el.textContent;
                const wordList = text.trim().split(/\s+/);
                el.innerHTML = wordList.map(word => `<span>${word}</span>`).join(' ');
                el.dataset.processed = "true";
            }
        });

        return () => {
            document.head.removeChild(link1);
            document.body.removeChild(script);
            fadeObserver.disconnect();
            buttons?.forEach(btn => {
                btn.removeEventListener('mousemove', handleMagneticMove);
                btn.removeEventListener('mouseleave', handleMagneticLeave);
            });
        };
    }, []);

    return (
        <div ref={containerRef} className="bg-white text-zinc-900 font-sans antialiased">
            <style>{`
        .font-serif { font-family: 'Fraunces', serif; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
        
        .word-reveal span {
          color: #d4d4d8;
          transition: color 0.3s ease;
        }
        .word-reveal span.revealed {
          color: #18181b;
        }

        .magnetic-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s cubic-bezier(0.33, 1, 0.68, 1);
        }
        .magnetic-btn-inner {
          transition: transform 0.2s cubic-bezier(0.33, 1, 0.68, 1);
        }

        .fancy-underline {
          background-image: linear-gradient(90deg, currentColor 0%, currentColor 100%);
          background-repeat: no-repeat;
          background-size: 0% 1px;
          background-position: left bottom;
          transition: background-size 0.4s ease;
        }
        .fancy-underline:hover {
          background-size: 100% 1px;
        }

        .fade-in {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .img-hover {
          overflow: hidden;
        }
        .img-hover img {
          transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (hover: hover) {
          .img-hover:hover img {
            transform: scale(1.03);
          }
        }
        
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

            {/* Nav */}
            <nav className="relative z-50 bg-white border-b border-zinc-100 lg:bg-transparent lg:border-0">
                <div className="max-w-[1600px] mx-auto px-5 md:px-8 lg:px-10 py-4 lg:py-6 flex justify-between items-center">
                    <span className="text-zinc-900 text-sm font-medium tracking-wide">Ellissa Oliver</span>
                    <a href="https://instagram.com/ellissaoliver" target="_blank" rel="noopener noreferrer" className="text-zinc-900 text-sm tracking-wide fancy-underline pb-0.5">@ellissaoliver</a>
                </div>
            </nav>

            {/* Hero */}
            <section className="min-h-screen relative pt-14 lg:pt-0">
                <div className="flex flex-col lg:grid lg:grid-cols-12 min-h-screen">
                    <div className="h-[60dvh] lg:h-auto lg:col-span-7 relative overflow-hidden img-hover">
                        <div className="absolute inset-0">
                            <img src={heroImg} alt="Ellissa Oliver" className="w-full h-full object-cover object-top" />
                        </div>
                    </div>
                    <div className="flex-1 lg:col-span-5 flex flex-col justify-center lg:justify-end p-6 md:p-10 lg:p-16 bg-white min-h-[40dvh]">
                        <div className="max-w-md">
                            <p className="text-xs md:text-sm tracking-widest uppercase text-zinc-400 mb-4 md:mb-6 fade-in">Personal Training · Perth</p>
                            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl xl:text-7xl leading-[0.95] tracking-tight fade-in" style={{ transitionDelay: '0.1s' }}>
                                Strong looks<br />
                                really good<br />
                                on you.
                            </h1>
                            <p className="mt-5 md:mt-8 text-zinc-500 text-sm md:text-lg leading-relaxed fade-in" style={{ transitionDelay: '0.2s' }}>
                                Personal training for women who think life’s too short for boring workouts.
                            </p>
                            <div className="mt-8 md:mt-10 fade-in" style={{ transitionDelay: '0.3s' }}>
                                <a href="#start" className="magnetic-btn px-6 md:px-8 py-3.5 md:py-4 bg-zinc-900 text-white text-sm font-medium tracking-wide rounded-full inline-block">
                                    <span className="magnetic-btn-inner">Let's talk →</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statement */}
            <section className="py-16 md:py-24 lg:py-40">
                <div className="max-w-[1600px] mx-auto px-5 md:px-8 lg:px-10">
                    <div className="max-w-4xl lg:max-w-5xl">
                        <h2 className="font-serif text-xl md:text-4xl lg:text-5xl xl:text-6xl leading-[1.2] md:leading-[1.1] word-reveal" data-word-reveal>
                            An hour of great conversation that happens to make you stronger. That's the whole idea.
                        </h2>
                    </div>
                </div>
            </section>

            {/* Image Grid */}
            <section className="pb-16 md:pb-24 lg:pb-40">
                <div className="max-w-[1600px] mx-auto px-5 md:px-8 lg:px-10">
                    <div className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-5 lg:gap-6">
                        <div className="md:col-span-7 md:row-span-2 fade-in img-hover">
                            <div className="aspect-[4/5] bg-zinc-100 rounded-sm overflow-hidden">
                                <img src={trainingImg} alt="Training session" className="w-full h-full object-cover" loading="lazy" />
                            </div>
                        </div>
                        <div className="md:col-span-5 fade-in img-hover" style={{ transitionDelay: '0.1s' }}>
                            <div className="aspect-[16/10] md:aspect-[4/3] bg-zinc-100 rounded-sm overflow-hidden">
                                <img src={groupImg} alt="Group training" className="w-full h-full object-cover" loading="lazy" />
                            </div>
                        </div>
                        <div className="md:col-span-5 relative fade-in img-hover" style={{ transitionDelay: '0.2s' }}>
                            <div className="aspect-[16/10] md:aspect-[4/3] bg-zinc-100 rounded-sm overflow-hidden">
                                <img src={wideBannerImg} alt="Living life" className="w-full h-full object-cover object-bottom" loading="lazy" />
                            </div>
                            <div className="mt-4 md:mt-0 md:absolute md:-bottom-6 md:-left-6 lg:-bottom-8 lg:-left-8 bg-white p-4 md:p-5 lg:p-6 md:max-w-xs md:shadow-sm">
                                <p className="text-sm text-zinc-600 leading-relaxed">
                                    "The hour flies by. We laugh the whole time and somehow I've gotten stronger."
                                </p>
                                <p className="text-xs text-zinc-400 mt-2">— Kate, 52</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About */}
            <section className="py-16 md:py-24 lg:py-40 bg-zinc-50">
                <div className="max-w-[1600px] mx-auto px-5 md:px-8 lg:px-10">
                    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 md:gap-12 lg:gap-20 items-start">
                        <div className="w-full lg:col-span-5 lg:col-start-2 fade-in img-hover">
                            <div className="aspect-[3/4] bg-zinc-200 rounded-sm overflow-hidden">
                                <img src={portraitImg} alt="Ellissa" className="w-full h-full object-cover object-top" loading="lazy" />
                            </div>
                        </div>
                        <div className="w-full lg:col-span-5 lg:pt-12 xl:pt-20 fade-in" style={{ transitionDelay: '0.1s' }}>
                            <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl leading-[1.1]">
                                Hi, I'm Ellissa.
                            </h2>
                            <div className="mt-6 md:mt-8 space-y-4 md:space-y-5 text-zinc-600 text-sm md:text-lg leading-relaxed">
                                <p>
                                    I'm a personal trainer in Perth and I genuinely love my job. I get to spend my days helping women feel
                                    strong, capable, and honestly pretty powerful.
                                </p>
                                <p>
                                    My sessions are equal parts training and talking — about life, travel, work, whatever's going on.
                                    The strength part just happens along the way.
                                </p>
                                <p>
                                    If you're looking for someone to yell at you, I'm not your girl. If you want to get strong
                                    while having a really good time, let's chat.
                                </p>
                            </div>
                            <a href="https://instagram.com/ellissaoliver" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-8 md:mt-10 text-sm font-medium tracking-wide group">
                                <span className="fancy-underline pb-0.5">Follow along on Instagram</span>
                                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pull quote */}
            <section className="py-16 md:py-24 lg:py-32 border-y border-zinc-200">
                <div className="max-w-[1000px] lg:max-w-[1200px] mx-auto px-5 md:px-8 lg:px-10 text-center">
                    <p className="font-serif text-xl md:text-3xl lg:text-4xl xl:text-5xl leading-[1.2] md:leading-[1.15] word-reveal" data-word-reveal>
                        Life's too short for workouts you dread. This one you'll actually want to show up to.
                    </p>
                </div>
            </section>

            {/* What to expect */}
            <section className="py-16 md:py-24 lg:py-40">
                <div className="max-w-[1600px] mx-auto px-5 md:px-8 lg:px-10">
                    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 md:gap-12 lg:gap-24">
                        <div className="lg:sticky lg:top-32 lg:self-start fade-in">
                            <p className="text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase text-zinc-400 mb-3 md:mb-4">What we do</p>
                            <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl leading-[1.1]">
                                The fun stuff.
                            </h2>
                        </div>
                        <div className="space-y-10 md:space-y-12 lg:space-y-16">
                            <div className="fade-in">
                                <h3 className="text-base md:text-xl font-medium mb-2 md:mb-3">Strength training that works</h3>
                                <p className="text-zinc-500 text-sm md:text-base leading-relaxed">
                                    Squats, deadlifts, presses, rows — the classics.
                                    Progressive programming that builds real, functional strength. The kind where you notice everyday things gets easier.
                                </p>
                            </div>
                            <div className="fade-in">
                                <h3 className="text-base md:text-xl font-medium mb-2 md:mb-3">Conversation built in</h3>
                                <p className="text-zinc-500 text-sm md:text-base leading-relaxed">
                                    We talk about everything. Work, travel, weekend plans,
                                    that restaurant you just tried. It's an hour that actually flies by — like catching up with a friend who happens to be holding a stopwatch.
                                </p>
                            </div>
                            <div className="fade-in">
                                <h3 className="text-base md:text-xl font-medium mb-2 md:mb-3">Works around your life</h3>
                                <p className="text-zinc-500 text-sm md:text-base leading-relaxed">
                                    Got a trip coming up? Kids' school thing? Just not
                                    feeling it this week? All good. We'll find times that work and roll with whatever life throws at you.
                                </p>
                            </div>
                            <div className="fade-in">
                                <h3 className="text-base md:text-xl font-medium mb-2 md:mb-3">You'll actually want to come back</h3>
                                <p className="text-zinc-500 text-sm md:text-base leading-relaxed">
                                    Most of my clients have been with me for years. They keep
                                    showing up because it's genuinely enjoyable — and because carrying all the shopping bags in one trip feels incredible.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Wide image break */}
            <section className="fade-in">
                <div className="aspect-[16/9] md:aspect-[21/9] lg:aspect-[3/1] bg-zinc-100 overflow-hidden">
                    <img src={poolImg} alt="Living life" className="w-full h-full object-cover" loading="lazy" />
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-16 md:py-24 lg:py-40 bg-zinc-900 text-white">
                <div className="max-w-[1600px] mx-auto px-5 md:px-8 lg:px-10 mb-8 md:mb-12">
                    <p className="text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase text-zinc-500">Kind words</p>
                </div>
                <div className="overflow-x-auto hide-scrollbar">
                    <div className="flex gap-4 md:gap-6 px-5 md:px-8 lg:px-10 w-max pb-4">
                        <div className="w-[280px] md:w-[340px] lg:w-[400px] flex-shrink-0 border border-zinc-700 p-6 md:p-8 lg:p-10 rounded-sm fade-in">
                            <p className="font-serif text-lg md:text-2xl lg:text-3xl leading-snug">
                                "I've never laughed so much during a workout. Also I can now carry all the groceries in one trip."
                            </p>
                            <p className="mt-6 md:mt-8 text-xs md:text-sm text-zinc-500">Sarah, 52</p>
                        </div>
                        <div className="w-[280px] md:w-[340px] lg:w-[400px] flex-shrink-0 border border-zinc-700 p-6 md:p-8 lg:p-10 rounded-sm fade-in" style={{ transitionDelay: '0.1s' }}>
                            <p className="font-serif text-lg md:text-2xl lg:text-3xl leading-snug">
                                "Training with Ellissa is the highlight of my week. Genuinely."
                            </p>
                            <p className="mt-6 md:mt-8 text-xs md:text-sm text-zinc-500">Michelle, 48</p>
                        </div>
                        <div className="w-[280px] md:w-[340px] lg:w-[400px] flex-shrink-0 border border-zinc-700 p-6 md:p-8 lg:p-10 rounded-sm fade-in" style={{ transitionDelay: '0.2s' }}>
                            <p className="font-serif text-lg md:text-2xl lg:text-3xl leading-snug">
                                "Three years in and I still look forward to every session. My husband thinks I've been body-snatched."
                            </p>
                            <p className="mt-6 md:mt-8 text-xs md:text-sm text-zinc-500">Kate, 55</p>
                        </div>
                        <div className="w-[280px] md:w-[340px] lg:w-[400px] flex-shrink-0 border border-zinc-700 p-6 md:p-8 lg:p-10 rounded-sm fade-in" style={{ transitionDelay: '0.3s' }}>
                            <p className="font-serif text-lg md:text-2xl lg:text-3xl leading-snug">
                                "Best decision I made this year. Apart from the Margaret River trip."
                            </p>
                            <p className="mt-6 md:mt-8 text-xs md:text-sm text-zinc-500">Jenny, 61</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section id="start" className="py-16 md:py-24 lg:py-40">
                <div className="max-w-[1600px] mx-auto px-5 md:px-8 lg:px-10">
                    <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-10 md:gap-12 lg:gap-24 items-center">
                        <div className="w-full fade-in">
                            <p className="text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase text-zinc-400 mb-4 md:mb-6">Let's go</p>
                            <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl xl:text-6xl leading-[1.05]">
                                Keen? Let's have a chat.
                            </h2>
                            <p className="mt-4 md:mt-6 text-zinc-500 text-sm md:text-lg leading-relaxed max-w-md">
                                Send me a message on Instagram and tell me a bit about yourself. We'll figure out if we're a good fit — no
                                pressure, just a conversation.
                            </p>
                            <div className="mt-8 md:mt-10">
                                <a href="https://instagram.com/ellissaoliver" target="_blank" rel="noopener noreferrer" className="magnetic-btn px-6 md:px-8 py-3.5 md:py-4 bg-zinc-900 text-white text-sm font-medium tracking-wide rounded-full inline-block">
                                    <span className="magnetic-btn-inner">Message me on Instagram</span>
                                </a>
                            </div>
                        </div>
                        <div className="w-full fade-in img-hover" style={{ transitionDelay: '0.1s' }}>
                            <div className="aspect-square md:aspect-[4/5] lg:aspect-square bg-zinc-100 rounded-sm overflow-hidden">
                                <img src={ctaPortraitImg} alt="Ellissa" className="w-full h-full object-cover object-top" loading="lazy" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 md:py-12 border-t border-zinc-200">
                <div className="max-w-[1600px] mx-auto px-5 md:px-8 lg:px-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                        <div>
                            <p className="font-serif text-lg md:text-xl">Ellissa Oliver</p>
                            <p className="text-xs md:text-sm text-zinc-400 mt-1">Personal Training · Perth, Western Australia</p>
                        </div>
                        <div className="flex gap-6 md:gap-8 text-sm">
                            <a href="https://instagram.com/ellissaoliver" target="_blank" rel="noopener noreferrer" className="fancy-underline pb-0.5">Instagram</a>
                            <a href="mailto:hello@ellissaoliver.com" className="fancy-underline pb-0.5">Email</a>
                        </div>
                    </div>
                    <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-zinc-100 text-xs text-zinc-400">
                        © 2025 Ellissa Oliver. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
