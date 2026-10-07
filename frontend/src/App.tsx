// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/common/Header.js';
import { Footer } from './components/common/Footer.js';
import { MobileBottomNav } from './components/common/MobileBottomNav.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { LanguageProvider } from './context/LanguageContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { OfflineBanner } from './components/common/OfflineBanner.js';

import { HomePage } from './pages/HomePage.js';
import { TrainSearchPage } from './pages/TrainSearchPage.js';
import { TrainDetailsPage } from './pages/TrainDetailsPage.js';
import { StationPage } from './pages/StationPage.js';
import { LiveStationPage } from './pages/LiveStationPage.js';
import { TrainsBetweenPage } from './pages/TrainsBetweenPage.js';
import { AlertsPage } from './pages/AlertsPage.js';
import { FavouritesPage } from './pages/FavouritesPage.js';
import { PnrPage } from './pages/PnrPage.js';
import { TicketsPage } from './pages/TicketsPage.js';
import { LiveTrainsPage } from './pages/LiveTrainsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { RailwayMapPage } from './pages/RailwayMapPage.js';
import { RoutePage } from './pages/RoutePage.js';
import { JourneyPlannerPage } from './pages/JourneyPlannerPage.js';
import { SeatAvailabilityPage } from './pages/SeatAvailabilityPage.js';
import { TrainExceptionsPage } from './pages/TrainExceptionsPage.js';
import { RailwayZonesPage } from './pages/RailwayZonesPage.js';
import { RailwayDivisionsPage } from './pages/RailwayDivisionsPage.js';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-[#070F1E] text-slate-900 dark:text-slate-100 selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200">
              <Header />
              <OfflineBanner />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<TrainSearchPage />} />
                  <Route path="/trains" element={<TrainSearchPage />} />
                  <Route path="/trains/:number" element={<TrainDetailsPage />} />
                  <Route path="/live" element={<LiveTrainsPage />} />
                  <Route path="/live-trains" element={<LiveTrainsPage />} />
                  <Route path="/live/:number" element={<TrainDetailsPage />} />
                  <Route path="/train/:number" element={<TrainDetailsPage />} />
                  <Route path="/station/:code" element={<StationPage />} />
                  <Route path="/stations" element={<StationPage />} />
                  <Route path="/stations/:code" element={<StationPage />} />
                  <Route path="/live-station" element={<LiveStationPage />} />
                  <Route path="/live-station/:code" element={<LiveStationPage />} />
                  <Route path="/station-live" element={<LiveStationPage />} />
                  <Route path="/station-live/:code" element={<LiveStationPage />} />
                  <Route path="/trains-between" element={<TrainsBetweenPage />} />
                  <Route path="/routes" element={<RoutePage />} />
                  <Route path="/routes/:id" element={<RoutePage />} />
                  <Route path="/map" element={<RailwayMapPage />} />
                  <Route path="/railway-map" element={<RailwayMapPage />} />
                  <Route path="/journey-planner" element={<JourneyPlannerPage />} />
                  <Route path="/seat-availability" element={<SeatAvailabilityPage />} />
                  <Route path="/exceptions" element={<TrainExceptionsPage />} />
                  <Route path="/railway-zones" element={<RailwayZonesPage />} />
                  <Route path="/railway-divisions" element={<RailwayDivisionsPage />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/favourites" element={<FavouritesPage />} />
                  <Route path="/pnr" element={<PnrPage />} />
                  <Route path="/tickets" element={<TicketsPage />} />
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
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
