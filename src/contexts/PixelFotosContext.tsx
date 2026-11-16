import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  AlbumRetouchSettings,
  AppViewMode,
  CRMClient,
  EventMicrositeConfig,
  GalleryDeliveryConfig,
  LifecycleStageNumber,
  LutPreset,
  PrintOrder,
  QuotationInvoiceRecord,
  RegisteredGuest,
  ShootPhoto,
  StudioExpense,
  StudioModuleId,
  TeamAssignment,
  WatermarkConfig,
  WhatsAppDispatchLog,
} from '../types/pixelfotos';
import {
  BUILTIN_LUT_PRESETS,
  INITIAL_ALBUM_RETOUCH,
  INITIAL_CRM_CLIENTS,
  INITIAL_DELIVERY_CONFIG,
  INITIAL_EXPENSES,
  INITIAL_MICROSITE,
  INITIAL_PRINT_ORDERS,
  INITIAL_QUOTATIONS_INVOICES,
  INITIAL_REGISTERED_GUESTS,
  INITIAL_SHOOT_PHOTOS,
  INITIAL_TEAM_ASSIGNMENTS,
  INITIAL_WATERMARK_CONFIG,
  PIXELFOTOS_ASSETS,
} from '../data/pixelfotosData';
import { auth } from '../lib/firebase';
import {
  fetchPublishedEventBySlug,
  saveCrmLeadToFirestore,
  saveEventToFirestore,
  saveExpenseToFirestore,
  saveInvoiceToFirestore,
  savePrintOrderToFirestore,
  saveTeamTaskToFirestore,
  signInStudioWithGoogle,
  signOutStudio,
  subscribeOwnerCollection,
} from '../lib/firestoreSync';
import { idbGet, idbSet } from '../lib/idbStorage';

const IDB_SNAPSHOT_KEY = 'pixelfotos_workspace_v2';

interface PersistedWorkspaceSnapshot {
  events: EventMicrositeConfig[];
  activeEventId: string;
  photos: ShootPhoto[];
  luts: LutPreset[];
  activeLutId: string;
  batchExposureMatch: boolean;
  watermark: WatermarkConfig;
  albumRetouch: AlbumRetouchSettings;
  deliveryConfig: GalleryDeliveryConfig;
  printOrders: PrintOrder[];
  clients: CRMClient[];
  teamAssignments: TeamAssignment[];
  expenses: StudioExpense[];
  documents: QuotationInvoiceRecord[];
  registeredGuests: RegisteredGuest[];
  dispatchLogs: WhatsAppDispatchLog[];
}

interface PixelFotosContextValue {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  viewMode: AppViewMode;
  setViewMode: (mode: AppViewMode) => void;
  activeModule: StudioModuleId;
  setActiveModule: (module: StudioModuleId) => void;
  activeLifecycleStage: LifecycleStageNumber;
  setActiveLifecycleStage: (stage: LifecycleStageNumber) => void;
  openStudioAt: (module: StudioModuleId, stage?: LifecycleStageNumber) => void;
  openMicrositeBySlug: (slug: string) => void;

  // Firebase Auth + Persistence Sync
  firebaseUser: User | null;
  storageStatus: 'indexeddb' | 'firestore_synced';
  connectGoogleCloudSync: () => Promise<void>;
  disconnectGoogleCloudSync: () => Promise<void>;

  // Multi-Event Microsites
  events: EventMicrositeConfig[];
  activeEventId: string;
  setActiveEventId: (id: string) => void;
  microsite: EventMicrositeConfig;
  setMicrosite: React.Dispatch<React.SetStateAction<EventMicrositeConfig>>;
  createNewEvent: (draft: Omit<EventMicrositeConfig, 'id'>) => EventMicrositeConfig;

  // Shoot & Culling Photos
  photos: ShootPhoto[];
  setPhotos: React.Dispatch<React.SetStateAction<ShootPhoto[]>>;
  addPhotos: (newPhotos: ShootPhoto[]) => void;
  toggleGuestLike: (photoId: string) => void;
  updatePhotoRating: (photoId: string, rating: 1 | 2 | 3 | 4 | 5) => void;
  toggleAiSelected: (photoId: string) => void;
  updatePhotoEmbeddings: (photoId: string, embeddings: number[][]) => void;
  resetSampleBatch: () => void;

  // Module 2: LUT & Watermark
  luts: LutPreset[];
  activeLutId: string;
  setActiveLutId: (id: string) => void;
  addCustomLut: (lut: LutPreset) => void;
  batchExposureMatch: boolean;
  setBatchExposureMatch: (v: boolean) => void;
  watermark: WatermarkConfig;
  setWatermark: React.Dispatch<React.SetStateAction<WatermarkConfig>>;

  // Module 3: 1-Click Album Retouch
  albumRetouch: AlbumRetouchSettings;
  setAlbumRetouch: React.Dispatch<React.SetStateAction<AlbumRetouchSettings>>;

  // Module 5: Delivery & Print Store
  deliveryConfig: GalleryDeliveryConfig;
  setDeliveryConfig: React.Dispatch<React.SetStateAction<GalleryDeliveryConfig>>;
  printOrders: PrintOrder[];
  placePrintOrder: (order: Omit<PrintOrder, 'id' | 'createdAt' | 'status'>) => void;
  updatePrintOrderStatus: (orderId: string, status: PrintOrder['status']) => void;

  // Module 6: CRM, Team & Expenses
  clients: CRMClient[];
  addClient: (client: Omit<CRMClient, 'id' | 'communicationLogs'>) => void;
  updateClientStatus: (clientId: string, status: CRMClient['leadStatus']) => void;
  addClientLog: (clientId: string, note: string) => void;
  teamAssignments: TeamAssignment[];
  updateTeamProgress: (id: string, progress: number) => void;
  addTeamAssignment: (item: Omit<TeamAssignment, 'id'>) => void;
  expenses: StudioExpense[];
  addExpense: (exp: Omit<StudioExpense, 'id'>) => void;

  // Module 7: Quotations & UPI Invoices
  documents: QuotationInvoiceRecord[];
  addQuotation: (doc: Omit<QuotationInvoiceRecord, 'id' | 'createdAt'>) => void;
  convertQuotationToInvoice: (docId: string) => void;
  markInvoicePaid: (docId: string) => void;

  // Lifecycle Stage 2, 3, 4: Guest QR Registration & Face Match
  registeredGuests: RegisteredGuest[];
  registerGuest: (guest: {
    name: string;
    whatsapp: string;
    selfieUrl?: string;
    faceEmbedding?: number[];
  }) => RegisteredGuest;
  dispatchLogs: WhatsAppDispatchLog[];
  triggerFirstPhotoUploadDispatch: (photoLabel: string) => void;
  activeGuestClusterKey: string | null;
  setActiveGuestClusterKey: (key: string | null) => void;

  // Computed Studio Financials
  totalCollectedRevenueInr: number;
  totalExpensesInr: number;
  totalPrintProfitInr: number;
  netProfitInr: number;
}

const PixelFotosContext = createContext<PixelFotosContextValue | null>(null);

function parseInitialRoute(): { mode: AppViewMode; slugFromPath: string | null } {
  if (typeof window === 'undefined') return { mode: 'landing', slugFromPath: null };
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!path) return { mode: 'landing', slugFromPath: null };
  if (path === 'studio') return { mode: 'studio', slugFromPath: null };
  return { mode: 'microsite', slugFromPath: path };
}

export const PixelFotosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialRoute = useMemo(() => parseInitialRoute(), []);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('pixelfotos_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('pixelfotos_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const [viewMode, setViewModeState] = useState<AppViewMode>(initialRoute.mode);
  const [activeModule, setActiveModule] = useState<StudioModuleId>('lifecycle');
  const [activeLifecycleStage, setActiveLifecycleStage] = useState<LifecycleStageNumber>(1);
  const [hydrated, setHydrated] = useState(false);

  // Firebase Auth
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  // Core States
  const [events, setEvents] = useState<EventMicrositeConfig[]>([INITIAL_MICROSITE]);
  const [activeEventId, setActiveEventId] = useState<string>(INITIAL_MICROSITE.id);
  const [photos, setPhotos] = useState<ShootPhoto[]>(INITIAL_SHOOT_PHOTOS);
  const [luts, setLuts] = useState<LutPreset[]>(BUILTIN_LUT_PRESETS);
  const [activeLutId, setActiveLutId] = useState<string>(BUILTIN_LUT_PRESETS[0].id);
  const [batchExposureMatch, setBatchExposureMatch] = useState<boolean>(true);
  const [watermark, setWatermark] = useState<WatermarkConfig>(INITIAL_WATERMARK_CONFIG);
  const [albumRetouch, setAlbumRetouch] = useState<AlbumRetouchSettings>(INITIAL_ALBUM_RETOUCH);
  const [deliveryConfig, setDeliveryConfig] = useState<GalleryDeliveryConfig>(INITIAL_DELIVERY_CONFIG);
  const [printOrders, setPrintOrders] = useState<PrintOrder[]>(INITIAL_PRINT_ORDERS);
  const [clients, setClients] = useState<CRMClient[]>(INITIAL_CRM_CLIENTS);
  const [teamAssignments, setTeamAssignments] = useState<TeamAssignment[]>(INITIAL_TEAM_ASSIGNMENTS);
  const [expenses, setExpenses] = useState<StudioExpense[]>(INITIAL_EXPENSES);
  const [documents, setDocuments] = useState<QuotationInvoiceRecord[]>(INITIAL_QUOTATIONS_INVOICES);
  const [registeredGuests, setRegisteredGuests] = useState<RegisteredGuest[]>(INITIAL_REGISTERED_GUESTS);
  const [dispatchLogs, setDispatchLogs] = useState<WhatsAppDispatchLog[]>([]);
  const [activeGuestClusterKey, setActiveGuestClusterKey] = useState<string | null>(null);

  const microsite = useMemo(
    () => events.find((e) => e.id === activeEventId) || events[0] || INITIAL_MICROSITE,
    [events, activeEventId]
  );

  const setMicrosite: React.Dispatch<React.SetStateAction<EventMicrositeConfig>> = useCallback(
    (updater) => {
      setEvents((prev) =>
        prev.map((evt) => {
          if (evt.id !== activeEventId) return evt;
          const next = typeof updater === 'function' ? updater(evt) : updater;
          if (firebaseUser) {
            saveEventToFirestore(next, firebaseUser.uid, false).catch(() => {});
          }
          return next;
        })
      );
    },
    [activeEventId, firebaseUser]
  );

  // Sync URL with viewMode & active microsite slug
  const syncBrowserPath = useCallback(
    (mode: AppViewMode, slug?: string) => {
      if (typeof window === 'undefined') return;
      const targetPath =
        mode === 'landing'
          ? '/'
          : mode === 'studio'
          ? '/studio'
          : `/${(slug || microsite.slug || 'ananya-kabir').replace(/^\/+/, '')}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ mode, slug }, '', targetPath);
      }
    },
    [microsite.slug]
  );

  const setViewMode = useCallback(
    (mode: AppViewMode) => {
      setViewModeState(mode);
      syncBrowserPath(mode);
    },
    [syncBrowserPath]
  );

  const openMicrositeBySlug = useCallback(
    (slug: string) => {
      const clean = slug.replace(/^\/+|\/+$/g, '').toLowerCase();
      const matched = events.find((e) => e.slug.toLowerCase() === clean);
      if (matched) {
        setActiveEventId(matched.id);
      } else {
        fetchPublishedEventBySlug(clean)
          .then((remote) => {
            if (remote) {
              setEvents((prev) =>
                prev.some((e) => e.id === remote.id) ? prev : [remote, ...prev]
              );
              setActiveEventId(remote.id);
            }
          })
          .catch(() => {});
      }
      setViewModeState('microsite');
      syncBrowserPath('microsite', clean);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [events, syncBrowserPath]
  );

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const onPopState = () => {
      const parsed = parseInitialRoute();
      if (parsed.slugFromPath) {
        const matched = events.find((e) => e.slug.toLowerCase() === parsed.slugFromPath);
        if (matched) setActiveEventId(matched.id);
      }
      setViewModeState(parsed.mode);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [events]);

  // Hydrate full state from IndexedDB on boot (plus slug lookup from Firestore if direct /:eventSlug route)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await idbGet<PersistedWorkspaceSnapshot>(IDB_SNAPSHOT_KEY);
      if (mounted && saved) {
        if (Array.isArray(saved.events) && saved.events.length > 0) {
          setEvents(saved.events);
          if (initialRoute.slugFromPath) {
            const foundBySlug = saved.events.find(
              (e) => e.slug.toLowerCase() === initialRoute.slugFromPath
            );
            setActiveEventId(foundBySlug ? foundBySlug.id : saved.activeEventId || saved.events[0].id);
          } else if (saved.activeEventId) {
            setActiveEventId(saved.activeEventId);
          }
        }
        if (Array.isArray(saved.photos) && saved.photos.length > 0) setPhotos(saved.photos);
        if (Array.isArray(saved.luts) && saved.luts.length > 0) setLuts(saved.luts);
        if (saved.activeLutId) setActiveLutId(saved.activeLutId);
        if (typeof saved.batchExposureMatch === 'boolean') setBatchExposureMatch(saved.batchExposureMatch);
        if (saved.watermark) setWatermark(saved.watermark);
        if (saved.albumRetouch) setAlbumRetouch(saved.albumRetouch);
        if (saved.deliveryConfig) setDeliveryConfig(saved.deliveryConfig);
        if (Array.isArray(saved.printOrders)) setPrintOrders(saved.printOrders);
        if (Array.isArray(saved.clients)) setClients(saved.clients);
        if (Array.isArray(saved.teamAssignments)) setTeamAssignments(saved.teamAssignments);
        if (Array.isArray(saved.expenses)) setExpenses(saved.expenses);
        if (Array.isArray(saved.documents)) setDocuments(saved.documents);
        if (Array.isArray(saved.registeredGuests)) setRegisteredGuests(saved.registeredGuests);
        if (Array.isArray(saved.dispatchLogs)) setDispatchLogs(saved.dispatchLogs);
      } else if (mounted && initialRoute.slugFromPath) {
        const remote = await fetchPublishedEventBySlug(initialRoute.slugFromPath).catch(() => null);
        if (remote && mounted) {
          setEvents((prev) => (prev.some((e) => e.id === remote.id) ? prev : [remote, ...prev]));
          setActiveEventId(remote.id);
        }
      }
      if (mounted) setHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, [initialRoute.slugFromPath]);

  // Auto-persist workspace snapshot to IndexedDB after hydration
  useEffect(() => {
    if (!hydrated) return;
    const snapshot: PersistedWorkspaceSnapshot = {
      events,
      activeEventId,
      photos,
      luts,
      activeLutId,
      batchExposureMatch,
      watermark,
      albumRetouch,
      deliveryConfig,
      printOrders,
      clients,
      teamAssignments,
      expenses,
      documents,
      registeredGuests,
      dispatchLogs,
    };
    const timer = setTimeout(() => {
      idbSet(IDB_SNAPSHOT_KEY, snapshot);
    }, 250);
    return () => clearTimeout(timer);
  }, [
    hydrated,
    events,
    activeEventId,
    photos,
    luts,
    activeLutId,
    batchExposureMatch,
    watermark,
    albumRetouch,
    deliveryConfig,
    printOrders,
    clients,
    teamAssignments,
    expenses,
    documents,
    registeredGuests,
    dispatchLogs,
  ]);

  // Listen to Firebase Auth & subscribe to Firestore collections when signed in
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const unsubs = [
      subscribeOwnerCollection<EventMicrositeConfig>('studio_events', uid, (rows) => {
        if (rows.length > 0) setEvents(rows);
      }),
      subscribeOwnerCollection<CRMClient>('crm_leads', uid, (rows) => {
        if (rows.length > 0) setClients(rows);
      }),
      subscribeOwnerCollection<TeamAssignment>('team_tasks', uid, (rows) => {
        if (rows.length > 0) setTeamAssignments(rows);
      }),
      subscribeOwnerCollection<StudioExpense>('expenses', uid, (rows) => {
        if (rows.length > 0) setExpenses(rows);
      }),
      subscribeOwnerCollection<PrintOrder>('print_orders', uid, (rows) => {
        if (rows.length > 0) setPrintOrders(rows);
      }),
      subscribeOwnerCollection<QuotationInvoiceRecord>('invoices', uid, (rows) => {
        if (rows.length > 0) setDocuments(rows);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [firebaseUser]);

  const connectGoogleCloudSync = async () => {
    const user = await signInStudioWithGoogle();
    // Seed current local events/records into user's Firestore workspace cleanly
    await Promise.allSettled([
      ...events.map((e) => saveEventToFirestore(e, user.uid, true)),
      ...clients.map((c) => saveCrmLeadToFirestore(c, user.uid, true)),
      ...teamAssignments.map((t) => saveTeamTaskToFirestore(t, user.uid, true)),
      ...expenses.map((ex) => saveExpenseToFirestore(ex, user.uid)),
      ...printOrders.map((po) => savePrintOrderToFirestore(po, user.uid, true)),
      ...documents.map((docItem) => saveInvoiceToFirestore(docItem, user.uid, true)),
    ]);
  };

  const disconnectGoogleCloudSync = async () => {
    await signOutStudio();
  };

  const openStudioAt = (module: StudioModuleId, stage?: LifecycleStageNumber) => {
    setActiveModule(module);
    if (stage) setActiveLifecycleStage(stage);
    setViewMode('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const createNewEvent = (draft: Omit<EventMicrositeConfig, 'id'>): EventMicrositeConfig => {
    const cleanSlug =
      draft.slug
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-|-$/g, '') || `event-${Date.now()}`;
    const created: EventMicrositeConfig = {
      ...draft,
      id: `evt_${Date.now()}`,
      slug: cleanSlug,
      isPublished: true,
    };
    setEvents((prev) => [created, ...prev]);
    setActiveEventId(created.id);
    if (firebaseUser) {
      saveEventToFirestore(created, firebaseUser.uid, true).catch(() => {});
    }
    return created;
  };

  const addPhotos = (newPhotos: ShootPhoto[]) => {
    const tagged = newPhotos.map((p) => ({ ...p, eventId: p.eventId || activeEventId }));
    setPhotos((prev) => [...tagged, ...prev]);
  };

  const toggleGuestLike = (photoId: string) => {
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id !== photoId) return p;
        const nextLiked = !p.guestLiked;
        return {
          ...p,
          guestLiked: nextLiked,
          likesCount: nextLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
        };
      })
    );
  };

  const updatePhotoRating = (photoId: string, rating: 1 | 2 | 3 | 4 | 5) => {
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, starRating: rating } : p)));
  };

  const toggleAiSelected = (photoId: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, aiSelected: !p.aiSelected } : p))
    );
  };

  const updatePhotoEmbeddings = (photoId: string, embeddings: number[][]) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, faceEmbeddings: embeddings } : p))
    );
  };

  const resetSampleBatch = () => setPhotos(INITIAL_SHOOT_PHOTOS);

  const addCustomLut = (lut: LutPreset) => {
    setLuts((prev) => [lut, ...prev]);
    setActiveLutId(lut.id);
  };

  const placePrintOrder = (order: Omit<PrintOrder, 'id' | 'createdAt' | 'status'>) => {
    const newOrder: PrintOrder = {
      ...order,
      id: `po_${Date.now()}`,
      status: 'New Order',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setPrintOrders((prev) => [newOrder, ...prev]);
    if (firebaseUser) {
      savePrintOrderToFirestore(newOrder, firebaseUser.uid, true).catch(() => {});
    }
  };

  const updatePrintOrderStatus = (orderId: string, status: PrintOrder['status']) => {
    setPrintOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const next = { ...o, status };
        if (firebaseUser) {
          savePrintOrderToFirestore(next, firebaseUser.uid, false).catch(() => {});
        }
        return next;
      })
    );
  };

  const addClient = (client: Omit<CRMClient, 'id' | 'communicationLogs'>) => {
    const record: CRMClient = {
      ...client,
      id: `cli_${Date.now()}`,
      communicationLogs: [
        {
          id: `log_${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          note: `Added client profile (${client.packageName}).`,
        },
      ],
    };
    setClients((prev) => [record, ...prev]);
    if (firebaseUser) {
      saveCrmLeadToFirestore(record, firebaseUser.uid, true).catch(() => {});
    }
  };

  const updateClientStatus = (clientId: string, leadStatus: CRMClient['leadStatus']) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        const next = { ...c, leadStatus };
        if (firebaseUser) {
          saveCrmLeadToFirestore(next, firebaseUser.uid, false).catch(() => {});
        }
        return next;
      })
    );
  };

  const addClientLog = (clientId: string, note: string) => {
    if (!note.trim()) return;
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        const next = {
          ...c,
          communicationLogs: [
            {
              id: `log_${Date.now()}`,
              date: new Date().toISOString().slice(0, 10),
              note: note.trim(),
            },
            ...c.communicationLogs,
          ],
        };
        if (firebaseUser) {
          saveCrmLeadToFirestore(next, firebaseUser.uid, false).catch(() => {});
        }
        return next;
      })
    );
  };

  const updateTeamProgress = (id: string, progress: number) => {
    setTeamAssignments((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, progressPercent: progress };
        if (firebaseUser) {
          saveTeamTaskToFirestore(next, firebaseUser.uid, false).catch(() => {});
        }
        return next;
      })
    );
  };

  const addTeamAssignment = (item: Omit<TeamAssignment, 'id'>) => {
    const next: TeamAssignment = { ...item, id: `tm_${Date.now()}` };
    setTeamAssignments((prev) => [next, ...prev]);
    if (firebaseUser) {
      saveTeamTaskToFirestore(next, firebaseUser.uid, true).catch(() => {});
    }
  };

  const addExpense = (exp: Omit<StudioExpense, 'id'>) => {
    const next: StudioExpense = { ...exp, id: `exp_${Date.now()}` };
    setExpenses((prev) => [next, ...prev]);
    if (firebaseUser) {
      saveExpenseToFirestore(next, firebaseUser.uid).catch(() => {});
    }
  };

  const addQuotation = (docItem: Omit<QuotationInvoiceRecord, 'id' | 'createdAt'>) => {
    const next: QuotationInvoiceRecord = {
      ...docItem,
      id: `doc_${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setDocuments((prev) => [next, ...prev]);
    if (firebaseUser) {
      saveInvoiceToFirestore(next, firebaseUser.uid, true).catch(() => {});
    }
  };

  const convertQuotationToInvoice = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== docId) return d;
        const next: QuotationInvoiceRecord = {
          ...d,
          stage: 'Invoice',
          status: 'Sent',
          docNumber: d.docNumber.replace('QT-', 'INV-'),
        };
        if (firebaseUser) {
          saveInvoiceToFirestore(next, firebaseUser.uid, false).catch(() => {});
        }
        return next;
      })
    );
  };

  const markInvoicePaid = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== docId) return d;
        const subtotal = d.items.reduce((sum, item) => sum + item.qty * item.rateInr, 0);
        const total = d.includeGst18 ? Math.round(subtotal * 1.18) : subtotal;
        const next: QuotationInvoiceRecord = {
          ...d,
          stage: 'Invoice',
          status: 'Paid',
          advancePaidInr: total,
        };
        if (firebaseUser) {
          saveInvoiceToFirestore(next, firebaseUser.uid, false).catch(() => {});
        }
        return next;
      })
    );
  };

  const registerGuest = (guest: {
    name: string;
    whatsapp: string;
    selfieUrl?: string;
    faceEmbedding?: number[];
  }) => {
    const newGuest: RegisteredGuest = {
      id: `gst_${Date.now()}`,
      name: guest.name.trim(),
      whatsapp: guest.whatsapp.trim(),
      selfieUrl: guest.selfieUrl || PIXELFOTOS_ASSETS.weddingBridal,
      faceClusterKey: 'guest_ananya',
      faceEmbedding: guest.faceEmbedding,
      notifiedOnFirstUpload: false,
      registeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setRegisteredGuests((prev) => [newGuest, ...prev]);
    setActiveGuestClusterKey(newGuest.faceClusterKey);
    return newGuest;
  };

  const triggerFirstPhotoUploadDispatch = (photoLabel: string) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setRegisteredGuests((prev) =>
      prev.map((g) => ({ ...g, notifiedOnFirstUpload: true }))
    );
    setDispatchLogs((prev) => [
      ...registeredGuests.map((g) => ({
        id: `wa_${Date.now()}_${g.id}`,
        recipientName: g.name,
        whatsapp: g.whatsapp,
        messagePreview: `Hi ${g.name.split(' ')[0]}! First live photo "${photoLabel}" from ${microsite.coupleOrHostName} is ready at pixelfotos.online/${microsite.slug}`,
        timestamp: nowTime,
      })),
      ...prev,
    ]);
  };

  const totalCollectedRevenueInr = useMemo(
    () => documents.reduce((acc, docItem) => acc + docItem.advancePaidInr, 0),
    [documents]
  );

  const totalExpensesInr = useMemo(
    () => expenses.reduce((acc, exp) => acc + exp.amountInr, 0),
    [expenses]
  );

  const totalPrintProfitInr = useMemo(
    () => printOrders.reduce((acc, ord) => acc + ord.studioProfitInr, 0),
    [printOrders]
  );

  const netProfitInr = useMemo(
    () => totalCollectedRevenueInr + totalPrintProfitInr - totalExpensesInr,
    [totalCollectedRevenueInr, totalPrintProfitInr, totalExpensesInr]
  );

  return (
    <PixelFotosContext.Provider
      value={{
        theme,
        toggleTheme,
        viewMode,
        setViewMode,
        activeModule,
        setActiveModule,
        activeLifecycleStage,
        setActiveLifecycleStage,
        openStudioAt,
        openMicrositeBySlug,
        firebaseUser,
        storageStatus: firebaseUser ? 'firestore_synced' : 'indexeddb',
        connectGoogleCloudSync,
        disconnectGoogleCloudSync,
        events,
        activeEventId,
        setActiveEventId,
        microsite,
        setMicrosite,
        createNewEvent,
        photos,
        setPhotos,
        addPhotos,
        toggleGuestLike,
        updatePhotoRating,
        toggleAiSelected,
        updatePhotoEmbeddings,
        resetSampleBatch,
        luts,
        activeLutId,
        setActiveLutId,
        addCustomLut,
        batchExposureMatch,
        setBatchExposureMatch,
        watermark,
        setWatermark,
        albumRetouch,
        setAlbumRetouch,
        deliveryConfig,
        setDeliveryConfig,
        printOrders,
        placePrintOrder,
        updatePrintOrderStatus,
        clients,
        addClient,
        updateClientStatus,
        addClientLog,
        teamAssignments,
        updateTeamProgress,
        addTeamAssignment,
        expenses,
        addExpense,
        documents,
        addQuotation,
        convertQuotationToInvoice,
        markInvoicePaid,
        registeredGuests,
        registerGuest,
        dispatchLogs,
        triggerFirstPhotoUploadDispatch,
        activeGuestClusterKey,
        setActiveGuestClusterKey,
        totalCollectedRevenueInr,
        totalExpensesInr,
        totalPrintProfitInr,
        netProfitInr,
      }}
    >
      {children}
    </PixelFotosContext.Provider>
  );
};

export function usePixelFotos(): PixelFotosContextValue {
  const ctx = useContext(PixelFotosContext);
  if (!ctx) {
    throw new Error('usePixelFotos must be used inside PixelFotosProvider');
  }
  return ctx;
}
