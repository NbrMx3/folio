import { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiMenuAlt3, HiX } from 'react-icons/hi';
import { FaUserShield, FaMoon, FaSun, FaDesktop } from 'react-icons/fa';
import { useThemeStore } from '../../store/useThemeStore';
import { getProfile } from '../../utils/api';
import { fallbackProfile } from '../../data/offlineContent';
import './Navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [resume, setResume] = useState(fallbackProfile.resume || '/resume.pdf');
  const { theme, cycleTheme, applyTheme } = useThemeStore();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    applyTheme();

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMedia = () => {
      if (theme === 'default') applyTheme();
    };
    media.addEventListener('change', handleMedia);
    return () => media.removeEventListener('change', handleMedia);
  }, [theme, applyTheme]);

  useEffect(() => {
    let mounted = true;

    getProfile()
      .then((profile) => {
        if (mounted && profile?.resume) {
          setResume(profile.resume);
        }
      })
      .catch(() => {
        if (mounted) setResume(fallbackProfile.resume || '/resume.pdf');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const themeIcon = theme === 'default' ? <FaDesktop /> : theme === 'dark' ? <FaMoon /> : <FaSun />;
  const themeLabel = theme === 'default' ? 'System' : theme === 'dark' ? 'Dark' : 'Light';

  const links = [
    { id: 'about', label: 'About' },
    { id: 'skills', label: 'Skills' },
    { id: 'projects', label: 'Projects' },
    { id: 'experience', label: 'Experience' },
    { id: 'services', label: 'Services' },
    { id: 'activity', label: 'Activity' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-container">
        <a href="#home" className="logo">
          Dennis <span>Kipkemoi</span>
        </a>
        <ul id="primary-navigation" className={`nav-links${menuOpen ? ' open' : ''}`}>
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="nav-right">
          <a
            href={resume || '/resume.pdf'}
            className="nav-resume"
            download
            onClick={() => setMenuOpen(false)}
          >
            Resume
          </a>
          <button
            type="button"
            className="nav-resume"
            onClick={() => {
              setMenuOpen(false);
              window.print();
            }}
          >
            Export PDF
          </button>
          <button
            type="button"
            className="theme-toggle"
            onClick={cycleTheme}
            aria-label={`Theme: ${themeLabel}`}
            title={`Theme: ${themeLabel}`}
          >
            {themeIcon}
          </button>
          <button
            type="button"
            className="admin-icon"
            onClick={() => navigate('/admin/login')}
            aria-label="Admin login"
            title="Admin login"
          >
            <FaUserShield />
            <span>Admin</span>
          </button>
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
          >
            {menuOpen ? <HiX /> : <HiMenuAlt3 />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default memo(Navbar);
