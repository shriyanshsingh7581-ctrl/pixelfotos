export type AppViewMode = 'landing' | 'studio' | 'microsite';

export type StudioModuleId =
  | 'lifecycle'
  | 'culling'
  | 'retouch_lut'
  | 'album_retouch'
  | 'microsite_builder'
  | 'print_store'
  | 'crm_expenses'
  | 'billing_upi';

export type LifecycleStageNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type CullingTag = 'best_pick' | 'closed_eyes' | 'blurry' | 'duplicate';

export interface ShootPhoto {
  id: string;
  eventId?: string;
  fileName: string;
  rawFileName: string;
  url: string;
  eventSection: 'Haldi' | 'Sangeet' | 'Wedding' | 'Reception' | 'Portraits';
  poseClusterId: string;
  cullingTag: CullingTag;
  confidenceScore: number;
  sharpnessScore?: number;
  brightnessScore?: number;
  contrastScore?: number;
  dHash?: string;
  faceEmbeddings?: number[][];
  starRating: 1 | 2 | 3 | 4 | 5;
  aiSelected: boolean;
  guestLiked: boolean;
  likesCount: number;
  faceMatchClusters: string[];
  cameraModel: string;
  exifSummary: string;
  capturedAt: string;
}

export type LutCategory = 'Kerala Wedding Style' | 'Signature Studio' | 'Custom .CUBE';

export interface LutPreset {
  id: string;
  name: string;
  category?: LutCategory;
  description?: string;
  source: 'builtin' | 'custom_cube';
  fileName?: string;
  lutSize?: number;
  cubeTable?: number[];
  domainMin?: [number, number, number];
  domainMax?: [number, number, number];
  brightness: number;
  contrast: number;
  saturate: number;
  sepia: number;
  hueRotate: number;
  warmthOverlay: string;
}

export type WatermarkFont =
  | 'Cormorant Garamond'
  | 'Great Vibes'
  | 'Cinzel'
  | 'Plus Jakarta Sans'
  | 'JetBrains Mono';

export interface WatermarkConfig {
  enabled: boolean;
  mode: 'text' | 'logo';
  text: string;
  fontFamily?: WatermarkFont;
  logoDataUrl: string;
  opacity: number;
  scale: number;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
}

export interface AlbumRetouchSettings {
  presetName?: string;
  masterIntensity: number;
  skinBlemishCleanup: number;
  skinToneWarmth: number;
  flyawayHairReduction: number;
  faceOilGlareRemoval: number;
  eyeTeethClarity: number;
  dressDetailPop: number;
  backgroundSoftening: number;
  appliedToAlbum: boolean;
  lastProcessedCount: number;
}

export interface EventScheduleItem {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  venueHall: string;
  dressCode: string;
}

export interface EventMicrositeConfig {
  id: string;
  coupleOrHostName: string;
  eventType: 'Wedding' | 'Engagement' | 'Birthday' | 'Griha Pravesh';
  eventDate: string;
  venueName: string;
  venueCity: string;
  googleMapsQuery: string;
  slug: string;
  heroImageUrl: string;
  storyText: string;
  youtubeStreamUrl: string;
  schedule: EventScheduleItem[];
  isPublished?: boolean;
}

export interface GalleryDeliveryConfig {
  studioName: string;
  studioLogoText: string;
  accentColor: string;
  pinProtected: boolean;
  pinCode: string;
  allowHighResDownload: boolean;
  upiId?: string;
  upiPayeeName?: string;
}

export interface PrintProduct {
  id: string;
  name: string;
  category: 'Wooden Frame' | 'Acrylic Frame' | 'Canvas Print' | 'Luxury Album' | 'Fine Art Print';
  dimensions: string;
  studioCostInr: number;
  clientPriceInr: number;
  previewImageUrl: string;
}

export interface PrintOrder {
  id: string;
  photoId: string;
  photoFileName: string;
  photoUrl: string;
  productId: string;
  productName: string;
  category: string;
  dimensions: string;
  quantity: number;
  clientTotalInr: number;
  studioProfitInr: number;
  customerName: string;
  status: 'New Order' | 'In Print Lab' | 'Shipped';
  createdAt: string;
}

export type LeadStatus = 'Inquiry' | 'Booked' | 'Editing' | 'Delivered';

export interface CRMClient {
  id: string;
  name: string;
  phone: string;
  email: string;
  eventDate: string;
  packageName: string;
  packageValueInr: number;
  leadStatus: LeadStatus;
  communicationLogs: { id: string; date: string; note: string }[];
}

export interface TeamAssignment {
  id: string;
  memberName: string;
  role: 'Lead Photographer' | 'Candid Shooter' | 'Cinematographer' | 'Album Editor';
  assignedEvent: string;
  taskTitle: string;
  progressPercent: number;
}

export interface StudioExpense {
  id: string;
  eventId: string;
  eventName: string;
  category: 'Travel' | 'Food' | 'Freelancer Payouts' | 'Equipment Rental' | 'Studio Overhead';
  description: string;
  amountInr: number;
  date: string;
}

export interface InvoiceLineItem {
  id: string;
  service: string;
  description: string;
  qty: number;
  rateInr: number;
}

export interface QuotationInvoiceRecord {
  id: string;
  docNumber: string;
  clientId: string;
  clientName: string;
  eventTitle: string;
  stage: 'Quotation' | 'Invoice';
  status: 'Draft' | 'Sent' | 'Approved' | 'Paid';
  includeGst18: boolean;
  items: InvoiceLineItem[];
  advancePaidInr: number;
  upiId: string;
  payeeName?: string;
  createdAt: string;
}

export interface RegisteredGuest {
  id: string;
  name: string;
  whatsapp: string;
  selfieUrl: string;
  faceClusterKey: string;
  faceEmbedding?: number[];
  notifiedOnFirstUpload: boolean;
  registeredAt: string;
}

export interface WhatsAppDispatchLog {
  id: string;
  recipientName: string;
  whatsapp: string;
  messagePreview: string;
  timestamp: string;
}
