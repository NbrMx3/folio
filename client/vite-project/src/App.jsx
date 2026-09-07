import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Portfolio from './pages/Portfolio';
import Gallery from './pages/Gallery/Gallery';
import ProjectCaseStudy from './pages/ProjectCaseStudy/ProjectCaseStudy';
import AdminLogin from './pages/AdminLogin/AdminLogin';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AdminResetPassword from './pages/AdminResetPassword/AdminResetPassword';
import NotFound from './pages/NotFound/NotFound';
import { prefetchPortfolioContent, trackInteraction } from './utils/api';
import './App.css';

function App() {
  const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    prefetchPortfolioContent();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const isPublicPath = () => !window.location.pathname.startsWith('/admin');
    const labelFor = (element) => {
      const text = element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent || '';
      return text.replace(/\s+/g, ' ').trim().slice(0, 180);
    };
    const onClick = (event) => {
      if (!isPublicPath()) return;
      const target = event.target.closest('a, button');
      if (!target || target.hasAttribute('disabled')) return;
      void trackInteraction(target.tagName === 'A' ? 'link_click' : 'button_click', labelFor(target));
    };
    const onSubmit = (event) => {
      if (!isPublicPath()) return;
      const form = event.target;
      void trackInteraction('form_submit', labelFor(form) || 'form');
    };

    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('submit', onSubmit);
    };
  }, []);

  return (
    <div className="app">
      {!isOnline && (
        <div className="connection-banner" role="status" aria-live="polite">
          Offline mode: cached portfolio content is available.
        </div>
      )}
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/projects/:projectSlug" element={<ProjectCaseStudy />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/reset-password" element={<AdminResetPassword />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
