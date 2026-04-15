/**
 * pages/user/Profile.jsx  — Full Settings Page
 *
 * Tabs:
 *  - Profile: avatar upload + name + phone  
 *  - Security: change password
 *
 * Works for user, admin, and vendor roles.
 * Avatar is displayed globally in Navbar via AuthContext.
 */
import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User, Mail, Phone, Save, CheckCircle, AlertCircle,
  Camera, Shield, Key, Trash2, Upload,
} from 'lucide-react';
import AvatarDisplay from '../../components/common/AvatarDisplay';
import api from '../../services/api';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_MB = 5;

export default function Profile() {
  const { user, updateUser } = useAuth();
  const avatarInputRef = useRef(null);

  /* ── form state ─────────────────────────────────────────── */
  const [form,    setForm]    = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState(null);
  const [tab,     setTab]     = useState('profile');

  /* ── avatar state ───────────────────────────────────────── */
  const currentImg         = user?.profileImage || user?.avatar || null;
  const [avatarFile,       setAvatarFile]       = useState(null);
  const [avatarPreview,    setAvatarPreview]     = useState(currentImg);
  const [avatarUploading,  setAvatarUploading]  = useState(false);
  const [avatarMsg,        setAvatarMsg]        = useState(null);

  /* ── password state ─────────────────────────────────────── */
  const [pwForm,  setPwForm]  = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg,   setPwMsg]   = useState(null);
  const [pwLoad,  setPwLoad]  = useState(false);

  /* ── avatar picker ──────────────────────────────────────── */
  const handleAvatarClick = () => avatarInputRef.current?.click();

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarMsg({ type: 'error', text: 'Only JPG, PNG, WebP or GIF allowed.' });
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setAvatarMsg({ type: 'error', text: `Image must be under ${MAX_MB}MB.` });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarMsg(null);
    e.target.value = '';
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setAvatarUploading(true); setAvatarMsg(null);
    try {
      const fd = new FormData();
      fd.append('avatar', avatarFile);
      fd.append('name', user?.name || '');
      const res = await api.put('/auth/profile', fd);
      const img = res.data.profileImage || res.data.avatar || avatarPreview;
      setAvatarPreview(img);
      updateUser({ ...res.data, avatar: img, profileImage: img });
      setAvatarFile(null);
      setAvatarMsg({ type: 'success', text: 'Profile photo updated!' });
    } catch (err) {
      setAvatarMsg({ type: 'error', text: err.response?.data?.message || 'Upload failed.' });
    } finally { setAvatarUploading(false); }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(currentImg);
    setAvatarMsg(null);
  };

  /* ── profile save ───────────────────────────────────────── */
  const handleProfileSave = async (e) => {
    e.preventDefault(); setMsg(null); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name',  form.name);
      if (form.phone) fd.append('phone', form.phone);
      if (avatarFile) fd.append('avatar', avatarFile);
      const res = await api.put('/auth/profile', fd);
      const img = res.data.profileImage || res.data.avatar || avatarPreview;
      updateUser({ ...res.data, avatar: img, profileImage: img });
      if (avatarFile) { setAvatarPreview(img); setAvatarFile(null); }
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    } finally { setLoading(false); }
  };

  /* ── password change ────────────────────────────────────── */
  const handlePasswordChange = async (e) => {
    e.preventDefault(); setPwMsg(null);
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' }); return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return;
    }
    setPwLoad(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Password change failed.' });
    } finally { setPwLoad(false); }
  };

  /* ── helpers ────────────────────────────────────────────── */
  const MsgBanner = ({ msg: m }) => !m ? null : (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '11px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14,
      background: m.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
      border: `1px solid ${m.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
      color: m.type === 'success' ? '#10B981' : '#EF4444',
    }}>
      {m.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      {m.text}
    </div>
  );

  const TABS = [
    { id: 'profile',  label: 'Profile',  icon: <User   size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
  ];

  const roleColor = { admin: '#5B5FCF', vendor: '#F5A623', user: '#2DCBA4' }[user?.role] || '#2DCBA4';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', paddingBottom: 80 }}>

      {/* Hero */}
      <div className="page-hero">
        <div className="container-app">
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px,4vw,36px)', color: '#fff', marginBottom: 4 }}>
            My Profile
          </h1>
          <p style={{ color: 'var(--brand-muted)' }}>Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="container-app" style={{ paddingTop: 36 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, alignItems: 'start' }}>

          {/* ── Left: Avatar card + nav tabs ─────────────────── */}
          <div style={{ background: 'var(--brand-card)', borderRadius: 20, border: '1px solid var(--brand-border)', padding: 28, textAlign: 'center' }}>

            {/* Hidden file input */}
            <input
              ref={avatarInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />

            {/* Avatar with camera button */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
              <AvatarDisplay
                src={avatarPreview}
                name={user?.name}
                role={user?.role}
                size={96}
                radius={20}
                showRing
              />
              <button
                onClick={handleAvatarClick}
                title="Change profile photo"
                style={{
                  position: 'absolute', bottom: -4, right: -4,
                  width: 30, height: 30, borderRadius: 9,
                  background: 'var(--brand-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', border: '2px solid var(--brand-card)',
                  outline: 'none', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#4A4EB8'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--brand-primary)'}
              >
                <Camera size={13} color="#fff" />
              </button>
            </div>

            {/* Avatar upload controls */}
            {avatarFile && (
              <div style={{ marginBottom: 14 }}>
                <MsgBanner msg={avatarMsg} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button
                    onClick={handleAvatarUpload}
                    disabled={avatarUploading}
                    className="btn-primary"
                    style={{ fontSize: 12, padding: '7px 14px', opacity: avatarUploading ? 0.7 : 1 }}
                  >
                    <Upload size={13} /> {avatarUploading ? 'Uploading…' : 'Save Photo'}
                  </button>
                  <button
                    onClick={handleRemoveAvatar}
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: '7px 12px' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
            {!avatarFile && avatarMsg && <MsgBanner msg={avatarMsg} />}

            {/* User info */}
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 4 }}>
              {user?.name}
            </h2>
            <p style={{ color: 'var(--brand-muted)', fontSize: 13, marginBottom: 14 }}>{user?.email}</p>
            <span style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 999,
              background: `${roleColor}20`, color: roleColor,
              fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
            }}>
              {user?.role || 'user'}
            </span>

            {/* Vendor info */}
            {user?.role === 'vendor' && user?.vendorInfo?.businessName && (
              <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--brand-border)', textAlign: 'left' }}>
                <div style={{ color: 'var(--brand-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Business</div>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{user.vendorInfo.businessName}</div>
                <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                  background: user.vendorInfo.isApproved ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  color: user.vendorInfo.isApproved ? '#10B981' : '#F59E0B',
                }}>
                  {user.vendorInfo.isApproved ? '✓ Approved' : '⏳ Pending'}
                </div>
              </div>
            )}

            {/* Tab nav */}
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
                    background: tab === t.id ? `${roleColor}18` : 'transparent',
                    color: tab === t.id ? roleColor : 'var(--brand-muted)',
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Right: Form area ─────────────────────────────── */}
          <div style={{ background: 'var(--brand-card)', borderRadius: 20, border: '1px solid var(--brand-border)', padding: 'clamp(24px,4vw,36px)' }}>

            {/* PROFILE TAB */}
            {tab === 'profile' && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 6 }}>
                  Personal Information
                </h2>
                <p style={{ color: 'var(--brand-muted)', fontSize: 13, marginBottom: 24 }}>
                  Update your name and contact details.
                </p>
                <MsgBanner msg={msg} />
                <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Profile image upload inside form */}
                  <div>
                    <label style={labelStyle}>Profile Photo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--brand-border)', background: 'rgba(255,255,255,0.03)' }}>
                      <AvatarDisplay src={avatarPreview} name={user?.name} role={user?.role} size={52} radius={12} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                          {avatarFile ? avatarFile.name : 'No new photo selected'}
                        </div>
                        <div style={{ color: 'var(--brand-muted)', fontSize: 11 }}>JPG, PNG, WebP or GIF · max 5MB</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        className="btn-ghost"
                        style={{ fontSize: 12, padding: '7px 14px', flexShrink: 0 }}
                      >
                        <Camera size={13} /> Change
                      </button>
                    </div>
                  </div>

                  {/* Name */}
                  <FormField label="Full Name" icon={<User size={15} />}>
                    <input
                      type="text"
                      className="input-field"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      style={{ paddingLeft: 38 }}
                      required
                    />
                  </FormField>

                  {/* Phone */}
                  <FormField label="Phone Number" icon={<Phone size={15} />}>
                    <input
                      type="tel"
                      className="input-field"
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      style={{ paddingLeft: 38 }}
                      placeholder="+91 98765 43210"
                    />
                  </FormField>

                  {/* Email — read only */}
                  <FormField label="Email Address (read-only)" icon={<Mail size={15} />}>
                    <input
                      className="input-field"
                      value={user?.email || ''}
                      readOnly
                      style={{ paddingLeft: 38, opacity: 0.55, cursor: 'not-allowed' }}
                    />
                  </FormField>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: loading ? 0.7 : 1 }}
                  >
                    <Save size={15} /> {loading ? 'Saving…' : 'Save Changes'}
                  </button>
                </form>
              </>
            )}

            {/* SECURITY TAB */}
            {tab === 'security' && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 6 }}>
                  Change Password
                </h2>
                <p style={{ color: 'var(--brand-muted)', fontSize: 13, marginBottom: 24 }}>
                  Choose a strong password — at least 6 characters.
                </p>
                <MsgBanner msg={pwMsg} />
                <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: 'Current Password', field: 'currentPassword' },
                    { label: 'New Password',      field: 'newPassword'     },
                    { label: 'Confirm Password',  field: 'confirm'         },
                  ].map(({ label, field }) => (
                    <FormField key={field} label={label} icon={<Key size={15} />}>
                      <input
                        type="password"
                        className="input-field"
                        value={pwForm[field]}
                        onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                        style={{ paddingLeft: 38 }}
                        required
                      />
                    </FormField>
                  ))}
                  <button
                    type="submit"
                    disabled={pwLoad}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: pwLoad ? 0.7 : 1 }}
                  >
                    <Shield size={15} /> {pwLoad ? 'Updating…' : 'Update Password'}
                  </button>
                </form>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Local helpers ─────────────────────────────────────────── */
const labelStyle = {
  color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.05em',
  display: 'block', marginBottom: 6,
};

function FormField({ label, icon, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-muted)', pointerEvents: 'none' }}>
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}
