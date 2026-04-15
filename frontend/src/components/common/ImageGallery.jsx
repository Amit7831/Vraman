/**
 * components/common/ImageGallery.jsx
 *
 * Reusable e-commerce-style image gallery used on all detail pages:
 *   HotelDetails, BikeDetails, CabDetails, ServiceDetails
 *
 * Features:
 *  - Large main image with smooth fade transition
 *  - Thumbnail strip with active highlight border
 *  - Click thumbnail → updates main image instantly
 *  - Click main image → cycles to next
 *  - Keyboard arrow support
 *  - Fallback default image per service type
 *  - Fullscreen lightbox on long-press / Expand button
 *  - Mobile swipe carousel
 *  - Lazy loading on thumbnails
 *  - Image counter badge
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn } from 'lucide-react';

const DEFAULTS = {
  hotel:   'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
  bike:    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=900&q=80',
  cab:     'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=900&q=80',
  bus:     'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900&q=80',
  service: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80',
  default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900&q=80',
};

export default function ImageGallery({ images = [], alt = '', type = 'default', height = 420 }) {
  // Normalize — merge single & array, dedupe, filter empty
  const allImages = [...new Set([...images])].filter(Boolean);
  if (!allImages.length) allImages.push(DEFAULTS[type] || DEFAULTS.default);

  const [active,    setActive]    = useState(0);
  const [prev,      setPrev]      = useState(null);
  const [fading,    setFading]    = useState(false);
  const [lightbox,  setLightbox]  = useState(false);
  const [lbIdx,     setLbIdx]     = useState(0);
  const thumbsRef = useRef(null);

  // Touch swipe state
  const touchStartX = useRef(null);

  const goto = useCallback((idx) => {
    if (idx === active || fading) return;
    setPrev(active);
    setFading(true);
    setTimeout(() => { setActive(idx); setFading(false); }, 180);
  }, [active, fading]);

  const prev1 = () => goto((active - 1 + allImages.length) % allImages.length);
  const next1 = () => goto((active + 1) % allImages.length);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (lightbox) {
        if (e.key === 'ArrowLeft')  setLbIdx(i => (i - 1 + allImages.length) % allImages.length);
        if (e.key === 'ArrowRight') setLbIdx(i => (i + 1) % allImages.length);
        if (e.key === 'Escape')     setLightbox(false);
      } else {
        if (e.key === 'ArrowLeft')  prev1();
        if (e.key === 'ArrowRight') next1();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, lightbox, allImages.length]);

  // Scroll active thumb into view
  useEffect(() => {
    const container = thumbsRef.current;
    if (!container) return;
    const thumb = container.children[active];
    if (thumb) thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [active]);

  const openLightbox = (idx) => { setLbIdx(idx); setLightbox(true); };

  // Swipe
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) next1();
    else if (diff < -50) prev1();
    touchStartX.current = null;
  };

  return (
    <>
      {/* ── Main gallery ─────────────────────────────────────── */}
      <div style={{ userSelect: 'none' }}>
        {/* Main image */}
        <div
          style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', height, background: '#0d1117', cursor: allImages.length > 1 ? 'pointer' : 'zoom-in' }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={() => allImages.length > 1 ? next1() : openLightbox(active)}
        >
          {/* Current image */}
          <img
            src={allImages[active]}
            alt={alt}
            loading="eager"
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              transition: 'opacity 0.18s ease',
              opacity: fading ? 0 : 1,
            }}
            onError={e => { e.target.src = DEFAULTS[type] || DEFAULTS.default; }}
          />

          {/* Dark gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 50%)', pointerEvents: 'none' }} />

          {/* Image counter */}
          {allImages.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 14, left: 14,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
              color: '#fff', fontSize: 12, fontWeight: 600,
              padding: '4px 10px', borderRadius: 20,
            }}>
              {active + 1} / {allImages.length}
            </div>
          )}

          {/* Expand button */}
          <button
            onClick={e => { e.stopPropagation(); openLightbox(active); }}
            style={{
              position: 'absolute', bottom: 14, right: 14,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
              border: 'none', color: '#fff', cursor: 'pointer',
              width: 34, height: 34, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Full screen"
          >
            <Maximize2 size={15} />
          </button>

          {/* Prev / Next arrows */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev1(); }}
                style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                  border: 'none', color: '#fff', cursor: 'pointer',
                  width: 36, height: 36, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.75)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); next1(); }}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                  border: 'none', color: '#fff', cursor: 'pointer',
                  width: 36, height: 36, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.75)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Dot indicators for mobile */}
          {allImages.length > 1 && allImages.length <= 8 && (
            <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
              {allImages.map((_, i) => (
                <button key={i}
                  onClick={e => { e.stopPropagation(); goto(i); }}
                  style={{
                    width: i === active ? 20 : 6, height: 6,
                    borderRadius: 3, border: 'none', cursor: 'pointer',
                    background: i === active ? '#fff' : 'rgba(255,255,255,0.45)',
                    transition: 'all 0.2s', padding: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {allImages.length > 1 && (
          <div
            ref={thumbsRef}
            style={{
              display: 'flex', gap: 8, marginTop: 10,
              overflowX: 'auto', paddingBottom: 4,
              scrollbarWidth: 'thin',
            }}
          >
            {allImages.map((img, i) => (
              <button key={i}
                onClick={() => goto(i)}
                style={{
                  flexShrink: 0, width: 72, height: 52,
                  padding: 0, border: 'none', borderRadius: 8,
                  overflow: 'hidden', cursor: 'pointer',
                  outline: i === active ? '2px solid var(--brand-primary)' : '2px solid transparent',
                  outlineOffset: 2,
                  opacity: i === active ? 1 : 0.62,
                  transition: 'opacity 0.2s, outline 0.15s, transform 0.15s',
                  transform: i === active ? 'scale(1.05)' : 'scale(1)',
                }}
                onMouseEnter={e => { if (i !== active) e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={e => { if (i !== active) e.currentTarget.style.opacity = '0.62'; }}
              >
                <img
                  src={img} alt={`View ${i + 1}`}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { e.target.src = DEFAULTS[type] || DEFAULTS.default; }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ──────────────────────────────────────────── */}
      {lightbox && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(false)}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,0.12)', border: 'none',
              color: '#fff', cursor: 'pointer', width: 40, height: 40,
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>

          {/* Counter */}
          <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 14, fontWeight: 600 }}>
            {lbIdx + 1} / {allImages.length}
          </div>

          {/* Prev */}
          {allImages.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLbIdx(i => (i - 1 + allImages.length) % allImages.length); }}
              style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Image */}
          <img
            src={allImages[lbIdx]}
            alt={alt}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '85vh',
              objectFit: 'contain', borderRadius: 12,
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            }}
          />

          {/* Next */}
          {allImages.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLbIdx(i => (i + 1) % allImages.length); }}
              style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Thumb strip in lightbox */}
          {allImages.length > 1 && (
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
              {allImages.map((img, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setLbIdx(i); }}
                  style={{ width: 48, height: 34, padding: 0, border: 'none', borderRadius: 5, overflow: 'hidden', cursor: 'pointer', outline: i === lbIdx ? '2px solid #fff' : 'none', opacity: i === lbIdx ? 1 : 0.5, transition: 'all 0.15s' }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
