/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { LandingPage } from './pages/LandingPage';
import {
  DashboardTabId,
  StudioDashboardShell,
} from './components/dashboard/StudioDashboardShell';
import { StudioOnboardingModal } from './components/dashboard/StudioOnboardingModal';
import { OfflineIndicator } from './components/PWAInstallButton';

export default function App() {
  const [activeView, setActiveView] = useState<'coming_soon' | 'landing' | 'dashboard'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' || params.get('gallery')) {
      return 'dashboard';
    }
    if (params.get('preview') === 'coming_soon') {
      return 'coming_soon';
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
    } else if (params.get('preview') === 'coming_soon') {
      setActiveView('coming_soon');
    }
  }, []);

  if (activeView === 'coming_soon') {
    return <ComingSoonPage />;
  }

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
