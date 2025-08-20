import { useState, useRef, useEffect } from 'react';
import { showToast, showToastScoped } from '../funcs';
import { createPortal } from 'react-dom';
import mayaImg from '../images/maya.png';
import alexImg from '../images/alex.png';
import priyaImg from '../images/priya.png';

// Preview thread that uses the exact row styles from Demonstration.jsx
function DemoPreviewThread({ disableScroll = false, maxMessages, instant = false, swipeToBlankOnHighlightEnd = false, forceFinalSnapshot = false }) {
  // Simple, technical topic: environment variables for API keys (client vs server)
  const baseRows = [
            { role: 'user', name: 'Jin Liner', initials: 'JL', text: "Hey! I'm having trouble with API authentication in my React app." },
    { role: 'assistant', name: 'phraze', initials: 'P', text: "I can help with that! What specific API are you trying to integrate?" },
            { role: 'user', name: 'Jin Liner', initials: 'JL', text: "Weather API — keeps returning 401 errors. Where should I put the API key?" },
    { role: 'assistant', name: 'phraze', initials: 'P', text: "Create a .env file and add VITE_WEATHER_API_KEY=your_key. Access it with import.meta.env.VITE_WEATHER_API_KEY. Never commit the key—add .env to .gitignore!" },
    { role: 'user', name: 'Alex Kim', initials: 'AK', text: "Do we need to restart the dev server after changing .env?" },
    { role: 'assistant', name: 'phraze', initials: 'P', text: "Yes. Env vars are loaded at startup. Stop and rerun npm run dev so Vite picks up the change." },
            { role: 'user', name: 'Paige Lamar', initials: 'PL', text: "What if we don't want the key in the browser at all?" },
    { role: 'assistant', name: 'phraze', initials: 'P', text: "Put the key in your Node server .env and call the upstream API from the server. The client calls your /weather endpoint, and the server adds the key via process.env.WEATHER_API_KEY." },
    // @mention messages (assistant should not respond to these)
            { role: 'user', name: 'Jin Liner', initials: 'JL', text: "@Alex Kim can you update the README with an .env example for VITE_WEATHER_API_KEY?" },
            { role: 'user', name: 'Alex Kim', initials: 'AK', text: "@Jin Liner Yep, on it. I'll add the var name and a short note on import.meta.env usage." },
    // Normal user message (no @) — AI should reply
            { role: 'user', name: 'Jin Liner', initials: 'JL', text: "Got it. Client uses import.meta.env in dev, server proxy in prod. Works now—thanks!" },
    { role: 'assistant', name: 'phraze', initials: 'P', text: "Great! Glad it's working. Keep secrets out of the client when possible and rotate API keys if they ever leak." },
    // Final Q&A where AI replies
            { role: 'user', name: 'Jin Liner', initials: 'JL', text: "One more: how do we handle different API keys per environment?" },
    { role: 'assistant', name: 'phraze', initials: 'P', text: "Use separate files like .env.development and .env.production, or set env vars per environment in your hosting provider. Prefix with VITE_ for keys needed in the client; keep server-only secrets unprefixed and access via process.env on the server." },
  ];

  const demoRows = Array.isArray(baseRows)
    ? baseRows.slice(0, typeof maxMessages === 'number' ? Math.max(0, Math.min(baseRows.length, maxMessages)) : baseRows.length)
    : [];

  // Map participant names to avatar images under src/images
  const nameToAvatar = {
            'Jin Liner': mayaImg,
    'Alex Kim': alexImg,
            'Paige Lamar': priyaImg,
  };

  const [typedTexts, setTypedTexts] = useState(demoRows.map(() => ''));
  const [visibleCount, setVisibleCount] = useState(0); // how many rows to render
  const [typingIndex, setTypingIndex] = useState(0);
  const [highlightWidth, setHighlightWidth] = useState(0);
  const [showIcon, setShowIcon] = useState(false);
  const [iconOpacity, setIconOpacity] = useState(1);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [spotlightOpacity, setSpotlightOpacity] = useState(0);
  const [startSwipe, setStartSwipe] = useState(false);
  const [secondSwipe, setSecondSwipe] = useState(false);
  const [firstSwipeDone, setFirstSwipeDone] = useState(false);
  const [rightOptionsVisible, setRightOptionsVisible] = useState(false);
  const [showOptionsAfterSwipe, setShowOptionsAfterSwipe] = useState(false);
  const [secondSwipeDone, setSecondSwipeDone] = useState(false);
  const [optionsAutoActive, setOptionsAutoActive] = useState(false);
  const [finalSwipe, setFinalSwipe] = useState(false);
  // Single-sweep back to first screen (keeps width at 300% during reverse)
  const [backSwipeToFirst, setBackSwipeToFirst] = useState(false);
  const [toneExpanded, setToneExpanded] = useState(false);
  const toneBtnRef = useRef(null);
  const toneContentRef = useRef(null);
  const [toneAnimHeight, setToneAnimHeight] = useState('0px');
  const thirdPaneRef = useRef(null);
  const [autoToneActive, setAutoToneActive] = useState(false);
  const [autoTechnicalActive, setAutoTechnicalActive] = useState(false);
  const [labelsAppear, setLabelsAppear] = useState(false);
  const scrollDemoDoneRef = useRef(false);
  const techAutoDoneRef = useRef(false);
  const [selectedToneOption, setSelectedToneOption] = useState(null);
  const rootRef = useRef(null);
  const [overlayRect, setOverlayRect] = useState(null);
  const [modalFadeIn, setModalFadeIn] = useState(false);
  const [showTechnicalModal, setShowTechnicalModal] = useState(false);
  const technicalModalShownRef = useRef(false);
  // Show the applied label pill only after returning from the last screen
  const [showAppliedLabelPill, setShowAppliedLabelPill] = useState(false);
  // Auto cursor for OK button in the Technical modal
  const okButtonRef = useRef(null);
  const okAutoRanRef = useRef(false);
  const [okAutoActive, setOkAutoActive] = useState(false);
  const [okCursorPos, setOkCursorPos] = useState({ x: 0, y: 0 });
  const [okCursorVisible, setOkCursorVisible] = useState(false);
  const [okCursorScale, setOkCursorScale] = useState(1);
  const [okRippleVisible, setOkRippleVisible] = useState(false);
  const [okRippleScale, setOkRippleScale] = useState(0.8);
  const [okRippleOpacity, setOkRippleOpacity] = useState(0);
  const [okRipplePos, setOkRipplePos] = useState({ x: 0, y: 0 });
  // After first label pill is shown on the first screen, animate and show a second pill on Maya's third message
  const [secondHighlightWidth, setSecondHighlightWidth] = useState(0);
  const [secondLabelActive, setSecondLabelActive] = useState(false);
  const secondAnimStartedRef = useRef(false);
  // On landing on predefined labels, fade in labels, perform scroll sequence, then auto pointer
  useEffect(() => {
    if (!finalSwipe) { setLabelsAppear(false); return; }
    if (scrollDemoDoneRef.current) return; // run once per entry
    // ensure Tone starts collapsed for demo
    setToneExpanded(false);
    // reset selection on entry so nothing is pre-selected
    setSelectedToneOption(null);
    setShowTechnicalModal(false);
    technicalModalShownRef.current = false;
    setAutoTechnicalActive(false);
    techAutoDoneRef.current = false;
    setShowAppliedLabelPill(false);
    setLabelsAppear(true);
    const container = thirdPaneRef.current;
    if (!container) return;
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafId = 0; const timers = [];
    const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const animateScroll = (from, to, duration, cb) => {
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = easeInOutCubic(p);
        container.scrollTop = from + (to - from) * eased;
        if (p < 1) rafId = requestAnimationFrame(step); else if (cb) cb();
      };
      rafId = requestAnimationFrame(step);
    };
    const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);

    if (prefersReduced) { setAutoToneActive(true); scrollDemoDoneRef.current = true; return () => {}; }
    timers.push(setTimeout(() => {
      animateScroll(0, maxScroll, 1400, () => {
        animateScroll(container.scrollTop, 0, 1100, () => {
          // Immediately run pointer click animation once we return to top
          setAutoToneActive(true);
          scrollDemoDoneRef.current = true;
        });
      });
    }, 700));

    return () => { if (rafId) cancelAnimationFrame(rafId); timers.forEach(clearTimeout); };
  }, [finalSwipe]);

  // When the Technical tone is selected (via auto-click or manual), show the alert-like modal once
  useEffect(() => {
    if (selectedToneOption === 'Technical' && !technicalModalShownRef.current) {
      technicalModalShownRef.current = true;
      setShowTechnicalModal(true);
      // Measure the bounding box of this expanded content so the overlay only covers it
      const updateRect = () => {
        const el = rootRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setOverlayRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      };
      updateRect();
      const onWin = () => updateRect();
      window.addEventListener('resize', onWin);
      window.addEventListener('scroll', onWin, { passive: true });
      const id = window.setInterval(updateRect, 200); // keep in sync during animations
      // Cleanup when modal closes
      const cleanup = () => {
        window.removeEventListener('resize', onWin);
        window.removeEventListener('scroll', onWin);
        window.clearInterval(id);
      };
      // Return cleanup if the effect runs again before unmount
      return cleanup;
    }
  }, [selectedToneOption]);

  // Animate modal fade-in on open
  useEffect(() => {
    if (showTechnicalModal) {
      const id = window.setTimeout(() => setModalFadeIn(true), 10);
      return () => window.clearTimeout(id);
    }
    setModalFadeIn(false);
  }, [showTechnicalModal]);

  // After modal fades in, schedule auto-cursor once
  useEffect(() => {
    if (!showTechnicalModal || !modalFadeIn) return;
    if (okAutoRanRef.current) return;
    okAutoRanRef.current = true;
    const id = setTimeout(() => {
      setOkAutoActive(true);
    }, 400);
    return () => clearTimeout(id);
  }, [showTechnicalModal, modalFadeIn]);

  const handleToneToggle = () => {
    const el = toneContentRef.current;
    if (!el) return;
    if (!toneExpanded) {
      const target = el.scrollHeight;
      setToneExpanded(true);
      // Start closed then expand to measured height next frame
      setToneAnimHeight('0px');
      requestAnimationFrame(() => setToneAnimHeight(`${target}px`));
    } else {
      // Collapse from current height to 0
      const current = el.scrollHeight;
      setToneAnimHeight(`${current}px`);
      requestAnimationFrame(() => setToneAnimHeight('0px'));
      setToneExpanded(false);
    }
  };

  // After Tone expands, schedule automated click of "Technical" once
  useEffect(() => {
    if (!finalSwipe) return;
    if (!toneExpanded) return;
    if (techAutoDoneRef.current) return;
    if (selectedToneOption != null) return;
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delayMs = prefersReduced ? 0 : 620;
    const id = setTimeout(() => setAutoTechnicalActive(true), delayMs);
    return () => clearTimeout(id);
  }, [toneExpanded, finalSwipe, selectedToneOption]);

  // pointer auto-click is now controlled by the scroll sequence (setAutoToneActive in that effect)

  // Smoothly close the Technical modal with a fade-out
  const closeTechnicalModalWithFade = () => {
    setModalFadeIn(false);
    const t = setTimeout(() => {
      setShowTechnicalModal(false);
      // After modal closes, swipe back to the very first screen
      if (swipeToBlankOnHighlightEnd) {
        // One smooth sweep back across both panes without pausing
        setBackSwipeToFirst(true);
        setSecondSwipe(false);
        setOptionsAutoActive(false);
        // After the sweep finishes, reset the state
        const SWEEP_MS = 450;
        const doneTimer = setTimeout(() => {
          setFinalSwipe(false);
          setStartSwipe(false);
          setFirstSwipeDone(false);
          setBackSwipeToFirst(false);
          setShowAppliedLabelPill(true);
        }, SWEEP_MS + 40);
        timersRef.current.push(doneTimer);
      }
    }, 260); // a bit longer than the 220ms CSS transition for safety
    timersRef.current.push(t);
  };

  // Auto-click OK in Technical modal: animate a small cursor inside the modal, then click
  useEffect(() => {
    if (!okAutoActive) return;
    const modal = document.querySelector('[role="dialog"]');
    const btn = okButtonRef.current;
    if (!modal || !btn) return;

    const modalRect = modal.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const targetX = btnRect.left - modalRect.left + Math.min(24, btnRect.width * 0.12);
    const targetY = btnRect.top - modalRect.top + btnRect.height * 0.55;
    setOkRipplePos({ x: targetX + 10, y: targetY + 8 });

    // Start farther then glide in one continuous motion (no mid-step pause)
    setOkCursorVisible(false);
    setOkCursorScale(0.98);
    setOkCursorPos({ x: Math.max(0, targetX - 110), y: Math.max(0, targetY - 72) });

    const moveTimer = setTimeout(() => {
      setOkCursorVisible(true);
      setOkCursorPos({ x: targetX, y: targetY });
      const dwellTimer = setTimeout(() => {
        setOkCursorScale(0.92);
        // Fade out cursor a bit later so it lingers briefly after the click
        const fadeOutTimer = setTimeout(() => {
          setOkCursorScale(1);
          setOkCursorVisible(false);
        }, 300);
        const closeTimer = setTimeout(() => {
          setOkAutoActive(false);
          closeTechnicalModalWithFade();
        }, 520);
        timersRef.current.push(fadeOutTimer, closeTimer);
      }, 120);
      timersRef.current.push(dwellTimer);
    }, 1200);
    timersRef.current.push(moveTimer);

    return () => {};
  }, [okAutoActive]);

  // Cursor animation component for Tone button
  const ToneAutoCursor = ({ active, expanded }) => {
    const [showCursor, setShowCursor] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [cursorScale, setCursorScale] = useState(1);
    const [cursorOpacity, setCursorOpacity] = useState(0);
    const [rippleVisible, setRippleVisible] = useState(false);
    const [rippleScale, setRippleScale] = useState(0.8);
    const [rippleOpacity, setRippleOpacity] = useState(0);
    const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
      if (!active || expanded) return;
      const container = thirdPaneRef.current;
      const btn = toneBtnRef.current;
      if (!container || !btn) return;
      // position calculation
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const targetX = btnRect.left - containerRect.left + Math.min(24, btnRect.width * 0.12);
      const targetY = btnRect.top - containerRect.top + btnRect.height * 0.55;
      setRipplePos({ x: targetX + 10, y: targetY + 8 });

      setShowCursor(true);
      setCursorOpacity(1);
      setCursorPos({ x: Math.max(0, targetX - 40), y: Math.max(0, targetY - 30) });
      const raf = requestAnimationFrame(() => setCursorPos({ x: targetX, y: targetY }));
      const moveMs = 600;
      const clickTimer = setTimeout(() => {
        setCursorScale(0.92);
        setRippleVisible(true);
        setRippleScale(0.8);
        setRippleOpacity(0.35);
        setTimeout(() => { setRippleScale(1.8); setRippleOpacity(0); }, 10);
        try { btn.click(); } catch (_) {}
        setTimeout(() => {
          setCursorScale(1);
          setCursorOpacity(0);
          setTimeout(() => setShowCursor(false), 250);
          setRippleVisible(false);
          setAutoToneActive(false);
        }, 650);
      }, moveMs + 50);
      return () => { cancelAnimationFrame(raf); clearTimeout(clickTimer); };
    }, [active, expanded]);

    if (!showCursor) return null;
    return (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }}>
        <div
          style={{
            position: 'absolute',
            transform: `translate(${cursorPos.x}px, ${cursorPos.y}px) scale(${cursorScale}) rotate(-8deg)`,
            transition: 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)',
            opacity: cursorOpacity,
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }}>
            <path fill="#FFF" stroke="#000" strokeWidth="1.25" d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z"></path>
          </svg>
        </div>
        {rippleVisible && (
          <div style={{ position: 'absolute', transform: `translate(${ripplePos.x}px, ${ripplePos.y}px)` }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(17,17,17,0.4)', transform: `scale(${rippleScale})`, transition: 'transform 320ms ease, opacity 320ms ease', opacity: rippleOpacity }} />
          </div>
        )}
      </div>
    );
  };

  // Cursor animation component for clicking the Technical tag chip
  const TechnicalAutoCursor = ({ active }) => {
    const [showCursor, setShowCursor] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [cursorScale, setCursorScale] = useState(1);
    const [cursorOpacity, setCursorOpacity] = useState(0);
    const [rippleVisible, setRippleVisible] = useState(false);
    const [rippleScale, setRippleScale] = useState(0.8);
    const [rippleOpacity, setRippleOpacity] = useState(0);
    const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
      if (!active) return;
      // Guard: run only once
      if (techAutoDoneRef.current) { setAutoTechnicalActive(false); return; }
      const container = thirdPaneRef.current;
      const toneContent = toneContentRef.current;
      if (!container || !toneContent) return;
      const chip = toneContent.querySelector('[data-tag="Technical"]');
      if (!chip) return;

      const containerRect = container.getBoundingClientRect();
      const chipRect = chip.getBoundingClientRect();
      const targetX = chipRect.left - containerRect.left + Math.min(24, chipRect.width * 0.12);
      const targetY = chipRect.top - containerRect.top + chipRect.height * 0.55;
      setRipplePos({ x: targetX + 10, y: targetY + 8 });

      setShowCursor(true);
      // Begin farther away and glide in one continuous motion to eliminate any perceived pause
      setCursorOpacity(0);
      setCursorPos({ x: Math.max(0, targetX - 110), y: Math.max(0, targetY - 72) });
      const raf = requestAnimationFrame(() => {
      setCursorOpacity(1);
        setCursorPos({ x: targetX, y: targetY });
      });

      const moveMs = 900;
      const preClickDwellMs = 160;
      const postClickLingerMs = 900;
      const clickTimer = setTimeout(() => {
        // Trigger selection first so the visual changes exactly at click time
        try { chip.click(); } catch (_) {}
        setCursorScale(0.94);
        setRippleVisible(true);
        setRippleScale(0.8);
        setRippleOpacity(0.35);
        setTimeout(() => { setRippleScale(1.8); setRippleOpacity(0); }, 10);
        techAutoDoneRef.current = true;
        setTimeout(() => {
          setCursorScale(1);
          setCursorOpacity(0);
          setTimeout(() => setShowCursor(false), 250);
          setRippleVisible(false);
          setAutoTechnicalActive(false);
        }, postClickLingerMs);
      }, moveMs + preClickDwellMs);

      return () => { cancelAnimationFrame(raf); clearTimeout(clickTimer); };
    }, [active]);

    if (!showCursor) return null;
    return (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }}>
        <div
          style={{
            position: 'absolute',
            transform: `translate(${cursorPos.x}px, ${cursorPos.y}px) scale(${cursorScale}) rotate(-8deg)`,
            transition: 'transform 900ms cubic-bezier(0.22, 1, 0.36, 1), opacity 360ms ease',
            opacity: cursorOpacity,
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }}>
            <path fill="#FFF" stroke="#000" strokeWidth="1.25" d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z"></path>
          </svg>
        </div>
        {rippleVisible && (
          <div style={{ position: 'absolute', transform: `translate(${ripplePos.x}px, ${ripplePos.y}px)` }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(17,17,17,0.4)', transform: `scale(${rippleScale})`, transition: 'transform 320ms ease, opacity 320ms ease', opacity: rippleOpacity }} />
          </div>
        )}
      </div>
    );
  };
  const isMountedRef = useRef(true);
  const timersRef = useRef([]);
  const scrollContainerRef = useRef(null);
  const overlayScrollStyleIdRef = useRef('overlay-chat-scroll-style');
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);

  // Start highlighting animation when component mounts if instant is true (skip when forcing final snapshot)
  useEffect(() => {
    if (instant && !forceFinalSnapshot) {
      // Play animation once on mount with frame-by-frame animation
      const timer = setTimeout(() => {
        let progress = 0;
        const duration = 1600; // 1.6 seconds
        const startTime = Date.now();
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          progress = Math.min(elapsed / duration, 1);
          
          // Steady, consistent pace throughout the animation
          setHighlightWidth(progress * 100);
          
          // Show icon when highlighting starts
          if (progress > 0.01 && progress < 0.93) {
            setShowIcon(true);
            setIconOpacity(1);
            // Show spotlight effect with smooth fade-in
            setShowSpotlight(true);
            // Gradually increase opacity from 0 to 0.25 with a very gentle ease-in
            const spotlightProgress = Math.min((progress - 0.005) / 0.2, 1); // Fade in over first 20% of progress, start earlier
            const easedProgress = 0.5 - 0.5 * Math.cos(Math.PI * spotlightProgress); // smooth ease-in
            setSpotlightOpacity(easedProgress * 0.25);
          } else if (progress >= 0.93 && progress < 1) {
            // Start fading out spotlight while highlight is still in progress
            setShowIcon(true);
            setIconOpacity(1);
            setShowSpotlight(true);
            // Fade out from 0.25 to 0 over the last 7% of progress
            const fadeOutProgress = (progress - 0.93) / 0.07; // 0 to 1 over last 7%
            setSpotlightOpacity(0.25 * (1 - fadeOutProgress));
          } else if (progress >= 1) {
            // Animation finished, hide spotlight completely
            setShowIcon(true);
            setIconOpacity(1);
            setShowSpotlight(false);
          }
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            // Animation finished, now hide the icon
            setTimeout(() => {
              setShowIcon(false);
            }, 100); // Small delay to ensure highlight is visually complete
          }
        };
        
        requestAnimationFrame(animate);
      }, 1000); // Start after 1 second delay
      
      return () => clearTimeout(timer);
    }
  }, [instant, forceFinalSnapshot]);
  


  // Trigger swipe to a blank screen once highlighting is done (for the second expanded card)
  useEffect(() => {
    if (!instant) return;
    if (!swipeToBlankOnHighlightEnd) return;
    if (highlightWidth < 100) return;
    const id = setTimeout(() => setStartSwipe(true), 400);
    return () => clearTimeout(id);
  }, [instant, swipeToBlankOnHighlightEnd, highlightWidth]);

  // Mark first swipe completion and allow delayed animations
  useEffect(() => {
    if (!swipeToBlankOnHighlightEnd) return;
    if (!startSwipe) return;
    setFirstSwipeDone(false);
    const TRANSITION_MS = 400; // matches transform transition
    const bufferMs = 80; // small buffer for safety
    const id = setTimeout(() => setFirstSwipeDone(true), TRANSITION_MS + bufferMs);
    return () => clearTimeout(id);
  }, [startSwipe, swipeToBlankOnHighlightEnd]);

  // Activate auto-click on options ONLY after the right pane has slid in
  useEffect(() => {
    if (!secondSwipe) { setOptionsAutoActive(false); return; }
    const TRANSITION_MS = 500; // match right pane slide-in
    const id = setTimeout(() => setOptionsAutoActive(true), TRANSITION_MS + 80);
    return () => clearTimeout(id);
  }, [secondSwipe]);

  useEffect(() => {
    isMountedRef.current = true;

    // Clear any pending timers before starting a new message
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];

    // If we should render instantly (no typing animation) or force a final snapshot
    if (instant || forceFinalSnapshot) {
      setTypedTexts(demoRows.map((r) => r.text));
      setVisibleCount(demoRows.length);
      setTypingIndex(demoRows.length);
      if (forceFinalSnapshot) {
        setShowIcon(false);
        setShowSpotlight(false);
        setShowAppliedLabelPill(true);
        setHighlightWidth(100);
        setSecondHighlightWidth(100);
        setSecondLabelActive(true);
      }
      return () => { isMountedRef.current = false; };
    }

    // If we've reached the end, wait a moment, then restart the animation
    if (typingIndex >= demoRows.length) {
      const restartId = window.setTimeout(() => {
        if (!isMountedRef.current) return;
        setTypedTexts(demoRows.map(() => ''));
        setVisibleCount(0);
        setTypingIndex(0);
      }, 1400);
      timersRef.current.push(restartId);
      return () => {
        isMountedRef.current = false;
        timersRef.current.forEach((id) => window.clearTimeout(id));
        timersRef.current = [];
      };
    }

    const typeCurrent = () => {
      if (!isMountedRef.current) return;
      if (typingIndex >= demoRows.length) return; // finished (handled above)

      // Render only the current message and everything before it
      setVisibleCount(typingIndex + 1);

      const currentRow = demoRows[typingIndex];
      const full = currentRow.text;
      let i = 0;

      const charDelay = () => Math.floor(18 + Math.random() * 24);
      const startDelay = currentRow.role === 'assistant' ? 420 : 280;
      const pauseAfter = currentRow.role === 'assistant' ? 900 : 650;

      const step = () => {
        if (!isMountedRef.current) return;
        i += 1;
        setTypedTexts((prev) => {
          const copy = [...prev];
          copy[typingIndex] = full.slice(0, i);
          return copy;
        });
        if (i < full.length) {
          const id = window.setTimeout(step, charDelay());
          timersRef.current.push(id);
        } else {
          const id = window.setTimeout(() => setTypingIndex((v) => v + 1), pauseAfter);
          timersRef.current.push(id);
        }
      };

      const id = window.setTimeout(step, startDelay);
      timersRef.current.push(id);
    };

    typeCurrent();

    return () => {
      isMountedRef.current = false;
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [typingIndex, instant, demoRows.length, forceFinalSnapshot]);

  // When the first label pill becomes visible on the first message, animate the second highlight sweep once
  useEffect(() => {
    if (!showAppliedLabelPill) return;
    // For the third modal snapshot, show the second highlight/pill immediately without sweep
    if (forceFinalSnapshot) {
      setSecondHighlightWidth(100);
      setSecondLabelActive(true);
      return;
    }
    if (secondAnimStartedRef.current) return;
    secondAnimStartedRef.current = true;
    let rafId = 0;
    const start = performance.now();
    const duration = 1200;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setSecondHighlightWidth(Math.round(eased * 100));
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        // small grace so pill appears after sweep fully settles
        const id = setTimeout(() => setSecondLabelActive(true), 250);
        timersRef.current.push(id);
      }
    };
    rafId = requestAnimationFrame(step);
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, [showAppliedLabelPill, forceFinalSnapshot]);

  // Keep the scroll anchored to the bottom as messages render/type unless disabled
  useEffect(() => {
    if (disableScroll) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const id = window.setTimeout(() => {
      try {
        el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
      } catch (_) {
        el.scrollTop = el.scrollHeight;
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [visibleCount, typingIndex, typedTexts, disableScroll]);

  // Inject minimal CSS to hide scrollbar for the overlay chat only
  useEffect(() => {
    const styleId = overlayScrollStyleIdRef.current;
    if (!document.getElementById(styleId)) {
      const styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.textContent = `
        .overlay-chat-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .overlay-chat-scroll::-webkit-scrollbar { display: none; }
      `;
      document.head.appendChild(styleTag);
    }
  }, []);

  // Synchronize scrolling between left and right panes
  const handleLeftScroll = (e) => {
    if (rightScrollRef.current && rightOptionsVisible) {
      rightScrollRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const handleRightScroll = (e) => {
    if (leftScrollRef.current) {
      leftScrollRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const Row = ({ role, name, initials, avatarUrl, children, highlightWidth }) => {
    const [imgOk, setImgOk] = useState(true);
    
    // Check if this is the first message that should be highlighted
    const isHighlightTarget = role === 'user' && 
      name === 'Jin Liner' && 
      children === "Hey! I'm having trouble with API authentication in my React app.";
    // The third Jin Liner message that should receive a second animated highlight/pill after the first pill appears
    const isSecondTarget = role === 'user' &&
      name === 'Jin Liner' &&
      children === 'Weather API — keeps returning 401 errors. Where should I put the API key?';
    
    const renderHighlightedText = (text) => {
      if (!isHighlightTarget && !isSecondTarget) {
        return text;
      }
      
      if (isHighlightTarget) {
      const targetPhrase = "Hey! I'm having trouble with API authentication in my React app.";
      const regex = new RegExp(`(${targetPhrase})`, 'i');
      const parts = text.split(regex);
      return parts.map((part, index) => {
        if (part.toLowerCase() === targetPhrase.toLowerCase()) {
          return (
            <span key={index} style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ position: 'relative', zIndex: 15 }}>{part}</span>
              <div 
                style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: '#fef08a', width: `${highlightWidth}%`, zIndex: 6,
                  }}
                />
              {showAppliedLabelPill && (
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, transform: 'translateY(-6px)', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.85)', backdropFilter: 'saturate(180%) blur(4px)', WebkitBackdropFilter: 'saturate(180%) blur(4px)', border: '1px solid #e5e7eb', borderRadius: 9999, padding: '6px 10px', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', zIndex: 26 }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Label:</span>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 9999, background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe', fontWeight: 600 }}>Tone</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>User:</span>
                  <span style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>Jin Liner</span>
                </div>
              )}
              {showIcon && (
                  <div style={{ position: 'absolute', top: 0, left: '-52px', color: '#374151', filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))', transition: 'opacity 300ms', opacity: iconOpacity, zIndex: 25 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 1.15L17.97 1.68L16.82 2.83L8.41 11.24L7.26 12.39L6.73 12.92C6.53 13.12 6.53 13.44 6.73 13.64L10.36 17.27C10.56 17.47 10.88 17.47 11.08 17.27L11.61 16.74L12.76 15.59L21.17 7.18L22.32 6.03L22.85 5.5C23.05 5.3 23.05 4.98 22.85 4.78L19.22 1.15C19.02 0.95 18.7 0.95 18.5 1.15M9.85 11.24L17.97 3.12L20.88 6.03L12.76 14.15L9.85 11.24M8.61 12.39L11.52 15.3L11.08 15.74L7.17 11.83L8.61 12.39M2 20V22H22V20H2Z"/></svg>
                </div>
              )}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      });
      }
      // Second target: wrap the entire text and animate the sweep + show a new pill once done
      if (isSecondTarget) {
        return (
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ position: 'relative', zIndex: 15 }}>{text}</span>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fef08a', width: `${secondHighlightWidth}%`, zIndex: 6 }} />
            <div style={{
              position: 'absolute', bottom: '100%', left: 0,
              transform: secondLabelActive ? 'translateY(-6px) scale(1)' : 'translateY(-2px) scale(0.98)',
              opacity: secondLabelActive ? 1 : 0,
              transition: 'opacity 240ms ease, transform 240ms ease',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'saturate(180%) blur(4px)', WebkitBackdropFilter: 'saturate(180%) blur(4px)',
              border: '1px solid #e5e7eb', borderRadius: 9999, padding: '6px 10px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.06)', zIndex: 26
            }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Label:</span>
              <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 9999, background: '#ecfeff', color: '#0e7490', border: '1px solid #a5f3fc', fontWeight: 600 }}>Credential</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>User:</span>
              <span style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>Jin Liner</span>
            </div>
          </span>
        );
      }
    };
    
    return (
    <div
      style={{
        padding: '0 1rem',
        // Make each row span the full chat width so assistant messages are not "tabbed"
        margin: 0,
        width: '100%',
        display: 'flex',
        justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
        position: 'relative',
        zIndex: isHighlightTarget ? 10 : 1,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '85%' }}>
        <div
          style={{
            fontSize: '0.8rem',
            marginBottom: '8px',
            fontWeight: 500,
            color: '#555',
            textAlign: role === 'user' ? 'right' : 'left',
            paddingRight: role === 'user' ? '0' : '0rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
          }}
        >
          {role === 'user' && (
            avatarUrl && imgOk ? (
              <img
                src={avatarUrl}
                alt={name}
                onError={() => setImgOk(false)}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid #cbd5e1',
                }}
              />
            ) : (
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                }}
              >
                {initials}
              </div>
            )
          )}
          <span>{role === 'user' ? name : 'phraze'}</span>
          {role === 'assistant' && (
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6rem',
                fontWeight: 600,
                color: 'white',
                border: '1px solid #475569',
              }}
            >
              P
            </div>
          )}
        </div>
        <div
          className="message-bubble"
          style={{
            // Assistant text should line up directly under the "phraze" label
            padding: role === 'user' ? '1rem 1.5rem 1.5rem' : '0 0 0.75rem 0',
            background: role === 'user' ? '#ffffff' : 'transparent',
            borderRadius: role === 'user' ? '2rem' : '0.5rem',
            borderBottomRightRadius: role === 'user' ? '5px' : '0.5rem',
            color: '#0A0A0A',
            display: 'inline-block',
            width: '100%',
            position: 'relative',
            marginTop: '4px',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontSize: '1rem',
              lineHeight: 1.5,
              whiteSpace: role === 'assistant' ? 'normal' : 'pre-wrap',
            }}
          >
            {renderHighlightedText(children)}
          </div>
        </div>
      </div>
    </div>
  );
  };

  const ChatPane = () => (
    <div
      style={{
        background: 'rgb(249, 248, 246)',
        borderRadius: 12,
        padding: '0.5rem 0.5rem',
        maxWidth: 850,
        margin: '0 auto',
        border: '1px solid #e5e7eb',
        position: 'relative',
      }}
    >
      {/* Share chat icon (top-left) */}
      <button
        type="button"
        aria-label="Share chat"
        title="Share chat"
        onFocus={(e) => { try { e.currentTarget.blur(); } catch (_) {} }}
        onClick={(e) => { try { e.currentTarget.blur(); } catch (_) {} }}
        style={{
          position: 'absolute',
          top: 8,
          left: 10,
          background: 'transparent',
          border: 'none',
          padding: 6,
          cursor: 'pointer',
          color: '#374151',
          zIndex: 2,
          outline: 'none',
          boxShadow: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      </button>
      <div
        ref={scrollContainerRef}
        className="overlay-chat-scroll"
        style={{
          maxHeight: 315,
          overflowY: disableScroll ? 'hidden' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          paddingBottom: '0.5rem',
          paddingTop: '0.5rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {demoRows.slice(0, visibleCount).map((m, i) => (
          <Row
            key={i}
            role={m.role}
            name={m.name}
            initials={m.initials}
            avatarUrl={m.role === 'user' ? nameToAvatar[m.name] : undefined}
            highlightWidth={highlightWidth}
          >
            {typedTexts[i]}
          </Row>
        ))}
        <div style={{ height: '0.25rem', minHeight: '0.25rem' }} />
      </div>
      {showSpotlight && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(107, 114, 128, 0.45)', // semi-transparent grey
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            opacity: spotlightOpacity,
            transition: 'opacity 1000ms ease-in-out',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );

  const EmptyPane = () => (
    null
  );

  // Auto cursor that clicks "Add Label" within the options list
  const RightOptionsAutoClick = ({ onAddLabelDone }) => {
    const containerRef = useRef(null);
    const [showCursor, setShowCursor] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [cursorScale, setCursorScale] = useState(1);
    const [cursorOpacity, setCursorOpacity] = useState(0);
    const [rippleVisible, setRippleVisible] = useState(false);
    const [rippleScale, setRippleScale] = useState(0.8);
    const [rippleOpacity, setRippleOpacity] = useState(0);
    const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
      const id = setTimeout(() => {
        const root = containerRef.current;
        if (!root) return;
        const buttons = Array.from(root.querySelectorAll('button'));
        const addLabelBtn = buttons.find((b) => b.textContent && b.textContent.includes('Add Label'));
        if (!addLabelBtn) return;

        const rootRect = root.getBoundingClientRect();
        const btnRect = addLabelBtn.getBoundingClientRect();
        const targetX = btnRect.left - rootRect.left + Math.min(24, btnRect.width * 0.12);
        const targetY = btnRect.top - rootRect.top + btnRect.height * 0.55;
        setRipplePos({ x: targetX + 10, y: targetY + 8 });

        setShowCursor(true);
        setCursorOpacity(1);
        setCursorPos({ x: Math.max(0, targetX - 40), y: Math.max(0, targetY - 30) });
        requestAnimationFrame(() => setCursorPos({ x: targetX, y: targetY }));

        const moveMs = 600;
        setTimeout(() => {
          setCursorScale(0.92);
          setRippleVisible(true);
          setRippleScale(0.8);
          setRippleOpacity(0.35);
          setTimeout(() => { setRippleScale(1.8); setRippleOpacity(0); }, 10);

          // Visual press feedback on the actual button (scale + soft ring)
          try {
            addLabelBtn.style.transition = 'transform 160ms ease, box-shadow 160ms ease';
            addLabelBtn.style.transform = 'scale(0.98)';
            addLabelBtn.style.boxShadow = '0 0 0 3px rgba(124, 193, 124, 0.35)';
            setTimeout(() => {
              addLabelBtn.style.transform = 'scale(1)';
            }, 180);
            setTimeout(() => {
              addLabelBtn.style.boxShadow = 'none';
            }, 360);
          } catch (_) {}

          // Perform the actual click
          addLabelBtn.click();
          setTimeout(() => {
            setCursorScale(1);
            setCursorOpacity(0);
            setTimeout(() => setShowCursor(false), 250);
            setRippleVisible(false);
            // After the full press/release visual completes, trigger the swipe
            if (typeof onAddLabelDone === 'function') {
              setTimeout(() => onAddLabelDone(), 100);
            }
          }, 650);
        }, moveMs + 50);
      }, 600);
      return () => clearTimeout(id);
    }, []);

    return (
      <div ref={containerRef} style={{ position: 'relative' }}>
        <AnnotationOptionsPane />
        {showCursor && (
          <div
            style={{
              position: 'absolute', top: 0, left: 0,
              transform: `translate(${cursorPos.x}px, ${cursorPos.y}px) scale(${cursorScale}) rotate(-8deg)`,
              transition: 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)',
              opacity: cursorOpacity, pointerEvents: 'none', zIndex: 20,
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }}>
              <path fill="#FFF" stroke="#000" strokeWidth="1.25" d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z"></path>
            </svg>
          </div>
        )}
        {rippleVisible && (
          <div style={{ position: 'absolute', top: 0, left: 0, transform: `translate(${ripplePos.x}px, ${ripplePos.y}px)`, pointerEvents: 'none', zIndex: 19 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(17,17,17,0.4)', transform: `scale(${rippleScale})`, transition: 'transform 320ms ease, opacity 320ms ease', opacity: rippleOpacity }} />
          </div>
        )}
      </div>
    );
  };
  const AnnotationOptionsPane = () => {
    const items = [
      {
        id: 'Label',
        iconClass: 'fa-solid fa-ruble-sign',
        title: 'Add Label',
        description:
          'Create and assign custom labels to categorize your selected text. Choose from predefined labels or create your own.',
        accent: '#7cc17c',
      },
      {
        id: 'Code',
        iconClass: 'fa-solid fa-terminal',
        title: 'Add Code',
        description:
          'Add structured codes to analyze and organize your text selections. Use predefined code categories or customize your own.',
        accent: '#c17c7c',
      },
      {
        id: 'Note',
        iconClass: 'fa-regular fa-note-sticky',
        title: 'Manual Logging',
        description:
          'Create detailed notes with rich text formatting. Add context, observations, or additional information to your annotations.',
        accent: '#c1b07c',
      },
      {
        id: 'VoiceAnnotation',
        iconClass: 'fa-regular fa-file-audio',
        title: 'Voice Annotation',
        description:
          'Record and attach voice notes to your annotations. Perfect for capturing detailed verbal explanations or quick thoughts.',
        accent: '#7c8fc1',
      },
    ];

    const containerStyle = { width: '100%', height: '100%', overflowY: 'auto', paddingRight: 8, textAlign: 'left' };
    const descStyle = { color: '#374151', fontSize: '0.85rem', lineHeight: 1.3, opacity: 0.6, margin: '6px 0 2px 0', fontWeight: 400, textAlign: 'left' };
    const buttonStyle = (accent, isLast) => ({
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      border: '2px solid #eaeeef',
      borderLeft: `4px solid ${accent}`,
      borderRadius: 12,
      padding: '12px 20px',
      marginBottom: isLast ? 0 : 16,
      color: '#374151',
      height: 56,
      width: '100%',
      textAlign: 'left',
      boxSizing: 'border-box',
    });

    return (
      <div style={containerStyle}>
        {items.map((it, idx) => (
          <div key={it.id}>
            <div className="button-description" style={{ padding: 0, textAlign: 'left' }}>
              <p style={descStyle}>{it.description}</p>
            </div>
            <button type="button" className="frame-button" style={buttonStyle(it.accent, idx === items.length - 1)}>
              <i className={it.iconClass} style={{ color: '#626262', fontSize: '1.1rem', marginRight: 15 }} />
              <span className="p-2" style={{ fontSize: '1.05rem', fontWeight: 500 }}>{it.title}</span>
            </button>
          </div>
        ))}
      </div>
    );
  };

  const MenuPane = ({ onNavigateAnnotationHistory, autoPulseId, simulateCursorForId, onShowAnnotationOptions }) => {
    const [hoveredId, setHoveredId] = useState(null);
    const [clickedId, setClickedId] = useState(null);
    const [pulseActive, setPulseActive] = useState(false);
    const [pulseTargetId, setPulseTargetId] = useState(null);
    const containerRef = useRef(null);
    const annotationSystemBtnRef = useRef(null);
    const annotationHistoryBtnRef = useRef(null);
    const [showCursor, setShowCursor] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [cursorScale, setCursorScale] = useState(1);
    const [cursorOpacity, setCursorOpacity] = useState(0);
    const [rippleVisible, setRippleVisible] = useState(false);
    const [rippleScale, setRippleScale] = useState(0.8);
    const [rippleOpacity, setRippleOpacity] = useState(0);
    const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });

    const items = [
      {
        id: 'Annotation System',
        iconClass: 'fa-regular fa-note-sticky',
        title: 'Annotation System',
        description:
          'Create and manage annotations for your selected text. Add labels, codes, notes, voice recordings, or video annotations.',
        accentColor: '#92c2d7',
      },
      {
        id: 'Annotation History',
        iconClass: 'fa-regular fa-clock',
        title: 'Annotation History',
        description:
          'View, search, and manage all your previously created annotations. Export or import your annotation data for backup or sharing.',
      },
      {
        id: 'Messaging',
        iconClass: 'fa-regular fa-comments',
        title: 'Messaging',
        description:
          'View and manage messages with fellow company members about AI Chats, Manual Logs, and more. Add replies, track discussions, and collaborate with others.',
      },
      {
        id: 'Clear Data',
        iconClass: 'fa-regular fa-trash-can',
        title: 'Clear Data',
        description:
          'Remove all stored annotations and reset the extension to its default state. Use with caution as this action cannot be undone.',
      },
    ];

    const pulseShadow = pulseActive ? '0 0 0 6px rgba(146, 194, 215, 0.35)' : undefined;

    const buttonBaseStyle = (item) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      backgroundColor: '#ffffff',
      border: '2px solid #eaeeef',
      borderRadius: 12,
      padding: '12px 20px',
      marginBottom: 16,
      transition: 'all 0.3s ease',
      color: '#374151',
      height: 56,
      width: '100%',
      boxSizing: 'border-box',
      textAlign: 'left',
      boxShadow: clickedId === item.id
        ? '0 0 0 3px rgba(146, 194, 215, 0.35)'
        : hoveredId === item.id
        ? '0 4px 8px rgba(0,0,0,0.10)'
        : item.id === pulseTargetId && pulseActive
        ? pulseShadow
        : 'none',
      transform:
        clickedId === item.id
          ? 'scale(0.98)'
          : hoveredId === item.id
          ? 'translateY(-2px)'
          : 'none',
      borderLeft: item.accentColor ? `4px solid ${item.accentColor}` : undefined,
      cursor: 'pointer',
    });

    const iconStyle = { fontSize: '1.1rem', marginRight: 15, color: '#626262' };
    const titleStyle = { fontSize: '1.05rem', fontWeight: 500, display: 'inline-block' };
    const descStyle = { color: '#374151', fontSize: '0.85rem', lineHeight: 1.3, opacity: 0.6, margin: 0, fontWeight: 400, textAlign: 'left' };

    // Auto-pulse on mount for a given item (e.g., Annotation System)
    useEffect(() => {
      // Skip auto-pulse if we are simulating a cursor click instead
      if (!autoPulseId || simulateCursorForId) return;
      setPulseTargetId(autoPulseId);
      setClickedId(autoPulseId);
      const t1 = setTimeout(() => setPulseActive(true), 120);
      const t2 = setTimeout(() => setPulseActive(false), 280);
      const t3 = setTimeout(() => setPulseActive(true), 440);
      const t4 = setTimeout(() => {
        setPulseActive(false);
        setClickedId(null);
        setPulseTargetId(null);
      }, 600);
      return () => {
        clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      };
    }, [autoPulseId, simulateCursorForId]);

    // Simulated cursor movement and click
    useEffect(() => {
      if (simulateCursorForId !== 'Annotation System') return;
      const container = containerRef.current;
      const btn = annotationSystemBtnRef.current;
      if (!container || !btn) return;

      const start = () => {
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        const targetX = btnRect.left - containerRect.left + Math.min(24, btnRect.width * 0.12);
        const targetY = btnRect.top - containerRect.top + btnRect.height * 0.55;
        // Ripple will appear at the tip area of the cursor
        setRipplePos({ x: targetX + 10, y: targetY + 8 });
        // Start slightly above-left
        setShowCursor(true);
        setCursorOpacity(1);
        setCursorPos({ x: Math.max(0, targetX - 40), y: Math.max(0, targetY - 30) });
        requestAnimationFrame(() => {
          // Move into place
          setCursorPos({ x: targetX, y: targetY });
        });
        // After move completes, simulate click + pulse and then fade
        const moveMs = 600;
        setTimeout(() => {
          setCursorScale(0.92);
          setPulseTargetId('Annotation System');
          setClickedId('Annotation System');
          setPulseActive(true);
          // Click ripple
          setRippleVisible(true);
          setRippleScale(0.8);
          setRippleOpacity(0.35);
          setTimeout(() => {
            setRippleScale(1.8);
            setRippleOpacity(0);
          }, 10);
          setTimeout(() => setPulseActive(false), 150);
          setTimeout(() => setPulseActive(true), 300);
          setTimeout(() => {
            setPulseActive(false);
            setClickedId(null);
            setCursorScale(1);
            // Fade out
            setCursorOpacity(0);
            setTimeout(() => setShowCursor(false), 250);
            setRippleVisible(false);
            if (typeof onShowAnnotationOptions === 'function') {
              onShowAnnotationOptions();
            }
          }, 500);
        }, moveMs + 50);
      };

      // Wait ~1s after pane display, then run
      const id = setTimeout(start, 1000);
      return () => clearTimeout(id);
    }, [simulateCursorForId]);

    return (
      <div ref={containerRef} style={{ width: '100%', margin: 0, padding: '0 8px', boxSizing: 'border-box', position: 'relative' }}>
        {/* Remove Menu header on left panel */}
        <div style={{ height: 4 }} />

        {items.map((item, idx) => (
          <div key={item.id}>
            <div style={{ padding: '0 0 0 0', margin: '6px 0 2px 0', textAlign: 'left', boxSizing: 'border-box' }}>
              <p style={descStyle}>{item.description}</p>
            </div>
            <button
              type="button"
              ref={item.id === 'Annotation System' ? annotationSystemBtnRef : (item.id === 'Annotation History' ? annotationHistoryBtnRef : undefined)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId((prev) => (prev === item.id ? null : prev))}
              onClick={() => {
                if (item.id === 'Annotation History') {
                  setClickedId(item.id);
                  setPulseTargetId('Annotation History');

                  // Simulated cursor movement to the Annotation History button, then navigate
                  const container = containerRef.current;
                  const btn = annotationHistoryBtnRef.current;
                  if (!container || !btn) {
                    // Fallback: old pulse + navigate
                    setPulseActive(true);
                    setTimeout(() => setPulseActive(false), 160);
                    setTimeout(() => setPulseActive(true), 320);
                    setTimeout(() => setPulseActive(false), 480);
                    setTimeout(() => {
                      setClickedId(null);
                      if (typeof onNavigateAnnotationHistory === 'function') onNavigateAnnotationHistory();
                    }, 520);
                    return;
                  }

                  const containerRect = container.getBoundingClientRect();
                  const btnRect = btn.getBoundingClientRect();
                  const targetX = btnRect.left - containerRect.left + Math.min(24, btnRect.width * 0.12);
                  const targetY = btnRect.top - containerRect.top + btnRect.height * 0.55;

                  // Ripple origin aligned to cursor tip
                  setRipplePos({ x: targetX + 10, y: targetY + 8 });

                  // Start cursor slightly offset
                  setShowCursor(true);
                  setCursorOpacity(1);
                  setCursorPos({ x: Math.max(0, targetX - 40), y: Math.max(0, targetY - 30) });
                  requestAnimationFrame(() => {
                    setCursorPos({ x: targetX, y: targetY });
                  });

                  const moveMs = 600;
                  setTimeout(() => {
                    setCursorScale(0.92);
                    setPulseActive(true);
                    // Click ripple
                    setRippleVisible(true);
                    setRippleScale(0.8);
                    setRippleOpacity(0.35);
                    setTimeout(() => {
                      setRippleScale(1.8);
                      setRippleOpacity(0);
                    }, 10);
                    setTimeout(() => setPulseActive(false), 150);
                    setTimeout(() => setPulseActive(true), 300);
                    setTimeout(() => setPulseActive(false), 480);

                    // After click effect, navigate (trigger the slide animation)
                    setTimeout(() => {
                      setClickedId(null);
                      setCursorScale(1);
                      setCursorOpacity(0);
                      setTimeout(() => setShowCursor(false), 250);
                      setRippleVisible(false);
                      if (typeof onNavigateAnnotationHistory === 'function') onNavigateAnnotationHistory();
                    }, 520);
                  }, moveMs + 50);
                } else if (item.id === 'Annotation System') {
                  // Play the same pulse without navigation
                  setClickedId(item.id);
                  setPulseTargetId('Annotation System');
                  setPulseActive(true);
                  setTimeout(() => setPulseActive(false), 160);
                  setTimeout(() => setPulseActive(true), 320);
                  setTimeout(() => {
                    setPulseActive(false);
                    setClickedId(null);
                    setPulseTargetId(null);
                    if (typeof onShowAnnotationOptions === 'function') {
                      onShowAnnotationOptions();
                    }
                  }, 480);
                }
              }}
              style={{ ...buttonBaseStyle(item), marginRight: 8, marginBottom: idx === items.length - 1 ? 0 : 16 }}
            >
              <i className={item.iconClass} style={iconStyle}></i>
              <span className="p-2" style={titleStyle}>{item.title}</span>
            </button>
          </div>
        ))}

        {showCursor && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `translate(${cursorPos.x}px, ${cursorPos.y}px) scale(${cursorScale}) rotate(-8deg)`,
              transition: 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)',
              opacity: cursorOpacity,
              pointerEvents: 'none',
              zIndex: 20,
            }}
          >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }}>
            <path fill="#FFF" stroke="#000" strokeWidth="1.25" d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z"></path>
          </svg>
          </div>
        )}

        {rippleVisible && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `translate(${ripplePos.x}px, ${ripplePos.y}px)`,
              pointerEvents: 'none',
              zIndex: 19,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: '2px solid rgba(17,17,17,0.4)',
                transform: `scale(${rippleScale})`,
                transition: 'transform 320ms ease, opacity 320ms ease',
                opacity: rippleOpacity,
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={rootRef} style={{ overflow: 'hidden', width: '100%', height: '100%' }}>
      {showTechnicalModal && overlayRect && createPortal(
        (
          <div
            style={{
              position: 'fixed',
              top: overlayRect.top,
              left: overlayRect.left,
              width: overlayRect.width,
              height: overlayRect.height,
              backgroundColor: 'rgba(17,24,39,0.28)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              opacity: modalFadeIn ? 1 : 0,
              transition: 'opacity 220ms ease',
            }}
            onClick={closeTechnicalModalWithFade}
          >
              <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                width: 'min(520px, 96%)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
                color: '#111827',
                overflow: 'hidden',
                transform: modalFadeIn ? 'translateY(0px) scale(1)' : 'translateY(4px) scale(0.98)',
                opacity: modalFadeIn ? 1 : 0.96,
                transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease',
              }}
            >
              {/* Minimal OK auto-cursor overlay inside modal */}
              {okAutoActive && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }}>
                  <div
                    style={{
                      position: 'absolute',
                      transform: `translate(${okCursorPos.x}px, ${okCursorPos.y}px) scale(${okCursorScale}) rotate(-8deg)`,
                      transition: 'transform 900ms cubic-bezier(0.22, 1, 0.36, 1), opacity 360ms ease',
                      opacity: okCursorVisible ? 1 : 0,
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }}>
                      <path fill="#FFF" stroke="#000" strokeWidth="1.25" d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z"></path>
                    </svg>
                  </div>
                  {/* ripple indicator intentionally removed */}
                </div>
              )}
              {/* Minimal, ChatGPT-like neutral modal */}
              <div style={{ padding: '16px 16px 6px 16px', fontSize: 13, lineHeight: 1.5 }}>
                <div style={{ color: '#6b7280', marginBottom: 8, letterSpacing: 0.2 }}>Added Label</div>
                <div style={{ marginBottom: 10, color: '#111827' }}>
                  <span style={{ fontWeight: 600 }}>Text:</span> "Hey! I'm having trouble with API authentication in my React app."
                </div>
                <div style={{ display: 'grid', rowGap: 4 }}>
                  <div style={{ color: '#111827' }}>
                    <span style={{ fontWeight: 600, color: '#111827' }}>Label:</span> <span style={{ color: '#111827', fontWeight: 400 }}>Tone</span>
                  </div>
                  <div style={{ color: '#111827' }}>
                    <span style={{ fontWeight: 600, color: '#111827' }}>Label Type:</span> <span style={{
                    display: 'inline-block',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    color: '#111827',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    fontWeight: 400,
                  }}>Technical</span></div>
                </div>
              </div>
              <div style={{ padding: '12px 16px 14px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  ref={okButtonRef}
                  type="button"
                  onClick={closeTechnicalModalWithFade}
                  style={{
                    background: '#ffffff',
                    color: '#111827',
                    border: '1px solid #d1d5db',
                    borderRadius: 10,
                    padding: '9px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: 'none'
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}
      <div
        style={{
          display: 'flex',
          position: 'relative',
          width: swipeToBlankOnHighlightEnd ? (backSwipeToFirst ? '300%' : (finalSwipe ? '300%' : '200%')) : '100%',
          transform: swipeToBlankOnHighlightEnd
            ? (
                backSwipeToFirst
                  ? 'translate3d(0, 0, 0)'
                  : (finalSwipe ? 'translate3d(-66.6667%, 0, 0)' : (startSwipe ? 'translate3d(-50%, 0, 0)' : 'translate3d(0, 0, 0)'))
              )
            : 'translate3d(0, 0, 0)',
          transition: swipeToBlankOnHighlightEnd
            ? (backSwipeToFirst
                ? 'transform 450ms linear'
                : 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)')
            : undefined,
          willChange: 'transform',
          height: '100%',
        }}
      >
        {/* Removed gradient parallax overlay for a clean, linear feel */}
        <div style={{
          flex: `0 0 ${swipeToBlankOnHighlightEnd ? (finalSwipe ? '33.3333%' : '50%') : '100%'}`,
          position: 'relative',
          transform: swipeToBlankOnHighlightEnd && (startSwipe || finalSwipe) ? 'scale(0.985)' : 'scale(1)',
          opacity: swipeToBlankOnHighlightEnd && (startSwipe || finalSwipe) ? 0.96 : 1,
          filter: 'none',
          transition: backSwipeToFirst
            ? 'transform 450ms linear, opacity 300ms ease'
            : 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease',
          willChange: 'transform'
        }}>
          <ChatPane />
        </div>
        {swipeToBlankOnHighlightEnd && (
          <div style={{ flex: `0 0 ${finalSwipe ? '33.3333%' : '50%'}`, position: 'relative', overflow: 'hidden' }}>
            {/* Page 1: Menu (slides out to the left) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                padding: '0 8px',
                boxSizing: 'border-box',
                height: 340,
                overflowY: 'auto',
                transform: secondSwipe ? 'translateX(-8%)' : 'translateX(0%)',
                opacity: secondSwipe ? 0 : 1,
                transition: 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease',
                willChange: 'transform, opacity',
              }}
              ref={leftScrollRef}
            >
              <MenuPane
                onNavigateAnnotationHistory={() => setSecondSwipe(true)}
                autoPulseId={firstSwipeDone ? 'Annotation System' : undefined}
                simulateCursorForId={firstSwipeDone ? 'Annotation System' : undefined}
                onShowAnnotationOptions={() => { setSecondSwipe(true); }}
              />
            </div>

            {/* Page 2: Annotation options (slides in from the right) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                padding: '4px 8px 16px 8px',
                boxSizing: 'border-box',
                background: 'transparent',
                height: 355,
                overflowY: 'auto',
                transform: secondSwipe ? 'translateX(0%)' : 'translateX(8%)',
                opacity: secondSwipe ? 1 : 0,
                transition: 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease',
                willChange: 'transform, opacity',
              }}
              ref={rightScrollRef}
            >
              {optionsAutoActive
                ? <RightOptionsAutoClick onAddLabelDone={() => setFinalSwipe(true)} />
                : <AnnotationOptionsPane />}
            </div>
          </div>
        )}
        {/* Third pane: empty screen after Add Label click */}
        {swipeToBlankOnHighlightEnd && (
          <div ref={thirdPaneRef} style={{ flex: `0 0 ${finalSwipe ? '33.3333%' : '50%'}`, position: 'relative', background: '#ffffff', overflowY: 'auto', overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch', padding: '0 12px 8px' }}>
            <div style={{ boxSizing: 'border-box', maxWidth: 820, width: '100%', margin: '0 auto' }}>
              <section className="sub-frame-container">
                <div id="predefined-label-sub-frame" className="sub-frame frame-button-1-holder" style={{ marginTop: 0 }}>
                  <div className="label-button-container">
                    <button id="Sentiment" className="frame-button-1">
                      <div className="label-content">
                        <div className="label-main">
                          <i className="fas fa-thumbs-up" style={{ color: '#626262' }} />
                          <span className="p-2">Sentiment</span>
                        </div>
                        <i className="fas fa-chevron-down label-dropdown-arrow" />
                      </div>
                    </button>
                    <div className="label-description" data-label="Sentiment">
                      <p>Categorize text based on the emotional tone - whether it expresses positive, negative, or neutral feelings.</p>
                    </div>
                  </div>

                  <div className="label-button-container">
                    <button
                      id="Tone"
                      className="frame-button-1"
                      ref={toneBtnRef}
                      onClick={handleToneToggle}
                      aria-expanded={toneExpanded}
                    >
                      <div className="label-content">
                        <div className="label-main">
                          <i className="fas fa-music" style={{ color: '#626262' }} />
                          <span className="p-2">Tone</span>
                        </div>
                        <i className={`fas fa-chevron-down label-dropdown-arrow ${toneExpanded ? 'active' : ''}`} />
                      </div>
                      <div
                        style={{
                          maxHeight: `calc(${toneAnimHeight} + ${toneExpanded ? 16 : 0}px)`,
                          overflow: 'hidden',
                          transition: 'max-height 260ms cubic-bezier(0.22, 1, 0.36, 1), padding-top 260ms ease',
                          paddingTop: toneExpanded ? 16 : 0,
                          textAlign: 'left'
                        }}
                        ref={toneContentRef}
                      >
                        <p style={{ margin: 0 }}>Identify the writing style and mood of the text.</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                          {['Technical', 'Concise', 'Verbose', 'Plain-English'].map((opt) => (
                            <span
                              key={opt}
                              role="button"
                              tabIndex={0}
                              data-tag={opt}
                              onClick={(e) => { e.stopPropagation(); setSelectedToneOption(opt); }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setSelectedToneOption(opt); } }}
                              className={`frame-button-1 ${selectedToneOption === opt ? 'selected' : ''}`}
                              style={{ width: 'auto', padding: '8px 12px', cursor: 'pointer' }}
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="label-button-container">
                    <button id="Intent" className="frame-button-1">
                      <div className="label-content">
                        <div className="label-main">
                          <i className="fas fa-bullseye" style={{ color: '#626262' }} />
                          <span className="p-2">Intent</span>
                        </div>
                        <i className="fas fa-chevron-down label-dropdown-arrow" />
                      </div>
                    </button>
                    <div className="label-description" data-label="Intent">
                      <p>Classify the purpose or goal behind the text, such as making a request, providing information, or expressing a complaint.</p>
                    </div>
                  </div>

                  <div className="label-button-container">
                    <button id="Emotion" className="frame-button-1">
                      <div className="label-content">
                        <div className="label-main">
                          <i className="far fa-smile" style={{ color: '#626262' }} />
                          <span className="p-2">Emotion</span>
                        </div>
                        <i className="fas fa-chevron-down label-dropdown-arrow" />
                      </div>
                    </button>
                    <div className="label-description" data-label="Emotion">
                      <p>Tag text with specific emotional states like happiness, sadness, anger, or surprise.</p>
                    </div>
                  </div>

                  <div className="label-button-container">
                    <button id="Priority" className="frame-button-1">
                      <div className="label-content">
                        <div className="label-main">
                          <i className="fas fa-exclamation" style={{ color: '#626262', width: 25, textAlign: 'center' }} />
                          <span className="p-2">Priority</span>
                        </div>
                        <i className="fas fa-chevron-down label-dropdown-arrow" />
                      </div>
                    </button>
                    <div className="label-description" data-label="Priority">
                      <p>Mark the importance level of the content as high, medium, or low priority.</p>
                    </div>
                  </div>

                  <div className="label-button-container">
                    <button id="Politeness" className="frame-button-1">
                      <div className="label-content">
                        <div className="label-main">
                          <i className="fas fa-hand-peace" style={{ color: '#626262' }} />
                          <span className="p-2">Politeness</span>
                        </div>
                        <i className="fas fa-chevron-down label-dropdown-arrow" />
                      </div>
                    </button>
                    <div className="label-description" data-label="Politeness">
                      <p>Evaluate the courtesy level in communications, from polite to rude.</p>
                    </div>
                  </div>

                  <div className="label-button-container">
                    <button id="Agreement" className="frame-button-1">
                      <div className="label-content">
                        <div className="label-main">
                          <i className="fas fa-handshake" style={{ color: '#626262' }} />
                          <span className="p-2">Agreement</span>
                        </div>
                        <i className="fas fa-chevron-down label-dropdown-arrow" />
                      </div>
                    </button>
                    <div className="label-description" data-label="Agreement">
                      <p>Indicate whether the text expresses agreement or disagreement with a topic or statement.</p>
                    </div>
                  </div>

                  <div className="label-button-container">
                    <button id="Relevance" className="frame-button-1">
                      <div className="label-content">
                        <div className="label-main">
                          <i className="fas fa-tags" style={{ color: '#626262' }} />
                          <span className="p-2">Relevance</span>
                        </div>
                        <i className="fas fa-chevron-down label-dropdown-arrow" />
                      </div>
                    </button>
                    <div className="label-description" data-label="Relevance">
                      <p>Mark content as relevant or irrelevant to your specific needs or criteria.</p>
                    </div>
                  </div>

                  <div className="label-button-container" style={{ marginBottom: 0 }}>
                    <button id="Toggle Custom Labels" className="frame-button-1">
                      <div className="label-content">
                        <div className="label-main">
                          <i className="fas fa-plus" style={{ color: '#626262' }} />
                          <span className="p-2">Add Custom Label</span>
                        </div>
                        <i className="fas fa-chevron-down label-dropdown-arrow" />
                      </div>
                    </button>
                    <div className="label-description" data-label="Toggle Custom Labels">
                      <p>Create and manage your own custom labels to suit your specific annotation needs.</p>
                    </div>
                  </div>
                </div>
              </section>
              <ToneAutoCursor active={autoToneActive} expanded={toneExpanded} />
              <TechnicalAutoCursor active={autoTechnicalActive} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Hero() {
  // Expansion animation state
  const timelineSectionRef = useRef(null);
  const cardRefs = useRef([]);
  const wrapperRefs = useRef([]);
  const timelineGridRef = useRef(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [expandedStyle, setExpandedStyle] = useState(null);
  const [originalRect, setOriginalRect] = useState(null);
  const [overlayHTML, setOverlayHTML] = useState('');
  const [backdropVisible, setBackdropVisible] = useState(false);
  const [overlayContentVisible, setOverlayContentVisible] = useState(true);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [showExpandIcons, setShowExpandIcons] = useState(false);
  const [reserveSpace, setReserveSpace] = useState(0); // dynamic spacer below timeline when expanded
  const showIconsDelayRef = useRef(null);
  const showIconsRafRef = useRef(null);
  const hideIconsDelayRef = useRef(null);
  const showExpandIconsRef = useRef(false);
  useEffect(() => { showExpandIconsRef.current = showExpandIcons; }, [showExpandIcons]);
  

  
  // Auto-cursor for timeline share icon (third card)
  const [autoShareActive, setAutoShareActive] = useState(false);
  const shareAutoRanInThisViewRef = useRef(false);
  const heroWorkflowRef = useRef(null);
  // Auto-cursor for overlay share icon when third card is expanded
  const [autoShareOverlayActive, setAutoShareOverlayActive] = useState(false);
  const shareOverlayRanRef = useRef(false);
  const expandedOverlayRef = useRef(null);
  const bodyOverflowBeforeLockRef = useRef('');
  const bodyPaddingRightBeforeLockRef = useRef('');

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);


  const measureTargetSize = () => {
    const chatDemo = document.querySelector('.chat-demo-window');
    if (chatDemo) {
      const rect = chatDemo.getBoundingClientRect();
      return {
        width: Math.min(rect.width, window.innerWidth - 48),
        height: Math.min(rect.height, window.innerHeight - 96 - 56), // Reduced height for bottom margin
      };
    }
    return {
      width: Math.min(850, window.innerWidth - 48),
      height: Math.min(560, window.innerHeight - 96 - 56), // Reduced height for bottom margin
    };
  };

  // ESC to close while overlay is open
  useEffect(() => {
    const onShareOpen = () => {
      try {
        const host = expandedOverlayRef.current;
        if (!host) return;
        // Blur the entire expanded frame contents (inside the white border)
        const overlayHost = host;
        if (getComputedStyle(overlayHost).position === 'static') {
          overlayHost.style.position = 'relative';
        }
        let modalBackdrop = overlayHost.querySelector('[data-share-blur]');
        if (!modalBackdrop) {
          modalBackdrop = document.createElement('div');
          modalBackdrop.setAttribute('data-share-blur', '');
          modalBackdrop.style.position = 'absolute';
          // Respect the inner padding so the overlay doesn't touch the frame edges or icons
          const cs = getComputedStyle(overlayHost);
          const padT = parseFloat(cs.paddingTop || '12') || 12;
          const padR = parseFloat(cs.paddingRight || '12') || 12;
          const padB = parseFloat(cs.paddingBottom || '12') || 12;
          const padL = parseFloat(cs.paddingLeft || '12') || 12;
          // leave extra breathing room so it doesn't touch the expand icon or edges
          modalBackdrop.style.top = `${Math.max(8, padT)}px`;
          modalBackdrop.style.left = `${Math.max(8, padL)}px`;
          modalBackdrop.style.right = `${Math.max(8, padR)}px`;
          modalBackdrop.style.bottom = `${Math.max(12, padB)}px`;
          // Follow the inner container radius so the outer frame border stays crisp
          modalBackdrop.style.borderRadius = getComputedStyle(overlayHost).borderRadius || '8px';
          // Match the Annotate Your Chat modal overlay style
          modalBackdrop.style.background = 'rgba(17,24,39,0.28)';
          modalBackdrop.style.backdropFilter = 'blur(2px)';
          modalBackdrop.style.WebkitBackdropFilter = 'blur(2px)';
          modalBackdrop.style.zIndex = '25';
          modalBackdrop.style.pointerEvents = 'none';
          overlayHost.appendChild(modalBackdrop);
        }
        requestAnimationFrame(() => { modalBackdrop.style.opacity = '1'; });
      } catch (_) {}
    };
    const onShareClose = () => {
      try {
        const host = expandedOverlayRef.current;
        if (!host) return;
        // Remove any blur/spotlight overlays that might have been attached to either the
        // inner scroll container or the host itself.
        const candidates = [host, host.querySelector('.overlay-chat-scroll')].filter(Boolean);
        candidates.forEach((container) => {
          container
            .querySelectorAll('[data-share-blur], [data-share-spotlight]')
            .forEach((el) => {
              try { el.remove(); } catch (_) {}
            });
        });
      } catch (_) {}
    };
    window.addEventListener('share-modal:open', onShareOpen);
    window.addEventListener('share-modal:close', onShareClose);
    return () => {
      window.removeEventListener('share-modal:open', onShareOpen);
      window.removeEventListener('share-modal:close', onShareClose);
    };
  }, []);

  // ESC to close while overlay is open
  useEffect(() => {
    if (expandedIndex === null) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') collapseExpanded();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [expandedIndex]);

  // Show expand icons when the grid's center is near the viewport center and at least partially visible
  useEffect(() => {
    const el = timelineGridRef.current;
    if (!el) return undefined;

    const compute = () => {
      showIconsRafRef.current = null;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      // Prefer the grid to be a bit toward the top (around 42% of viewport height)
      const preferredY = Math.floor(vh * 0.42);
      const elementCenterY = rect.top + rect.height / 2;
      const bandPx = Math.max(110, Math.floor(vh * 0.14));
      // Wider band for hold so micro scrolls don't reset the timer
      const holdBandPx = bandPx + Math.max(80, Math.floor(vh * 0.08));

      // How much of the element is visible
      const visibleHeight = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      const elementHeight = Math.max(1, rect.height);
      const visibleRatio = Math.max(0, Math.min(visibleHeight / elementHeight, 1));

      const centerNear = Math.abs(elementCenterY - preferredY) <= bandPx;
      const enoughVisible = visibleRatio >= 0.3; // require 30% visible
      const withinHold = Math.abs(elementCenterY - preferredY) <= holdBandPx;
      const enoughVisibleHold = visibleRatio >= 0.15;
      const shouldShow = centerNear && enoughVisible;

      if (shouldShow) {
        // Cancel any pending hide timer
        if (hideIconsDelayRef.current) {
          window.clearTimeout(hideIconsDelayRef.current);
          hideIconsDelayRef.current = null;
        }
        if (!showIconsDelayRef.current) {
          showIconsDelayRef.current = window.setTimeout(() => {
            setShowExpandIcons(true);
            showIconsDelayRef.current = null;
          }, 650);
        }
      } else {
        // Only cancel the pending show if we are clearly out of the wider hold band
        if (showIconsDelayRef.current && (!withinHold || !enoughVisibleHold)) {
          window.clearTimeout(showIconsDelayRef.current);
          showIconsDelayRef.current = null;
        }
        const outOfView = rect.bottom < 0 || rect.top > vh || visibleRatio < 0.05;
        if (outOfView) {
          // If truly out of view, hide immediately
          if (hideIconsDelayRef.current) {
            window.clearTimeout(hideIconsDelayRef.current);
            hideIconsDelayRef.current = null;
          }
          setShowExpandIcons(false);
        } else {
          // Give the user a short grace period after icons have shown
          if (showExpandIconsRef.current && !hideIconsDelayRef.current) {
            hideIconsDelayRef.current = window.setTimeout(() => {
              setShowExpandIcons(false);
              hideIconsDelayRef.current = null;
            }, 800);
          } else if (!showExpandIconsRef.current) {
            // While within the hold band and partially visible, keep waiting for the pending show
            if (!withinHold || !showIconsDelayRef.current) {
              setShowExpandIcons(false);
            }
          }
        }
      }
    };

    const onScrollOrResize = () => {
      if (showIconsRafRef.current != null) return;
      showIconsRafRef.current = window.requestAnimationFrame(compute);
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('orientationchange', onScrollOrResize);
    // Initial check
    onScrollOrResize();

    return () => {
      if (showIconsDelayRef.current) {
        window.clearTimeout(showIconsDelayRef.current);
        showIconsDelayRef.current = null;
      }
      if (hideIconsDelayRef.current) {
        window.clearTimeout(hideIconsDelayRef.current);
        hideIconsDelayRef.current = null;
      }
      if (showIconsRafRef.current != null) {
        window.cancelAnimationFrame(showIconsRafRef.current);
        showIconsRafRef.current = null;
      }
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('orientationchange', onScrollOrResize);
    };
  }, []);

  // Trigger the share auto-cursor once per view when expand icons appear
  useEffect(() => {
    if (showExpandIcons) {
      const sectionEl = heroWorkflowRef.current;
      if (!sectionEl || !isElementVisible(sectionEl, 0.55)) return undefined;
      if (!shareAutoRanInThisViewRef.current) {
        shareAutoRanInThisViewRef.current = true;
        const id = window.setTimeout(() => setAutoShareActive(true), 420);
        return () => window.clearTimeout(id);
      }
    } else {
      // Reset when grid leaves the view so it can run again on next entry
      shareAutoRanInThisViewRef.current = false;
    }
    return undefined;
  }, [showExpandIcons]);

  const lockBodyScroll = () => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    bodyOverflowBeforeLockRef.current = document.body.style.overflow;
    bodyPaddingRightBeforeLockRef.current = document.body.style.paddingRight;
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = 'hidden';
  };

  // Utility: check if an element is sufficiently visible in the viewport
  const isElementVisible = (element, threshold = 0.55) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const viewportW = window.innerWidth || document.documentElement.clientWidth;
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    const visibleW = Math.max(0, Math.min(rect.right, viewportW) - Math.max(rect.left, 0));
    const visibleH = Math.max(0, Math.min(rect.bottom, viewportH) - Math.max(rect.top, 0));
    const visibleArea = visibleW * visibleH;
    const totalArea = Math.max(1, rect.width * rect.height);
    return visibleArea / totalArea >= threshold;
  };

  const unlockBodyScroll = () => {
    document.body.style.overflow = bodyOverflowBeforeLockRef.current || '';
    document.body.style.paddingRight = bodyPaddingRightBeforeLockRef.current || '';
  };

  // When the third card is expanded and content is visible, trigger overlay share auto-cursor once per expand
  useEffect(() => {
    if (expandedIndex === 2 && overlayContentVisible) {
      if (!shareOverlayRanRef.current) {
        shareOverlayRanRef.current = true;
        const id = window.setTimeout(() => setAutoShareOverlayActive(true), 900); // smooth start
        return () => window.clearTimeout(id);
      }
    } else {
      // reset for next time
      shareOverlayRanRef.current = false;
      setAutoShareOverlayActive(false);
    }
    return undefined;
  }, [expandedIndex, overlayContentVisible]);

  // Cursor animation component targeting the share icon on the third timeline card
  const TimelineShareAutoCursor = ({ active }) => {
    const [showCursor, setShowCursor] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [cursorScale, setCursorScale] = useState(1);
    const [cursorOpacity, setCursorOpacity] = useState(0);
    const [rippleVisible, setRippleVisible] = useState(false);
    const [rippleScale, setRippleScale] = useState(0.8);
    const [rippleOpacity, setRippleOpacity] = useState(0);
    const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
      if (!active) return;
      const container = heroWorkflowRef.current;
      const thirdCard = cardRefs.current[2];
      if (!container || !thirdCard) return;
      if (!isElementVisible(thirdCard, 0.55)) return;
      const shareIcon = thirdCard.querySelector('.step-icon.collaborate-icon');
      if (!shareIcon) return;

      const containerRect = container.getBoundingClientRect();
      const targetRect = shareIcon.getBoundingClientRect();
      const targetX = targetRect.left - containerRect.left + Math.min(22, targetRect.width * 0.6);
      const targetY = targetRect.top - containerRect.top + Math.min(22, targetRect.height * 0.65);
      setRipplePos({ x: targetX + 10, y: targetY + 8 });

      setShowCursor(true);
      setCursorOpacity(0);
      setCursorPos({ x: Math.max(0, targetX - 110), y: Math.max(0, targetY - 72) });
      const raf = requestAnimationFrame(() => {
        setCursorOpacity(1);
        setCursorPos({ x: targetX, y: targetY });
      });

      const moveMs = 900;
      const preClickDwellMs = 160;
      const postClickLingerMs = 700;
      const clickTimer = setTimeout(() => {
        try { shareIcon.click(); } catch (_) {}
        setCursorScale(0.94);
        setRippleVisible(true);
        setRippleScale(0.8);
        setRippleOpacity(0.35);
        setTimeout(() => { setRippleScale(1.8); setRippleOpacity(0); }, 10);
        setTimeout(() => {
          setCursorScale(1);
          setCursorOpacity(0);
          setTimeout(() => setShowCursor(false), 250);
          setRippleVisible(false);
          setAutoShareActive(false);
        }, postClickLingerMs);
      }, moveMs + preClickDwellMs);

      return () => { cancelAnimationFrame(raf); clearTimeout(clickTimer); };
    }, [active]);

    if (!showCursor) return null;
    return (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }}>
        <div
          style={{
            position: 'absolute',
            transform: `translate(${cursorPos.x}px, ${cursorPos.y}px) scale(${cursorScale}) rotate(-8deg)`,
            transition: 'transform 900ms cubic-bezier(0.22, 1, 0.36, 1), opacity 360ms ease',
            opacity: cursorOpacity,
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }}>
            <path fill="#FFF" stroke="#000" strokeWidth="1.25" d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z"></path>
          </svg>
        </div>
        {rippleVisible && (
          <div style={{ position: 'absolute', transform: `translate(${ripplePos.x}px, ${ripplePos.y}px)` }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(17,17,17,0.4)', transform: `scale(${rippleScale})`, transition: 'transform 320ms ease, opacity 320ms ease', opacity: rippleOpacity }} />
          </div>
        )}
      </div>
    );
  };

  const ShareOverlayAutoCursor = ({ active }) => {
    const [showCursor, setShowCursor] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [cursorScale, setCursorScale] = useState(1);
    const [cursorOpacity, setCursorOpacity] = useState(0);
    const [rippleVisible, setRippleVisible] = useState(false);
    const [rippleScale, setRippleScale] = useState(0.8);
    const [rippleOpacity, setRippleOpacity] = useState(0);
    const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
      if (!active) return;
      const container = expandedOverlayRef.current;
      if (!container) return;
      // target the top-left share icon inside overlay content
      const button = container.querySelector('button[aria-label="Share chat"]');
      if (!button) return;

      const containerRect = container.getBoundingClientRect();
      const btnRect = button.getBoundingClientRect();
      const targetX = btnRect.left - containerRect.left + Math.min(16, btnRect.width * 0.6);
      const targetY = btnRect.top - containerRect.top + Math.min(16, btnRect.height * 0.6);
      setRipplePos({ x: targetX + 8, y: targetY + 6 });

      setShowCursor(true);
      setCursorOpacity(0);
      setCursorPos({ x: Math.max(0, targetX - 110), y: Math.max(0, targetY - 72) });
      const raf = requestAnimationFrame(() => {
        setCursorOpacity(1);
        setCursorPos({ x: targetX, y: targetY });
      });

      const moveMs = 900;            // smooth cursor glide
      const preClickDwellMs = 220;   // brief pause before click
      const postClickLingerMs = 800; // gentle linger
      const clickTimer = setTimeout(() => {
        try { button.click(); } catch (_) {}
        try { button.blur(); } catch (_) {}
        setCursorScale(0.94);
        // removed ripple ring on click
        
        // Imperatively add a dark, blurred backdrop spotlight over the overlay content
        try {
          // Limit the blur to the ChatPane card, not the whole overlay
          const cardEl = button.offsetParent || button.parentElement; // ChatPane container (position: relative)
          const host = cardEl || expandedOverlayRef.current;
          if (host) {
            const overlay = document.createElement('div');
            overlay.setAttribute('data-share-spotlight', '');
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.right = '0';
            overlay.style.bottom = '0';
            // Match the second modal: light grey translucent, no blur (slightly lighter)
            overlay.style.backgroundColor = 'rgba(210, 210, 210, 0.31)';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 280ms ease';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '20';
            // match chat frame radius exactly
            overlay.style.borderRadius = getComputedStyle(host).borderRadius || '12px';
            // add matching border so cutout edges align seamlessly
            const cs = getComputedStyle(host);
            const bw = cs.borderTopWidth || '1px';
            const bs = cs.borderTopStyle || 'solid';
            const bc = cs.borderTopColor || 'rgb(229, 231, 235)';
            overlay.style.border = `${bw} ${bs} ${bc}`;
            overlay.style.boxSizing = 'border-box';

            // Rectangular spotlight cutout inside the frame (no circular ripple)
            const hostRect = host.getBoundingClientRect();
            const btnRect = button.getBoundingClientRect();
            const pad = 12; // extend just past the icon
            // Hole starts at the card's top-left and ends exactly at (just past) the share button's outer edge
            const fudge = 1; // expand by 1px to avoid visible seam
            const holeX = -fudge;
            const holeY = -fudge;
            const exactW = Math.round(btnRect.right - hostRect.left) + fudge;
            const exactH = Math.round(btnRect.bottom - hostRect.top) + fudge;
            const holeW = Math.max(0, Math.min(Math.round(hostRect.width) + 2 * fudge, exactW + fudge));
            const holeH = Math.max(0, Math.min(Math.round(hostRect.height) + 2 * fudge, exactH + fudge));
            // Use an SVG mask to subtract a rounded-rect hole (12px radius)
            const w = Math.round(hostRect.width);
            const h = Math.round(hostRect.height);
            const r = (parseFloat(getComputedStyle(host).borderTopLeftRadius) || 12) + fudge; // match card radius and expand slightly
            const svg = `<?xml version=\"1.0\" encoding=\"UTF-8\"?><svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' shape-rendering='crispEdges'><defs><mask id='cut'><rect width='${w}' height='${h}' fill='white'/><rect x='${holeX}' y='${holeY}' width='${holeW}' height='${holeH}' rx='${r}' ry='${r}' fill='black'/></mask></defs><rect width='${w}' height='${h}' fill='white' mask='url(#cut)'/></svg>`;
            const dataUrl = `url(\"data:image/svg+xml;utf8,${encodeURIComponent(svg)}\")`;
            overlay.style.webkitMaskImage = dataUrl;
            overlay.style.maskImage = dataUrl;
            overlay.style.webkitMaskRepeat = 'no-repeat';
            overlay.style.maskRepeat = 'no-repeat';
            overlay.style.webkitMaskSize = '100% 100%';
            overlay.style.maskSize = '100% 100%';

            host.appendChild(overlay);

            // Shared timing so overlay and toast stay in sync
            const overlayFadeOutStartMs = 3800; // increase linger before fading
            const overlayFadeOutDurationMs = 280; // slightly slower fade for visibility
            const overlayRemovalMs = overlayFadeOutStartMs + overlayFadeOutDurationMs;

            // Show toast inside the overlay and ensure it sits above the overlay
            try {
              // Anchored toast positioned over the expanded view, appended to body to avoid React re-renders
              const toastFadeMs = 5500;
              const toastDelayMs = 0; // show immediately after click
              const toastDurationMs = 800; // keep toast brief regardless of overlay timing
              window.setTimeout(() => {
                try {
                  const toast = document.createElement('div');
                  toast.className = 'toast toast-success toast--anchored';
                  toast.textContent = 'Shareable link copied to clipboard!';

                  // Position it to the visual bottom-center of the host card
                  const centerX = hostRect.left + (hostRect.width / 2);
                  const bottomOffset = Math.max(6, window.innerHeight - hostRect.bottom + 6);
                  toast.style.position = 'fixed';
                  toast.style.left = `${Math.round(centerX)}px`;
                  toast.style.bottom = `${Math.round(bottomOffset)}px`;
                  toast.style.zIndex = '999999';

                  document.body.appendChild(toast);
                  requestAnimationFrame(() => toast.classList.add('show'));

                  setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => {
                      try {
                        window.dispatchEvent(new CustomEvent('toast:ended', { detail: { message: 'Shareable link copied to clipboard!', type: 'success', scope: 'anchored' } }));
                      } catch (_) {}
                      toast.remove();
                    }, 300);
                  }, toastDurationMs);
                } catch (_) {}
              }, toastDelayMs);
            } catch (_) {}

            // Fade in, then fade out and remove overlay (smooth)
            requestAnimationFrame(() => { overlay.style.opacity = '1'; });
            // start blur fade-out later for a calmer beat
            setTimeout(() => { overlay.style.transition = 'opacity 280ms ease'; overlay.style.opacity = '0'; }, overlayFadeOutStartMs);
            setTimeout(() => {
              try { overlay.remove(); } catch (_) {}
            }, overlayRemovalMs);
          }
        } catch (_) {}

        setTimeout(() => {
          // gentle fade/scale out instead of snap disappear
          setCursorScale(0.88);
          setCursorOpacity(0);
          setTimeout(() => setShowCursor(false), 700);
          setAutoShareOverlayActive(false);
        }, postClickLingerMs);
      }, moveMs + preClickDwellMs);

      return () => { cancelAnimationFrame(raf); clearTimeout(clickTimer); };
    }, [active]);

    if (!showCursor) return null;
    return (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }}>
        <div
          style={{
            position: 'absolute',
            transform: `translate(${cursorPos.x}px, ${cursorPos.y}px) scale(${cursorScale}) rotate(-8deg)`,
            transition: 'transform 900ms cubic-bezier(0.22, 1, 0.36, 1), opacity 360ms ease',
            opacity: cursorOpacity,
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }}>
            <path fill="#FFF" stroke="#000" strokeWidth="1.25" d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z"></path>
          </svg>
        </div>
        {rippleVisible && (
          <div style={{ position: 'absolute', transform: `translate(${ripplePos.x}px, ${ripplePos.y}px)` }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(17,17,17,0.4)', transform: `scale(${rippleScale})`, transition: 'transform 320ms ease, opacity 320ms ease', opacity: rippleOpacity }} />
          </div>
        )}
      </div>
    );
  };
  const expandCard = (index) => {
    if (expandedIndex !== null) return; // prevent concurrent expansions
    const card = cardRefs.current[index];
    const wrapper = wrapperRefs.current[index];
    if (!card || !wrapper) return;

    const rect = card.getBoundingClientRect();
    const heroEl = timelineSectionRef.current;
    const heroRect = heroEl ? heroEl.getBoundingClientRect() : { top: 0, left: 0 };
    const start = {
      top: rect.top - heroRect.top,
      left: rect.left - heroRect.left,
      width: rect.width,
      height: rect.height,
    };
    const computed = window.getComputedStyle(card);
    const startRadius = computed.borderRadius || '16px';

    setOriginalRect({ ...start, borderRadius: startRadius });
    setExpandedIndex(index);
    setIsCollapsing(false);

    // For card 1 only, render specific content in overlay; others clone current content
    if (index === 0) {
      setOverlayHTML(`
        <div style="padding: 1rem;">
          <div class="chat-demo-window" style="max-width: 850px; margin: 0 auto;">
            <div class="chat-demo-header-bar">
              <div class="window-controls">
                <div class="control-dot red"></div>
                <div class="control-dot yellow"></div>
                <div class="control-dot green"></div>
              </div>
              <div class="chat-demo-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                Team Discussion
              </div>
            </div>
            <div class="chat-demo-messages" style="max-height: 340px; overflow-y: auto;">
              <div class="chat-demo-message user-message">
                <div class="message-avatar">
                  <div class="avatar-circle user-avatar"><span class="avatar-initials">AK</span></div>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-name" style="font-weight: bold;">Alex Kim</span>
                    <span class="message-time">2:21 PM</span>
                  </div>
                  <div class="message-text">Hey team, can we review yesterday's deploy results?</div>
                </div>
              </div>

              <div class="chat-demo-message ai-message">
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-name" style="font-weight: bold;">Phraze</span>
                    <span class="message-time">2:22 PM</span>
                  </div>
                  <div class="message-text">Sure! Overall latency improved by 14%. Do you want a quick summary?</div>
                </div>
              </div>

              <div class="chat-demo-message user-message">
                <div class="message-avatar">
                  <div class="avatar-circle user-avatar"><span class="avatar-initials">SC</span></div>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-name" style="font-weight: bold;">Sarah Chen</span>
                    <span class="message-time">2:23 PM</span>
                  </div>
                  <div class="message-text">Yes please, and highlight any errors above threshold.</div>
                </div>
              </div>

              <div class="chat-demo-message ai-message">
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-name" style="font-weight: bold;">Phraze</span>
                    <span class="message-time">2:24 PM</span>
                  </div>
                  <div class="message-text">Summary: Requests +8%, P95 latency -14%, 2 services with elevated error rates: auth-api (1.3%), export-worker (0.9%).</div>
                </div>
              </div>
            </div>

            <div class="chat-demo-input" style="padding: 0.75rem 1rem; background: transparent;">
              <div style="display:flex; align-items:center; border:1px solid rgba(0,0,0,0.15); border-radius:12px; background:#fff; width:100%; max-width:850px; margin:0 auto;">
                <button type="button" style="background:none; border:none; padding:0.75rem 1rem; color:#6b7280; cursor:default;" disabled>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                </button>
                <textarea rows="1" style="flex:1; padding:0.9rem 0.5rem; border:none; resize:none; outline:none; background:#fff;" placeholder="Write a message..." disabled></textarea>
                <button type="button" style="background:none; border:none; padding:0.75rem 1rem; cursor:not-allowed; opacity:0.5;" disabled>
                  <svg viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" style="width:20px; height:20px; transform: rotate(90deg);"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `);
    } else if (index === 1) {
      // Same chat UI as overlay 1 but without scroll on messages container
      setOverlayHTML(`
        <div style="padding: 1rem;">
          <div class="chat-demo-window" style="max-width: 850px; margin: 0 auto;">
            <div class="chat-demo-header-bar">
              <div class="window-controls">
                <div class="control-dot red"></div>
                <div class="control-dot yellow"></div>
                <div class="control-dot green"></div>
              </div>
              <div class="chat-demo-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                Team Discussion
              </div>
            </div>
            <div class="chat-demo-messages" style="max-height: 340px; overflow: hidden;">
              <div class="chat-demo-message user-message">
                <div class="message-avatar">
                  <div class="avatar-circle user-avatar"><span class="avatar-initials">AK</span></div>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-name" style="font-weight: bold;">Alex Kim</span>
                    <span class="message-time">2:21 PM</span>
                  </div>
                  <div class="message-text">Hey team, can we review yesterday's deploy results?</div>
                </div>
              </div>

              <div class="chat-demo-message ai-message">
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-name" style="font-weight: bold;">Phraze</span>
                    <span class="message-time">2:22 PM</span>
                  </div>
                  <div class="message-text">Sure! Overall latency improved by 14%. Do you want a quick summary?</div>
                </div>
              </div>

              <div class="chat-demo-message user-message">
                <div class="message-avatar">
                  <div class="avatar-circle user-avatar"><span class="avatar-initials">SC</span></div>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-name" style="font-weight: bold;">Sarah Chen</span>
                    <span class="message-time">2:23 PM</span>
                  </div>
                  <div class="message-text">Yes please, and highlight any errors above threshold.</div>
                </div>
              </div>

              <div class="chat-demo-message ai-message">
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-name" style="font-weight: bold;">Phraze</span>
                    <span class="message-time">2:24 PM</span>
                  </div>
                  <div class="message-text">Summary: Requests +8%, P95 latency -14%, 2 services with elevated error rates: auth-api (1.3%), export-worker (0.9%).</div>
                </div>
              </div>
            </div>

            <div class="chat-demo-input" style="padding: 0.75rem 1rem; background: transparent;">
              <div style="display:flex; align-items:center; border:1px solid rgba(0,0,0,0.15); border-radius:12px; background:#fff; width:100%; max-width:850px; margin:0 auto;">
                <button type="button" style="background:none; border:none; padding:0.75rem 1rem; color:#6b7280; cursor:default;" disabled>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                </button>
                <textarea rows="1" style="flex:1; padding:0.9rem 0.5rem; border:none; resize:none; outline:none; background:#fff;" placeholder="Write a message..." disabled></textarea>
                <button type="button" style="background:none; border:none; padding:0.75rem 1rem; cursor:not-allowed; opacity:0.5;" disabled>
                  <svg viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" style="width:20px; height:20px; transform: rotate(90deg);"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `);
    } else if (index === 2) {
      // Collaborate & Share: show the same final chat snapshot as in the end of Annotate Chat
      setOverlayHTML(`
        <div style="padding: 1rem;">
          <div class="chat-demo-window" style="max-width: 850px; margin: 0 auto;">
            <div class="chat-demo-header-bar">
              <div class="window-controls">
                <div class="control-dot red"></div>
                <div class="control-dot yellow"></div>
                <div class="control-dot green"></div>
              </div>
              <div class="chat-demo-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                Team Discussion
              </div>
            </div>
            <div class="chat-demo-messages" style="max-height: 340px; overflow-y: auto;">
              <!-- Maya 1 with label pill and highlight -->
              <div class="chat-demo-message user-message">
                <div class="message-avatar">
                  <div class="avatar-circle user-avatar"><span class="avatar-initials">MK</span></div>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-name" style="font-weight: bold;">Jin Liner</span>
                    <span class="message-time">2:20 PM</span>
                  </div>
                  <div class="message-text" style="position: relative;">
                    <div style="position: absolute; bottom: 100%; left: 0; transform: translateY(-6px); display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.9); border: 1px solid #e5e7eb; border-radius: 9999px; padding: 6px 10px; box-shadow: 0 6px 20px rgba(0,0,0,0.06);">
                      <span style="font-size: 12px; color: #6b7280;">Label:</span>
                      <span style="font-size: 12px; padding: 2px 8px; border-radius: 9999px; background: #eef2ff; color: #3730a3; border: 1px solid #c7d2fe; font-weight: 600;">Tone</span>
                      <span style="font-size: 12px; color: #6b7280;">User:</span>
                      <span style="font-size: 12px; color: #111827; font-weight: 600;">Jin Liner</span>
                    </div>
                    <mark style="background: #fef08a; padding: 2px 4px;">Hey! I'm having trouble with API authentication in my React app.</mark>
                  </div>
                </div>
              </div>

              <!-- Assistant -->
              <div class="chat-demo-message ai-message">
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-name" style="font-weight: bold;">Phraze</span>
                    <span class="message-time">2:21 PM</span>
                  </div>
                  <div class="message-text">I can help with that! What specific API are you trying to integrate?</div>
                </div>
              </div>

              <!-- Maya 3 with second label pill and highlight -->
              <div class="chat-demo-message user-message">
                <div class="message-avatar">
                  <div class="avatar-circle user-avatar"><span class="avatar-initials">MK</span></div>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-name" style="font-weight: bold;">Jin Liner</span>
                    <span class="message-time">2:23 PM</span>
                  </div>
                  <div class="message-text" style="position: relative;">
                    <div style="position: absolute; bottom: 100%; left: 0; transform: translateY(-6px); display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.9); border: 1px solid #e5e7eb; border-radius: 9999px; padding: 6px 10px; box-shadow: 0 6px 20px rgba(0,0,0,0.06);">
                      <span style="font-size: 12px; color: #6b7280;">Label:</span>
                      <span style="font-size: 12px; padding: 2px 8px; border-radius: 9999px; background: #ecfeff; color: #0e7490; border: 1px solid #a5f3fc; font-weight: 600;">Credential</span>
                      <span style="font-size: 12px; color: #6b7280;">User:</span>
                      <span style="font-size: 12px; color: #111827; font-weight: 600;">Jin Liner</span>
                    </div>
                    <mark style="background: #fef08a; padding: 2px 4px;">Weather API — keeps returning 401 errors. Where should I put the API key?</mark>
                    <div style="margin-top: 10px; color: #374151; opacity: 0.95;">Also, the docs mention rotating keys regularly and avoiding client-side exposure when possible.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);
    } else {
      // fallback: keep existing content for other cards
      setOverlayHTML(card.innerHTML);
    }

    setOverlayContentVisible(true);

    const transition = '200ms cubic-bezier(0.22, 1, 0.36, 1)';
    setExpandedStyle({
      position: 'absolute',
      top: `${start.top}px`,
      left: `${start.left}px`,
      width: `${start.width}px`,
      height: `${start.height}px`,
      margin: 0,
      zIndex: 2000,
      borderRadius: startRadius,
      boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
      transition: `top ${transition}, left ${transition}, width ${transition}, height ${transition}, border-radius ${transition}, box-shadow ${transition}, opacity 150ms ease-out` ,
      background: '#ffffff',
      opacity: 1,
    });

    setBackdropVisible(true);
    lockBodyScroll();
    // Delay content fade-in slightly for a smoother open
    setOverlayContentVisible(false);

    // Target grows from origin side without recentering
    const { width: targetWidth, height: targetHeight } = measureTargetSize();
    const marginX = 24;
    const clampedWidth = Math.min(targetWidth, window.innerWidth - marginX * 2);
    // Leave a little breathing room below so the overlay doesn't sit flush on the next section
    const bottomBreathingRoom = 84; // px (reduce bottom whitespace a bit)
    const clampedHeight = Math.max(start.height, targetHeight - bottomBreathingRoom); // grow downwards from current top

    let targetLeft = start.left;
    if (index === 1) {
      // middle: grow from center
      targetLeft = start.left - (clampedWidth - start.width) / 2;
    } else if (index === 2) {
      // right: grow leftwards
      targetLeft = start.left + (start.width - clampedWidth);
    }
    const targetTop = start.top; // keep top anchored, grow downward

    requestAnimationFrame(() => {
      // Force reflow then animate
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      card.offsetHeight;
      requestAnimationFrame(() => {
        setExpandedStyle((prev) => (
          prev
            ? {
                ...prev,
                width: `${clampedWidth}px`,
                height: `${clampedHeight}px`,
                left: `${targetLeft}px`,
                top: `${targetTop}px`,
                borderRadius: '12px',
              }
            : prev
        ));
        // Reserve space under the timeline equal to growth delta so the next section moves down
        const growthDelta = Math.max(0, clampedHeight - start.height);
        const extraGap = 12; // slightly smaller breathing room per your screenshot
        setReserveSpace(growthDelta + extraGap);
        window.setTimeout(() => setOverlayContentVisible(true), 60);
      });
    });
  };

  const collapseExpanded = () => {
    if (expandedIndex === null || !originalRect) return;
    const wrapper = wrapperRefs.current[expandedIndex];
    // Fade out overlay content immediately to avoid visible shrink of inner UI
    setOverlayContentVisible(false);
    setIsCollapsing(true);
    // Release reserved space immediately so surrounding content moves up without delay
    setReserveSpace(0);
    
    // Start smooth collapse animation immediately
    setExpandedStyle((prev) => (
      prev
        ? {
            ...prev,
            width: `${originalRect.width}px`,
            height: `${originalRect.height}px`,
            left: `${originalRect.left}px`,
            borderRadius: originalRect.borderRadius || '16px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
            background: 'transparent',
            pointerEvents: 'none',
            opacity: 0.98,
            // Hide content immediately during collapse
            overflow: 'hidden',
            // Keep smooth transition for collapse animation
            transition: `top 200ms cubic-bezier(0.22, 1, 0.36, 1), left 200ms cubic-bezier(0.22, 1, 0.36, 1), width 200ms cubic-bezier(0.22, 1, 0.36, 1), height 200ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }
        : prev
    ));

    // Clean up after animation completes
    const TRANSITION_MS = 200;
    window.setTimeout(() => {
      setBackdropVisible(false);
      setOverlayHTML('');
      unlockBodyScroll();
      setExpandedIndex(null);
      setExpandedStyle(null);
      setOriginalRect(null);
      setIsCollapsing(false);
    }, TRANSITION_MS);
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Phraze Overview',
          text: 'Listen to the overview of Phraze - an interactive platform for annotating conversations with AI models.',
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Shareable link copied to clipboard!', 'success');
      } catch (err) {
        console.log('Failed to copy to clipboard');
      }
    }
  };



  return (
    <section className="hero" ref={timelineSectionRef}>
      <div className="container">
        <div className="hero-content-centered">
          <div className="hero-date">
            <span style={{ fontSize: '16px' }}>September 1st, 2025</span>
          </div>
          <h1 className="hero-title" style={{
            fontFamily: '"Inter", "Inter Fallback", sans-serif'
          }}>Introducing Phraze</h1>
          <p className="hero-description" style={{ fontSize: '16px' }}>
            A collaborative workspace and living notebook for every AI conversation
          </p>
                      <div className="hero-cta">
              <a href="#get-started" className="btn btn-primary btn-hero" style={{ fontSize: '18px' }}>
                Start Annotating
              </a>
              <a href="#demo" className="btn btn-secondary btn-hero" style={{ fontSize: '18px' }}>
                See How It Works
              </a>
              {/* Decorative icons near call-to-action removed per request (limit to 4 icons total) */}
            </div>
            <div className="hero-samples">
              {/* Decorative icons around Overview (no fade) */}
              <div className="overview-floating-icons" aria-hidden="true">
                {/* Left side: Comments (top), Users (lower) */}
                <span className="floating-pill-icon fp-chat overview-left-top"><i className="fas fa-comments"></i></span>
                <span className="floating-pill-icon fp-users overview-left-bottom"><i className="fas fa-users"></i></span>
                {/* Right side: Highlighter (top), Book (lower) */}
                <span className="floating-pill-icon fp-highlighter overview-right-top"><i className="fas fa-highlighter"></i></span>
                <span className="floating-pill-icon fp-book overview-right-bottom"><i className="fas fa-book-open"></i></span>
              </div>
              <div className="audio-player-compact">
                <button 
                  className={`audio-play-btn-compact ${isPlaying ? 'playing' : ''}`}
                  onClick={handlePlayPause}
                  aria-label={isPlaying ? "Pause overview audio" : "Play overview audio"}
                >
                  <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                </button>
                
                <div className="audio-time-display">
                  {formatTime(currentTime)}
                </div>
                
                <div className="audio-speed-controls">
                  {[0.5, 1, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                      onClick={() => handleSpeedChange(speed)}
                      aria-label={`Play at ${speed}x speed`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
                
                <button 
                  className="audio-share-btn-compact" 
                  onClick={handleShare}
                  aria-label="Share overview"
                >
                  <i className="fas fa-share"></i>
                </button>
                
                <audio
                  ref={audioRef}
                  onEnded={() => setIsPlaying(false)}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                >
                  <source src="/voice.mp3" type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
              <h2 className="samples-title" style={{
                fontFamily: '"Inter", "Inter Fallback", sans-serif',
                fontSize: '1.7rem'
              }}>Overview</h2>
              <p className="samples-description">
                Phraze is a collaborative workspace for conversations with language models. Instead of exporting transcripts or switching between platforms, teams can work directly in the chat thread. With built-in labels, notes, and annotations, Phraze organizes discussions and captures insights as they happen.
              </p>
              <p className="samples-description">
                The future of language models is not individuals talking to isolated agents, but shared spaces where users can collaborate. Phraze enables teams to engage with an AI collectively, annotate in real time, exchange ideas, and make informed decisions together. Collaboration is built in at the core.
              </p>
              <p className="samples-description" style={{ marginBottom: '8rem' }}>
                Unlike traditional tools that leave dialogue static, Phraze keeps everything in context and transforms conversations into a living workspace. Try it now at phrazeapp.ai.
              </p>
              
              <div
                ref={heroWorkflowRef}
                className="hero-workflow"
                style={{
                  position: 'relative',
                  marginBottom: reserveSpace,
                  transition: 'margin-bottom 520ms cubic-bezier(0.22, 1, 0.36, 1)',
                  animation: 'fadeInUp 0.8s ease-out forwards',
                  opacity: 0,
                  transform: 'translateY(30px)'
                }}
              >
                <div className="workflow-header" style={{
                  textAlign: 'center',
                  marginBottom: '2rem'
                }}>
                  <h3 
                    className="workflow-title"
                    style={{
                      fontSize: '1.7rem',
                      fontWeight: '700',
                      color: '#1a1a1a',
                      marginBottom: '1.5rem',
                      marginTop: 0,
                      fontFamily: '"Inter", "Inter Fallback", sans-serif',
                      animation: 'fadeInUp 0.8s ease-out 0.2s forwards',
                      opacity: 0,
                      transform: 'translateY(30px)'
                    }}
                  >
                    How it works
                  </h3>
                  <p style={{
                    fontSize: '18px',
                    color: '#666',
                    maxWidth: '600px',
                    margin: '0 auto',
                    lineHeight: '1.6',
                    marginBottom: '0',
                    fontFamily: '"Inter", "Inter Fallback", sans-serif',
                    animation: 'fadeInUp 0.8s ease-out 0.3s forwards',
                    opacity: 0,
                    transform: 'translateY(30px)'
                  }}>Discover the simple three-step process that makes conversation analysis effortless and insightful</p>
                </div>
                <div 
                  ref={timelineGridRef} 
                  className={`workflow-timeline ${showExpandIcons ? 'show-icons' : ''}`}
                  style={{
                    animation: 'fadeInUp 0.8s ease-out 0.4s forwards',
                    opacity: 0,
                    transform: 'translateY(30px)'
                  }}
                >
                  <div className="timeline-card-wrapper" ref={(el) => (wrapperRefs.current[0] = el)}>
                    <div
                      ref={(el) => (cardRefs.current[0] = el)}
                      className={"timeline-card"}
                    >
                      <button
                        type="button"
                        className="card-expand-btn"
                        aria-label="Expand card"
                        aria-expanded={expandedIndex === 0 && !isCollapsing}
                        onClick={(e) => {
                          e.stopPropagation();
                          expandedIndex === 0 ? collapseExpanded() : expandCard(0);
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <polyline points="9 21 3 21 3 15"></polyline>
                          <line x1="21" y1="3" x2="14" y2="10"></line>
                          <line x1="3" y1="21" x2="10" y2="14"></line>
                        </svg>
                      </button>
                      <div className="timeline-card-inner">
                    <div className="step-header">
                      <div className="step-icon chat-icon">
                        <i className="fa-solid fa-comments"></i>
                        <div className="step-number">1</div>
                      </div>
                    </div>
                    <div className="step-content">
                      <h4 style={{ fontFamily: '"Inter", "Inter Fallback", sans-serif', fontSize: '1.125rem', fontWeight: '500', color: '#111827' }}>Chat with Phraze AI</h4>
                      <p>Start conversations and generate content with our AI</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="timeline-card-wrapper" ref={(el) => (wrapperRefs.current[1] = el)}>
                    <div
                      ref={(el) => (cardRefs.current[1] = el)}
                      className={"timeline-card"}
                    >
                      <button
                        type="button"
                        className="card-expand-btn"
                        aria-label="Expand card"
                        aria-expanded={expandedIndex === 1 && !isCollapsing}
                        onClick={(e) => {
                          e.stopPropagation();
                          expandedIndex === 1 ? collapseExpanded() : expandCard(1);
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <polyline points="9 21 3 21 3 15"></polyline>
                          <line x1="21" y1="3" x2="14" y2="10"></line>
                          <line x1="3" y1="21" x2="10" y2="14"></line>
                        </svg>
                      </button>
                      <div className="timeline-card-inner">
                    <div className="step-header">
                      <div className="step-icon annotate-icon">
                        <i className="fa-solid fa-quote-left"></i>
                        <div className="step-number">2</div>
                      </div>
                    </div>
                    <div className="step-content">
                      <h4 style={{ fontFamily: '"Inter", "Inter Fallback", sans-serif', fontSize: '1.125rem', fontWeight: '500', color: '#111827' }}>Annotate Your Chat</h4>
                      <p>Add labels, codes, and notes to organize conversations</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="timeline-card-wrapper" ref={(el) => (wrapperRefs.current[2] = el)}>
                    <div
                      ref={(el) => (cardRefs.current[2] = el)}
                      className={"timeline-card"}
                    >
                      <button
                        type="button"
                        className="card-expand-btn"
                        aria-label="Expand card"
                        aria-expanded={expandedIndex === 2 && !isCollapsing}
                        onClick={(e) => {
                          e.stopPropagation();
                          expandedIndex === 2 ? collapseExpanded() : expandCard(2);
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <polyline points="9 21 3 21 3 15"></polyline>
                          <line x1="21" y1="3" x2="14" y2="10"></line>
                          <line x1="3" y1="21" x2="10" y2="14"></line>
                        </svg>
                      </button>
                      <div className="timeline-card-inner">
                    <div className="step-header">
                      <div className="step-icon collaborate-icon">
                        <i className="fa-solid fa-share"></i>
                        <div className="step-number">3</div>
                      </div>
                    </div>
                    <div className="step-content">
                      <h4 style={{ fontFamily: '"Inter", "Inter Fallback", sans-serif', fontSize: '1.125rem', fontWeight: '500', color: '#111827' }}>Collaborate & Share</h4>
                      <p>Work with your team to review and improve together</p>
                    </div>
                  </div>
                </div>
                {/* Auto cursor overlays disabled to avoid off-screen cursor on load */}
                <TimelineShareAutoCursor active={false} />
              </div>
                </div>
              </div>
              {/* Overlay clone (keeps original card fixed in place) */}
              {expandedIndex !== null && overlayHTML && (
                <div
                  className="timeline-card timeline-card--overlay"
                  style={{ ...expandedStyle, pointerEvents: 'auto' } || undefined}
                  onClick={(e) => {
                    const target = e.target;
                    const closestBtn = target && target.closest ? target.closest('.card-expand-btn') : null;
                    if (closestBtn) {
                      e.preventDefault();
                      e.stopPropagation();
                      collapseExpanded();
                      return;
                    }
                    e.stopPropagation();
                  }}
                >
                  <button
                    type="button"
                    className="card-expand-btn"
                    aria-label="Collapse expanded card"
                    onClick={(e) => { e.stopPropagation(); collapseExpanded(); }}
                  >
                    {isCollapsing ? (
                      // Show expand-outward icon immediately when collapsing
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <polyline points="9 21 3 21 3 15"></polyline>
                        <line x1="21" y1="3" x2="14" y2="10"></line>
                        <line x1="3" y1="21" x2="10" y2="14"></line>
                      </svg>
                    ) : (
                      // Collapse-inward icon while expanded
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="9 3 3 3 3 9"></polyline>
                        <polyline points="15 21 21 21 21 15"></polyline>
                        <line x1="3" y1="3" x2="10" y2="10"></line>
                        <line x1="21" y1="21" x2="14" y2="14"></line>
                      </svg>
                    )}
                  </button>
                  <div ref={expandedOverlayRef} data-expanded-overlay-host style={{ position: 'relative', padding: '1rem 1rem 1.5rem', opacity: overlayContentVisible ? 1 : 0, transition: 'opacity 200ms ease', height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
                    {expandedIndex === 0 ? (
                      <DemoPreviewThread />
                    ) : expandedIndex === 1 ? (
                      <DemoPreviewThread disableScroll maxMessages={3} instant swipeToBlankOnHighlightEnd />
                    ) : expandedIndex === 2 ? (
                      <DemoPreviewThread disableScroll maxMessages={3} instant forceFinalSnapshot />
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: overlayHTML }} />
                    )}
                    <ShareOverlayAutoCursor active={expandedIndex === 2 && autoShareOverlayActive} />
                  </div>
                </div>
              )}
              {/* Backdrop */}
              <div
                className={`expansion-backdrop ${backdropVisible ? 'visible' : ''}`}
                onClick={collapseExpanded}
                aria-hidden={!backdropVisible}
              />
            </div>
            

        </div>
      </div>
    </section>
  );
} 