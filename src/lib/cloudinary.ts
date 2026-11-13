import { CloudinaryConfig, WatermarkSettings } from '../types';
import { buildCloudinaryTransformUrl } from '../utils/studioLogic';

const STORAGE_KEY = 'pixelfotos_cloudinary_config_v2';
const WATERMARK_STORAGE_KEY = 'pixelfotos_watermark_settings_v1';

export const DEFAULT_CLOUDINARY_CLOUD_NAME = 'dxeuzdwkz';
export const DEFAULT_CLOUDINARY_UPLOAD_PRESET = 'Event schedule';

export function getCloudinaryConfig(): CloudinaryConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as CloudinaryConfig;
      if (parsed.cloudName && parsed.cloudName !== 'YOUR_CLOUD_NAME') {
        return parsed;
      }
    }
  } catch {
    // fallback to defaults
  }
  return {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || DEFAULT_CLOUDINARY_CLOUD_NAME,
    apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || 'cloudinary_unsigned_preset',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || DEFAULT_CLOUDINARY_UPLOAD_PRESET,
    folder: import.meta.env.VITE_CLOUDINARY_FOLDER || 'pixelfotos-studio',
    signedDeliveryEnabled: true,
  };
}

export function saveCloudinaryConfig(config: CloudinaryConfig): CloudinaryConfig {
  const updated: CloudinaryConfig = {
    ...config,
    cloudName: config.cloudName.trim() || DEFAULT_CLOUDINARY_CLOUD_NAME,
    apiKey: config.apiKey.trim(),
    uploadPreset: config.uploadPreset.trim() || DEFAULT_CLOUDINARY_UPLOAD_PRESET,
    folder: config.folder.trim() || 'pixelfotos-studio',
    lastValidatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function isCloudinaryConfigured(config = getCloudinaryConfig()): boolean {
  return (
    Boolean(config.cloudName) &&
    config.cloudName !== 'YOUR_CLOUD_NAME' &&
    Boolean(config.uploadPreset) &&
    config.uploadPreset !== 'YOUR_PRESET_NAME'
  );
}

export function buildStudioAssetFolder(
  studioId: string,
  projectId: string,
  galleryId: string,
  subfolder: 'originals' | 'thumbnails' | 'previews' | 'covers' | 'watermarks' = 'originals'
): string {
  const cfg = getCloudinaryConfig();
  const base = cfg.folder || 'pixelfotos-studio';
  return `${base}/${studioId}/projects/${projectId}/${galleryId}/${subfolder}`;
}

export function getOptimizedPhotoUrl(
  secureUrlOrPublicId: string,
  options: { width?: number; height?: number; watermarkText?: string }
): string {
  const cfg = getCloudinaryConfig();
  if (
    !secureUrlOrPublicId ||
    secureUrlOrPublicId.startsWith('data:') ||
    secureUrlOrPublicId.startsWith('blob:') ||
    secureUrlOrPublicId.startsWith('http://') ||
    secureUrlOrPublicId.startsWith('https://')
  ) {
    return secureUrlOrPublicId;
  }
  if (!isCloudinaryConfigured(cfg)) {
    return secureUrlOrPublicId;
  }
  return buildCloudinaryTransformUrl(cfg.cloudName, secureUrlOrPublicId, options);
}

/**
 * Generates a Cloudinary direct-attachment download URL using `fl_attachment`
 * when the URL points to res.cloudinary.com.
 */
export function buildCloudinaryAttachmentUrl(url: string, customFileName?: string): string {
  if (!url) return url;
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    const cleanName = customFileName
      ? customFileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')
      : '';
    const attachmentFlag = cleanName ? `fl_attachment:${cleanName}` : 'fl_attachment';
    return url.replace('/upload/', `/upload/${attachmentFlag}/`);
  }
  return url;
}

/**
 * Triggers a direct 1-click file download on the client device using
 * Cloudinary `fl_attachment` + Blob fetch fallback for cross-origin URLs.
 */
export async function triggerDirectPhotoDownload(
  url: string,
  fileName: string
): Promise<void> {
  const safeFileName = fileName || `pixelfotos_${Date.now()}.jpg`;
  const downloadUrl = buildCloudinaryAttachmentUrl(url, safeFileName);

  if (downloadUrl.startsWith('data:') || downloadUrl.startsWith('blob:')) {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = safeFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  try {
    const response = await fetch(downloadUrl, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = safeFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);
      return;
    }
  } catch {
    // Fallback to direct anchor download with fl_attachment URL
  }

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = safeFileName;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function getWatermarkSettings(defaultText = '© LUMINA STUDIO OS'): WatermarkSettings {
  try {
    const raw = localStorage.getItem(WATERMARK_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as WatermarkSettings;
    }
  } catch {
    // ignore
  }
  return {
    enabled: true,
    mode: 'text',
    text: defaultText,
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    fontSize: 22,
    rotation: 0,
    opacity: 78,
    logoUrl: '',
    position9Grid: 'bottom-right',
    scale: 100,
  };
}

export function saveWatermarkSettings(settings: WatermarkSettings): WatermarkSettings {
  localStorage.setItem(WATERMARK_STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('pixelfotos-watermark-updated', { detail: settings }));
  return settings;
}
