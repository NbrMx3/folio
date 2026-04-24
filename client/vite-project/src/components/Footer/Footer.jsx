import { useEffect, useState } from 'react';
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaInstagram,
} from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si';
import { getProfile } from '../../utils/api';
import './Footer.css';

const Footer = () => {
  const [profile, setProfile] = useState({
    github: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    tiktok: '',
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
        // ignore
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const socialLinks = [
    { label: 'GitHub', href: profile.github || 'https://github.com', icon: <FaGithub /> },
    { label: 'LinkedIn', href: profile.linkedin || 'https://linkedin.com', icon: <FaLinkedin /> },
    { label: 'X', href: profile.twitter || 'https://x.com', icon: <FaTwitter /> },
    { label: 'Facebook', href: profile.facebook || 'https://facebook.com', icon: <FaFacebook /> },
    { label: 'Instagram', href: profile.instagram || 'https://instagram.com', icon: <FaInstagram /> },
    { label: 'TikTok', href: profile.tiktok || 'https://tiktok.com', icon: <SiTiktok /> },
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
              <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}>
                {social.icon}
              </a>
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

export default Footer;
