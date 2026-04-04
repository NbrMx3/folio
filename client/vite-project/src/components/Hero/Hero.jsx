import { useState, useEffect } from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { getProfile } from '../../utils/api';
import './Hero.css';

const Hero = () => {
  const [profile, setProfile] = useState({ name: '', title: '', bio: '', picture: '', github: '', linkedin: '' });
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
          setProfile(data);
        }
      })
      .catch((err) => {
        console.error('Profile fetch error:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const titleWords = (profile.title || 'Full-Stack Developer').trim().split(/\s+/);
  const titleLead = titleWords.length > 1 ? titleWords.slice(0, -1).join(' ') : 'Full-Stack';
  const titleAccent = titleWords.length > 1 ? titleWords[titleWords.length - 1] : titleWords[0];

  return (
    <section className="hero" id="home">
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
          <div className="hero-actions">
            <a href="#contact" className="btn-primary">Let's Connect</a>
            <div className="hero-socials">
              <a href={profile.github || 'https://github.com'} target="_blank" rel="noreferrer" aria-label="GitHub">
                <FaGithub />
              </a>
              <a href={profile.linkedin || 'https://linkedin.com'} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <FaLinkedin />
              </a>
            </div>
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
              <div className="hero-image-placeholder">Profile Preview</div>
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
