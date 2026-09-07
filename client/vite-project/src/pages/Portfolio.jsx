import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar/Navbar';
import Hero from '../components/Hero/Hero';
import About from '../components/About/About';
import Skills from '../components/Skills/Skills';
import Projects from '../components/Projects/Projects';
import Experience from '../components/Experience/Experience';
import Services from '../components/Services/Services';
import DeveloperActivity from '../components/DeveloperActivity/DeveloperActivity';
import Contact from '../components/Contact/Contact';
import Footer from '../components/Footer/Footer';
import Seo from '../components/Seo/Seo';
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

  useEffect(() => {
    const sections = document.querySelectorAll('.reveal-section');
    if (!sections.length) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      sections.forEach((section) => section.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.18,
      rootMargin: '0px 0px -10% 0px',
    });

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Seo
        title="CyberDev | Full-Stack Developer Portfolio"
        description="CyberDev's portfolio featuring motion-rich project showcases, detailed case studies, writing, and direct contact options."
        url={window.location.origin}
        image="/social-card.svg"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: 'CyberDev',
          jobTitle: 'Full-Stack Developer',
          url: window.location.origin,
          image: '/dk_portfolio_logo_light.svg',
          sameAs: ['https://github.com', 'https://linkedin.com', 'https://x.com'],
        }}
      />
      <div
        className={`portfolio-welcome-toast ${showWelcomeToast ? 'is-visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        Welcome. Glad you are here.
      </div>
      <Navbar />
      <div className="reveal-section reveal-hero"><Hero /></div>
      <div className="reveal-section"><About /></div>
      <div className="reveal-section"><Skills /></div>
      <div className="reveal-section"><Projects /></div>
      <div className="reveal-section"><Experience /></div>
      <div className="reveal-section"><Services /></div>
      <div className="reveal-section"><DeveloperActivity /></div>
      <div className="reveal-section"><Contact /></div>
      <div className="reveal-section"><Footer /></div>
    </>
  );
};

export default Portfolio;
