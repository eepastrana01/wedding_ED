import React from 'react';
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
import { CsvUploader } from './components/importer/CsvUploader';
import { Toast } from './components/common/Toast';
import { ChangelogModal } from './components/common/ChangelogModal';

function WeddingAppContent() {
  const { activeTab, setActiveTab, isChangelogOpen, closeChangelog } = useWedding();

  // Soporte para enlaces directos por código QR (ej. ?tab=photos)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['guests', 'families', 'cards', 'tasks', 'dashboard', 'countdown', 'photos', 'importer'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [setActiveTab]);

  return (
    <div className="min-h-screen flex flex-col bg-wedding-bg">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3.5 sm:pt-6 pb-24 md:pb-10">
        {activeTab === 'guests' && <GuestView />}
        {activeTab === 'families' && <FamilyView />}
        {activeTab === 'cards' && <CardsView />}
        {activeTab === 'tasks' && <TaskView />}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'countdown' && <CountdownView />}
        {activeTab === 'photos' && <PhotoWallView />}
        {activeTab === 'importer' && <CsvUploader />}
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
