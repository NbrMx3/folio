import { memo, useEffect, useState } from 'react';
import {
  FaGithub,
  FaLinkedin,
  FaEnvelope,
} from 'react-icons/fa';
import { getProfile } from '../../utils/api';
import { fallbackProfile } from '../../data/offlineContent';
import './Footer.css';

const Footer = () => {
  const [profile, setProfile] = useState({
    ...fallbackProfile,
  });
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getProfile()
      .then((data) => {
        if (!cancelled && data && typeof data === 'object') {
          setProfile((prev) => ({ ...prev, ...data }));
          setProfileLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(fallbackProfile);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const contactEmail = profileLoaded ? profile.email?.trim() : fallbackProfile.email;
  const socialLinks = [
    { label: 'GitHub', href: profile.github || 'https://github.com', icon: <FaGithub />, isExternal: true },
    ...(profile.linkedin ? [{ label: 'LinkedIn', href: profile.linkedin, icon: <FaLinkedin />, isExternal: true }] : []),
    ...(contactEmail ? [{ label: 'Email', href: `mailto:${contactEmail}?subject=${encodeURIComponent('Portfolio enquiry')}`, icon: <FaEnvelope />, isExternal: true }] : []),
  ];

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <a href="#home" className="footer-logo">
            Nbr<span>Dev</span>
          </a>
          <div className="footer-socials">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target={social.isExternal ? '_blank' : undefined}
                rel={social.isExternal ? 'noreferrer' : undefined}
                aria-label={social.label}
                className="footer-social-link"
              >
                {social.icon}
                <span className="footer-social-label">{social.label}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="footer-divider"></div>
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} {profile.name || 'Nbr'} - Built with React, TypeScript &amp; ❤️
        </p>
      </div>
    </footer>
  );
};

export default memo(Footer);
