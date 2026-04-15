import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Pages where we hide the footer (e.g., full-height dashboards)
const NO_FOOTER = ['/vendor-dashboard'];

export default function MainLayout() {
  const { pathname } = useLocation();
  const showFooter   = !NO_FOOTER.some(p => pathname.startsWith(p));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
