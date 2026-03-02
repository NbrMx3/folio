import { useState, useEffect } from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { getProfile } from '../../utils/api';
import './Hero.css';

const Hero = () => {
  const [profile, setProfile] = useState({ name: '', title: '', bio: '', picture: '', github: '', linkedin: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      if (data && typeof data === 'object') setProfile(data);
    } catch (err) {
      console.error('Profile fetch error:', err.message);
    }
  };

  return (
    <section className="hero" id="home">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">
            {profile.title ? profile.title.split(' ').slice(0, -1).join(' ') : 'Full-Stack'}<br />
            <span className="highlight">
              {profile.title ? profile.title.split(' ').slice(-1)[0] : 'Developer'}
            </span>
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
        </div>
        <div className="hero-image-wrapper">
          <div className="hero-image-glow"></div>
          {profile.picture ? (
            <img
              src={profile.picture}
              alt={profile.name || 'Developer portrait'}
              className="hero-image"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="hero-image-placeholder"></div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
