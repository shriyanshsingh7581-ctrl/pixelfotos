import React from 'react';
import { PixelFotosProvider, usePixelFotos } from './contexts/PixelFotosContext';
import { ClientMicrositeView } from './components/microsite/ClientMicrositeView';
import { StudioCommandWorkspace } from './components/studio/StudioCommandWorkspace';
import { LandingPage } from './pages/LandingPage';

const PixelFotosShell: React.FC = () => {
  const { viewMode } = usePixelFotos();

  if (viewMode === 'studio') {
    return <StudioCommandWorkspace />;
  }

  if (viewMode === 'microsite') {
    return <ClientMicrositeView />;
  }

  return <LandingPage />;
};

export function App() {
  return (
    <PixelFotosProvider>
      <PixelFotosShell />
    </PixelFotosProvider>
  );
}

export default App;
