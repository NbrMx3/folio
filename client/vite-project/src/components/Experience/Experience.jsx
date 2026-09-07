import { memo } from 'react';
import './Experience.css';

const experience = [
  {
    company: 'Independent Product Work',
    role: 'Full-Stack Developer',
    dates: '2024 - Present',
    description: 'Designing and shipping production-ready portfolio, dashboard, and admin products with scalable frontend systems and robust API integrations.',
    tech: ['React', 'Node.js', 'PostgreSQL', 'REST API'],
  },
  {
    company: 'AfyaSync',
    role: 'Software Engineer (Project-Based)',
    dates: '2025',
    description: 'Built patient-facing and clinician-facing product surfaces with clear UX hierarchy, secure data handling, and responsive interface behavior.',
    tech: ['React', 'Express', 'Authentication', 'Cloud Deployment'],
  },
  {
    company: 'SaccoFraudGuard',
    role: 'Frontend & Platform Engineer',
    dates: '2026',
    description: 'Implemented a risk-visibility dashboard with componentized analytics cards, actionable alerts, and clear workflows for financial operations.',
    tech: ['React', 'Data Visualization', 'Security', 'Node.js'],
  },
];

const Experience = () => (
  <section className="experience" id="experience" aria-labelledby="experience-title">
    <div className="experience-container">
      <h2 className="section-title" id="experience-title">
        Experience <span className="highlight">Timeline</span>
      </h2>
      <div className="experience-timeline">
        {experience.map((item) => (
          <article className="experience-item" key={`${item.company}-${item.role}`}>
            <span className="experience-dot" aria-hidden="true"></span>
            <div className="experience-card">
              <header>
                <p className="experience-company">{item.company}</p>
                <h3>{item.role}</h3>
                <p className="experience-dates">{item.dates}</p>
              </header>
              <p>{item.description}</p>
              <div className="experience-tech">
                {item.tech.map((tech) => (
                  <span key={tech}>{tech}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default memo(Experience);
