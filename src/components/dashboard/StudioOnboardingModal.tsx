import React, { useState } from 'react';
import { Check, LogIn, Mail, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  loginWithEmailPassword,
  registerWithEmailPassword,
  requestPasswordReset,
  signInWithGooglePopup,
  triggerEmailVerification,
} from '../../lib/auth';
import { SubscriptionPlanId } from '../../types';

interface StudioOnboardingModalProps {
  onClose: () => void;
  onComplete: () => void;
}

export const StudioOnboardingModal: React.FC<StudioOnboardingModalProps> = ({
  onClose,
  onComplete,
}) => {
  const {
    firebaseUser,
    studio,
    updateStudio,
    plans,
    onboardingStep,
    setOnboardingStep,
  } = useAuth();

  const [step, setStep] = useState<number>(onboardingStep < 6 ? onboardingStep : 1);
  const [authMode, setAuthMode] = useState<'register' | 'login' | 'reset'>('register');
  const [email, setEmail] = useState<string>(studio.email);
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('Julian Vance');
  const [studioName, setStudioName] = useState<string>(studio.studioName);
  const [studioSlug, setStudioSlug] = useState<string>(studio.slug);
  const [watermarkText, setWatermarkText] = useState<string>(studio.watermarkText);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>(studio.subscriptionPlan);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    try {
      await signInWithGooglePopup();
      setStatusMessage('Authenticated with Google. Proceeding to Studio Profile setup.');
      setStep(3);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Google Sign-In popup was closed or blocked in preview.'
      );
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');
    try {
      if (authMode === 'reset') {
        await requestPasswordReset(email);
        setStatusMessage(`Password reset instructions sent to ${email}.`);
        return;
      }
      if (authMode === 'login') {
        await loginWithEmailPassword(email, password);
        setStatusMessage('Signed in successfully.');
        setStep(3);
      } else {
        await registerWithEmailPassword(email, password, displayName);
        setStatusMessage('Account created and verification email dispatched.');
        setStep(2);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Authentication error. Verify Email/Password provider is enabled in Firebase Console or continue with Studio Setup.'
      );
    }
  };

  const handleFinishOnboarding = async () => {
    await updateStudio({
      studioName: studioName.trim() || studio.studioName,
      slug: studioSlug.trim() || studio.slug,
      watermarkText: watermarkText.trim() || studio.watermarkText,
      subscriptionPlan: selectedPlan,
    });
    setOnboardingStep(6);
    onComplete();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 md:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 id="onboarding-modal-title" className="text-2xl font-semibold text-slate-900">
              Studio Registration &amp; Authentication Wizard
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              6-Step Guided Setup · Firebase Auth + Multi-Tenant Studio Provisioning
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700"
            aria-label="Close Onboarding Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-6 gap-1.5 text-[11px]">
          {[
            { num: 1, label: '1. Account' },
            { num: 2, label: '2. Verify' },
            { num: 3, label: '3. Profile' },
            { num: 4, label: '4. Branding' },
            { num: 5, label: '5. Plan' },
            { num: 6, label: '6. Launch' },
          ].map((item) => (
            <button
              key={item.num}
              type="button"
              onClick={() => setStep(item.num)}
              className={`py-2 px-2 rounded-lg font-medium text-center transition-colors truncate ${
                step === item.num
                  ? 'bg-[#0F172A] text-white'
                  : step > item.num
                  ? 'bg-teal-50 text-[#0D9488]'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {statusMessage && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900">
            {statusMessage}
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: CREATE ACCOUNT / LOGIN */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Step 1: Authenticate Your Studio Account
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`px-2.5 py-1 rounded ${
                    authMode === 'register' ? 'bg-slate-900 text-white' : 'text-slate-600'
                  }`}
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`px-2.5 py-1 rounded ${
                    authMode === 'login' ? 'bg-slate-900 text-white' : 'text-slate-600'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('reset')}
                  className={`px-2.5 py-1 rounded ${
                    authMode === 'reset' ? 'bg-slate-900 text-white' : 'text-slate-600'
                  }`}
                >
                  Forgot Password
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 bg-[#0F172A] text-white font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-[#0D9488]" />
              <span>Continue with Google Sign-In (Firebase OAuth Popup)</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-slate-200" />
              <span className="shrink mx-3 text-slate-400">or Email &amp; Password</span>
              <div className="grow border-t border-slate-200" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              {authMode === 'register' && (
                <div>
                  <label htmlFor="auth-name" className="block font-medium text-slate-700 mb-1">
                    Principal Photographer Name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              )}
              <div>
                <label htmlFor="auth-email" className="block font-medium text-slate-700 mb-1">
                  Studio Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>
              {authMode !== 'reset' && (
                <div>
                  <label htmlFor="auth-pass" className="block font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    id="auth-pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-slate-600 hover:text-slate-900 font-medium"
                >
                  Skip to Step 2 →
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0D9488] text-white font-medium rounded-lg hover:bg-teal-700"
                >
                  {authMode === 'reset'
                    ? 'Send Reset Link'
                    : authMode === 'login'
                    ? 'Sign In'
                    : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: EMAIL VERIFICATION */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-semibold text-slate-900">
              Step 2: Email Verification &amp; Zero-Trust Guard
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Our Firestore Security Rules enforce <code className="font-mono">request.auth.token.email_verified == true</code> on all studio writes. Verify your email or sign in with Google to activate cloud writes.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-[#0D9488]" />
                <div>
                  <div className="font-semibold text-slate-900">
                    {firebaseUser?.email || email}
                  </div>
                  <div className="text-slate-500">
                    Verification Status:{' '}
                    {firebaseUser?.emailVerified ? 'Verified' : 'Pending / Preview Mode'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await triggerEmailVerification();
                  setStatusMessage('Verification email sent.');
                }}
                className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg font-medium"
              >
                Resend Verification
              </button>
            </div>
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2 bg-[#0F172A] text-white font-medium rounded-lg"
              >
                Continue to Step 3
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: STUDIO PROFILE */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-semibold text-slate-900">
              Step 3: Configure Studio Identity &amp; Portfolio URL
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="onb-studio-name" className="block font-medium text-slate-700 mb-1">
                  Studio Brand Name
                </label>
                <input
                  id="onb-studio-name"
                  type="text"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="onb-studio-slug" className="block font-medium text-slate-700 mb-1">
                  Public Portfolio Slug (/studio/...)
                </label>
                <input
                  id="onb-studio-slug"
                  type="text"
                  value={studioSlug}
                  onChange={(e) => setStudioSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-5 py-2 bg-[#0F172A] text-white font-medium rounded-lg"
              >
                Continue to Step 4
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: STUDIO LOGO & WATERMARK */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-semibold text-slate-900">
              Step 4: Upload Studio Crest &amp; Default Watermark
            </h3>
            <div>
              <label htmlFor="onb-watermark" className="block font-medium text-slate-700 mb-1">
                Default Client Proofing Watermark Text
              </label>
              <input
                id="onb-watermark"
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-5 py-2 bg-[#0F172A] text-white font-medium rounded-lg"
              >
                Continue to Step 5
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SELECT SUBSCRIPTION PLAN */}
        {step === 5 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-semibold text-slate-900">
              Step 5: Select Studio Subscription Tier
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlan(p.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedPlan === p.id
                      ? 'border-[#0D9488] bg-teal-50/40 ring-2 ring-[#0D9488]/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-900">{p.name}</div>
                  <div className="font-mono text-lg font-bold text-slate-900 my-1 tabular-nums">
                    ${p.monthlyPrice}/mo
                  </div>
                  <div className="text-slate-500 tabular-nums">
                    {p.storageLimitGB} GB · {p.teamMemberLimit} Team Seats
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(6)}
                className="px-5 py-2 bg-[#0F172A] text-white font-medium rounded-lg"
              >
                Review &amp; Launch
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: OPEN STUDIO DASHBOARD */}
        {step === 6 && (
          <div className="space-y-4 text-xs text-center py-4">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-[#0D9488] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">
              {studioName} Is Ready for Production
            </h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Plan: <strong>{selectedPlan.toUpperCase()}</strong> · Portfolio:{' '}
              <span className="font-mono">/studio/{studioSlug}</span> · Watermark:{' '}
              <strong>{watermarkText}</strong>
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="px-6 py-2.5 bg-[#0D9488] text-white font-medium rounded-lg hover:bg-teal-700 inline-flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save &amp; Open Studio Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
