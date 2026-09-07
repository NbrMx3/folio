import { memo, useEffect, useState } from 'react';
import { FaDownload, FaGithub, FaLinkedin } from 'react-icons/fa';
import { fallbackProfile } from '../../data/offlineContent';
import { getProfile, trackConversion, trackDownload } from '../../utils/api';
import './Hero.css';

const Hero = () => {
  const [profile, setProfile] = useState({ ...fallbackProfile });

  useEffect(() => {
    let mounted = true;
    getProfile()
      .then((data) => {
        if (mounted && data && typeof data === 'object') {
          setProfile((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {
        if (mounted) setProfile(fallbackProfile);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleCta = (action) => {
    const ref = sessionStorage.getItem('folio_ref') || document.referrer || 'direct';
    void trackConversion(ref, 'cta', action);
  };

  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="hero-container">
        <div className="hero-content">
          <p className="hero-status">Available for opportunities</p>
          <h1 id="hero-title">
            Hi, I&apos;m {profile.name || 'Nbr'} - Software Developer
          </h1>
          <p className="hero-copy">
            I build modern, scalable, and user-focused software with clean frontend systems,
            reliable backend services, and production-ready engineering standards.
          </p>
          <div className="hero-actions">
            <a href="#projects" className="btn btn-primary" onClick={() => handleCta('view-work')}>
              View My Work
            </a>
            <a
              href={profile.resume || '/resume.pdf'}
              className="btn btn-ghost"
              download
              onClick={() => {
                handleCta('download-resume');
                void trackDownload({
                  assetType: 'resume',
                  assetName: 'Resume',
                  assetUrl: profile.resume || '/resume.pdf',
                });
              }}
            >
              <FaDownload />
              <span>Download Resume</span>
            </a>
          </div>
          <div className="hero-socials" aria-label="Professional links">
            <a href={profile.github || 'https://github.com'} target="_blank" rel="noreferrer">
              <FaGithub />
              <span>GitHub</span>
            </a>
            <a href={profile.linkedin || 'https://linkedin.com'} target="_blank" rel="noreferrer">
              <FaLinkedin />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>

        <aside className="hero-visual" aria-hidden="true">
          <div className="hero-avatar-frame">
            {profile.picture ? (
              <img src={profile.picture} alt="" className="hero-avatar-image" loading="lazy" decoding="async" />
            ) : (
              <span className="hero-avatar-placeholder">
                {String(profile.name || 'DK').split(' ').map((part) => part[0]).slice(0, 2).join('')}
              </span>
            )}
          </div>
          <div className="hero-code-card">
            <header>
              <span></span><span></span><span></span>
              <p>portfolio.tsx</p>
            </header>
            <pre>
              <code>{`const developer = {\n  stack: ['React', 'TypeScript', 'Node.js'],\n  focus: 'Scalable product engineering',\n  status: 'Open to opportunities'\n};`}</code>
            </pre>
          </div>
          <div className="hero-profile-card">
            <strong>{profile.title || 'Full-Stack Developer'}</strong>
            <span>Building real-world products with clean architecture.</span>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default memo(Hero);
