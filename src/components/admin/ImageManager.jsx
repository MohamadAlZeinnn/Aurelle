import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Link2, Trash2 } from 'lucide-react';
import { Button, Input } from '../ui/index.js';

const MAX_DIMENSION = 1200;

/** Downscales an uploaded image in the browser so demo storage stays small. */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file (JPG, PNG, WebP or SVG).'));
    if (file.size > 8 * 1024 * 1024) return reject(new Error('Images must be under 8 MB.'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read this file.'));
    reader.onload = () => {
      if (file.type === 'image/svg+xml') return resolve(reader.result);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('This image could not be processed.'));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Ordered image list for a product. In production, uploads should go to object storage
 * (e.g. Azure Blob / S3) via a signed upload endpoint, storing only URLs on the product.
 */
export function ImageManager({ value = [], onChange, error }) {
  const fileRef = useRef(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState(null);

  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  const onFiles = async (files) => {
    setLocalError(null);
    setBusy(true);
    try {
      const urls = [];
      for (const f of files) urls.push(await fileToDataUrl(f));
      onChange([...value, ...urls]);
    } catch (e) {
      setLocalError(e.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addUrl = () => {
    const v = url.trim();
    if (!v) return;
    if (!/^(https?:\/\/|\/)/.test(v)) return setLocalError('Enter a full URL (https://…) or a site path starting with /.');
    onChange([...value, v]);
    setUrl('');
    setLocalError(null);
  };

  return (
    <div>
      {value.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((src, i) => (
            <li key={`${src.slice(0, 60)}-${i}`} className="group relative">
              <div className="aspect-product overflow-hidden border border-line bg-linen">
                <img src={src} alt={`Product image ${i + 1}`} className="h-full w-full object-cover" />
              </div>
              {i === 0 && <span className="absolute left-1.5 top-1.5 bg-espresso px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-ivory">Main</span>}
              <div className="mt-1.5 flex justify-center gap-0.5">
                <button type="button" className="icon-btn h-7 w-7" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move image ${i + 1} earlier`}>
                  <ArrowUp className="h-3.5 w-3.5 -rotate-90" />
                </button>
                <button type="button" className="icon-btn h-7 w-7" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label={`Move image ${i + 1} later`}>
                  <ArrowDown className="h-3.5 w-3.5 -rotate-90" />
                </button>
                <button type="button" className="icon-btn h-7 w-7 text-rosewood" onClick={() => onChange(value.filter((_, x) => x !== i))} aria-label={`Remove image ${i + 1}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border border-dashed border-line-strong px-4 py-8 text-center text-[13.5px] text-taupe">No images yet. Products need at least one image before publishing.</p>
      )}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" id="img-upload" onChange={(e) => e.target.files?.length && onFiles([...e.target.files])} />
        <Button variant="quiet" size="sm" loading={busy} onClick={() => fileRef.current?.click()}>
          <ImagePlus aria-hidden className="h-4 w-4" /> Upload images
        </Button>
        <div className="flex flex-1 gap-2">
          <label htmlFor="img-url" className="sr-only">
            Image URL
          </label>
          <Input id="img-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image URL" className="!min-h-[36px] text-[13.5px]" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())} />
          <Button variant="quiet" size="sm" onClick={addUrl}>
            <Link2 aria-hidden className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>
      {(localError || error) && <p className="field-error">{localError || error}</p>}
      <p className="field-hint">Use 4:5 portrait images, at least 1000 × 1250 px. Demo uploads are resized and stored in this browser.</p>
    </div>
  );
}
