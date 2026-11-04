# Lumina Studio OS — Photography SaaS & Client Proofing Platform

Lumina Studio OS is a full-stack Photography Studio Management, Client Proofing, QR Event Photo Sharing, Online Photo Editor, Wedding Album Designer, and CRM SaaS platform inspired by Groupfie, FotoOwl, and Fotos.

## Architecture & Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Framer Motion, HTML5 Canvas (Online Photo Editor & Watermarking), jsPDF (GST Invoice & Wedding Album PDF Export), `qrcode` (Event QR Code Generator).
- **Backend & Persistence**:
  - Firebase Authentication (Google Sign-In, Email/Password, Password Reset, Email Verification, 6-Step Studio Onboarding).
  - Firebase Firestore & Realtime Database Rules (`firestore.rules`, `database.rules.json`, `database.indexes.json`) with studio-level tenant isolation and RBAC.
  - Cloudinary Integration (`src/lib/cloudinary.ts`, `src/services/uploadService.ts`) supporting unsigned preset uploads, folder organization (`photography-studios/{studioId}/projects/{projectId}/{galleryId}`), responsive transformations, and local high-res Canvas fallback when credentials are not yet configured.
- **PWA**: Configured with `vite-plugin-pwa`, offline caching, manifest, and in-app install prompt (`PWAInstallButton`).

## Environment Variables (`.env`)
Copy `.env.example` to `.env` and configure:
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_API_KEY`
- `VITE_CLOUDINARY_UPLOAD_PRESET`
- `VITE_CLOUDINARY_FOLDER` (defaults to `photography-studios`)
- `VITE_FACE_RECOGNITION_API_ENDPOINT` (optional external face-indexing microservice)
- `VITE_PAYMENT_VERIFICATION_WEBHOOK_URL` (optional payment verification endpoint)

## Deployment
1. Build production bundle: `npm run build`
2. Deploy Firestore & Realtime Database rules: `firebase deploy --only firestore:rules,database`
