import { useEffect, useState } from 'react';
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
    { label: 'GitHub', href: profile.github || 'https://github.com', icon: <FaGithub />, isExternal: true },
    { label: 'LinkedIn', href: profile.linkedin || 'https://linkedin.com', icon: <FaLinkedin />, isExternal: true },
    { label: 'X', href: profile.twitter || 'https://x.com', icon: <FaTwitter />, isExternal: true },
    { label: 'Facebook', href: profile.facebook || 'https://facebook.com', icon: <FaFacebook />, isExternal: true },
    { label: 'Instagram', href: profile.instagram || 'https://instagram.com', icon: <FaInstagram />, isExternal: true },
    { label: 'TikTok', href: profile.tiktok || 'https://tiktok.com', icon: <SiTiktok />, isExternal: true },
    { label: 'Gallery', href: '/gallery', icon: <FaImages />, isExternal: false },
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
                <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}>
                  {social.icon}
                </a>
              ) : (
                <Link key={social.label} to={social.href} aria-label={social.label}>
                  {social.icon}
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

export default Footer;
