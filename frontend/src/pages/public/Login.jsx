import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plane, Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function AuthLayout({ title, subtitle, children, link, linkText, linkTo }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 28 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#FF6B35,#FFD700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plane size={20} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#fff' }}>Vra<span style={{ color: 'var(--brand-primary)' }}>man</span></span>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#fff', marginBottom: 8 }}>{title}</h1>
          <p style={{ color: 'var(--brand-muted)', fontSize: 15 }}>{subtitle}</p>
        </div>
        <div className="glass" style={{ borderRadius: 20, padding: 36, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
          {children}
        </div>
        <p style={{ textAlign: 'center', color: 'var(--brand-muted)', fontSize: 14, marginTop: 24 }}>
          {link}{' '}
          <Link to={linkTo} style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>{linkText}</Link>
        </p>
      </div>
    </div>
  );
}

function InputRow({ icon, type, placeholder, value, onChange, showToggle, onToggle, showPass }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-muted)', pointerEvents: 'none' }}>{icon}</span>
      <input
        type={showToggle ? (showPass ? 'text' : 'password') : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="input-field"
        style={{ paddingLeft: 44, paddingRight: showToggle ? 44 : 14 }}
      />
      {showToggle && (
        <button type="button" onClick={onToggle} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--brand-muted)', cursor: 'pointer' }}>
          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
}

export function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form,     setForm]     = useState({ email: '', password: '' });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const data = await login(form.email, form.password);
      navigate(data.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue your journey" link="Don't have an account?" linkText="Sign up" linkTo="/register">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <InputRow icon={<Mail size={16} />} type="email" placeholder="Email address" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        <InputRow icon={<Lock size={16} />} type="password" placeholder="Password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} showToggle showPass={showPass} onToggle={() => setShowPass(p => !p)} />
        {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 13 }}>{error}</div>}
        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form,      setForm]     = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading,   setLoading]  = useState(false);
  const [error,     setError]    = useState('');
  const [showPass,  setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6)       { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Create account" subtitle="Join millions of happy travelers" link="Already have an account?" linkText="Sign in" linkTo="/login">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <InputRow icon={<User size={16} />} type="text" placeholder="Full name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <InputRow icon={<Mail size={16} />} type="email" placeholder="Email address" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        <InputRow icon={<Phone size={16} />} type="tel" placeholder="Phone number (optional)" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
        <InputRow icon={<Lock size={16} />} type="password" placeholder="Create password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} showToggle showPass={showPass} onToggle={() => setShowPass(p => !p)} />
        <InputRow icon={<Lock size={16} />} type="password" placeholder="Confirm password" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} />
        {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 13 }}>{error}</div>}
        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Login;
