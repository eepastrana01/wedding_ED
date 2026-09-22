import React from 'react';
import { WeddingProvider, useWedding } from './context/WeddingContext';
import { Navbar } from './components/layout/Navbar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { GuestView } from './components/guests/GuestView';
import { FamilyView } from './components/families/FamilyView';
import { CardsView } from './components/cards/CardsView';
import { TaskView } from './components/tasks/TaskView';
import { DashboardView } from './components/dashboard/DashboardView';
import { CsvUploader } from './components/importer/CsvUploader';
import { Toast } from './components/common/Toast';

function WeddingAppContent() {
  const { activeTab } = useWedding();

  return (
    <div className="min-h-screen flex flex-col bg-wedding-bg">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3.5 sm:pt-6 pb-24 md:pb-10">
        {activeTab === 'guests' && <GuestView />}
        {activeTab === 'families' && <FamilyView />}
        {activeTab === 'cards' && <CardsView />}
        {activeTab === 'tasks' && <TaskView />}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'importer' && <CsvUploader />}
      </main>

      <MobileBottomNav />
      <Toast />
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
