import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiMenuAlt3, HiX } from 'react-icons/hi';
import { FaUserShield, FaMoon, FaSun, FaDesktop } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'default');
  const navigate = useNavigate();

  const resolveTheme = useCallback(
    (mode) => {
      if (mode === 'dark' || mode === 'light') return mode;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    },
    []
  );

  const applyTheme = useCallback(
    (mode) => {
      const effective = resolveTheme(mode);
      document.documentElement.setAttribute('data-theme', effective === 'dark' ? 'dark' : 'light');
      if (mode === 'default') {
        localStorage.removeItem('theme');
      } else {
        localStorage.setItem('theme', mode);
      }
    },
    [resolveTheme]
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    applyTheme(theme);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMedia = () => {
      if (theme === 'default') applyTheme('default');
    };
    media.addEventListener('change', handleMedia);
    return () => media.removeEventListener('change', handleMedia);
  }, [theme, applyTheme]);

  const cycleTheme = () => {
    setTheme((prev) => {
      if (prev === 'default') return 'dark';
      if (prev === 'dark') return 'light';
      return 'default';
    });
  };

  const themeIcon = theme === 'default' ? <FaDesktop /> : theme === 'dark' ? <FaMoon /> : <FaSun />;
  const themeLabel = theme === 'default' ? 'System' : theme === 'dark' ? 'Dark' : 'Light';

  const links = ['Home', 'Skills', 'Projects', 'Contact'];

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-container">
        <a href="#home" className="logo">
          Cyber<span>Dev</span>
        </a>
        <ul className={`nav-links${menuOpen ? ' open' : ''}`}>
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
            className="theme-toggle"
            onClick={cycleTheme}
            aria-label={`Theme: ${themeLabel}`}
            title={`Theme: ${themeLabel}`}
          >
            {themeIcon}
          </button>
          <button
            className="admin-icon"
            onClick={() => navigate('/admin/login')}
            aria-label="Admin login"
            title="Admin"
          >
            <FaUserShield />
          </button>
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <HiX /> : <HiMenuAlt3 />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
