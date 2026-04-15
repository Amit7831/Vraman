/**
 * middleware/uploadMiddleware.js
 *
 * BUG FIXES:
 *   1. FOLDER_MAP had '/api/service' but route is mounted at '/api/services' → wrong folder.
 *   2. Added uploadAny() for mixed single+multiple uploads.
 *   3. Added uploadAvatar() dedicated to profile photos.
 */
const { upload, uploadToImageKit } = require('../config/imagekit');

const FOLDER_MAP = {
  '/api/auth':     'vraman/avatars',
  '/api/hotels':   'vraman/hotels',
  '/api/cabs':     'vraman/cabs',
  '/api/bikes':    'vraman/bikes',
  '/api/services': 'vraman/services',  // FIX: was '/api/service'
  '/api/service':  'vraman/services',
  '/api/vendor':   'vraman/vendor',
  '/api/users':    'vraman/avatars',
};

function getFolder(req) {
  const match = Object.keys(FOLDER_MAP).find(prefix => req.originalUrl.startsWith(prefix));
  return match ? FOLDER_MAP[match] : 'vraman/misc';
}

async function pushToImageKit(file, folder) {
  if (!file?.buffer) return;
  try {
    const url   = await uploadToImageKit(file.buffer, file.originalname, folder);
    file.path   = url;
    file.buffer = null;
  } catch (err) {
    console.error('[uploadMiddleware] ImageKit upload failed:', err.message);
    throw Object.assign(new Error('Image upload failed. Please try again.'), { status: 502 });
  }
}

function makeSingleMiddleware(fieldName = 'image') {
  const multerMiddleware = upload.single(fieldName);
  return async (req, res, next) => {
    multerMiddleware(req, res, async (err) => {
      if (err) return res.status(400).json({ message: err.message });
      if (!req.file) return next();
      try {
        await pushToImageKit(req.file, getFolder(req));
        next();
      } catch (uploadErr) {
        res.status(uploadErr.status || 500).json({ message: uploadErr.message });
      }
    });
  };
}

function makeMultipleMiddleware(fieldName = 'images', maxCount = 10) {
  const multerMiddleware = upload.array(fieldName, maxCount);
  return async (req, res, next) => {
    multerMiddleware(req, res, async (err) => {
      if (err) return res.status(400).json({ message: err.message });
      if (!req.files?.length) return next();
      try {
        const folder = getFolder(req);
        await Promise.all(req.files.map(f => pushToImageKit(f, folder)));
        next();
      } catch (uploadErr) {
        res.status(uploadErr.status || 500).json({ message: uploadErr.message });
      }
    });
  };
}

// Handles BOTH 'image' (single) AND 'images' (array) in one request
function makeFieldsMiddleware(fields) {
  const multerMiddleware = upload.fields(fields);
  return async (req, res, next) => {
    multerMiddleware(req, res, async (err) => {
      if (err) return res.status(400).json({ message: err.message });
      const folder = getFolder(req);
      try {
        const allUploads = [];
        if (req.files) {
          for (const fieldFiles of Object.values(req.files)) {
            for (const file of fieldFiles) {
              allUploads.push(pushToImageKit(file, folder));
            }
          }
        }
        await Promise.all(allUploads);
        // Normalize req.file for controllers that use single image
        if (req.files?.image?.[0]) req.file = req.files.image[0];
        next();
      } catch (uploadErr) {
        res.status(uploadErr.status || 500).json({ message: uploadErr.message });
      }
    });
  };
}

const handleUploadError = (err, _req, res, next) => {
  if (err) return res.status(400).json({ message: err.message });
  next();
};

const uploadSingle   = makeSingleMiddleware('image');
const uploadMultiple = makeMultipleMiddleware('images', 10);
const uploadAvatar   = makeSingleMiddleware('avatar');
const uploadAny      = makeFieldsMiddleware([
  { name: 'image',  maxCount: 1  },
  { name: 'images', maxCount: 10 },
]);

module.exports = { uploadSingle, uploadMultiple, uploadAny, uploadAvatar, handleUploadError };
