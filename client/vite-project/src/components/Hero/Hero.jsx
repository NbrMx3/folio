import { useState, useEffect, useRef } from 'react';
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaEnvelope,
  FaDownload,
  FaWhatsapp,
} from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si';
import { getProfile, trackConversion } from '../../utils/api';
import { fallbackProfile } from '../../data/offlineContent';
import './Hero.css';

const Hero = () => {
  const heroRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfileData, setHasProfileData] = useState(true);
  const [profile, setProfile] = useState({
    ...fallbackProfile,
  });
  const heroSnippet = [
    'const buildExperience = async () => {',
    "  const stack = ['React', 'Node', 'Security'];",
    '  return launch({ motion: true, polish: true });',
    '};',
  ];

  useEffect(() => {
    let isMounted = true;

    getProfile()
      .then((data) => {
        if (isMounted && data && typeof data === 'object') {
          const hasPublishedData = Object.keys(data).length > 0;
          setHasProfileData(hasPublishedData);
          setProfile((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => {
        console.error('Profile fetch error:', err.message);
        if (isMounted) {
          setProfile(fallbackProfile);
          setHasProfileData(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const element = heroRef.current;
    if (!element) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      element.style.removeProperty('--hero-parallax-x');
      element.style.removeProperty('--hero-parallax-y');
      element.style.removeProperty('--hero-scroll-shift');
      return undefined;
    }

    const updateFromPointer = (event) => {
      const rect = element.getBoundingClientRect();
      const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
      const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 18;
      element.style.setProperty('--hero-parallax-x', `${offsetX.toFixed(2)}px`);
      element.style.setProperty('--hero-parallax-y', `${offsetY.toFixed(2)}px`);
    };

    const resetMotion = () => {
      element.style.setProperty('--hero-parallax-x', '0px');
      element.style.setProperty('--hero-parallax-y', '0px');
    };

    const updateScroll = () => {
      const offset = Math.min(window.scrollY * 0.03, 18);
      element.style.setProperty('--hero-scroll-shift', `${offset.toFixed(2)}px`);
    };

    element.addEventListener('pointermove', updateFromPointer);
    element.addEventListener('pointerleave', resetMotion);
    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();

    return () => {
      element.removeEventListener('pointermove', updateFromPointer);
      element.removeEventListener('pointerleave', resetMotion);
      window.removeEventListener('scroll', updateScroll);
    };
  }, []);

  const titleWords = (profile.title || 'Full-Stack Developer').trim().split(/\s+/);
  const titleLead = titleWords.length > 1 ? titleWords.slice(0, -1).join(' ') : 'Full-Stack';
  const titleAccent = titleWords.length > 1 ? titleWords[titleWords.length - 1] : titleWords[0];
  const socialLinks = [
    { label: 'GitHub', href: profile.github || 'https://github.com', icon: <FaGithub /> },
    { label: 'LinkedIn', href: profile.linkedin || 'https://linkedin.com', icon: <FaLinkedin /> },
    { label: 'X', href: profile.twitter || 'https://x.com', icon: <FaTwitter /> },
    { label: 'Facebook', href: profile.facebook || 'https://facebook.com', icon: <FaFacebook /> },
    { label: 'Instagram', href: profile.instagram || 'https://instagram.com', icon: <FaInstagram /> },
    { label: 'TikTok', href: profile.tiktok || 'https://tiktok.com', icon: <SiTiktok /> },
  ];

  const quickActions = [
    {
      label: 'Download Resume',
      href: profile.resume || '/resume.pdf',
      icon: <FaDownload />,
      download: true,
      track: 'resume',
    },
    {
      label: 'Email',
      href: 'mailto:kipkemoi386@gmail.com',
      icon: <FaEnvelope />,
      track: 'email',
    },
    {
      label: 'WhatsApp',
      href: 'https://wa.me/254112267013',
      icon: <FaWhatsapp />,
      track: 'whatsapp',
    },
  ];

  const handleQuickAction = (action) => {
    const ref = sessionStorage.getItem('folio_ref') || document.referrer || 'direct';
    void trackConversion(ref, 'cta', action);
  };

  if (isLoading) {
    return (
      <section className="hero" id="home" ref={heroRef}>
        <div className="hero-container hero-loading-state">
          <div className="hero-loading-copy">
            <div className="skeleton skeleton-line hero-loading-kicker"></div>
            <div className="skeleton skeleton-line skeleton-line--lg hero-loading-title hero-loading-title-top"></div>
            <div className="skeleton skeleton-line skeleton-line--lg hero-loading-title hero-loading-title-bottom"></div>
            <div className="skeleton skeleton-line hero-loading-description"></div>
            <div className="skeleton skeleton-line hero-loading-description hero-loading-description--short"></div>
            <div className="hero-loading-actions">
              <div className="skeleton skeleton-block hero-loading-button"></div>
              <div className="skeleton skeleton-block hero-loading-avatar-row"></div>
            </div>
            <div className="hero-loading-metrics">
              <div className="skeleton skeleton-block hero-loading-metric"></div>
              <div className="skeleton skeleton-block hero-loading-metric"></div>
              <div className="skeleton skeleton-block hero-loading-metric"></div>
            </div>
          </div>
          <div className="hero-loading-visual">
            <div className="skeleton skeleton-block hero-loading-card hero-loading-code"></div>
            <div className="skeleton skeleton-block hero-loading-card hero-loading-status"></div>
            <div className="skeleton skeleton-block hero-loading-card hero-loading-image"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hero" id="home" ref={heroRef}>
      <div className="hero-container">
        <div className="hero-content">
          <p className="hero-kicker">Code-First Interfaces</p>
          <h1 className="hero-title">
            {titleLead}<br />
            <span className="highlight">{titleAccent}</span>
          </h1>
          <p className="hero-description">
            {profile.bio || 'Building digital experiences that merge creativity with technology.'}
          </p>
          <p className="hero-sub">
            Specializing in modern web development and cyber systems
          </p>
          {!hasProfileData && (
            <div className="hero-empty-note">
              No published profile content yet. Showing the portfolio defaults until the backend is updated.
            </div>
          )}
          <div className="hero-actions">
            <a href="#contact" className="btn-primary" onClick={() => handleQuickAction('contact')}>
              Let's Connect
            </a>
            <div className="hero-socials">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}>
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          <div className="hero-quick-actions">
            {quickActions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="hero-quick-action"
                download={action.download || undefined}
                onClick={() => handleQuickAction(action.track)}
                target={action.download ? undefined : '_blank'}
                rel={action.download ? undefined : 'noreferrer'}
              >
                {action.icon}
                <span>{action.label}</span>
              </a>
            ))}
          </div>
          <div className="hero-metrics">
            <article className="hero-metric">
              <span>Focus</span>
              <strong>Frontend Systems</strong>
            </article>
            <article className="hero-metric">
              <span>Stack</span>
              <strong>React + Node</strong>
            </article>
            <article className="hero-metric">
              <span>Edge</span>
              <strong>Secure Delivery</strong>
            </article>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-code-card">
            <div className="hero-code-header">
              <span className="code-dot code-dot-red"></span>
              <span className="code-dot code-dot-amber"></span>
              <span className="code-dot code-dot-cyan"></span>
              <p>landing-page.jsx</p>
            </div>
            <div className="hero-code-lines">
              {heroSnippet.map((line, index) => (
                <div className="hero-code-line" key={line}>
                  <span className="hero-code-index">0{index + 1}</span>
                  <code>{line}</code>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-status-card">
            <span className="hero-status-pill">Live Build</span>
            <h2>{profile.name || 'CyberDev'}</h2>
            <p>{profile.title || 'Full-Stack Developer'}</p>
          </div>

          <div className="hero-image-card">
            {profile.picture ? (
              <img
                src={profile.picture}
                alt={profile.name || 'Developer portrait'}
                className="hero-image"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="hero-image-placeholder">No profile image uploaded yet</div>
            )}
            <div className="hero-image-meta">
              <strong>{profile.name || 'Ready to collaborate'}</strong>
              <span>{profile.linkedin ? 'LinkedIn connected' : 'Open for new projects'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
