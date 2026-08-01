import { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiMenuAlt3, HiX } from 'react-icons/hi';
import { FaUserShield, FaMoon, FaSun, FaDesktop, FaPalette } from 'react-icons/fa';
import { useThemeStore } from '../../store/useThemeStore';
import './Navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, visualMode, cycleTheme, cycleVisualMode, applyTheme } = useThemeStore();
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

  const themeIcon = theme === 'default' ? <FaDesktop /> : theme === 'dark' ? <FaMoon /> : <FaSun />;
  const themeLabel = theme === 'default' ? 'System' : theme === 'dark' ? 'Dark' : 'Light';
  const visualModeLabel = visualMode === 'midnight' ? 'Midnight' : visualMode === 'aurora' ? 'Aurora' : 'Eclipse';

  const links = ['Home', 'Skills', 'Projects', 'Writing', 'Contact'];

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-container">
        <a href="#home" className="logo">
          Cyber<span>Dev</span>
        </a>
        <ul id="primary-navigation" className={`nav-links${menuOpen ? ' open' : ''}`}>
          {links.map((link) => (
            <li key={link}>
              <a
                href={`#${link.toLowerCase()}`}
                onClick={() => setMenuOpen(false)}
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
        <div className="nav-right">
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
            className="visual-mode-toggle"
            onClick={cycleVisualMode}
            aria-label={`Visual mode: ${visualModeLabel}`}
            title={`Visual mode: ${visualModeLabel}`}
          >
            <FaPalette />
            <span>{visualModeLabel}</span>
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
          <a href="#contact" className="nav-contact" onClick={() => setMenuOpen(false)}>
            Get in touch
          </a>
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
