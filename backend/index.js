/**
 * Vraman Travel API — Production-Ready Entry Point
 * v2.2.0
 */
const express       = require('express');
const dotenv        = require('dotenv');
const cors          = require('cors');
const helmet        = require('helmet');
const rateLimit     = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB     = require('./config/db');

dotenv.config();

// ── Fail-fast: validate required env vars ─────────────────────────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'FRONTEND_URL'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`\n❌  Missing required env vars: ${missing.join(', ')}`);
  console.error('   Copy .env.example → .env and fill in all values.\n');
  process.exit(1);
}

if (process.env.JWT_SECRET === 'CHANGE_ME_TO_64_CHAR_RANDOM_HEX_BEFORE_DEPLOY') {
  console.warn('\n⚠️  WARNING: JWT_SECRET is a placeholder. Run: openssl rand -hex 64\n');
}

// ── DB ─────────────────────────────────────────────────────────────────────
connectDB();



const app  = express();
const PORT = process.env.PORT || 8000;

// ── Security: Helmet (HTTP headers) ───────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },  // allow Cloudinary CDN
  contentSecurityPolicy:     false,                        // configure CSP separately
}));

// ── Security: CORS ─────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Security: NoSQL injection prevention ───────────────────────────────────
app.use(mongoSanitize({ replaceWith: '_' }));

// ── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate limiting ───────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max:      10,
  message:  { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max:      200,
  message:  { message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/',              generalLimiter);

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/search',    require('./routes/searchRoutes'));
app.use('/api/hotels',    require('./routes/hotelRoutes'));
app.use('/api/buses',     require('./routes/busRoutes'));
app.use('/api/cabs',      require('./routes/cabRoutes'));
app.use('/api/cars',      require('./routes/cabRoutes'));    // backward-compat alias
app.use('/api/bikes',     require('./routes/bikeRoutes'));
app.use('/api/booking',   require('./routes/bookingRoutes'));
app.use('/api/service',   require('./routes/serviceRoutes'));
app.use('/api/contact',   require('./routes/contactRoutes'));
app.use('/api/vendor',    require('./routes/vendorRoutes'));
app.use('/api/flights',   require('./routes/flightRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/payment',   require('./routes/paymentRoutes'));
app.use('/api/users',     require('./routes/userRoutes'));     // Admin user management
app.use('/api/otp',       require('./routes/otpRoutes'));      // OTP verification system

// ── Health check ────────────────────────────────────────────────────────────
app.get('/', (_req, res) =>
  res.json({ message: '🚀 Vraman Travel API', status: 'OK', version: '2.2.0', port: PORT })
);
app.get('/health', (_req, res) =>
  res.json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() })
);

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Global error handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  console.error(`[${new Date().toISOString()}] ${err.message}${isDev ? '\n' + err.stack : ''}`);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀  Vraman API  →  http://localhost:${PORT}`);
  console.log(`📝  NODE_ENV   →  ${process.env.NODE_ENV || 'development'}\n`);
});
