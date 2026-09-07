import { memo } from 'react';
import { FaCloud, FaCodeBranch, FaDatabase, FaDraftingCompass, FaLaptopCode, FaServer, FaUserTie } from 'react-icons/fa';
import './Services.css';

const services = [
  { title: 'Web Application Development', icon: <FaLaptopCode />, description: 'Production-ready web applications with a strong product UX layer.' },
  { title: 'Full-Stack Development', icon: <FaCodeBranch />, description: 'Frontend and backend delivery from idea to deployment.' },
  { title: 'API Development', icon: <FaServer />, description: 'Scalable REST API layers with secure, maintainable contracts.' },
  { title: 'Database Design', icon: <FaDatabase />, description: 'Reliable schemas and data flows tuned for growth and clarity.' },
  { title: 'UI/UX Implementation', icon: <FaDraftingCompass />, description: 'Design-system minded interfaces with accessibility-first execution.' },
  { title: 'Cloud Deployment', icon: <FaCloud />, description: 'Deployments on modern hosting platforms with stable release flow.' },
  { title: 'Technical Consulting', icon: <FaUserTie />, description: 'Architecture and implementation guidance for product teams.' },
];

const Services = () => (
  <section className="services" id="services" aria-labelledby="services-title">
    <div className="services-container">
      <h2 className="section-title" id="services-title">
        Services <span className="highlight">I Offer</span>
      </h2>
      <div className="services-grid">
        {services.map((service) => (
          <article className="service-card" key={service.title}>
            <span className="service-icon" aria-hidden="true">{service.icon}</span>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default memo(Services);
