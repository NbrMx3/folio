import { useState, useEffect } from 'react';
import {
  FaReact,
  FaNodeJs,
  FaDatabase,
  FaCode,
  FaPaintBrush,
  FaPlug,
  FaServer,
  FaMobile,
  FaShieldAlt,
  FaCloud,
  FaCogs,
  FaRocket,
} from 'react-icons/fa';
import { getSkills } from '../../utils/api';
import { fallbackSkills } from '../../data/offlineContent';
import './Skills.css';

const iconMap = {
  FaCode: <FaCode />,
  FaNodeJs: <FaNodeJs />,
  FaReact: <FaReact />,
  FaDatabase: <FaDatabase />,
  FaPaintBrush: <FaPaintBrush />,
  FaPlug: <FaPlug />,
  FaServer: <FaServer />,
  FaMobile: <FaMobile />,
  FaShieldAlt: <FaShieldAlt />,
  FaCloud: <FaCloud />,
  FaCogs: <FaCogs />,
  FaRocket: <FaRocket />,
};

const Skills = () => {
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPublishedSkills, setHasPublishedSkills] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getSkills()
      .then((data) => {
        if (isMounted) {
          const nextSkills = Array.isArray(data) ? data : [];
          setSkills(nextSkills);
          setHasPublishedSkills(nextSkills.length > 0);
        }
      })
      .catch((err) => {
        console.error('Skills fetch error:', err.message);
        if (isMounted) {
          setSkills(fallbackSkills);
          setHasPublishedSkills(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="skills" id="skills">
      <div className="skills-container">
        <h2 className="section-title">
          Technical <span className="highlight">Expertise</span>
        </h2>
        {isLoading ? (
          <div className="skills-grid skills-grid--loading" aria-busy="true" aria-live="polite">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="skill-card skill-card--loading" key={index}>
                <div className="skeleton skeleton-block skill-skeleton-icon"></div>
                <div className="skeleton skeleton-line skeleton-line--lg skill-skeleton-title"></div>
                <div className="skeleton skeleton-line skill-skeleton-copy"></div>
                <div className="skeleton skeleton-line skill-skeleton-copy skill-skeleton-copy--short"></div>
              </div>
            ))}
          </div>
        ) : !hasPublishedSkills ? (
          <div className="skills-empty-state">
            <h3>No skills published yet.</h3>
            <p>Add a few core skills in the admin dashboard to make this section visible.</p>
          </div>
        ) : (
          <div className="skills-grid">
            {skills.map((skill) => (
              <div className="skill-card" key={skill.id}>
                <div className="skill-icon">{iconMap[skill.icon] || <FaCode />}</div>
                <h3>{skill.title}</h3>
                <p>{skill.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Skills;
