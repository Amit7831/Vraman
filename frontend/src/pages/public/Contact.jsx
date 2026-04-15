import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import api from '../../services/api';

const CONTACT_INFO = [
  { icon: <Mail  size={20} />, label: 'Email',   value: 'support@vraman.in',  href: 'mailto:support@vraman.in' },
  { icon: <Phone size={20} />, label: 'Phone',   value: '+91 98765 43210',    href: 'tel:+919876543210' },
  { icon: <MapPin size={20}/>, label: 'Address', value: 'Connaught Place, New Delhi, India', href: null },
  { icon: <Clock  size={20}/>, label: 'Support', value: 'Mon–Sat, 9 AM – 8 PM IST', href: null },
];

export default function Contact() {
  const [form,    setForm]    = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [status,  setStatus]  = useState(null); // 'success' | 'error'
  const [msg,     setMsg]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setStatus(null);
    try {
      await api.post('/contact', form);
      setStatus('success');
      setMsg('Thank you! We\'ll get back to you within 24 hours.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setStatus('error');
      setMsg(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inp = (field, type = 'text', placeholder = '') => (
    <input
      type={type}
      className="input-field"
      placeholder={placeholder || field.charAt(0).toUpperCase() + field.slice(1)}
      value={form[field]}
      onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
      required
    />
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', paddingBottom: 80 }}>

      {/* Header */}
      <div className="page-hero">
        <div className="container-app" style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px,5vw,48px)', color: '#fff', marginBottom: 12 }}>
            Get in Touch
          </h1>
          <p style={{ color: 'var(--brand-muted)', fontSize: 17, maxWidth: 480, margin: '0 auto' }}>
            We're here to help with any questions about bookings, partnerships, or feedback.
          </p>
        </div>
      </div>

      <div className="container-app" style={{ paddingTop: 48 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40 }}>

          {/* Left: info */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 24 }}>
              Contact Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
              {CONTACT_INFO.map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, background: 'var(--brand-card)', border: '1px solid var(--brand-border)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,107,53,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)', flexShrink: 0 }}>
                    {c.icon}
                  </div>
                  <div>
                    <div style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{c.label}</div>
                    {c.href ? (
                      <a href={c.href} style={{ color: '#fff', fontSize: 14, textDecoration: 'none', transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = '#fff'}
                      >{c.value}</a>
                    ) : (
                      <div style={{ color: '#fff', fontSize: 14 }}>{c.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '20px 22px', borderRadius: 16, background: 'rgba(255,107,53,0.07)', border: '1px solid rgba(255,107,53,0.2)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--brand-primary)', marginBottom: 8 }}>
                🏢 Become a Vendor
              </h3>
              <p style={{ color: 'var(--brand-muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
                List your hotel, cab, bike or tour package on Vraman and reach millions of travelers.
              </p>
              <a href="/vendor-register" style={{ color: 'var(--brand-primary)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Apply now →
              </a>
            </div>
          </div>

          {/* Right: form */}
          <div>
            <div style={{ background: 'var(--brand-card)', borderRadius: 20, border: '1px solid var(--brand-border)', padding: 'clamp(24px,4vw,36px)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 24 }}>
                Send us a message
              </h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Name</label>
                    {inp('name', 'text', 'Your full name')}
                  </div>
                  <div>
                    <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</label>
                    {inp('email', 'email', 'your@email.com')}
                  </div>
                </div>

                <div>
                  <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Subject</label>
                  {inp('subject', 'text', 'How can we help?')}
                </div>

                <div>
                  <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Message</label>
                  <textarea
                    className="input-field"
                    placeholder="Tell us more about your inquiry…"
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    required
                    rows={5}
                    style={{ resize: 'vertical', minHeight: 120 }}
                  />
                </div>

                {status === 'success' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', fontSize: 14 }}>
                    <CheckCircle size={16} /> {msg}
                  </div>
                )}
                {status === 'error' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 14 }}>
                    <AlertCircle size={16} /> {msg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                >
                  <Send size={16} />
                  {loading ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
