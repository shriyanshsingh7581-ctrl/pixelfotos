export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export type UserRole =
  | 'super_admin'
  | 'studio_owner'
  | 'studio_admin'
  | 'photographer'
  | 'photo_editor'
  | 'customer'
  | 'event_guest';

export type SubscriptionPlanId = 'starter' | 'pro' | 'studio_max';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  storageLimitGB: number;
  projectLimit: number;
  photoLimit: number;
  galleryLimit: number;
  teamMemberLimit: number;
  aiCredits: number;
  features: string[];
}

export interface StudioProfile {
  id: string;
  studioName: string;
  slug: string;
  tagline: string;
  about: string;
  logoUrl: string;
  ownerId: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  customDomain: string;
  gstNumber: string;
  watermarkText: string;
  subscriptionPlan: SubscriptionPlanId;
  subscriptionStatus: 'active' | 'trial' | 'suspended';
  storageUsedBytes: number;
  aiCreditsRemaining: number;
  createdAt: string;
}

export interface StudioProject {
  id: string;
  studioId: string;
  ownerId: string;
  projectName: string;
  projectType: 'wedding' | 'pre_wedding' | 'event' | 'portrait' | 'editorial' | 'corporate';
  clientId: string;
  clientName: string;
  eventDate: string;
  location: string;
  status: 'planning' | 'shooting' | 'culling' | 'proofing' | 'delivered';
  coverImage: string;
  photoCount: number;
  createdAt: string;
}

export interface GalleryComment {
  id: string;
  photoId: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: string;
}

export interface PhotoAsset {
  id: string;
  studioId: string;
  galleryId: string;
  ownerId: string;
  publicId: string;
  secureUrl: string;
  thumbnailUrl: string;
  fileName: string;
  width: number;
  height: number;
  fileSize: number;
  category: string;
  exif: {
    camera: string;
    lens: string;
    aperture: string;
    shutter: string;
    iso: string;
  };
  selected: boolean;
  liked: boolean;
  likesCount: number;
  comments: GalleryComment[];
  uploadedAt: string;
}

export interface StudioGallery {
  id: string;
  studioId: string;
  projectId: string;
  ownerId: string;
  galleryName: string;
  galleryType:
    | 'Wedding Gallery'
    | 'Client Proofing Gallery'
    | 'Event Gallery'
    | 'Portrait Gallery'
    | 'Corporate Gallery'
    | 'Portfolio Gallery';
  accessType: 'public' | 'private' | 'password';
  passwordHash: string;
  passwordHint?: string;
  selectionEnabled: boolean;
  selectionLimit: number;
  watermarkEnabled: boolean;
  watermarkText: string;
  downloadEnabled: boolean;
  originalQualityEnabled: boolean;
  faceSearchEnabled: boolean;
  expiryDate: string;
  status: 'draft' | 'published' | 'selection_submitted' | 'locked';
  coverImage: string;
  viewCount: number;
  downloadCount: number;
  qrScansCount: number;
  createdAt: string;
}

export interface ClientRecord {
  id: string;
  studioId: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  eventDate: string;
  projectDetails: string;
  notes: string;
  followUpDate: string;
  totalBilled: number;
  totalPaid: number;
  createdAt: string;
}

export interface BookingRecord {
  id: string;
  studioId: string;
  clientId: string;
  clientName: string;
  bookingType: 'Wedding' | 'Pre-Wedding' | 'Corporate Event' | 'Editorial Portrait' | 'Destination Wedding';
  eventDate: string;
  location: string;
  assignedPhotographer: string;
  assignedEditor: string;
  status: 'inquiry' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  packageAmount: number;
  notes: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  studioId: string;
  clientId: string;
  clientName: string;
  clientGstin: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceLineItem[];
  gstRatePercent: number;
  advancePaid: number;
  status: 'quotation' | 'unpaid' | 'partially_paid' | 'paid';
  paymentTransactionId?: string;
  verifiedAt?: string;
}

export interface TeamMember {
  id: string;
  studioId: string;
  name: string;
  email: string;
  role: UserRole;
  specialty: string;
  status: 'active' | 'invited';
  assignedProjectsCount: number;
}

export interface AlbumSpread {
  id: string;
  pageNumber: number;
  title: string;
  layout: 'cover' | 'single_bleed' | 'dual_portrait' | 'editorial_trio';
  backgroundHex: string;
  caption: string;
  photoIds: string[];
}

export interface WeddingAlbumDraft {
  id: string;
  studioId: string;
  galleryId: string;
  albumTitle: string;
  coupleNames: string;
  coverFinish: 'Italian Linen Ivory' | 'Obsidian Velvet' | 'Warm Travertine Leather';
  status: 'draft' | 'awaiting_client_review' | 'revision_requested' | 'approved';
  clientFeedback: string;
  spreads: AlbumSpread[];
  updatedAt: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  uploadPreset: string;
  folder: string;
  signedDeliveryEnabled: boolean;
  lastValidatedAt?: string;
}

export interface CouponRecord {
  id: string;
  code: string;
  discountPercent: number;
  applicablePlan: SubscriptionPlanId | 'all';
  maxUses: number;
  usedCount: number;
  expiryDate: string;
  active: boolean;
}
