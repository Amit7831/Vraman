import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plane, Mail, Lock, User, Phone, Building2, MapPin, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';

export default function VendorRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    businessName: '', phone: '', address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6)       { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/vendor/register', form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="glass" style={{ borderRadius: 20, padding: 40, maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#fff', marginBottom: 10 }}>
            Application Submitted!
          </h2>
          <p style={{ color: 'var(--brand-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            Your vendor account has been created. An admin will review and approve your application. You'll be able to add services once approved.
          </p>
          <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#FF6B35,#FFD700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plane size={20} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#fff' }}>
              Vra<span style={{ color: 'var(--brand-primary)' }}>man</span>
            </span>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: '#fff', marginBottom: 6 }}>
            Become a Vendor
          </h1>
          <p style={{ color: 'var(--brand-muted)', fontSize: 14 }}>
            Register your business and start listing services
          </p>
        </div>

        <div className="glass" style={{ borderRadius: 20, padding: 32 }}>
          {/* Notice banner */}
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16 }}>⏳</span>
            <p style={{ color: '#FFD700', fontSize: 13, lineHeight: 1.6 }}>
              After registration, an admin must approve your account before you can add services.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Personal info */}
            <div style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Personal Info</div>

            <InputRow icon={<User size={15} />}     placeholder="Full name"       value={form.name}     onChange={e => f('name', e.target.value)} />
            <InputRow icon={<Mail size={15} />}     placeholder="Email address"   value={form.email}    onChange={e => f('email', e.target.value)}    type="email" />
            <InputRow icon={<Lock size={15} />}     placeholder="Password"        value={form.password} onChange={e => f('password', e.target.value)} showToggle showPass={showPass} onToggle={() => setShowPass(p => !p)} />
            <InputRow icon={<Lock size={15} />}     placeholder="Confirm password" value={form.confirm} onChange={e => f('confirm', e.target.value)} type="password" />

            {/* Business info */}
            <div style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Business Info</div>

            <InputRow icon={<Building2 size={15} />} placeholder="Business name *" value={form.businessName} onChange={e => f('businessName', e.target.value)} />
            <InputRow icon={<Phone size={15} />}     placeholder="Phone number"    value={form.phone}        onChange={e => f('phone', e.target.value)}        type="tel" />
            <InputRow icon={<MapPin size={15} />}    placeholder="Business address" value={form.address}     onChange={e => f('address', e.target.value)} />

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Submitting…' : 'Apply as Vendor'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--brand-muted)', fontSize: 14, marginTop: 20 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function InputRow({ icon, type = 'text', placeholder, value, onChange, showToggle, showPass, onToggle }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-muted)', pointerEvents: 'none' }}>{icon}</span>
      <input
        type={showToggle ? (showPass ? 'text' : 'password') : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="input-field"
        style={{ paddingLeft: 40, paddingRight: showToggle ? 40 : 14 }}
      />
      {showToggle && (
        <button type="button" onClick={onToggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--brand-muted)', cursor: 'pointer' }}>
          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      )}
    </div>
  );
}
