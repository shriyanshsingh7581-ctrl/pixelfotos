import JSZip from 'jszip';
import { ShootPhoto } from '../types/pixelfotos';
import { triggerDirectDownload } from './cloudinary';

export interface RawMatchReport {
  totalScannedFiles: number;
  matchedFiles: {
    shortlistPhotoName: string;
    matchedFileName: string;
    sizeBytes: number;
    copiedToSubfolder: boolean;
  }[];
  missingBaseNames: string[];
  outputFolderName: string;
  usedNativeFsApi: boolean;
}

export function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').trim().toLowerCase();
}

export function buildShortlistBaseNameMap(likedPhotos: ShootPhoto[]): Map<string, ShootPhoto> {
  const map = new Map<string, ShootPhoto>();
  for (const p of likedPhotos) {
    if (p.rawFileName) {
      map.set(stripFileExtension(p.rawFileName), p);
    }
    if (p.fileName) {
      map.set(stripFileExtension(p.fileName), p);
    }
  }
  return map;
}

export function supportsDirectoryPicker(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

interface DirHandleEntry {
  kind: 'file' | 'directory';
  name: string;
  getFile?: () => Promise<File>;
  values?: () => AsyncIterable<DirHandleEntry>;
}

interface DirHandle {
  name: string;
  values: () => AsyncIterable<DirHandleEntry>;
  getDirectoryHandle: (name: string, opts?: { create?: boolean }) => Promise<DirHandle>;
  getFileHandle: (
    name: string,
    opts?: { create?: boolean }
  ) => Promise<{
    createWritable: () => Promise<{
      write: (data: ArrayBuffer) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
}

async function collectFilesFromDirHandle(
  dirHandle: DirHandle,
  depth = 0
): Promise<{ name: string; file: File }[]> {
  const results: { name: string; file: File }[] = [];
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file' && entry.getFile) {
      const f = await entry.getFile();
      results.push({ name: entry.name, file: f });
    } else if (entry.kind === 'directory' && depth < 1 && entry.name !== 'Selected_Originals') {
      // Scan 1 level deep (e.g. 100EOSR5 / DCIM subfolders)
      const sub = entry as unknown as DirHandle;
      if (typeof sub.values === 'function') {
        const nested = await collectFilesFromDirHandle(sub, depth + 1);
        results.push(...nested);
      }
    }
  }
  return results;
}

/**
 * Real File System Access API picker: locates matching RAW/JPEG originals ignoring extension
 * and copies matched files into a real "Selected_Originals" subfolder on the user's device.
 */
export async function locateAndCopyWithDirectoryPicker(
  likedPhotos: ShootPhoto[]
): Promise<RawMatchReport> {
  const pickerFn = (
    window as unknown as {
      showDirectoryPicker?: (opts: { mode: 'readwrite' | 'read' }) => Promise<DirHandle>;
    }
  ).showDirectoryPicker;

  if (!pickerFn) {
    throw new Error('UNSUPPORTED_DIRECTORY_PICKER');
  }

  const rootDir = await pickerFn({ mode: 'readwrite' });
  const allEntries = await collectFilesFromDirHandle(rootDir);
  const baseMap = buildShortlistBaseNameMap(likedPhotos);

  const outputDir = await rootDir.getDirectoryHandle('Selected_Originals', { create: true });
  const matchedFiles: RawMatchReport['matchedFiles'] = [];
  const matchedBases = new Set<string>();

  for (const item of allEntries) {
    const base = stripFileExtension(item.name);
    const shortlistPhoto = baseMap.get(base);
    if (shortlistPhoto) {
      const targetHandle = await outputDir.getFileHandle(item.name, { create: true });
      const writable = await targetHandle.createWritable();
      const buffer = await item.file.arrayBuffer();
      await writable.write(buffer);
      await writable.close();

      matchedBases.add(base);
      matchedFiles.push({
        shortlistPhotoName: shortlistPhoto.fileName,
        matchedFileName: item.name,
        sizeBytes: item.file.size,
        copiedToSubfolder: true,
      });
    }
  }

  const missingBaseNames: string[] = [];
  for (const p of likedPhotos) {
    const rawBase = stripFileExtension(p.rawFileName || p.fileName);
    const jpgBase = stripFileExtension(p.fileName);
    if (!matchedBases.has(rawBase) && !matchedBases.has(jpgBase)) {
      missingBaseNames.push(p.rawFileName || p.fileName);
    }
  }

  return {
    totalScannedFiles: allEntries.length,
    matchedFiles,
    missingBaseNames,
    outputFolderName: `${rootDir.name}/Selected_Originals`,
    usedNativeFsApi: true,
  };
}

/**
 * Fallback for <input webkitdirectory>: matches local FileList ignoring extensions
 * and bundles matched originals into Selected_Originals.zip
 */
export async function matchAndZipFromFileList(
  files: File[],
  likedPhotos: ShootPhoto[],
  downloadZip = true
): Promise<RawMatchReport> {
  const baseMap = buildShortlistBaseNameMap(likedPhotos);
  const matchedFiles: RawMatchReport['matchedFiles'] = [];
  const matchedBases = new Set<string>();
  const zip = new JSZip();

  for (const file of files) {
    const base = stripFileExtension(file.name);
    const shortlistPhoto = baseMap.get(base);
    if (shortlistPhoto) {
      matchedBases.add(base);
      matchedFiles.push({
        shortlistPhotoName: shortlistPhoto.fileName,
        matchedFileName: file.name,
        sizeBytes: file.size,
        copiedToSubfolder: false,
      });
      if (downloadZip) {
        zip.file(file.name, file);
      }
    }
  }

  if (downloadZip && matchedFiles.length > 0) {
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    await triggerDirectDownload(url, 'Selected_Originals.zip');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  const missingBaseNames: string[] = [];
  for (const p of likedPhotos) {
    const rawBase = stripFileExtension(p.rawFileName || p.fileName);
    const jpgBase = stripFileExtension(p.fileName);
    if (!matchedBases.has(rawBase) && !matchedBases.has(jpgBase)) {
      missingBaseNames.push(p.rawFileName || p.fileName);
    }
  }

  return {
    totalScannedFiles: files.length,
    matchedFiles,
    missingBaseNames,
    outputFolderName: 'Selected_Originals.zip',
    usedNativeFsApi: false,
  };
}
