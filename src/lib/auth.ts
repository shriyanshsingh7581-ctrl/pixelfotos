import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError } from './firebase';
import { OperationType, UserRole } from '../types';

const googleProvider = new GoogleAuthProvider();

export async function signInWithGooglePopup(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserProfileInFirestore(result.user);
  return result.user;
}

export async function loginWithEmailPassword(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function registerWithEmailPassword(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'studio_owner'
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  await sendEmailVerification(result.user);
  await ensureUserProfileInFirestore(result.user, displayName, role);
  return result.user;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function triggerEmailVerification(): Promise<void> {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function ensureUserProfileInFirestore(
  user: User,
  customName?: string,
  role: UserRole = 'studio_owner'
): Promise<void> {
  const userPath = `users/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists() && user.emailVerified) {
      const studioId = `studio_${user.uid.slice(0, 12).replace(/[^a-zA-Z0-9_-]/g, '')}`;
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: (customName || user.displayName || 'Studio Principal').slice(0, 100),
        studioId,
        role: role === 'super_admin' ? 'studio_owner' : role,
        onboardingStep: 3,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'users', user.uid, 'private', 'info'), {
        uid: user.uid,
        email: (user.email || 'studio@example.com').slice(0, 160),
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}
