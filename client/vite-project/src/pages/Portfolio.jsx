import { useEffect } from 'react';
import Navbar from '../components/Navbar/Navbar';
import Hero from '../components/Hero/Hero';
import Skills from '../components/Skills/Skills';
import Projects from '../components/Projects/Projects';
import Contact from '../components/Contact/Contact';
import Footer from '../components/Footer/Footer';
import { trackVisit } from '../utils/api';

const Portfolio = () => {
  useEffect(() => {
    // Track visitor on portfolio load
    const ref = document.referrer || 'direct';
    trackVisit(ref, window.location.pathname);

    // Show a quick greeting when someone lands on the portfolio.
    setTimeout(() => {
      window.alert('Hello there?😍');
    }, 300);
  }, []);

  return (
    <>
      <Navbar />
      <Hero />
      <Skills />
      <Projects />
      <Contact />
      <Footer />
    </>
  );
};

export default Portfolio;
