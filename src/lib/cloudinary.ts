import { CloudinaryConfig } from '../types';
import { buildCloudinaryTransformUrl } from '../utils/studioLogic';

const STORAGE_KEY = 'lumina_cloudinary_config_v1';

export function getCloudinaryConfig(): CloudinaryConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as CloudinaryConfig;
    }
  } catch {
    // fallback to env vars
  }
  return {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME',
    apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || 'YOUR_API_KEY',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'YOUR_PRESET_NAME',
    folder: import.meta.env.VITE_CLOUDINARY_FOLDER || 'photography-studios',
    signedDeliveryEnabled: true,
  };
}

export function saveCloudinaryConfig(config: CloudinaryConfig): CloudinaryConfig {
  const updated: CloudinaryConfig = {
    ...config,
    cloudName: config.cloudName.trim(),
    apiKey: config.apiKey.trim(),
    uploadPreset: config.uploadPreset.trim(),
    folder: config.folder.trim() || 'photography-studios',
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
  subfolder: 'originals' | 'thumbnails' | 'previews' | 'covers' = 'originals'
): string {
  const cfg = getCloudinaryConfig();
  const base = cfg.folder || 'photography-studios';
  return `${base}/${studioId}/projects/${projectId}/${galleryId}/${subfolder}`;
}

export function getOptimizedPhotoUrl(
  secureUrlOrPublicId: string,
  options: { width?: number; height?: number; watermarkText?: string }
): string {
  const cfg = getCloudinaryConfig();
  if (secureUrlOrPublicId.startsWith('data:') || secureUrlOrPublicId.startsWith('blob:')) {
    return secureUrlOrPublicId;
  }
  if (!isCloudinaryConfigured(cfg)) {
    return secureUrlOrPublicId;
  }
  return buildCloudinaryTransformUrl(cfg.cloudName, secureUrlOrPublicId, options);
}
