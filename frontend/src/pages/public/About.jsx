import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Plane, Shield, Star, Users, TrendingUp, Heart, Award, MapPin, ArrowRight, Zap, Globe, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

/* ─── Data ─────────────────────────────────────────────────── */
const TEAM = [
  { name: 'Amitranjan Malik',  role: 'CEO & Founder',         avatar: 'AM', color: '#FF6B35', bg: 'linear-gradient(135deg,#FF6B35,#FF9A5C)' },
  { name: 'Chitaranjan Maharana',   role: 'Head of Product',       avatar: 'CM', color: '#FFD700', bg: 'linear-gradient(135deg,#FFD700,#FFAA00)' },
  { name: 'Soumyaranjan Dash',   role: 'Lead Engineer',         avatar: 'SD', color: '#2DCBA4', bg: 'linear-gradient(135deg,#2DCBA4,#00A080)' },
  { name: 'Praginta Behera', role: 'Customer Success Lead', avatar: 'PB', color: '#818CF8', bg: 'linear-gradient(135deg,#818CF8,#5B5FCF)' },
  { name: 'Madhusmita Nayak', role: 'Marketing Manager', avatar: 'MN', color: '#F472B6', bg: 'linear-gradient(135deg,#F472B6,#EC4899)' 
  },
];

const VALUES = [
  { icon: <Heart size={24}/>,       title: 'Customer First',    desc: "Every feature we build starts with one question: does this make the traveler's life easier?",     accent: '#FF6B35' },
  { icon: <Shield size={24}/>,      title: 'Trust & Safety',    desc: 'Razorpay-secured payments, verified listings, and HMAC-signed transactions protect you every step.', accent: '#2DCBA4' },
  { icon: <Star size={24}/>,        title: 'Quality Always',    desc: 'We curate every hotel, route, and package for reliability and genuine value for money.',              accent: '#FFD700' },
  { icon: <TrendingUp size={24}/>,  title: 'Always Improving',  desc: 'Our platform learns from every booking to deliver a smarter, faster, more personal experience.',      accent: '#818CF8' },
];

const MILESTONES = [
  { year: '2021', event: 'Vraman founded in Bhubaneswar',              icon: <Zap size={14}/> },
  { year: '2022', event: '100K travelers served across 15 states',   icon: <Users size={14}/> },
  { year: '2023', event: 'Launched vendor platform & tour packages', icon: <Globe size={14}/> },
  { year: '2024', event: 'Razorpay integration & mobile app beta',   icon: <Shield size={14}/> },
  { year: '2025', event: '2M+ happy travelers and growing 🚀',       icon: <Star size={14}/> },
];

const STATS = [
  { value: '2M+',  label: 'Happy Travelers', icon: <Heart size={18}/> },
  { value: '500+', label: 'Destinations',    icon: <MapPin size={18}/> },
  { value: '10K+', label: 'Listings',        icon: <Globe size={18}/> },
  { value: '4.8★', label: 'Avg Rating',      icon: <Star size={18}/> },
];

/* ─── Animation helpers ─────────────────────────────────────── */
function FadeUp({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ─── Floating orb background ───────────────────────────────── */
function Orb({ style }) {
  return (
    <div style={{
      position: 'absolute', borderRadius: '50%',
      filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
      ...style
    }} />
  );
}

/* ─── Marquee strip ─────────────────────────────────────────── */
const MARQUEE_ITEMS = ['Hotels', 'Bus Tickets', 'Cab Rentals', 'Bike Rentals', 'Tour Packages', 'Flights', 'Adventures', 'Pilgrimages', 'Beaches', 'Heritage Sites'];

function MarqueeStrip() {
  return (
    <div style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,107,53,0.2)', borderBottom: '1px solid rgba(255,107,53,0.2)', background: 'rgba(255,107,53,0.04)', padding: '14px 0' }}>
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
      `}</style>
      <div style={{ display: 'flex', width: 'max-content', animation: 'marquee 22s linear infinite', gap: 0 }}>
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '0 28px', color: 'var(--brand-muted)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--brand-primary)', fontSize: 8 }}>◆</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Value Card ─────────────────────────────────────────────── */
function ValueCard({ v, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      style={{
        background: 'var(--brand-card)',
        borderRadius: 20,
        border: `1px solid rgba(255,255,255,0.07)`,
        padding: '32px 26px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 2, background: `linear-gradient(90deg, transparent, ${v.accent}, transparent)`, borderRadius: 1 }} />
      {/* Glow */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: v.accent, opacity: 0.06, borderRadius: '50%', filter: 'blur(30px)' }} />

      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${v.accent}18`, border: `1px solid ${v.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: v.accent, marginBottom: 20, position: 'relative', zIndex: 1 }}>
        {v.icon}
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 10, position: 'relative', zIndex: 1 }}>{v.title}</h3>
      <p style={{ color: 'var(--brand-muted)', fontSize: 14, lineHeight: 1.7, position: 'relative', zIndex: 1 }}>{v.desc}</p>
    </motion.div>
  );
}

/* ─── Team Card ─────────────────────────────────────────────── */
function TeamCard({ t, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      style={{
        background: 'var(--brand-card)',
        borderRadius: 22,
        border: '1px solid rgba(255,255,255,0.07)',
        padding: '32px 20px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)', width: 100, height: 100, background: t.color, opacity: 0.07, borderRadius: '50%', filter: 'blur(30px)' }} />
      
      {/* Avatar ring */}
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 18 }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, margin: '0 auto', boxShadow: `0 8px 30px ${t.color}35` }}>{t.avatar}</div>
        <div style={{ position: 'absolute', inset: -4, borderRadius: 26, border: `2px solid ${t.color}35`, zIndex: -1 }} />
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 5 }}>{t.name}</h3>
      <p style={{ color: t.color, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>{t.role}</p>
    </motion.div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function About() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', overflowX: 'hidden' }}>

      {/* ── Hero ───────────────────────────────────────────── */}
      <div ref={heroRef} style={{ position: 'relative', minHeight: '90vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* Animated background */}
        <Orb style={{ width: 600, height: 600, top: -200, left: -200, background: 'radial-gradient(circle, rgba(255,107,53,0.18) 0%, transparent 70%)' }} />
        <Orb style={{ width: 500, height: 500, top: 100, right: -150, background: 'radial-gradient(circle, rgba(0,78,137,0.25) 0%, transparent 70%)' }} />
        <Orb style={{ width: 300, height: 300, bottom: 50, left: '40%', background: 'radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%)' }} />

        {/* Grid pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity, width: '100%', position: 'relative', zIndex: 1 }}>
          <div className="container-app" style={{ textAlign: 'center', paddingTop: 80, paddingBottom: 80 }}>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 999, background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', marginBottom: 28 }}>
                <Award size={13} color="var(--brand-primary)" />
                <span style={{ color: 'var(--brand-primary)', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Our Story</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(36px,6vw,72px)', color: '#fff', lineHeight: 1.1, marginBottom: 24 }}
            >
              We're Rewriting How<br />
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span className="grad-text">India Travels</span>
                {/* Underline decoration */}
                <svg style={{ position: 'absolute', bottom: -8, left: 0, width: '100%' }} viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 8 Q75 2 150 8 Q225 14 298 8" stroke="url(#ul)" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <defs><linearGradient id="ul" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FF6B35"/><stop offset="100%" stopColor="#FFD700"/></linearGradient></defs>
                </svg>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              style={{ color: 'var(--brand-muted)', fontSize: 'clamp(15px,2vw,18px)', maxWidth: 580, margin: '0 auto 52px', lineHeight: 1.75 }}
            >
              Vraman started with a simple idea: booking travel in India should be as easy as sending a WhatsApp message. Three years later, we're the platform millions call home.
            </motion.p>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
            >
              {STATS.map(({ value, label, icon }) => (
                <div key={label} style={{
                  padding: '18px 28px', borderRadius: 16,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  minWidth: 120,
                }}>
                  <div style={{ color: 'var(--brand-primary)', opacity: 0.8 }}>{icon}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#fff', lineHeight: 1 }}>{value}</div>
                  <div style={{ color: 'var(--brand-muted)', fontSize: 12, fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </motion.div>

          </div>
        </motion.div>

        {/* Bottom fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to bottom, transparent, var(--brand-dark))', zIndex: 2 }} />
      </div>

      {/* ── Marquee ────────────────────────────────────────── */}
      <MarqueeStrip />

      {/* ── Mission statement ──────────────────────────────── */}
      <section style={{ padding: 'clamp(64px,10vw,120px) 0', position: 'relative' }}>
        <Orb style={{ width: 400, height: 400, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%)' }} />
        <div className="container-app" style={{ position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,107,53,0.08) 0%, rgba(0,78,137,0.12) 100%)',
              border: '1px solid rgba(255,107,53,0.2)',
              borderRadius: 28,
              padding: 'clamp(40px,6vw,72px)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Corner accents */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: 80, height: 80, borderTop: '2px solid rgba(255,107,53,0.4)', borderLeft: '2px solid rgba(255,107,53,0.4)', borderRadius: '28px 0 0 0' }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 80, height: 80, borderBottom: '2px solid rgba(255,107,53,0.4)', borderRight: '2px solid rgba(255,107,53,0.4)', borderRadius: '0 0 28px 0' }} />

              <div style={{ fontSize: 'clamp(15px,1.5vw,18px)', color: 'var(--brand-primary)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 }}>Our Mission</div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(22px,3.5vw,40px)', color: '#fff', lineHeight: 1.4, maxWidth: 780, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                "To make every journey across India feel <span className="grad-text">effortless, safe, and memorable</span> — for every traveler, everywhere."
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Values ─────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(40px,6vw,80px) 0 clamp(64px,10vw,120px)' }}>
        <div className="container-app">
          <FadeUp style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Why Choose Us</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px,4vw,44px)', color: '#fff' }}>
              What We Stand For
            </h2>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 20 }}>
            {VALUES.map((v, i) => <ValueCard key={v.title} v={v} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── Journey / Timeline ─────────────────────────────── */}
      <section style={{ padding: 'clamp(64px,10vw,120px) 0', background: 'var(--brand-surface)', position: 'relative', overflow: 'hidden' }}>
        <Orb style={{ width: 500, height: 500, top: -100, right: -200, background: 'radial-gradient(circle, rgba(0,78,137,0.2) 0%, transparent 70%)' }} />

        <div className="container-app" style={{ position: 'relative', zIndex: 1 }}>
          <FadeUp style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Since 2021</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px,4vw,44px)', color: '#fff' }}>Our Journey</h2>
          </FadeUp>

          <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative' }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: 22, top: 22, bottom: 22, width: 2, background: 'linear-gradient(to bottom, var(--brand-primary), rgba(255,107,53,0.1))' }} />

            {MILESTONES.map((m, i) => (
              <FadeUp key={m.year} delay={i * 0.1}>
                <div style={{ display: 'flex', gap: 24, marginBottom: i < MILESTONES.length - 1 ? 40 : 0, alignItems: 'flex-start' }}>
                  {/* Dot */}
                  <div style={{
                    width: 46, height: 46, borderRadius: 14,
                    background: i === MILESTONES.length - 1 ? 'var(--brand-primary)' : 'rgba(255,107,53,0.12)',
                    border: `2px solid ${i === MILESTONES.length - 1 ? 'var(--brand-primary)' : 'rgba(255,107,53,0.4)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, position: 'relative', zIndex: 1,
                    color: i === MILESTONES.length - 1 ? '#fff' : 'var(--brand-primary)',
                  }}>
                    {m.icon}
                  </div>

                  <div style={{ paddingTop: 10, flex: 1 }}>
                    <div style={{
                      display: 'inline-block', fontFamily: 'var(--font-display)', fontWeight: 800,
                      fontSize: 12, color: 'var(--brand-primary)', letterSpacing: 1,
                      background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.25)',
                      borderRadius: 6, padding: '2px 10px', marginBottom: 6
                    }}>{m.year}</div>
                    <p style={{ color: '#fff', fontSize: 16, fontWeight: 500, lineHeight: 1.5 }}>{m.event}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ───────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(64px,10vw,120px) 0', position: 'relative' }}>
        <Orb style={{ width: 400, height: 400, bottom: 0, left: -100, background: 'radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)' }} />
        <div className="container-app" style={{ position: 'relative', zIndex: 1 }}>
          <FadeUp style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>The People</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px,4vw,44px)', color: '#fff' }}>Meet the Team</h2>
            <p style={{ color: 'var(--brand-muted)', fontSize: 16, marginTop: 12 }}>The passionate humans building Vraman, one feature at a time.</p>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px,1fr))', gap: 20, maxWidth: 900, margin: '0 auto' }}>
            {TEAM.map((t, i) => <TeamCard key={t.name} t={t} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── Trust badges ───────────────────────────────────── */}
      <section style={{ padding: 'clamp(40px,6vw,72px) 0', background: 'var(--brand-surface)', borderTop: '1px solid var(--brand-border)', borderBottom: '1px solid var(--brand-border)' }}>
        <div className="container-app">
          <FadeUp>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                ['Razorpay Secured', Shield],
                ['Verified Listings', CheckCircle],
                ['24/7 Support', Users],
                ['4.8★ Rated App', Star],
                ['500+ Destinations', MapPin],
              ].map(([label, Icon]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Icon size={15} color="var(--brand-primary)" />
                  <span style={{ color: 'var(--brand-muted)', fontSize: 13, fontWeight: 600 }}>{label}</span>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(80px,12vw,140px) 0', position: 'relative', overflow: 'hidden' }}>
        <Orb style={{ width: 700, height: 700, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 60%)' }} />

        {/* Background decorative text */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(80px,15vw,180px)', color: 'rgba(255,255,255,0.02)', whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none', zIndex: 0, letterSpacing: -4 }}>
          VRAMAN
        </div>

        <div className="container-app" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 999, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', marginBottom: 28 }}>
              <Plane size={13} color="#FFD700" />
              <span style={{ color: '#FFD700', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Ready to Explore?</span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(30px,5vw,58px)', color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
              Your Next Adventure<br />
              <span className="grad-text">Starts Here.</span>
            </h2>

            <p style={{ color: 'var(--brand-muted)', fontSize: 'clamp(14px,1.5vw,17px)', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
              Join millions of travelers who trust Vraman for every trip across India.
            </p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '16px 32px', borderRadius: 14,
                background: 'linear-gradient(135deg, #FF6B35, #FF9A5C)',
                color: '#fff', textDecoration: 'none',
                fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)',
                boxShadow: '0 8px 32px rgba(255,107,53,0.35)',
                border: 'none',
              }}>
                Get Started Free <ArrowRight size={16} />
              </Link>
              <Link to="/contact" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '16px 32px', borderRadius: 14,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', textDecoration: 'none',
                fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)',
              }}>
                Contact Us
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

    </div>
  );
}