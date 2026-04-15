/**
 * src/pages/public/Home.jsx — UPGRADED
 * Full hero, stats, service tabs, featured sections, popular cities, CTA.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Hotel, Plane, Bus, Car, Bike, BookOpen,
  ArrowRight, MapPin, TrendingUp, Star, Shield, Zap, Users
} from 'lucide-react';
import SearchBox   from '../../components/search/SearchBox';
import ServiceCard from '../../components/cards/ServiceCard';
import HotelCard   from '../../components/cards/HotelCard';
import api         from '../../services/api';

const SERVICE_TABS = [
  { id: 'hotels',   label: 'Hotels',   icon: <Hotel    size={20} />, href: '/hotels'  },
  { id: 'flights',  label: 'Flights',  icon: <Plane    size={20} />, href: '/flights' },
  { id: 'buses',    label: 'Buses',    icon: <Bus      size={20} />, href: '/buses'   },
  { id: 'cabs',     label: 'Cabs',     icon: <Car      size={20} />, href: '/cabs'    },
  { id: 'bikes',    label: 'Bikes',    icon: <Bike     size={20} />, href: '/bikes'   },
  { id: 'packages', label: 'Packages', icon: <BookOpen size={20} />, href: '/service' },
];

const POPULAR_CITIES = [
  { name: 'Goa',     img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=75' },
  { name: 'Jaipur',  img: 'https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=400&q=75' },
  { name: 'Manali',  img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=75' },
  { name: 'Kerala',  img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=75' },
  { name: 'Ladakh',  img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=75' },
  { name: 'Andaman', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=75' },
   { name: 'Udaipur', img: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=400&q=75' },
  { name: 'Rishikesh', img: 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=400&q=75' },
  { name: 'Darjeeling', img: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=75' },
  { name: 'Shimla', img: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=400&q=75' },

];

const STATS = [
  { value: '2M+',  label: 'Happy Travelers' },
  { value: '500+', label: 'Destinations'    },
  { value: '10K+', label: 'Hotels Listed'   },
  { value: '4.8★', label: 'Avg. Rating'     },
];

const WHY_US = [
  { icon: <Zap   size={24} />, title: 'Instant Booking',   desc: 'Book flights, hotels & cabs in seconds. No waiting, no calls.' },
  { icon: <Shield size={24}/>, title: 'Secure Payments',   desc: 'Razorpay-powered checkout with HMAC-verified transactions.' },
  { icon: <Star  size={24} />, title: 'Best Price Guarantee', desc: 'We compare prices to get you the best deal every time.' },
  { icon: <Users size={24} />, title: '24/7 Support',      desc: 'Our team is always here to help you throughout your journey.' },
];

const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

export default function Home() {
  const [featuredServices, setFeaturedServices] = useState([]);
  const [featuredHotels,   setFeaturedHotels]   = useState([]);
  const [loadingS, setLoadingS] = useState(true);
  const [loadingH, setLoadingH] = useState(true);

  useEffect(() => {
    api.get('/service/get', { params: { availableOnly: true, limit: 4 } })
      .then(r => setFeaturedServices(r.data?.service || []))
      .catch(() => {})
      .finally(() => setLoadingS(false));

    api.get('/hotels', { params: { limit: 4, sort: 'rating' } })
      .then(r => setFeaturedHotels(r.data?.hotels || []))
      .catch(() => {})
      .finally(() => setLoadingH(false));
  }, []);

  return (
    <div>

      {/* ─── HERO ─── */}
      <section style={{
        minHeight: '90vh', display: 'flex', alignItems: 'center',
        background: 'linear-gradient(135deg, #0A0E1A 0%, #0F1629 55%, #1a0d00 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative blobs */}
        <div style={{ position: 'absolute', top: '8%',  right: '4%',  width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '3%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,78,137,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container-app" style={{ width: '100%', paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(28px,5vw,72px)', alignItems: 'center' }}>

            {/* Copy */}
            <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.22)', marginBottom: 24 }}>
                <TrendingUp size={14} color="var(--brand-primary)" />
                <span style={{ color: 'var(--brand-primary)', fontSize: 12, fontWeight: 700 }}>India's #1 Travel Platform</span>
              </div>

              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(36px,5.5vw,62px)', color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>
                Travel India<br />
                <span className="grad-text">Without Limits</span>
              </h1>

              <p style={{ color: 'var(--brand-muted)', fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
                Flights, hotels, buses, cabs, bikes & exclusive tour packages —
                all in one place. Instant booking. Secure payments.
              </p>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Link to="/flights" className="btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
                  <Plane size={18} /> Book Flights
                </Link>
                <Link to="/hotels" className="btn-outline" style={{ fontSize: 16, padding: '13px 28px' }}>
                  <Hotel size={18} /> Explore Hotels
                </Link>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginTop: 44 }}>
                {STATS.map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--brand-primary)' }}>{s.value}</div>
                    <div style={{ color: 'var(--brand-muted)', fontSize: 12 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Service tabs card */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }}>
              <div className="glass" style={{ borderRadius: 24, padding: 28 }}>
                <p style={{ color: 'var(--brand-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                  What are you looking for?
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {SERVICE_TABS.map(tab => (
                    <Link key={tab.id} to={tab.href}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        padding: '16px 8px', borderRadius: 14, textDecoration: 'none',
                        border: '1px solid var(--brand-border)',
                        background: 'rgba(255,255,255,0.04)', transition: 'all 0.2s',
                        color: 'var(--brand-muted)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background   = 'rgba(255,107,53,0.12)';
                        e.currentTarget.style.borderColor  = 'rgba(255,107,53,0.4)';
                        e.currentTarget.style.color        = 'var(--brand-primary)';
                        e.currentTarget.style.transform    = 'translateY(-3px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background   = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.borderColor  = 'var(--brand-border)';
                        e.currentTarget.style.color        = 'var(--brand-muted)';
                        e.currentTarget.style.transform    = 'none';
                      }}
                    >
                      {tab.icon}
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{tab.label}</span>
                    </Link>
                  ))}
                </div>

                <div style={{ marginTop: 20 }}>
                  <SearchBox />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ─── POPULAR CITIES ─── */}
      <section style={{ padding: 'clamp(48px,8vw,96px) 0' }}>
        <div className="container-app">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(22px,3vw,32px)', color: '#fff' }}>
              Popular Destinations
            </h2>
            <Link to="/hotels" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {POPULAR_CITIES.map(city => (
              <Link key={city.name} to={`/hotels?city=${city.name}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    position: 'relative', borderRadius: 16, overflow: 'hidden',
                    aspectRatio: '3/4', cursor: 'pointer',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none';         e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <img src={city.img} alt={city.name} loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                  <div style={{ position: 'absolute', bottom: 14, left: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={13} color="var(--brand-primary)" />
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff' }}>{city.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED PACKAGES ─── */}
      <section style={{ padding: 'clamp(40px,6vw,80px) 0', background: 'var(--brand-surface)' }}>
        <div className="container-app">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(22px,3vw,32px)', color: '#fff' }}>
              Tour Packages
            </h2>
            <Link to="/service" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              View all <ArrowRight size={16} />
            </Link>
          </div>
          {loadingS ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 16 }} />)}
            </div>
          ) : featuredServices.length === 0 ? (
            <p style={{ color: 'var(--brand-muted)', textAlign: 'center', padding: '40px 0' }}>No packages available yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {featuredServices.map(s => <ServiceCard key={s._id} service={s} />)}
            </div>
          )}
        </div>
      </section>

      {/* ─── FEATURED HOTELS ─── */}
      <section style={{ padding: 'clamp(40px,6vw,80px) 0' }}>
        <div className="container-app">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(22px,3vw,32px)', color: '#fff' }}>
              Top Hotels
            </h2>
            <Link to="/hotels" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              View all <ArrowRight size={16} />
            </Link>
          </div>
          {loadingH ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 16 }} />)}
            </div>
          ) : featuredHotels.length === 0 ? (
            <p style={{ color: 'var(--brand-muted)', textAlign: 'center', padding: '40px 0' }}>No hotels available yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {featuredHotels.map(h => <HotelCard key={h._id} hotel={h} />)}
            </div>
          )}
        </div>
      </section>

      

      {/* ─── CTA Banner ─── */}
      <section style={{
        padding: 'clamp(48px,8vw,96px) 0',
        background: 'linear-gradient(135deg, rgba(255,107,53,0.12) 0%, rgba(0,78,137,0.12) 100%)',
        borderTop: '1px solid var(--brand-border)',
        borderBottom: '1px solid var(--brand-border)',
      }}>
        <div className="container-app" style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px,4vw,42px)', color: '#fff', marginBottom: 16 }}>
            Ready to Start Your<br /><span className="grad-text">Next Adventure?</span>
          </h2>
          <p style={{ color: 'var(--brand-muted)', fontSize: 17, maxWidth: 480, margin: '0 auto 32px' }}>
            Join 2 million+ travelers who trust Vraman for seamless trips across India.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/flights" className="btn-outline" style={{ fontSize: 16, padding: '13px 32px' }}>
              <Plane size={18} /> Search Flights
            </Link>
          </div>
        </div>
      </section>

      
      {/* ─── WHY VRAMAN ─── */}
      <section style={{ padding: 'clamp(48px,8vw,96px) 0', background: 'var(--brand-surface)' }}>
        <div className="container-app">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px,3.5vw,38px)', color: '#fff', marginBottom: 12 }}>
              Why Choose <span className="grad-text">Vraman?</span>
            </h2>
            <p style={{ color: 'var(--brand-muted)', maxWidth: 480, margin: '0 auto' }}>
              We're building the smartest travel platform in India.
            </p>
          </div>
          <motion.div
            variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}
          >
            {WHY_US.map(item => (
              <motion.div key={item.title} variants={fadeUp}
                style={{
                  background: 'var(--brand-card)', borderRadius: 18,
                  border: '1px solid var(--brand-border)', padding: '28px 24px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,107,53,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--brand-border)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,107,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)', marginBottom: 16 }}>
                  {item.icon}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#fff', marginBottom: 8 }}>{item.title}</h3>
                <p style={{ color: 'var(--brand-muted)', fontSize: 14, lineHeight: 1.6 }}>{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    </div>
  );
}
