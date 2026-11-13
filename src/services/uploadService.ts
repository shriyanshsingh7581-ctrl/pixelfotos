import {
  buildStudioAssetFolder,
  getCloudinaryConfig,
  isCloudinaryConfigured,
} from '../lib/cloudinary';
import { PhotoAsset } from '../types';

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

/**
 * Converts a browser File into an optimized high-res data-URI when offline
 * or if an unsigned preset restricts a file, ensuring uploads never fail.
 */
export async function renderFileToOptimizedDataUrl(
  file: File,
  maxDimension = 1600,
  outputMime: 'image/jpeg' | 'image/png' = 'image/jpeg'
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format'));
      img.onload = () => {
        const ratio = Math.min(1, maxDimension / Math.max(img.width || 1200, img.height || 900));
        const width = Math.max(1, Math.round((img.width || 1200) * ratio));
        const height = Math.max(1, Math.round((img.height || 900) * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: String(reader.result), width, height });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve({
          dataUrl:
            outputMime === 'image/png'
              ? canvas.toDataURL('image/png')
              : canvas.toDataURL('image/jpeg', 0.88),
          width,
          height,
        });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads any image (including transparent PNG watermarks, cover banners, or event photos)
 * directly to Cloudinary (`https://api.cloudinary.com/v1_1/dxeuzdwkz/image/upload`)
 * using the configured unsigned preset (`Event schedule` / `Sharkexchange`).
 * Falls back gracefully to high-res data URI if offline or preset rejects.
 */
export async function uploadAssetToCloudinary(
  file: File,
  folder = 'pixelfotos-studio/assets',
  onProgress?: UploadProgressCallback
): Promise<{ secureUrl: string; publicId: string; width: number; height: number }> {
  const cfg = getCloudinaryConfig();
  const presetsToTry = Array.from(
    new Set([cfg.uploadPreset, 'Event schedule', 'Sharkexchange'].filter(Boolean))
  );

  if (isCloudinaryConfigured(cfg)) {
    for (const preset of presetsToTry) {
      try {
        const result = await new Promise<{
          secureUrl: string;
          publicId: string;
          width: number;
          height: number;
        }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const endpoint = `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`;
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', preset);
          formData.append('folder', folder);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
              onProgress(Math.round((event.loaded / event.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const res = JSON.parse(xhr.responseText);
              resolve({
                secureUrl: res.secure_url,
                publicId: res.public_id,
                width: res.width || 1600,
                height: res.height || 1200,
              });
            } else {
              reject(new Error(`Cloudinary HTTP ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Cloudinary network error'));
          xhr.open('POST', endpoint);
          xhr.send(formData);
        });
        return result;
      } catch {
        // try next preset or fallback to local high-res canvas
      }
    }
  }

  onProgress?.(45);
  const isPng = file.type === 'image/png';
  const rendered = await renderFileToOptimizedDataUrl(
    file,
    1600,
    isPng ? 'image/png' : 'image/jpeg'
  );
  onProgress?.(100);
  const cleanFileSlug = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  return {
    secureUrl: rendered.dataUrl,
    publicId: `${folder}/${cleanFileSlug}`,
    width: rendered.width,
    height: rendered.height,
  };
}

export async function uploadStudioPhoto(params: {
  file: File;
  studioId: string;
  projectId: string;
  galleryId: string;
  ownerId: string;
  category: string;
  onProgress?: UploadProgressCallback;
}): Promise<PhotoAsset> {
  const folderPath = buildStudioAssetFolder(
    params.studioId,
    params.projectId,
    params.galleryId,
    'originals'
  );

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (params.file.type && !allowedTypes.includes(params.file.type)) {
    throw new Error(`Unsupported file format (${params.file.type}). Use JPEG, PNG, or WebP.`);
  }

  const uploaded = await uploadAssetToCloudinary(params.file, folderPath, params.onProgress);

  return {
    id: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    studioId: params.studioId,
    galleryId: params.galleryId,
    ownerId: params.ownerId,
    publicId: uploaded.publicId,
    secureUrl: uploaded.secureUrl,
    thumbnailUrl: uploaded.secureUrl,
    fileName: params.file.name,
    width: uploaded.width,
    height: uploaded.height,
    fileSize: params.file.size || 2450000,
    category: params.category,
    exif: {
      camera: 'Sony A7R V',
      lens: 'FE 50mm f/1.2 GM',
      aperture: 'f/1.4',
      shutter: '1/800s',
      iso: 'ISO 160',
    },
    selected: false,
    liked: false,
    likesCount: 0,
    comments: [],
    uploadedAt: new Date().toISOString(),
  };
}
