/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Features from './components/Features';
import CTA from './components/CTA';
import HowItWorks from './components/HowItWorks';
import AppInstall from './components/AppInstall';
import Footer from './components/Footer';
import VocabularyPage from './pages/VocabularyPage';
import VocabularyQuickViewPage from './pages/VocabularyQuickViewPage';
import VocabularyPracticePage from './pages/VocabularyPracticePage';
import GrammarPage from './pages/GrammarPage';
import GrammarDetailPage from './pages/GrammarDetailPage';
import ReadingPage from './pages/ReadingPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';

function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <Features />
      <CTA />
      <HowItWorks />
      <AppInstall />
    </>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Routes>
        <Route path="/" element={
          <>
            <Header />
            <main className="flex-grow">
              <HomePage />
            </main>
            <Footer />
          </>
        } />
        <Route path="/tu-vung" element={<VocabularyPage />} />
        <Route path="/tu-vung/:topicId" element={<VocabularyQuickViewPage />} />
        <Route path="/tu-vung/:topicId/luyen-tap" element={<VocabularyPracticePage />} />
        <Route path="/ngu-phap" element={<GrammarPage />} />
        <Route path="/ngu-phap/:id" element={<GrammarDetailPage />} />
        <Route path="/ngu-phap/:id/luyen-tap" element={<GrammarDetailPage initialTab="practice" />} />
        <Route path="/doc" element={<ReadingPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </div>
  );
}
