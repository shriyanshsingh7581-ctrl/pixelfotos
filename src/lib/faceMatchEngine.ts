import * as faceapi from 'face-api.js';
import { ShootPhoto } from '../types/pixelfotos';

const MODEL_CDNS = [
  'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights',
  'https://justadudewhohacks.github.io/face-api.js/models',
];

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

export async function ensureFaceModelsLoaded(
  onStatus?: (status: string) => void
): Promise<boolean> {
  if (modelsLoaded) return true;
  if (loadingPromise) {
    await loadingPromise;
    return modelsLoaded;
  }

  loadingPromise = (async () => {
    for (const cdnUrl of MODEL_CDNS) {
      try {
        onStatus?.(`Loading AI Face Match neural weights...`);
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(cdnUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(cdnUrl),
          faceapi.nets.faceRecognitionNet.loadFromUri(cdnUrl),
        ]);
        modelsLoaded = true;
        onStatus?.('Face neural models ready');
        return;
      } catch {
        // try next CDN
      }
    }
  })();

  await loadingPromise;
  loadingPromise = null;
  return modelsLoaded;
}

function loadImageForFaceApi(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode face image'));
    img.src = src;
  });
}

export async function computeFaceEmbeddings(imageSrc: string): Promise<number[][]> {
  const ready = await ensureFaceModelsLoaded();
  if (!ready) return [];

  try {
    const img = await loadImageForFaceApi(imageSrc);
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.42 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    return detections.map((det) => Array.from(det.descriptor));
  } catch {
    return [];
  }
}

export interface FaceMatchScore {
  photoId: string;
  distance: number;
  confidencePct: number;
}

export function matchEmbeddingAgainstGallery(
  guestDescriptor: number[],
  photos: ShootPhoto[],
  threshold = 0.58
): FaceMatchScore[] {
  if (!guestDescriptor || guestDescriptor.length !== 128) return [];
  const guestVec = new Float32Array(guestDescriptor);
  const matches: FaceMatchScore[] = [];

  for (const photo of photos) {
    if (!photo.faceEmbeddings || photo.faceEmbeddings.length === 0) continue;
    let bestDist = Infinity;

    for (const emb of photo.faceEmbeddings) {
      if (emb.length !== 128) continue;
      const dist = faceapi.euclideanDistance(guestVec, new Float32Array(emb));
      if (dist < bestDist) bestDist = dist;
    }

    if (bestDist <= threshold) {
      const confidencePct = Math.max(60, Math.min(99, Math.round((1 - bestDist / 1.0) * 100)));
      matches.push({ photoId: photo.id, distance: bestDist, confidencePct });
    }
  }

  return matches.sort((a, b) => a.distance - b.distance);
}
