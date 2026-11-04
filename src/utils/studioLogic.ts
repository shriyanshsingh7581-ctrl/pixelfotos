import {
  InvoiceLineItem,
  PhotoAsset,
  SubscriptionPlan,
} from '../types';

/**
 * Deterministic, non-plain-text hash for client gallery access verification.
 */
export function hashGalleryPassword(rawPassword: string): string {
  const trimmed = rawPassword.trim();
  if (!trimmed) return '';
  let h1 = 0xdeadbeef ^ trimmed.length;
  let h2 = 0x41c6ce57 ^ trimmed.length;
  for (let i = 0, ch; i < trimmed.length; i++) {
    ch = trimmed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'sha256_sim_' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
}

export function verifyGalleryPassword(inputPassword: string, storedHash: string): boolean {
  if (!storedHash) return true;
  return hashGalleryPassword(inputPassword) === storedHash;
}

export interface SelectionMetrics {
  selectedCount: number;
  likedCount: number;
  selectionLimit: number;
  remainingSelections: number;
  limitReached: boolean;
  progressPercent: number;
}

export function calculateSelectionMetrics(
  photos: Pick<PhotoAsset, 'selected' | 'liked'>[],
  selectionLimit: number
): SelectionMetrics {
  const safeLimit = Math.max(1, selectionLimit);
  const selectedCount = photos.filter((p) => p.selected).length;
  const likedCount = photos.filter((p) => p.liked).length;
  const remainingSelections = Math.max(0, safeLimit - selectedCount);
  const limitReached = selectedCount >= safeLimit;
  const progressPercent = Math.min(100, Math.round((selectedCount / safeLimit) * 100));

  return {
    selectedCount,
    likedCount,
    selectionLimit: safeLimit,
    remainingSelections,
    limitReached,
    progressPercent,
  };
}

export function canTogglePhotoSelection(
  currentlySelected: boolean,
  currentSelectedCount: number,
  selectionLimit: number,
  galleryStatus: 'draft' | 'published' | 'selection_submitted' | 'locked'
): { allowed: boolean; reason?: string } {
  if (galleryStatus === 'locked') {
    return { allowed: false, reason: 'Gallery selections have been locked by the photographer.' };
  }
  if (galleryStatus === 'selection_submitted') {
    return { allowed: false, reason: 'Selections are already submitted. Reopen selection to make changes.' };
  }
  if (!currentlySelected && currentSelectedCount >= selectionLimit) {
    return {
      allowed: false,
      reason: `Selection limit of ${selectionLimit} photos reached. Deselect a photo first.`,
    };
  }
  return { allowed: true };
}

export function exportSelectedPhotosToCSV(photos: PhotoAsset[], galleryName: string): string {
  const selected = photos.filter((p) => p.selected);
  const headers = ['Photo ID', 'File Name', 'Category', 'Public ID', 'Liked', 'Comments Count', 'Gallery'];
  const rows = selected.map((p) => [
    p.id,
    `"${p.fileName.replace(/"/g, '""')}"`,
    `"${p.category}"`,
    `"${p.publicId}"`,
    p.liked ? 'Yes' : 'No',
    String(p.comments.length),
    `"${galleryName.replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export interface GSTInvoiceCalculation {
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  totalGstAmount: number;
  grandTotal: number;
  advancePaid: number;
  balanceDue: number;
  derivedStatus: 'unpaid' | 'partially_paid' | 'paid';
}

export function calculateGSTInvoice(
  items: InvoiceLineItem[],
  gstRatePercent: number,
  advancePaid: number,
  hasVerifiedPaymentRecord: boolean
): GSTInvoiceCalculation {
  const subtotal = items.reduce((acc, item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    return acc + qty * price;
  }, 0);

  const safeGstRate = Math.max(0, Math.min(50, Number(gstRatePercent) || 0));
  const totalGstAmount = Math.round((subtotal * safeGstRate) / 100);
  const cgstAmount = Math.round(totalGstAmount / 2);
  const sgstAmount = totalGstAmount - cgstAmount;
  const grandTotal = subtotal + totalGstAmount;
  const clampedAdvance = Math.max(0, Math.min(grandTotal, Number(advancePaid) || 0));
  const balanceDue = Math.max(0, grandTotal - clampedAdvance);

  let derivedStatus: 'unpaid' | 'partially_paid' | 'paid' = 'unpaid';
  if (balanceDue === 0 && grandTotal > 0 && hasVerifiedPaymentRecord) {
    derivedStatus = 'paid';
  } else if (clampedAdvance > 0) {
    derivedStatus = 'partially_paid';
  }

  return {
    subtotal,
    cgstAmount,
    sgstAmount,
    totalGstAmount,
    grandTotal,
    advancePaid: clampedAdvance,
    balanceDue,
    derivedStatus,
  };
}

export interface QuotaCheckResult {
  withinQuota: boolean;
  storagePercent: number;
  projectsPercent: number;
  photosPercent: number;
  warnings: string[];
}

export function evaluateStudioQuota(
  plan: SubscriptionPlan,
  usage: {
    storageUsedBytes: number;
    projectCount: number;
    photoCount: number;
    galleryCount: number;
  }
): QuotaCheckResult {
  const maxStorageBytes = plan.storageLimitGB * 1024 * 1024 * 1024;
  const storagePercent = Math.min(100, Math.round((usage.storageUsedBytes / maxStorageBytes) * 100));
  const projectsPercent = Math.min(100, Math.round((usage.projectCount / plan.projectLimit) * 100));
  const photosPercent = Math.min(100, Math.round((usage.photoCount / plan.photoLimit) * 100));

  const warnings: string[] = [];
  if (usage.storageUsedBytes > maxStorageBytes) {
    warnings.push(`Storage quota exceeded (${plan.storageLimitGB} GB limit).`);
  }
  if (usage.projectCount >= plan.projectLimit) {
    warnings.push(`Project limit reached (${plan.projectLimit} projects).`);
  }
  if (usage.photoCount >= plan.photoLimit) {
    warnings.push(`Photo limit reached (${plan.photoLimit} photos).`);
  }
  if (usage.galleryCount >= plan.galleryLimit) {
    warnings.push(`Gallery limit reached (${plan.galleryLimit} galleries).`);
  }

  return {
    withinQuota: warnings.length === 0,
    storagePercent,
    projectsPercent,
    photosPercent,
    warnings,
  };
}

export function buildCloudinaryTransformUrl(
  cloudName: string,
  publicId: string,
  options: { width?: number; height?: number; quality?: string; format?: string; watermarkText?: string }
): string {
  if (!cloudName || cloudName === 'YOUR_CLOUD_NAME' || publicId.startsWith('data:')) {
    return publicId;
  }
  const transforms: string[] = ['f_' + (options.format || 'auto'), 'q_' + (options.quality || 'auto')];
  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`, 'c_fill');
  if (options.watermarkText) {
    const cleanText = encodeURIComponent(options.watermarkText.replace(/[^a-zA-Z0-9 \-]/g, ''));
    transforms.push(`l_text:Arial_28_bold:${cleanText},co_rgb:ffffff,o_45,g_south_east,x_24,y_24`);
  }
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(',')}/${publicId}`;
}

/**
 * Generates a rich, fine-art editorial SVG data URI photograph so galleries, lightboxes,
 * Canvas photo editor, and album spreads render with zero broken images even offline.
 */
export function createEditorialPhotoDataUri(params: {
  id: string;
  title: string;
  subtitle: string;
  palette: 'golden_courtyard' | 'bridal_window' | 'reception_dusk' | 'studio_monochrome' | 'garden_ceremony' | 'architectural_arch';
  aspect?: '16:9' | '4:3' | '3:4';
}): string {
  const width = params.aspect === '3:4' ? 900 : params.aspect === '4:3' ? 1200 : 1440;
  const height = params.aspect === '3:4' ? 1200 : params.aspect === '4:3' ? 900 : 810;

  const palettes = {
    golden_courtyard: {
      bg1: '#1E1B18',
      bg2: '#5C4028',
      bg3: '#D4A373',
      accent: '#F4E4BA',
      silhouette: '#14110F',
    },
    bridal_window: {
      bg1: '#23272A',
      bg2: '#646E78',
      bg3: '#E2ECE9',
      accent: '#FFFFFF',
      silhouette: '#181B1E',
    },
    reception_dusk: {
      bg1: '#0F172A',
      bg2: '#1E293B',
      bg3: '#C89D54',
      accent: '#FDE68A',
      silhouette: '#090D16',
    },
    studio_monochrome: {
      bg1: '#18181B',
      bg2: '#3F3F46',
      bg3: '#D4D4D8',
      accent: '#FAFAFA',
      silhouette: '#09090B',
    },
    garden_ceremony: {
      bg1: '#132A13',
      bg2: '#31572C',
      bg3: '#ECF39E',
      accent: '#FFFBEB',
      silhouette: '#0B190B',
    },
    architectural_arch: {
      bg1: '#2B2118',
      bg2: '#6F4E37',
      bg3: '#E6CCB2',
      accent: '#EDE0D4',
      silhouette: '#1A140F',
    },
  };

  const p = palettes[params.palette];
  const cx = Math.round(width * 0.52);
  const cy = Math.round(height * 0.44);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="sky_${params.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.bg1}" />
        <stop offset="55%" stop-color="${p.bg2}" />
        <stop offset="100%" stop-color="${p.bg3}" />
      </linearGradient>
      <radialGradient id="sun_${params.id}" cx="62%" cy="34%" r="55%">
        <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.78" />
        <stop offset="45%" stop-color="${p.bg3}" stop-opacity="0.32" />
        <stop offset="100%" stop-color="${p.bg1}" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="scrim_${params.id}" x1="0%" y1="55%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0" />
        <stop offset="100%" stop-color="#090D16" stop-opacity="0.72" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#sky_${params.id})" />
    <rect width="${width}" height="${height}" fill="url(#sun_${params.id})" />
    <!-- Architectural Arches & Light Rays -->
    <path d="M 0 ${height} L 0 ${Math.round(height * 0.25)} Q ${Math.round(width * 0.25)} ${Math.round(height * 0.05)} ${Math.round(width * 0.5)} ${Math.round(height * 0.25)} L ${Math.round(width * 0.5)} ${height} Z" fill="${p.silhouette}" fill-opacity="0.22" />
    <circle cx="${Math.round(width * 0.64)}" cy="${Math.round(height * 0.32)}" r="${Math.round(Math.min(width, height) * 0.19)}" fill="${p.accent}" fill-opacity="0.28" />
    <!-- Editorial Subject Composition -->
    <ellipse cx="${cx}" cy="${Math.round(height * 0.88)}" rx="${Math.round(width * 0.34)}" ry="${Math.round(height * 0.16)}" fill="${p.silhouette}" fill-opacity="0.65" />
    <!-- Figure 1 -->
    <circle cx="${cx - 42}" cy="${cy - 36}" r="34" fill="${p.silhouette}" fill-opacity="0.88" />
    <path d="M ${cx - 98} ${height} C ${cx - 92} ${cy + 15}, ${cx + 8} ${cy + 15}, ${cx + 14} ${height} Z" fill="${p.silhouette}" fill-opacity="0.88" />
    <!-- Figure 2 & Flowing Veil/Light -->
    <circle cx="${cx + 38}" cy="${cy - 18}" r="31" fill="${p.silhouette}" fill-opacity="0.82" />
    <path d="M ${cx - 14} ${height} C ${cx - 8} ${cy + 30}, ${cx + 110} ${cy + 25}, ${cx + 148} ${height} Z" fill="${p.accent}" fill-opacity="0.36" />
    <path d="M ${cx - 4} ${height} C ${cx + 2} ${cy + 36}, ${cx + 84} ${cy + 36}, ${cx + 96} ${height} Z" fill="${p.silhouette}" fill-opacity="0.84" />
    <!-- Bokeh Highlights -->
    <circle cx="${Math.round(width * 0.22)}" cy="${Math.round(height * 0.28)}" r="18" fill="${p.accent}" fill-opacity="0.24" />
    <circle cx="${Math.round(width * 0.78)}" cy="${Math.round(height * 0.48)}" r="26" fill="${p.accent}" fill-opacity="0.18" />
    <circle cx="${Math.round(width * 0.84)}" cy="${Math.round(height * 0.24)}" r="12" fill="${p.accent}" fill-opacity="0.35" />
    <rect width="${width}" height="${height}" fill="url(#scrim_${params.id})" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
