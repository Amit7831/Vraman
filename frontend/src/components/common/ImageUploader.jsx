/**
 * components/common/ImageUploader.jsx
 *
 * Reusable multi-image uploader with:
 *  - Drag & drop support
 *  - Click to select (append, not replace)
 *  - Image previews with individual remove buttons
 *  - File type + size validation (client-side)
 *  - Works for single OR multi image modes
 *
 * Props:
 *   images     {File[]}   - controlled array of selected File objects
 *   onChange   {fn}       - called with new File[] array
 *   maxImages  {number}   - default 10
 *   single     {boolean}  - if true, only 1 image allowed (replaces on add)
 *   existingUrls {string[]} - already-saved ImageKit URLs to display (edit mode)
 *   onRemoveExisting {fn} - called with index when existing URL removed
 */
import { useRef, useState, useCallback } from 'react';
import { Upload, X, Plus, Image } from 'lucide-react';

const MAX_MB   = 5;
const ALLOWED  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ImageUploader({
  images = [],
  onChange,
  maxImages = 10,
  single = false,
  existingUrls = [],
  onRemoveExisting,
}) {
  const inputRef   = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [errors,   setErrors]   = useState([]);

  const validate = (files) => {
    const errs = [];
    const valid = [];
    for (const file of files) {
      if (!ALLOWED.includes(file.type)) {
        errs.push(`"${file.name}": must be JPG, PNG, WebP or GIF`);
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        errs.push(`"${file.name}": exceeds ${MAX_MB}MB limit`);
        continue;
      }
      valid.push(file);
    }
    return { valid, errs };
  };

  const addFiles = useCallback((newFiles) => {
    const { valid, errs } = validate(newFiles);
    setErrors(errs);
    if (!valid.length) return;

    if (single) {
      onChange([valid[0]]);
    } else {
      const combined = [...images, ...valid].slice(0, maxImages);
      onChange(combined);
    }
  }, [images, onChange, single, maxImages]);

  const handleInputChange = (e) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = ''; // allow re-selecting same file
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files || []));
  };

  const removeNew = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const totalCount = existingUrls.length + images.length;
  const canAdd     = totalCount < maxImages;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Preview grid */}
      {(existingUrls.length > 0 || images.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {/* Existing saved URLs */}
          {existingUrls.map((url, i) => (
            <div key={`ex-${i}`} style={thumbWrap}>
              <img src={url} alt="" style={thumbImg} />
              {onRemoveExisting && (
                <button onClick={() => onRemoveExisting(i)} style={removeBtn} title="Remove">
                  <X size={10} />
                </button>
              )}
              <span style={thumbLabel}>Saved</span>
            </div>
          ))}

          {/* Newly selected files */}
          {images.map((file, i) => (
            <div key={`new-${i}`} style={thumbWrap}>
              <img src={URL.createObjectURL(file)} alt="" style={thumbImg} />
              <button onClick={() => removeNew(i)} style={removeBtn} title="Remove">
                <X size={10} />
              </button>
              <span style={{ ...thumbLabel, background: 'rgba(16,185,129,0.85)' }}>New</span>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAdd && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragging ? 'var(--brand-primary)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 12,
            padding: '20px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'rgba(255,107,53,0.06)' : 'rgba(255,255,255,0.02)',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,107,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dragging ? <Upload size={20} color="var(--brand-primary)" /> : <Plus size={20} color="var(--brand-primary)" />}
          </div>
          <div>
            <p style={{ color: 'var(--brand-text)', fontSize: 13, fontWeight: 600, margin: 0 }}>
              {images.length > 0 ? 'Add more images' : 'Click or drag images here'}
            </p>
            <p style={{ color: 'var(--brand-muted)', fontSize: 11, margin: '2px 0 0' }}>
              JPG, PNG, WebP, GIF · max {MAX_MB}MB each · up to {maxImages - totalCount} more
            </p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(',')}
        multiple={!single}
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {/* Validation errors */}
      {errors.length > 0 && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          {errors.map((e, i) => (
            <p key={i} style={{ color: '#EF4444', fontSize: 12, margin: '2px 0' }}>⚠ {e}</p>
          ))}
        </div>
      )}

      {/* Count info */}
      {!single && (
        <p style={{ color: 'var(--brand-muted)', fontSize: 11, margin: 0 }}>
          {totalCount}/{maxImages} image{maxImages !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const thumbWrap = {
  position: 'relative',
  width: 72,
  height: 72,
  borderRadius: 8,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.1)',
  flexShrink: 0,
};
const thumbImg = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};
const removeBtn = {
  position: 'absolute',
  top: 3,
  right: 3,
  width: 18,
  height: 18,
  borderRadius: 4,
  background: 'rgba(239,68,68,0.9)',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};
const thumbLabel = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'rgba(0,0,0,0.6)',
  color: '#fff',
  fontSize: 9,
  fontWeight: 700,
  textAlign: 'center',
  padding: '2px 0',
  textTransform: 'uppercase',
  letterSpacing: 0.3,
};
