import React, { useState } from 'react';
import { WeddingProvider, useWedding } from './context/WeddingContext';
import { Navbar } from './components/layout/Navbar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { GuestView } from './components/guests/GuestView';
import { FamilyView } from './components/families/FamilyView';
import { CardsView } from './components/cards/CardsView';
import { TaskView } from './components/tasks/TaskView';
import { DashboardView } from './components/dashboard/DashboardView';
import { CountdownView } from './components/countdown/CountdownView';
import { PhotoWallView } from './components/photos/PhotoWallView';
import { TablesView } from './components/tables/TablesView';
import { FloorPlanStudio } from './components/tables/FloorPlanStudio';
import { DigitalInvitationLanding } from './components/invitation/DigitalInvitationLanding';
import { CsvUploader } from './components/importer/CsvUploader';
import { Toast } from './components/common/Toast';
import { ChangelogModal } from './components/common/ChangelogModal';
import { checkAndPersistAdminAccess } from './utils/invitationToken';

function WeddingAppContent() {
  const { activeTab, setActiveTab, isChangelogOpen, closeChangelog } = useWedding();
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => checkAndPersistAdminAccess());

  const isStandalone = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('standalone') === 'true' ||
    window.location.pathname === '/tables-studio'
  );

  const isDigitalInvitationRoute = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/invitacion') ||
    window.location.pathname.startsWith('/i/') ||
    new URLSearchParams(window.location.search).has('invitacion') ||
    new URLSearchParams(window.location.search).has('k') ||
    new URLSearchParams(window.location.search).has('card')
  );

  // Soporte para enlaces directos por código QR (ej. ?tab=photos)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['guests', 'families', 'tables', 'cards', 'tasks', 'dashboard', 'countdown', 'photos', 'importer'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [setActiveTab]);

  // PROTECCIÓN DE SEGURIDAD SIN LOGIN:
  // Si el visitante NO ha desbloqueado este dispositivo con /panel-edis (es un invitado curioso
  // que borró "/invitacion?..." de la URL para intentar entrar a la raíz "/"),
  // SIEMPRE verá únicamente la Landing Page de la Invitación Digital y jamás el panel administrativo.
  if (!isAdminUnlocked || isDigitalInvitationRoute) {
    return (
      <>
        <DigitalInvitationLanding
          isAdminUnlocked={isAdminUnlocked}
          onUnlockAdmin={() => {
            try {
              localStorage.setItem('wedding_ed_admin_unlocked', 'true');
            } catch {}
            setIsAdminUnlocked(true);
            window.history.replaceState({}, '', '/');
          }}
        />
        <Toast />
      </>
    );
  }

  // Si se abre en una pestaña independiente para diseño de mesas (solo para admin desbloqueado)
  if (isStandalone) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-[#F8F9FA] fixed inset-0 select-none">
        <FloorPlanStudio isFullscreenMode={true} isStandaloneTab={true} />
        <Toast />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-wedding-bg">
      <Navbar />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 pt-3.5 sm:pt-6 pb-24 md:pb-10">
        <div key={activeTab} className="animate-in fade-in duration-200">
          {activeTab === 'guests' && <GuestView />}
          {activeTab === 'families' && <FamilyView />}
          {activeTab === 'tables' && <TablesView />}
          {activeTab === 'cards' && <CardsView />}
          {activeTab === 'tasks' && <TaskView />}
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'countdown' && <CountdownView />}
          {activeTab === 'photos' && <PhotoWallView />}
          {activeTab === 'importer' && <CsvUploader />}
        </div>
      </main>

      <MobileBottomNav />
      <Toast />
      <ChangelogModal isOpen={isChangelogOpen} onClose={closeChangelog} />
    </div>
  );
}

export default function App() {
  return (
    <WeddingProvider>
      <WeddingAppContent />
    </WeddingProvider>
  );
}
