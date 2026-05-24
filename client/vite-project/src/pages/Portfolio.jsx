import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar/Navbar';
import Hero from '../components/Hero/Hero';
import Skills from '../components/Skills/Skills';
import Projects from '../components/Projects/Projects';
import Contact from '../components/Contact/Contact';
import Footer from '../components/Footer/Footer';
import { trackVisit } from '../utils/api';
import './Portfolio.css';

const Portfolio = () => {
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);

  useEffect(() => {
    // Track visitor on portfolio load
    const ref = document.referrer || 'direct';
    sessionStorage.setItem('folio_ref', ref);
    void trackVisit(ref, window.location.pathname);

    const showTimer = setTimeout(() => {
      setShowWelcomeToast(true);
    }, 250);

    const hideTimer = setTimeout(() => {
      setShowWelcomeToast(false);
    }, 3600);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      <div
        className={`portfolio-welcome-toast ${showWelcomeToast ? 'is-visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        Welcome. Glad you are here.
      </div>
      <Navbar />
      <Hero />
      <Skills />
      <Projects />
      <Contact />
      <Footer />
    </>
  );
};

export default Portfolio;
