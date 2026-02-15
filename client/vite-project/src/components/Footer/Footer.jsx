import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <a href="#home" className="footer-logo">
            Cyber<span>Dev</span>
          </a>
          <div className="footer-socials">
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
              <FaGithub />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <FaLinkedin />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
              <FaTwitter />
            </a>
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
