export interface FaceSearchConsentRecord {
  galleryId: string;
  guestName: string;
  guestEmail: string;
  consentedAt: string;
  retentionDays: number;
  selfieDataUrl?: string;
}

export interface FaceRecognitionAdapterStatus {
  configured: boolean;
  endpointUrl: string;
  providerName: string;
  message: string;
}

const CONSENT_STORAGE_KEY = 'lumina_face_consents_v1';

export class FaceRecognitionService {
  static getAdapterStatus(): FaceRecognitionAdapterStatus {
    const endpoint = import.meta.env.VITE_FACE_RECOGNITION_API_ENDPOINT || '';
    if (!endpoint) {
      return {
        configured: false,
        endpointUrl: '',
        providerName: 'External Biometric Vector Adapter (Not Configured)',
        message:
          'Service-Not-Configured Mode: Firebase and Cloudinary do not natively perform biometric face indexing. Connect an AWS Rekognition / InsightFace microservice via VITE_FACE_RECOGNITION_API_ENDPOINT to enable live vector matching. No fabricated AI matches are shown.',
      };
    }
    return {
      configured: true,
      endpointUrl: endpoint,
      providerName: 'Configured Face Vector Service',
      message: 'Connected to external biometric vector indexing endpoint.',
    };
  }

  static saveGuestConsent(record: FaceSearchConsentRecord): void {
    const existing = this.getConsents();
    const filtered = existing.filter(
      (c) => !(c.galleryId === record.galleryId && c.guestEmail === record.guestEmail)
    );
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify([record, ...filtered]));
  }

  static getConsents(): FaceSearchConsentRecord[] {
    try {
      const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static deleteGuestSelfieAndBiometricData(galleryId: string, guestEmail: string): void {
    const existing = this.getConsents();
    const remaining = existing.filter(
      (c) => !(c.galleryId === galleryId && c.guestEmail.toLowerCase() === guestEmail.toLowerCase())
    );
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(remaining));
  }
}
