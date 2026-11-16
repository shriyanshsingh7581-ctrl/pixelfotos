import JSZip from 'jszip';
import { LutPreset, ShootPhoto, WatermarkConfig } from '../types/pixelfotos';
import { triggerDirectDownload } from './cloudinary';

/**
 * Parses real Adobe .cube 3D LUT text files into an N^3 RGB Float table
 */
export function parseCubeLutFile(text: string, fileName: string): LutPreset {
  const titleMatch = text.match(/TITLE\s+"?([^"\r\n]+)"?/i);
  const sizeMatch = text.match(/LUT_3D_SIZE\s+(\d+)/i);
  const domainMinMatch = text.match(
    /DOMAIN_MIN\s+([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)/i
  );
  const domainMaxMatch = text.match(
    /DOMAIN_MAX\s+([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)/i
  );

  const lutSize = sizeMatch ? Math.max(2, Math.min(65, Number(sizeMatch[1]))) : 17;
  const domainMin: [number, number, number] = domainMinMatch
    ? [Number(domainMinMatch[1]), Number(domainMinMatch[2]), Number(domainMinMatch[3])]
    : [0, 0, 0];
  const domainMax: [number, number, number] = domainMaxMatch
    ? [Number(domainMaxMatch[1]), Number(domainMaxMatch[2]), Number(domainMaxMatch[3])]
    : [1, 1, 1];

  const cubeTable: number[] = [];
  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (
      !line ||
      line.startsWith('#') ||
      /^[A-Z_]+/.test(line)
    ) {
      continue;
    }
    const parts = line.split(/\s+/);
    if (parts.length >= 3) {
      const r = Number(parts[0]);
      const g = Number(parts[1]);
      const b = Number(parts[2]);
      if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
        cubeTable.push(
          Math.max(0, Math.min(1, r)),
          Math.max(0, Math.min(1, g)),
          Math.max(0, Math.min(1, b))
        );
      }
    }
  }

  // Derive inferred actual LUT size if header was missing or mismatched
  const expectedTriplets = Math.round(Math.cbrt(cubeTable.length / 3));
  const finalSize = expectedTriplets >= 2 ? expectedTriplets : lutSize;

  return {
    id: `lut_cube_${Date.now()}`,
    name: titleMatch?.[1]?.trim() || fileName.replace(/\.(cube|3dl)$/i, ''),
    source: 'custom_cube',
    fileName,
    lutSize: finalSize,
    cubeTable,
    domainMin,
    domainMax,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    sepia: 0,
    hueRotate: 0,
    warmthOverlay: '',
  };
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

function sampleCubeTrilinear(
  table: number[],
  size: number,
  rNorm: number,
  gNorm: number,
  bNorm: number
): [number, number, number] {
  const maxIdx = size - 1;
  const rPos = Math.max(0, Math.min(maxIdx, rNorm * maxIdx));
  const gPos = Math.max(0, Math.min(maxIdx, gNorm * maxIdx));
  const bPos = Math.max(0, Math.min(maxIdx, bNorm * maxIdx));

  const r0 = Math.floor(rPos);
  const g0 = Math.floor(gPos);
  const b0 = Math.floor(bPos);
  const r1 = Math.min(maxIdx, r0 + 1);
  const g1 = Math.min(maxIdx, g0 + 1);
  const b1 = Math.min(maxIdx, b0 + 1);

  const dr = rPos - r0;
  const dg = gPos - g0;
  const db = bPos - b0;

  const idx = (ri: number, gi: number, bi: number) => (bi * size * size + gi * size + ri) * 3;

  const out: [number, number, number] = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    const c000 = table[idx(r0, g0, b0) + c] ?? rNorm;
    const c100 = table[idx(r1, g0, b0) + c] ?? rNorm;
    const c010 = table[idx(r0, g1, b0) + c] ?? gNorm;
    const c110 = table[idx(r1, g1, b0) + c] ?? gNorm;
    const c001 = table[idx(r0, g0, b1) + c] ?? bNorm;
    const c101 = table[idx(r1, g0, b1) + c] ?? bNorm;
    const c011 = table[idx(r0, g1, b1) + c] ?? bNorm;
    const c111 = table[idx(r1, g1, b1) + c] ?? bNorm;

    const c00 = c000 * (1 - dr) + c100 * dr;
    const c10 = c010 * (1 - dr) + c110 * dr;
    const c01 = c001 * (1 - dr) + c101 * dr;
    const c11 = c011 * (1 - dr) + c111 * dr;

    const c0 = c00 * (1 - dg) + c10 * dg;
    const c1 = c01 * (1 - dg) + c11 * dg;

    out[c] = c0 * (1 - db) + c1 * db;
  }

  return out;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
}

export async function renderGradedCanvas(options: {
  imageUrl: string;
  lut: LutPreset;
  batchExposureMatch: boolean;
  watermark: WatermarkConfig;
  maxWidth?: number;
  targetCanvas?: HTMLCanvasElement;
}): Promise<HTMLCanvasElement> {
  const { imageUrl, lut, batchExposureMatch, watermark, maxWidth, targetCanvas } = options;
  const img = await loadImage(imageUrl);

  const naturalW = img.naturalWidth || 1200;
  const naturalH = img.naturalHeight || 800;
  const scale = maxWidth ? Math.min(1, maxWidth / naturalW) : 1;
  const width = Math.max(1, Math.round(naturalW * scale));
  const height = Math.max(1, Math.round(naturalH * scale));

  const canvas = targetCanvas || document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Optional auto exposure & white-balance histogram neutralization
  let avgR = 128;
  let avgG = 128;
  let avgB = 128;
  let expGain = 1;

  if (batchExposureMatch) {
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    const stride = 4 * 4;
    let samples = 0;
    for (let i = 0; i < data.length; i += stride) {
      sumR += data[i];
      sumG += data[i + 1];
      sumB += data[i + 2];
      samples++;
    }
    if (samples > 0) {
      avgR = Math.max(40, sumR / samples);
      avgG = Math.max(40, sumG / samples);
      avgB = Math.max(40, sumB / samples);
      const meanGray = (avgR + avgG + avgB) / 3;
      expGain = Math.max(0.86, Math.min(1.22, 128 / meanGray));
    }
  }

  const grayWorldAvg = (avgR + avgG + avgB) / 3;
  const wbR = batchExposureMatch ? Math.max(0.88, Math.min(1.12, grayWorldAvg / avgR)) : 1;
  const wbG = batchExposureMatch ? Math.max(0.88, Math.min(1.12, grayWorldAvg / avgG)) : 1;
  const wbB = batchExposureMatch ? Math.max(0.88, Math.min(1.12, grayWorldAvg / avgB)) : 1;

  const hasCubeTable =
    lut.source === 'custom_cube' &&
    Array.isArray(lut.cubeTable) &&
    lut.cubeTable.length >= 24 &&
    lut.lutSize &&
    lut.lutSize >= 2;

  const brightMul = lut.brightness / 100;
  const contrastMul = lut.contrast / 100;
  const satMul = lut.saturate / 100;
  const sepiaAmt = lut.sepia / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] * expGain * wbR;
    let g = data[i + 1] * expGain * wbG;
    let b = data[i + 2] * expGain * wbB;

    if (hasCubeTable && lut.cubeTable && lut.lutSize) {
      const dMin = lut.domainMin || [0, 0, 0];
      const dMax = lut.domainMax || [1, 1, 1];
      const rn = (r / 255 - dMin[0]) / Math.max(0.001, dMax[0] - dMin[0]);
      const gn = (g / 255 - dMin[1]) / Math.max(0.001, dMax[1] - dMin[1]);
      const bn = (b / 255 - dMin[2]) / Math.max(0.001, dMax[2] - dMin[2]);

      const [tr, tg, tb] = sampleCubeTrilinear(lut.cubeTable, lut.lutSize, rn, gn, bn);
      r = tr * 255;
      g = tg * 255;
      b = tb * 255;
    } else {
      // Built-in mathematical tonal & color matrix grade
      r *= brightMul;
      g *= brightMul;
      b *= brightMul;

      r = (r - 128) * contrastMul + 128;
      g = (g - 128) * contrastMul + 128;
      b = (b - 128) * contrastMul + 128;

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      r = lum + (r - lum) * satMul;
      g = lum + (g - lum) * satMul;
      b = lum + (b - lum) * satMul;

      if (sepiaAmt > 0) {
        const sr = r * 0.393 + g * 0.769 + b * 0.189;
        const sg = r * 0.349 + g * 0.686 + b * 0.168;
        const sb = r * 0.272 + g * 0.534 + b * 0.131;
        r = r * (1 - sepiaAmt) + sr * sepiaAmt;
        g = g * (1 - sepiaAmt) + sg * sepiaAmt;
        b = b * (1 - sepiaAmt) + sb * sepiaAmt;
      }
    }

    data[i] = clampByte(r);
    data[i + 1] = clampByte(g);
    data[i + 2] = clampByte(b);
  }

  ctx.putImageData(imgData, 0, 0);

  // Subtle warmth tint overlay if defined
  if (lut.warmthOverlay) {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = lut.warmthOverlay;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // Real Watermark Rendering onto Canvas
  if (watermark.enabled) {
    ctx.save();
    ctx.globalAlpha = Math.max(0.05, Math.min(1, watermark.opacity / 100));
    const pad = Math.round(Math.min(width, height) * 0.04);
    const wmScale = watermark.scale / 100;

    if (watermark.mode === 'logo' && watermark.logoDataUrl) {
      try {
        const logoImg = await loadImage(watermark.logoDataUrl);
        const targetH = Math.max(24, Math.round(height * 0.09 * wmScale));
        const ratio = (logoImg.naturalWidth || 120) / Math.max(1, logoImg.naturalHeight || 60);
        const targetW = Math.round(targetH * ratio);

        let x = width - targetW - pad;
        let y = height - targetH - pad;
        if (watermark.position === 'top-left') {
          x = pad;
          y = pad;
        } else if (watermark.position === 'top-right') {
          x = width - targetW - pad;
          y = pad;
        } else if (watermark.position === 'bottom-left') {
          x = pad;
          y = height - targetH - pad;
        } else if (watermark.position === 'center') {
          x = Math.round((width - targetW) / 2);
          y = Math.round((height - targetH) / 2);
        }
        ctx.drawImage(logoImg, x, y, targetW, targetH);
      } catch {
        // Fallback to text if logo fails
      }
    } else if (watermark.text.trim()) {
      const fontSize = Math.max(12, Math.round(width * 0.024 * wmScale));
      ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;
      const text = watermark.text.toUpperCase();
      const metrics = ctx.measureText(text);
      const boxW = metrics.width + fontSize * 1.1;
      const boxH = fontSize * 1.7;

      let x = width - boxW - pad;
      let y = height - boxH - pad;
      if (watermark.position === 'top-left') {
        x = pad;
        y = pad;
      } else if (watermark.position === 'top-right') {
        x = width - boxW - pad;
        y = pad;
      } else if (watermark.position === 'bottom-left') {
        x = pad;
        y = height - boxH - pad;
      } else if (watermark.position === 'center') {
        x = Math.round((width - boxW) / 2);
        y = Math.round((height - boxH) / 2);
      }

      ctx.fillStyle = 'rgba(9, 11, 16, 0.52)';
      ctx.fillRect(x, y, boxW, boxH);
      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(text, x + boxW / 2, y + boxH / 2);
    }
    ctx.restore();
  }

  return canvas;
}

export async function exportGradedImageDownload(options: {
  imageUrl: string;
  fileName: string;
  lut: LutPreset;
  batchExposureMatch: boolean;
  watermark: WatermarkConfig;
}): Promise<void> {
  const canvas = await renderGradedCanvas({
    imageUrl: options.imageUrl,
    lut: options.lut,
    batchExposureMatch: options.batchExposureMatch,
    watermark: options.watermark,
  });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.94)
  );
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const outName = options.fileName.replace(/\.[^.]+$/, '') + '_PixelFotos_Graded.jpg';
  await triggerDirectDownload(url, outName);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function exportBatchGradedZip(options: {
  photos: ShootPhoto[];
  lut: LutPreset;
  batchExposureMatch: boolean;
  watermark: WatermarkConfig;
}): Promise<number> {
  const zip = new JSZip();
  let count = 0;

  for (const photo of options.photos) {
    try {
      const canvas = await renderGradedCanvas({
        imageUrl: photo.url,
        lut: options.lut,
        batchExposureMatch: options.batchExposureMatch,
        watermark: options.watermark,
        maxWidth: 1600,
      });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
      );
      if (blob) {
        const outName = photo.fileName.replace(/\.[^.]+$/, '') + '_Graded.jpg';
        zip.file(outName, blob);
        count++;
      }
    } catch {
      // skip
    }
  }

  if (count === 0) return 0;
  const archive = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(archive);
  await triggerDirectDownload(url, `PixelFotos_LUT_Batch_${count}.zip`);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return count;
}
