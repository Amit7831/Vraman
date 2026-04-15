import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import MainLayout  from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import { ProtectedRoute, PublicRoute, AdminRoute, VendorRoute } from './route/ProtectedRoute';

// Public pages
import Home           from './pages/public/Home';
import Hotels         from './pages/public/Hotels';
import HotelDetails   from './pages/public/HotelDetails';
import Buses          from './pages/public/Buses';
import BusDetails     from './pages/public/BusDetails';
import Cabs           from './pages/public/Cabs';
import CabDetails     from './pages/public/CabDetails';
import Bikes          from './pages/public/Bikes';
import BikeDetails    from './pages/public/BikeDetails';
import Flights        from './pages/public/Flights';
import AllServices    from './pages/public/AllServices';
import ServiceDetails from './pages/public/ServiceDetails';
import SearchResults  from './pages/public/SearchResults';
import Login          from './pages/public/Login';
import Register       from './pages/public/Register';
import About          from './pages/public/About';
import Contact        from './pages/public/Contact';
import MyBookings     from './pages/public/MyBookings';
import Profile        from './pages/user/Profile';

import VendorRegister    from './pages/public/VendorRegister';
import OTPVerification   from './pages/public/OTPVerification';
import ProviderDashboard from './pages/vendor/ProviderDashboard';
import VendorDashboard from './pages/vendor/VendorDashboard';

import AdminVendors  from './pages/admin/AdminVendors';
import AdminFlights  from './pages/admin/AdminFlights';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminHotels   from './pages/admin/AdminHotels';
import AdminBuses    from './pages/admin/AdminBuses';
import AdminCars     from './pages/admin/AdminCars';
import AdminBikes    from './pages/admin/AdminBikes';
import AdminService  from './pages/admin/Adminservice';
import AdminBooking  from './pages/admin/AdminBooking';
import AdminContact  from './pages/admin/AdminContact';
import AdminUsers    from './pages/admin/AdminUsers';

/**
 * FIX: ScrollToTop — every route change instantly scrolls to top.
 * This fixes the bug where navigating to a new page opened mid-scroll or at footer.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index              element={<Home />} />
          <Route path="hotels"      element={<Hotels />} />
          <Route path="hotels/:id"  element={<HotelDetails />} />
          <Route path="buses"       element={<Buses />} />
          <Route path="buses/:id"   element={<BusDetails />} />
          <Route path="cabs"        element={<Cabs />} />
          <Route path="cabs/:id"    element={<CabDetails />} />
          <Route path="cars/:id"    element={<CabDetails />} />
          <Route path="bikes"       element={<Bikes />} />
          <Route path="bikes/:id"   element={<BikeDetails />} />
          <Route path="flights"     element={<Flights />} />
          <Route path="service"     element={<AllServices />} />
          <Route path="service/:id" element={<ServiceDetails />} />
          <Route path="search"      element={<SearchResults />} />
          <Route path="about"       element={<About />} />
          <Route path="contact"     element={<Contact />} />

          <Route path="login"           element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="register"        element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="vendor-register" element={<PublicRoute><VendorRegister /></PublicRoute>} />

          <Route path="my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="profile"     element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="vendor-dashboard" element={<VendorRoute><VendorDashboard /></VendorRoute>} />
          <Route path="verify-otp"       element={<VendorRoute><OTPVerification /></VendorRoute>} />
          <Route path="provider-dashboard" element={<VendorRoute><ProviderDashboard /></VendorRoute>} />
          <Route path="verify-otp-admin"   element={<VendorRoute><OTPVerification /></VendorRoute>} />
        </Route>

        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index           element={<AdminDashboard />} />
          <Route path="hotels"   element={<AdminHotels />} />
          <Route path="buses"    element={<AdminBuses />} />
          <Route path="car"      element={<AdminCars />} />
          <Route path="bikes"    element={<AdminBikes />} />
          <Route path="service"  element={<AdminService />} />
          <Route path="booking"  element={<AdminBooking />} />
          <Route path="vendors"  element={<AdminVendors />} />
          <Route path="flights"  element={<AdminFlights />} />
          <Route path="contacts" element={<AdminContact />} />
          <Route path="users"             element={<AdminUsers />} />
          <Route path="provider-dashboard" element={<ProviderDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
