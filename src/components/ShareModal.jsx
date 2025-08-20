import { useEffect, useRef, useState } from 'react';
import { showToast } from '../funcs';
import mayaImg from '../images/maya.png';
import alexImg from '../images/alex.png';
import priyaImg from '../images/priya.png';

export default function ShareModal({ isOpen, onClose }) {
  const dialogRef = useRef(null);
  const [publicShare, setPublicShare] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const shareBtnRef = useRef(null);
  const [autoCursorVisible, setAutoCursorVisible] = useState(false);
  const [autoCursorPos, setAutoCursorPos] = useState({ x: 0, y: 0 });
  const [autoCursorScale, setAutoCursorScale] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    const prevFocus = document.activeElement;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    try { window.dispatchEvent(new CustomEvent('share-modal:open')); } catch (_) {}
    const computeAnchor = () => {
      try {
        const host = document.querySelector('[data-expanded-overlay-host]');
        if (!host) { setAnchor(null); return; }
        const r = host.getBoundingClientRect();
        const width = Math.min(420, Math.max(320, r.width - 32));
        const left = Math.round(r.left + r.width / 2);
        const top = Math.round(r.top + (r.height / 2));
        const maxHeight = Math.max(240, Math.round(r.height - 48));
        setAnchor({ left, top, width, maxHeight });
      } catch (_) { setAnchor(null); }
    };
    computeAnchor();
    const ro = new ResizeObserver(() => computeAnchor());
    const host = document.querySelector('[data-expanded-overlay-host]');
    if (host) ro.observe(host);
    const onScroll = () => computeAnchor();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    setTimeout(() => {
      dialogRef.current?.focus();
      setFadeIn(true);
    }, 0);

    // Automated cursor: move to big Share button and click
    const startAuto = () => {
      const btn = shareBtnRef.current;
      if (!btn) return;
      // allow layout to settle and give user time to read
      const kickoff = window.setTimeout(() => {
        const r = btn.getBoundingClientRect();
        // Start slightly above-left, glide to center of button
        const startX = Math.max(0, r.left - 120);
        const startY = Math.max(0, r.top - 80);
        const targetX = Math.round(r.left + r.width / 2);
        const targetY = Math.round(r.top + r.height / 2);
        setAutoCursorPos({ x: startX, y: startY });
        setAutoCursorScale(1);
        setAutoCursorVisible(true);
        requestAnimationFrame(() => {
          setAutoCursorPos({ x: targetX, y: targetY });
        });
        const preClickMs = 900;
        const postClickLingerMs = 600;
        const t1 = window.setTimeout(() => {
          try { btn.click(); } catch (_) {}
          setAutoCursorScale(0.94);
        }, preClickMs);
        const t2 = window.setTimeout(() => {
          setAutoCursorVisible(false);
        }, preClickMs + postClickLingerMs);
        cleanup.timers.push(t1, t2);
      }, 2800);
      const cleanup = { timers: [kickoff] };
      return () => { cleanup.timers.forEach((id) => window.clearTimeout(id)); };
    };
    const cleanupAuto = startAuto();

    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      try { ro.disconnect(); } catch (_) {}
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      setFadeIn(false);
      try { window.dispatchEvent(new CustomEvent('share-modal:close')); } catch (_) {}
      try { if (cleanupAuto) cleanupAuto(); } catch (_) {}
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const users = [
    {
              name: 'Jin Liner',
      avatar: mayaImg,
      link: window.location.href,
      email: 'maya.kapoor@gmail.com',
    },
    {
      name: 'Alex Kim',
      avatar: alexImg,
      link: window.location.href,
      email: 'alex.kim@gmail.com',
    },
    {
              name: 'Paige Lamar',
      avatar: priyaImg,
      link: window.location.href,
      email: 'priya.shah@gmail.com',
    },
  ];

  const shareCurrent = async () => {
    // Pure frontend demo: no clipboard, no system share, no toast.
    setFadeIn(false);
    setTimeout(() => onClose?.(), 220);
  };

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'transparent',
        display: 'flex', alignItems: 'stretch', justifyContent: 'center',
        zIndex: 1000003
      }}
    >
      {/* Auto-cursor overlay */}
      {autoCursorVisible && (
        <div style={{ position: 'fixed', top: 0, left: 0, transform: `translate3d(${autoCursorPos.x}px, ${autoCursorPos.y}px, 0) scale(${autoCursorScale}) rotate(-8deg)`, transition: 'transform 900ms cubic-bezier(0.22, 1, 0.36, 1), opacity 360ms ease', opacity: autoCursorVisible ? 1 : 0, pointerEvents: 'none', zIndex: 2147483646 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }}>
            <path fill="#FFF" stroke="#000" strokeWidth="1.25" d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z"></path>
          </svg>
        </div>
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
        tabIndex={-1}
        style={{
          position: 'relative', background: '#ffffff', border: '1px solid #e5e7eb',
          borderRadius: 12,
          width: anchor ? `${anchor.width}px` : 'min(420px, 92%)',
          maxHeight: anchor ? `${anchor.maxHeight}px` : '70vh',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', color: '#111827',
          overflow: 'hidden',
          opacity: fadeIn ? 1 : 0,
          position: 'fixed',
          left: anchor ? `${anchor.left}px` : '50%',
          top: anchor ? `${anchor.top}px` : '50%',
          transform: 'translate(-50%, -50%)',
          transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease'
        }}
      >
        <div style={{ padding: '12px 12px 6px 12px' }}>
          <h2 id="share-modal-title" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Share Chat</h2>

          <div style={{ display: 'grid', rowGap: 10 }}>
            {users.map((u) => (
              <div key={u.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', border: '1px solid #e5e7eb', borderRadius: 10 }}>
                <img src={u.avatar} alt={u.name} width={36} height={36} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 600, lineHeight: 1.2, fontSize: 13 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.2 }}>{u.email}</div>
                </div>
                <button
                  type="button"
                  onClick={shareCurrent}
                  style={{
                    background: '#ffffff', color: '#111827', border: '1px solid #d1d5db', borderRadius: 10,
                    padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                  }}
                >Share</button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '10px 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#111827' }}>
            <input type="checkbox" checked={publicShare} onChange={(e) => setPublicShare(e.target.checked)} />
            Public Share
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: '#ffffff', color: '#111827', border: '1px solid #d1d5db', borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >Cancel</button>
            <button
              type="button"
              onClick={shareCurrent}
              ref={shareBtnRef}
              style={{ background: '#111827', color: '#ffffff', border: '1px solid #111827', borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >Share</button>
          </div>
        </div>
      </div>
    </div>
  );
}


