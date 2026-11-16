import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth, db, handleFirestoreError } from './firebase';
import { OperationType } from '../types';
import {
  CRMClient,
  EventMicrositeConfig,
  PrintOrder,
  QuotationInvoiceRecord,
  StudioExpense,
  TeamAssignment,
} from '../types/pixelfotos';

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_');
  return (cleaned || `id_${Date.now()}`).slice(0, 120);
}

function sanitizeSlug(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '');
  return (cleaned || 'event-showcase').slice(0, 96);
}

export async function signInStudioWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutStudio() {
  await signOut(auth);
}

export async function saveEventToFirestore(
  event: EventMicrositeConfig,
  ownerId: string,
  isNew = false
): Promise<void> {
  const docId = sanitizeId(event.id);
  const path = `studio_events/${docId}`;
  const safeHeroUrl =
    event.heroImageUrl && !event.heroImageUrl.startsWith('data:') && event.heroImageUrl.length <= 490
      ? event.heroImageUrl
      : '';

  const payload = {
    id: docId,
    ownerId: sanitizeId(ownerId),
    slug: sanitizeSlug(event.slug),
    coupleOrHostName: event.coupleOrHostName.slice(0, 138),
    eventType: event.eventType,
    eventDate: event.eventDate.slice(0, 38),
    venueName: event.venueName.slice(0, 178),
    venueCity: event.venueCity.slice(0, 118),
    googleMapsQuery: event.googleMapsQuery.slice(0, 238),
    storyText: event.storyText.slice(0, 1180),
    youtubeStreamUrl: event.youtubeStreamUrl.slice(0, 398),
    heroImageUrl: safeHeroUrl,
    schedule: event.schedule.slice(0, 20),
    isPublished: event.isPublished !== false,
    updatedAt: serverTimestamp(),
    ...(isNew ? { createdAt: serverTimestamp() } : {}),
  };

  try {
    await setDoc(doc(db, 'studio_events', docId), payload, { merge: !isNew });
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function fetchPublishedEventBySlug(
  slug: string
): Promise<EventMicrositeConfig | null> {
  const safeSlug = sanitizeSlug(slug);
  const path = 'studio_events';
  try {
    const q = query(
      collection(db, path),
      where('slug', '==', safeSlug),
      where('isPublished', '==', true)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const data = snap.docs[0].data();
    return {
      id: String(data.id || snap.docs[0].id),
      slug: String(data.slug || safeSlug),
      coupleOrHostName: String(data.coupleOrHostName || 'Wedding Celebration'),
      eventType: data.eventType || 'Wedding',
      eventDate: String(data.eventDate || ''),
      venueName: String(data.venueName || ''),
      venueCity: String(data.venueCity || ''),
      googleMapsQuery: String(data.googleMapsQuery || ''),
      heroImageUrl: String(data.heroImageUrl || ''),
      storyText: String(data.storyText || ''),
      youtubeStreamUrl: String(data.youtubeStreamUrl || ''),
      schedule: Array.isArray(data.schedule) ? data.schedule : [],
      isPublished: true,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveCrmLeadToFirestore(
  client: CRMClient,
  ownerId: string,
  isNew = false
): Promise<void> {
  const docId = sanitizeId(client.id);
  const path = `crm_leads/${docId}`;
  try {
    await setDoc(
      doc(db, 'crm_leads', docId),
      {
        id: docId,
        ownerId: sanitizeId(ownerId),
        name: client.name.slice(0, 138),
        phone: client.phone.slice(0, 38),
        email: client.email.slice(0, 158),
        eventDate: client.eventDate.slice(0, 38),
        packageName: client.packageName.slice(0, 158),
        packageValueInr: Number(client.packageValueInr) || 0,
        leadStatus: client.leadStatus,
        communicationLogs: client.communicationLogs.slice(0, 100),
        ...(isNew ? { createdAt: serverTimestamp() } : {}),
      },
      { merge: !isNew }
    );
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function saveTeamTaskToFirestore(
  task: TeamAssignment,
  ownerId: string,
  isNew = false
): Promise<void> {
  const docId = sanitizeId(task.id);
  const path = `team_tasks/${docId}`;
  try {
    await setDoc(
      doc(db, 'team_tasks', docId),
      {
        id: docId,
        ownerId: sanitizeId(ownerId),
        memberName: task.memberName.slice(0, 118),
        role: task.role,
        assignedEvent: task.assignedEvent.slice(0, 138),
        taskTitle: task.taskTitle.slice(0, 198),
        progressPercent: Math.max(0, Math.min(100, Number(task.progressPercent) || 0)),
        ...(isNew ? { createdAt: serverTimestamp() } : {}),
      },
      { merge: !isNew }
    );
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function saveExpenseToFirestore(
  expense: StudioExpense,
  ownerId: string
): Promise<void> {
  const docId = sanitizeId(expense.id);
  const path = `expenses/${docId}`;
  try {
    await setDoc(doc(db, 'expenses', docId), {
      id: docId,
      ownerId: sanitizeId(ownerId),
      eventId: sanitizeId(expense.eventId),
      eventName: expense.eventName.slice(0, 138),
      category: expense.category,
      description: expense.description.slice(0, 238),
      amountInr: Math.max(0, Number(expense.amountInr) || 0),
      date: expense.date.slice(0, 38),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function savePrintOrderToFirestore(
  order: PrintOrder,
  ownerId: string,
  isNew = false
): Promise<void> {
  const docId = sanitizeId(order.id);
  const path = `print_orders/${docId}`;
  try {
    await setDoc(
      doc(db, 'print_orders', docId),
      {
        id: docId,
        ownerId: sanitizeId(ownerId),
        photoId: order.photoId.slice(0, 126),
        photoFileName: order.photoFileName.slice(0, 178),
        productId: order.productId.slice(0, 98),
        productName: order.productName.slice(0, 138),
        category: order.category.slice(0, 78),
        dimensions: order.dimensions.slice(0, 78),
        quantity: Math.max(1, Number(order.quantity) || 1),
        clientTotalInr: Math.max(0, Number(order.clientTotalInr) || 0),
        studioProfitInr: Number(order.studioProfitInr) || 0,
        customerName: order.customerName.slice(0, 118),
        status: order.status,
        ...(isNew ? { createdAt: serverTimestamp() } : {}),
      },
      { merge: !isNew }
    );
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function saveInvoiceToFirestore(
  invoice: QuotationInvoiceRecord,
  ownerId: string,
  isNew = false
): Promise<void> {
  const docId = sanitizeId(invoice.id);
  const path = `invoices/${docId}`;
  try {
    await setDoc(
      doc(db, 'invoices', docId),
      {
        id: docId,
        ownerId: sanitizeId(ownerId),
        docNumber: invoice.docNumber.slice(0, 58),
        clientId: invoice.clientId.slice(0, 126),
        clientName: invoice.clientName.slice(0, 138),
        eventTitle: invoice.eventTitle.slice(0, 198),
        stage: invoice.stage,
        status: invoice.status,
        includeGst18: Boolean(invoice.includeGst18),
        items: invoice.items.slice(0, 40),
        advancePaidInr: Math.max(0, Number(invoice.advancePaidInr) || 0),
        upiId: invoice.upiId.slice(0, 118),
        ...(isNew ? { createdAt: serverTimestamp() } : {}),
      },
      { merge: !isNew }
    );
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export function subscribeOwnerCollection<T>(
  collectionName: string,
  ownerId: string,
  onData: (rows: T[]) => void
): Unsubscribe {
  const q = query(collection(db, collectionName), where('ownerId', '==', sanitizeId(ownerId)));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, collectionName);
    }
  );
}
