import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/common/Header.js';
import { Footer } from './components/common/Footer.js';
import { MobileBottomNav } from './components/common/MobileBottomNav.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';

import { HomePage } from './pages/HomePage.js';
import { TrainSearchPage } from './pages/TrainSearchPage.js';
import { TrainDetailsPage } from './pages/TrainDetailsPage.js';
import { StationPage } from './pages/StationPage.js';
import { LiveStationPage } from './pages/LiveStationPage.js';
import { TrainsBetweenPage } from './pages/TrainsBetweenPage.js';
import { AlertsPage } from './pages/AlertsPage.js';
import { FavouritesPage } from './pages/FavouritesPage.js';
import { PnrPage } from './pages/PnrPage.js';
import { LiveTrainsPage } from './pages/LiveTrainsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { AdminPage } from './pages/AdminPage.js';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#070F1E] text-slate-100 selection:bg-amber-500 selection:text-slate-950">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<TrainSearchPage />} />
              <Route path="/live" element={<LiveTrainsPage />} />
              <Route path="/train/:number" element={<TrainDetailsPage />} />
              <Route path="/station/:code" element={<StationPage />} />
              <Route path="/live-station" element={<LiveStationPage />} />
              <Route path="/trains-between" element={<TrainsBetweenPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/favourites" element={<FavouritesPage />} />
              <Route path="/pnr" element={<PnrPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              {/* Fallback */}
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>
          <Footer />
          <MobileBottomNav />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
