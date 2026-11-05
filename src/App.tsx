/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { LandingPage } from './pages/LandingPage';
import {
  DashboardTabId,
  StudioDashboardShell,
} from './components/dashboard/StudioDashboardShell';
import { StudioOnboardingModal } from './components/dashboard/StudioOnboardingModal';
import { OfflineIndicator } from './components/PWAInstallButton';

export default function App() {
  const [activeView, setActiveView] = useState<'landing' | 'dashboard'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' || params.get('gallery')) {
      return 'dashboard';
    }
    return 'landing';
  });

  const [dashboardTab, setDashboardTab] = useState<DashboardTabId>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gallery')) return 'selection';
    return 'overview';
  });

  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setActiveView('dashboard');
    }
  }, []);

  return (
    <AuthProvider>
      <OfflineIndicator />

      {activeView === 'landing' ? (
        <LandingPage
          onOpenDashboard={(tab = 'overview') => {
            setDashboardTab(tab);
            setActiveView('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenOnboarding={() => setShowOnboardingModal(true)}
        />
      ) : (
        <StudioDashboardShell
          initialTab={dashboardTab}
          onNavigateLanding={() => {
            setActiveView('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAuthModal={() => setShowOnboardingModal(true)}
        />
      )}

      {showOnboardingModal && (
        <StudioOnboardingModal
          onClose={() => setShowOnboardingModal(false)}
          onComplete={() => {
            setShowOnboardingModal(false);
            setDashboardTab('overview');
            setActiveView('dashboard');
          }}
        />
      )}
    </AuthProvider>
  );
}
