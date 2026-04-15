/**
 * config/imagekit.js
 * ImageKit configuration + multer memory-storage setup.
 *
 * HOW IT WORKS:
 *   Multer buffers the file entirely in RAM (memoryStorage).
 *   The uploadMiddleware then calls ImageKit's SDK to push the buffer
 *   directly to ImageKit — no temp files on disk, no extra package.
 *
 * ENV VARS REQUIRED:
 *   IMAGEKIT_PUBLIC_KEY   — starts with "public_..."
 *   IMAGEKIT_PRIVATE_KEY  — starts with "private_..."
 *   IMAGEKIT_URL_ENDPOINT — e.g. "https://ik.imagekit.io/YOUR_ID"
 */
const ImageKit = require('imagekit');
const multer   = require('multer');

// ── Validate env vars at startup ───────────────────────────────────────────
const REQUIRED = ['IMAGEKIT_PUBLIC_KEY', 'IMAGEKIT_PRIVATE_KEY', 'IMAGEKIT_URL_ENDPOINT'];
const missing  = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.warn(
    `\n⚠️  ImageKit: missing env vars — ${missing.join(', ')}` +
    '\n   Image uploads will fail until these are set in .env\n'
  );
}

// ── ImageKit SDK instance ──────────────────────────────────────────────────
const imagekit = new ImageKit({
  publicKey:   process.env.IMAGEKIT_PUBLIC_KEY  || '',
  privateKey:  process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

// ── Multer — memory storage (buffer → ImageKit, no disk writes) ───────────
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXTS  = /\.(jpe?g|png|webp|gif)$/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },   // 5 MB hard limit
  fileFilter: (_req, file, cb) => {
    const mimeOk = ALLOWED_MIMES.has(file.mimetype);
    const extOk  = ALLOWED_EXTS.test(file.originalname);
    if (mimeOk && extOk) return cb(null, true);
    cb(new Error('Only JPG, PNG, WebP and GIF images are allowed (max 5 MB)'), false);
  },
});

/**
 * uploadToImageKit(buffer, originalName, folder)
 * Uploads a Buffer to ImageKit and returns the full CDN URL.
 *
 * @param {Buffer} buffer
 * @param {string} originalName  — used to derive a clean filename
 * @param {string} folder        — ImageKit folder, e.g. "vraman/hotels"
 * @returns {Promise<string>}    — the CDN URL of the uploaded image
 */
async function uploadToImageKit(buffer, originalName, folder = 'vraman') {
  // Strip extension + special chars from filename, append timestamp
  const baseName = originalName
    .replace(/\.[^.]+$/, '')          // remove extension
    .replace(/[^a-zA-Z0-9_-]/g, '_') // sanitise
    .slice(0, 60);                    // max length

  const fileName = `${baseName}_${Date.now()}`;

  const result = await imagekit.upload({
    file:              buffer,           // Buffer — SDK accepts Buffer directly
    fileName:          fileName,
    folder:            folder,
    useUniqueFileName: true,             // ImageKit appends a unique suffix
    tags:              ['vraman'],
  });

  return result.url;   // full CDN URL, e.g. https://ik.imagekit.io/YOUR_ID/vraman/...
}

/**
 * uploadUrlToImageKit(remoteUrl, fileName, folder)
 * Re-uploads an existing image URL into ImageKit (URL-based ingestion).
 * Useful for migrating old Cloudinary URLs.
 *
 * @param {string} remoteUrl
 * @param {string} fileName
 * @param {string} folder
 * @returns {Promise<string>}
 */
async function uploadUrlToImageKit(remoteUrl, fileName, folder = 'vraman') {
  const result = await imagekit.upload({
    file:     remoteUrl,   // ImageKit accepts a URL string directly
    fileName: fileName || `migrated_${Date.now()}`,
    folder,
    useUniqueFileName: true,
    tags: ['vraman', 'migrated'],
  });
  return result.url;
}

/**
 * getOptimizedUrl(imagekitUrl, options)
 * Appends ImageKit transformation parameters to any ImageKit URL.
 *
 * Common options:
 *   width, height        — resize
 *   quality              — 1-100 (default: auto)
 *   format               — 'auto' | 'webp' | 'jpg' | 'png'
 *   crop                 — 'maintain_ratio' | 'force' | 'at_max'
 *   blur                 — 1-100
 *
 * @param {string} url      — raw ImageKit URL
 * @param {object} options
 * @returns {string}        — URL with tr: transformation string appended
 *
 * Example:
 *   getOptimizedUrl(url, { width: 400, height: 300, quality: 80, format: 'webp' })
 *   → https://ik.imagekit.io/YOUR_ID/vraman/photo.jpg?tr=w-400,h-300,q-80,f-webp
 */
function getOptimizedUrl(url, options = {}) {
  if (!url || !url.includes('ik.imagekit.io')) return url;

  const parts = [];
  if (options.width)   parts.push(`w-${options.width}`);
  if (options.height)  parts.push(`h-${options.height}`);
  if (options.quality) parts.push(`q-${options.quality}`);
  if (options.format)  parts.push(`f-${options.format}`);
  if (options.crop)    parts.push(`c-${options.crop}`);
  if (options.blur)    parts.push(`bl-${options.blur}`);

  if (!parts.length) return url;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}tr=${parts.join(',')}`;
}

// ── Named transformation presets ─────────────────────────────────────────
const TRANSFORMS = {
  /** 800×600, quality auto, WebP — hero / detail images */
  hero:      (url) => getOptimizedUrl(url, { width: 800, height: 600, quality: 80, format: 'webp', crop: 'maintain_ratio' }),
  /** 400×300, quality 75, WebP — card thumbnails */
  thumbnail: (url) => getOptimizedUrl(url, { width: 400, height: 300, quality: 75, format: 'webp', crop: 'maintain_ratio' }),
  /** 100×100 square — avatars */
  avatar:    (url) => getOptimizedUrl(url, { width: 100, height: 100, quality: 80, format: 'webp', crop: 'force' }),
};

if (!missing.length) {
  console.log('✅ ImageKit configured');
}

module.exports = { imagekit, upload, uploadToImageKit, uploadUrlToImageKit, getOptimizedUrl, TRANSFORMS };
