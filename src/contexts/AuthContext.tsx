import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError } from '../lib/firebase';
import {
  BookingRecord,
  ClientRecord,
  CouponRecord,
  InvoiceRecord,
  OperationType,
  PhotoAsset,
  StudioGallery,
  StudioProfile,
  StudioProject,
  SubscriptionPlan,
  TeamMember,
  UserRole,
  WeddingAlbumDraft,
} from '../types';
import {
  INITIAL_ALBUM_DRAFT,
  INITIAL_BOOKINGS,
  INITIAL_CLIENTS,
  INITIAL_COUPONS,
  INITIAL_GALLERIES,
  INITIAL_INVOICES,
  INITIAL_PHOTOS,
  INITIAL_PLANS,
  INITIAL_PROJECTS,
  INITIAL_STUDIO,
  INITIAL_TEAM,
} from '../utils/seedData';

interface StudioContextValue {
  firebaseUser: User | null;
  authReady: boolean;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  studio: StudioProfile;
  updateStudio: (patch: Partial<StudioProfile>) => Promise<void>;
  plans: SubscriptionPlan[];
  updatePlans: React.Dispatch<React.SetStateAction<SubscriptionPlan[]>>;
  projects: StudioProject[];
  addProject: (proj: Omit<StudioProject, 'id' | 'studioId' | 'ownerId' | 'createdAt'>) => Promise<StudioProject>;
  updateProjectStatus: (projectId: string, status: StudioProject['status']) => void;
  galleries: StudioGallery[];
  addGallery: (gal: Omit<StudioGallery, 'id' | 'studioId' | 'ownerId' | 'createdAt' | 'viewCount' | 'downloadCount' | 'qrScansCount'>) => Promise<StudioGallery>;
  updateGallery: (galleryId: string, patch: Partial<StudioGallery>) => void;
  photos: PhotoAsset[];
  addPhotosBatch: (newPhotos: PhotoAsset[]) => Promise<void>;
  togglePhotoSelection: (photoId: string) => { ok: boolean; message?: string };
  togglePhotoLike: (photoId: string) => void;
  addPhotoComment: (photoId: string, authorName: string, authorRole: string, text: string) => void;
  deletePhoto: (photoId: string) => void;
  clients: ClientRecord[];
  addClient: (client: Omit<ClientRecord, 'id' | 'studioId' | 'createdAt'>) => ClientRecord;
  deleteClient: (clientId: string) => void;
  bookings: BookingRecord[];
  addBooking: (booking: Omit<BookingRecord, 'id' | 'studioId'>) => BookingRecord;
  updateBookingStatus: (bookingId: string, status: BookingRecord['status']) => void;
  invoices: InvoiceRecord[];
  addInvoice: (invoice: Omit<InvoiceRecord, 'id' | 'studioId'>) => InvoiceRecord;
  updateInvoice: (invoiceId: string, patch: Partial<InvoiceRecord>) => void;
  team: TeamMember[];
  addTeamMember: (member: Omit<TeamMember, 'id' | 'studioId' | 'assignedProjectsCount'>) => void;
  albumDraft: WeddingAlbumDraft;
  updateAlbumDraft: (patch: Partial<WeddingAlbumDraft>) => void;
  coupons: CouponRecord[];
  addCoupon: (coupon: Omit<CouponRecord, 'id' | 'usedCount'>) => void;
  allStudiosForAdmin: StudioProfile[];
  toggleStudioSuspension: (studioId: string) => void;
  activityLogs: { id: string; actor: string; action: string; timestamp: string }[];
  logActivity: (action: string, actor?: string) => void;
}

const AuthContext = createContext<StudioContextValue | undefined>(undefined);

const LOCAL_STATE_KEY = 'lumina_studio_os_state_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>('studio_owner');
  const [onboardingStep, setOnboardingStep] = useState<number>(6);

  const [studio, setStudio] = useState<StudioProfile>(INITIAL_STUDIO);
  const [plans, updatePlans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);
  const [projects, setProjects] = useState<StudioProject[]>(INITIAL_PROJECTS);
  const [galleries, setGalleries] = useState<StudioGallery[]>(INITIAL_GALLERIES);
  const [photos, setPhotos] = useState<PhotoAsset[]>(INITIAL_PHOTOS);
  const [clients, setClients] = useState<ClientRecord[]>(INITIAL_CLIENTS);
  const [bookings, setBookings] = useState<BookingRecord[]>(INITIAL_BOOKINGS);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES);
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [albumDraft, setAlbumDraft] = useState<WeddingAlbumDraft>(INITIAL_ALBUM_DRAFT);
  const [coupons, setCoupons] = useState<CouponRecord[]>(INITIAL_COUPONS);
  const [allStudiosForAdmin, setAllStudiosForAdmin] = useState<StudioProfile[]>([
    INITIAL_STUDIO,
    {
      ...INITIAL_STUDIO,
      id: 'studio_kyoto_02',
      studioName: 'Kurokawa Fine Art Kyoto',
      slug: 'kurokawa-kyoto',
      email: 'studio@kurokawa.jp',
      subscriptionPlan: 'studio_max',
      subscriptionStatus: 'active',
      storageUsedBytes: 920 * 1024 * 1024 * 1024,
    },
    {
      ...INITIAL_STUDIO,
      id: 'studio_milan_03',
      studioName: 'Maison Bellini Milano',
      slug: 'maison-bellini',
      email: 'ciao@maisonbellini.it',
      subscriptionPlan: 'starter',
      subscriptionStatus: 'trial',
      storageUsedBytes: 42 * 1024 * 1024 * 1024,
    },
  ]);

  const [activityLogs, setActivityLogs] = useState<
    { id: string; actor: string; action: string; timestamp: string }[]
  >([
    {
      id: 'log_1',
      actor: 'Aanya Mehra (Client)',
      action: 'Selected 3 photos in Royal Courtyard & Sangeet Proofing',
      timestamp: '10 mins ago',
    },
    {
      id: 'log_2',
      actor: 'Meera Krishnan (Photo Editor)',
      action: 'Uploaded 6 color-graded medium format masters to Udaivilas Gallery',
      timestamp: '1 hour ago',
    },
    {
      id: 'log_3',
      actor: 'System Webhook',
      action: 'Verified payment settlement STRP_99481024EU for INV-2026-085',
      timestamp: '3 hours ago',
    },
  ]);

  const logActivity = (action: string, actor = 'Julian Vance (Studio Owner)') => {
    setActivityLogs((prev) => [
      {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        actor,
        action,
        timestamp: 'Just now',
      },
      ...prev.slice(0, 29),
    ]);
  };

  // Hydrate persisted state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.studio) setStudio(parsed.studio);
        if (parsed.projects) setProjects(parsed.projects);
        if (parsed.galleries) setGalleries(parsed.galleries);
        if (parsed.photos) setPhotos(parsed.photos);
        if (parsed.clients) setClients(parsed.clients);
        if (parsed.bookings) setBookings(parsed.bookings);
        if (parsed.invoices) setInvoices(parsed.invoices);
        if (parsed.albumDraft) setAlbumDraft(parsed.albumDraft);
      }
    } catch {
      // ignore storage parse error
    }
  }, []);

  // Persist changes locally for instant offline PWA support
  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_STATE_KEY,
        JSON.stringify({
          studio,
          projects,
          galleries,
          photos,
          clients,
          bookings,
          invoices,
          albumDraft,
        })
      );
    } catch {
      // ignore quota exceeded on large data URIs
    }
  }, [studio, projects, galleries, photos, clients, bookings, invoices, albumDraft]);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (user?.email === 'singhshriyansh51@gmail.com') {
        // Bootstrapped admin support
      }
    });
    return () => unsub();
  }, []);

  // Attach Firestore real-time listeners only when auth is ready and user is signed in & verified
  useEffect(() => {
    if (!authReady || !firebaseUser || !firebaseUser.emailVerified) return;

    const projectsQuery = query(
      collection(db, 'projects'),
      where('ownerId', '==', firebaseUser.uid)
    );
    const unsubProjects = onSnapshot(
      projectsQuery,
      (snap) => {
        if (!snap.empty) {
          const remoteProjects: StudioProject[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              studioId: data.studioId,
              ownerId: data.ownerId,
              projectName: data.projectName,
              projectType: data.projectType,
              clientId: 'client_01',
              clientName: 'Studio Client',
              eventDate: data.eventDate,
              location: data.location,
              status: data.status,
              coverImage: INITIAL_PROJECTS[0].coverImage,
              photoCount: 0,
              createdAt: new Date().toISOString(),
            };
          });
          setProjects((prev) => {
            const existingIds = new Set(remoteProjects.map((r) => r.id));
            return [...remoteProjects, ...prev.filter((p) => !existingIds.has(p.id))];
          });
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'projects');
      }
    );

    return () => {
      unsubProjects();
    };
  }, [authReady, firebaseUser]);

  const updateStudio = async (patch: Partial<StudioProfile>) => {
    const updated = { ...studio, ...patch };
    setStudio(updated);
    logActivity(`Updated studio profile settings (${Object.keys(patch).join(', ')})`);

    if (firebaseUser && firebaseUser.emailVerified) {
      const studioId = `studio_${firebaseUser.uid.slice(0, 12).replace(/[^a-zA-Z0-9_-]/g, '')}`;
      try {
        await setDoc(doc(db, 'studios', studioId), {
          studioName: updated.studioName.slice(0, 120),
          slug: updated.slug.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80),
          ownerId: firebaseUser.uid,
          subscriptionPlan: updated.subscriptionPlan,
          subscriptionStatus: updated.subscriptionStatus,
          watermarkText: updated.watermarkText.slice(0, 80),
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `studios/${studioId}`);
      }
    }
  };

  const addProject = async (
    projInput: Omit<StudioProject, 'id' | 'studioId' | 'ownerId' | 'createdAt'>
  ): Promise<StudioProject> => {
    const newId = `proj_${Date.now()}`;
    const newProject: StudioProject = {
      ...projInput,
      id: newId,
      studioId: studio.id,
      ownerId: firebaseUser?.uid || studio.ownerId,
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [newProject, ...prev]);
    logActivity(`Created project "${newProject.projectName}"`);

    if (firebaseUser && firebaseUser.emailVerified) {
      const studioId = `studio_${firebaseUser.uid.slice(0, 12).replace(/[^a-zA-Z0-9_-]/g, '')}`;
      try {
        await setDoc(doc(db, 'studios', studioId), {
          studioName: studio.studioName.slice(0, 120),
          slug: studio.slug.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80),
          ownerId: firebaseUser.uid,
          subscriptionPlan: studio.subscriptionPlan,
          subscriptionStatus: studio.subscriptionStatus,
          watermarkText: studio.watermarkText.slice(0, 80),
          createdAt: serverTimestamp(),
        });
        await setDoc(doc(db, 'projects', newId), {
          studioId,
          ownerId: firebaseUser.uid,
          projectName: newProject.projectName.slice(0, 140),
          projectType: newProject.projectType,
          eventDate: newProject.eventDate.slice(0, 40),
          location: newProject.location.slice(0, 140),
          status: newProject.status,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `projects/${newId}`);
      }
    }
    return newProject;
  };

  const updateProjectStatus = (projectId: string, status: StudioProject['status']) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, status } : p)));
    logActivity(`Updated project ${projectId} status to ${status}`);
  };

  const addGallery = async (
    galInput: Omit<
      StudioGallery,
      'id' | 'studioId' | 'ownerId' | 'createdAt' | 'viewCount' | 'downloadCount' | 'qrScansCount'
    >
  ): Promise<StudioGallery> => {
    const newId = `gal_${Date.now()}`;
    const newGal: StudioGallery = {
      ...galInput,
      id: newId,
      studioId: studio.id,
      ownerId: firebaseUser?.uid || studio.ownerId,
      viewCount: 1,
      downloadCount: 0,
      qrScansCount: 0,
      createdAt: new Date().toISOString(),
    };
    setGalleries((prev) => [newGal, ...prev]);
    logActivity(`Created client gallery "${newGal.galleryName}"`);
    return newGal;
  };

  const updateGallery = (galleryId: string, patch: Partial<StudioGallery>) => {
    setGalleries((prev) => prev.map((g) => (g.id === galleryId ? { ...g, ...patch } : g)));
    logActivity(`Updated gallery settings for ${galleryId}`);
  };

  const addPhotosBatch = async (newPhotos: PhotoAsset[]) => {
    setPhotos((prev) => [...newPhotos, ...prev]);
    const addedBytes = newPhotos.reduce((acc, p) => acc + (p.fileSize || 2500000), 0);
    setStudio((prev) => ({
      ...prev,
      storageUsedBytes: prev.storageUsedBytes + addedBytes,
    }));
    logActivity(`Uploaded ${newPhotos.length} photo(s) to gallery ${newPhotos[0]?.galleryId || ''}`);
  };

  const togglePhotoSelection = (photoId: string): { ok: boolean; message?: string } => {
    const target = photos.find((p) => p.id === photoId);
    if (!target) return { ok: false, message: 'Photo not found.' };
    const gal = galleries.find((g) => g.id === target.galleryId);
    const limit = gal?.selectionLimit || 50;
    const galPhotos = photos.filter((p) => p.galleryId === target.galleryId);
    const currentSelected = galPhotos.filter((p) => p.selected).length;

    if (gal?.status === 'locked') {
      return { ok: false, message: 'Selections are locked by the photographer.' };
    }
    if (!target.selected && currentSelected >= limit) {
      return {
        ok: false,
        message: `Selection limit of ${limit} photos reached for this gallery. Deselect another photo first.`,
      };
    }

    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, selected: !p.selected } : p))
    );
    return { ok: true };
  };

  const togglePhotoLike = (photoId: string) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId
          ? {
              ...p,
              liked: !p.liked,
              likesCount: p.liked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1,
            }
          : p
      )
    );
  };

  const addPhotoComment = (
    photoId: string,
    authorName: string,
    authorRole: string,
    text: string
  ) => {
    const cleanText = text.trim();
    if (!cleanText) return;
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: `cm_${Date.now()}`,
                  photoId,
                  authorName: authorName.trim() || 'Client',
                  authorRole,
                  text: cleanText,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : p
      )
    );
    logActivity(`New comment added on photo ${photoId} by ${authorName}`, authorName);
  };

  const deletePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    logActivity(`Deleted photo ${photoId}`);
  };

  const addClient = (
    clientInput: Omit<ClientRecord, 'id' | 'studioId' | 'createdAt'>
  ): ClientRecord => {
    const newClient: ClientRecord = {
      ...clientInput,
      id: `client_${Date.now()}`,
      studioId: studio.id,
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [newClient, ...prev]);
    logActivity(`Added CRM client profile "${newClient.name}"`);
    return newClient;
  };

  const deleteClient = (clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    logActivity(`Removed client record ${clientId}`);
  };

  const addBooking = (bookingInput: Omit<BookingRecord, 'id' | 'studioId'>): BookingRecord => {
    const newBooking: BookingRecord = {
      ...bookingInput,
      id: `bk_${Date.now()}`,
      studioId: studio.id,
    };
    setBookings((prev) => [newBooking, ...prev]);
    logActivity(`Scheduled ${newBooking.bookingType} booking for ${newBooking.clientName}`);
    return newBooking;
  };

  const updateBookingStatus = (bookingId: string, status: BookingRecord['status']) => {
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
    logActivity(`Updated booking ${bookingId} status to ${status}`);
  };

  const addInvoice = (invoiceInput: Omit<InvoiceRecord, 'id' | 'studioId'>): InvoiceRecord => {
    const newInvoice: InvoiceRecord = {
      ...invoiceInput,
      id: `inv_${Date.now()}`,
      studioId: studio.id,
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    logActivity(`Generated invoice ${newInvoice.invoiceNumber} for ${newInvoice.clientName}`);
    return newInvoice;
  };

  const updateInvoice = (invoiceId: string, patch: Partial<InvoiceRecord>) => {
    setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? { ...i, ...patch } : i)));
    logActivity(`Updated billing record ${invoiceId}`);
  };

  const addTeamMember = (
    memberInput: Omit<TeamMember, 'id' | 'studioId' | 'assignedProjectsCount'>
  ) => {
    const newMember: TeamMember = {
      ...memberInput,
      id: `tm_${Date.now()}`,
      studioId: studio.id,
      assignedProjectsCount: 1,
    };
    setTeam((prev) => [...prev, newMember]);
    logActivity(`Invited team member ${newMember.name} as ${newMember.role}`);
  };

  const updateAlbumDraft = (patch: Partial<WeddingAlbumDraft>) => {
    setAlbumDraft((prev) => ({
      ...prev,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
    logActivity(`Updated wedding album draft "${albumDraft.albumTitle}"`);
  };

  const addCoupon = (couponInput: Omit<CouponRecord, 'id' | 'usedCount'>) => {
    const newCoupon: CouponRecord = {
      ...couponInput,
      id: `cp_${Date.now()}`,
      usedCount: 0,
    };
    setCoupons((prev) => [newCoupon, ...prev]);
    logActivity(`Created platform coupon ${newCoupon.code}`, 'Super Admin');
  };

  const toggleStudioSuspension = (studioId: string) => {
    setAllStudiosForAdmin((prev) =>
      prev.map((s) =>
        s.id === studioId
          ? {
              ...s,
              subscriptionStatus: s.subscriptionStatus === 'suspended' ? 'active' : 'suspended',
            }
          : s
      )
    );
    logActivity(`Toggled tenant status for studio ${studioId}`, 'Super Admin');
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        authReady,
        activeRole,
        setActiveRole,
        onboardingStep,
        setOnboardingStep,
        studio,
        updateStudio,
        plans,
        updatePlans,
        projects,
        addProject,
        updateProjectStatus,
        galleries,
        addGallery,
        updateGallery,
        photos,
        addPhotosBatch,
        togglePhotoSelection,
        togglePhotoLike,
        addPhotoComment,
        deletePhoto,
        clients,
        addClient,
        deleteClient,
        bookings,
        addBooking,
        updateBookingStatus,
        invoices,
        addInvoice,
        updateInvoice,
        team,
        addTeamMember,
        albumDraft,
        updateAlbumDraft,
        coupons,
        addCoupon,
        allStudiosForAdmin,
        toggleStudioSuspension,
        activityLogs,
        logActivity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useStudioContext(): StudioContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useStudioContext must be used inside AuthProvider');
  }
  return ctx;
}
