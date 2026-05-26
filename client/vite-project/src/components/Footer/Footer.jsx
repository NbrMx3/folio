import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaImages,
} from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si';
import { getProfile } from '../../utils/api';
import { fallbackProfile } from '../../data/offlineContent';
import './Footer.css';

const Footer = () => {
  const [profile, setProfile] = useState({
    ...fallbackProfile,
  });

  useEffect(() => {
    let cancelled = false;

    getProfile()
      .then((data) => {
        if (!cancelled && data && typeof data === 'object') {
          setProfile((prev) => ({ ...prev, ...data }));
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

  const socialLinks = [
    { label: 'GitHub', href: profile.github || 'https://github.com', icon: <FaGithub />, isExternal: true },
    { label: 'LinkedIn', href: profile.linkedin || 'https://linkedin.com', icon: <FaLinkedin />, isExternal: true },
    { label: 'X', href: profile.twitter || 'https://x.com', icon: <FaTwitter />, isExternal: true },
    { label: 'Facebook', href: profile.facebook || 'https://facebook.com', icon: <FaFacebook />, isExternal: true },
    { label: 'Instagram', href: profile.instagram || 'https://instagram.com', icon: <FaInstagram />, isExternal: true },
    { label: 'TikTok', href: profile.tiktok || 'https://tiktok.com', icon: <SiTiktok />, isExternal: true },
    { label: "Nbr's Gallery", href: '/gallery', icon: <FaImages />, isExternal: false, showLabel: true },
  ];

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <a href="#home" className="footer-logo">
            Cyber<span>Dev</span>
          </a>
          <div className="footer-socials">
            {socialLinks.map((social) => (
              social.isExternal ? (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="footer-social-link"
                >
                  {social.icon}
                </a>
              ) : (
                <Link
                  key={social.label}
                  to={social.href}
                  aria-label={social.label}
                  className="footer-social-link gallery-link"
                >
                  {social.icon}
                  {social.showLabel && <span className="footer-social-label">{social.label}</span>}
                </Link>
              )
            ))}
          </div>
        </div>
        <div className="footer-divider"></div>
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} CyberDev. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default memo(Footer);
