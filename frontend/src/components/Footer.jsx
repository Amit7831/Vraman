import { Link } from 'react-router-dom';
import { Plane, Mail, Phone, MapPin, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react';

const LINKS = {
  'Explore': [
    { to: '/hotels',  label: 'Hotels'    },
    { to: '/flights', label: 'Flights'   },
    { to: '/buses',   label: 'Buses'     },
    { to: '/cabs',    label: 'Cabs'      },
    { to: '/bikes',   label: 'Bikes'     },
    { to: '/service', label: 'Packages'  },
  ],
  'Company': [
    { to: '/about',   label: 'About Us'  },
    { to: '/contact', label: 'Contact'   },
    { to: '/vendor-register', label: 'Become a Vendor' },
  ],
};

const SOCIALS = [
  { icon: <Instagram size={18} />, href: 'https://www.instagram.com/' },
  { icon: <Twitter   size={18} />, href: 'https://x.com/' },
  { icon: <Facebook  size={18} />, href: 'https://www.facebook.com/' },
  { icon: <Linkedin  size={18} />, href: 'https://www.linkedin.com/' },
];

export default function Footer() {
  return (
    <footer style={{ background: 'var(--brand-surface)', borderTop: '1px solid var(--brand-border)', paddingTop: 56, paddingBottom: 32 }}>
      <div className="container-app">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, marginBottom: 48 }}>

          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#FF6B35,#FFD700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plane size={18} color="#fff" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#fff' }}>
                Vra<span style={{ color: 'var(--brand-primary)' }}>man</span>
              </span>
            </Link>
            <p style={{ color: 'var(--brand-muted)', fontSize: 13, lineHeight: 1.7, maxWidth: 240, marginBottom: 20 }}>
              India's smartest travel platform. Book flights, hotels, buses and more — all in one place.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {SOCIALS.map((s, i) => (
                <a key={i} href={s.href} target="_blank"
                  style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--brand-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-muted)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.color = 'var(--brand-primary)'; e.currentTarget.style.background = 'rgba(255,107,53,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--brand-border)';  e.currentTarget.style.color = 'var(--brand-muted)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {section}
              </h4>
              <ul style={{ listStyle: 'none' }}>
                {links.map(l => (
                  <li key={l.to} style={{ marginBottom: 10 }}>
                    <Link to={l.to} style={{ color: 'var(--brand-muted)', textDecoration: 'none', fontSize: 14, transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-primary)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--brand-muted)'}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.8 }}>Contact</h4>
            {[
              { icon: <Mail size={14} />,   text: 'support@vraman.in' },
              { icon: <Phone size={14} />,  text: '+91 98765 43210'   },
              { icon: <MapPin size={14} />, text: 'Bhubaneswar, India'  },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, color: 'var(--brand-muted)', fontSize: 14 }}>
                <span style={{ color: 'var(--brand-primary)', flexShrink: 0 }}>{c.icon}</span> {c.text}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid var(--brand-border)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: 'var(--brand-muted)', fontSize: 13 }}>
            © {new Date().getFullYear()} Vraman Travel Pvt. Ltd. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(t => (
              <a key={t} href="#" style={{ color: 'var(--brand-muted)', fontSize: 12, textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--brand-muted)'}
              >
                {t}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
