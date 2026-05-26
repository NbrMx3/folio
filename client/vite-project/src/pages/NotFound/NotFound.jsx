import { Link } from 'react-router-dom';
import { FaArrowLeft, FaHome, FaImages } from 'react-icons/fa';
import Seo from '../../components/Seo/Seo';
import './NotFound.css';

const NotFound = () => {
  return (
    <main className="not-found">
      <Seo
        title="404 - Page Not Found"
        description="The page you tried to open does not exist. Return to the CyberDev portfolio homepage or explore the gallery."
        url={window.location.href}
        image="/dk_portfolio_logo_light.svg"
      />
      <section className="not-found-shell" aria-labelledby="not-found-title">
        <div className="not-found-code">404</div>
        <div className="not-found-card">
          <p className="not-found-kicker">Lost in the build</p>
          <h1 id="not-found-title">This page does not exist.</h1>
          <p className="not-found-copy">
            The route may have changed, the link may be outdated, or the page may never have been published.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="not-found-button not-found-button-primary">
              <FaHome /> Go home
            </Link>
            <Link to="/gallery" className="not-found-button">
              <FaImages /> View gallery
            </Link>
            <Link to="/" className="not-found-link">
              <FaArrowLeft /> Back to portfolio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default NotFound;
