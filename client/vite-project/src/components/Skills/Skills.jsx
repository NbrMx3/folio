import { memo, useState, useEffect, useMemo } from 'react';
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

  const skillCategories = useMemo(() => {
    const fallback = [
      { title: 'Frontend', items: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS'] },
      { title: 'Backend', items: ['Node.js', 'Express.js', 'REST APIs'] },
      { title: 'Database', items: ['PostgreSQL', 'Prisma', 'MongoDB'] },
      { title: 'DevOps', items: ['Git', 'GitHub', 'Vercel', 'Render'] },
    ];

    if (!skills.length) return fallback;
    const dynamicItems = skills.map((item) => item?.title).filter(Boolean);
    return [
      { title: 'Core Stack', items: dynamicItems.slice(0, 8) },
      ...fallback.slice(1),
    ];
  }, [skills]);

  return (
    <section className="skills" id="skills">
      <div className="skills-container">
        <h2 className="section-title">
          Technology <span className="highlight">Stack</span>
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
          <>
            <div className="skills-categories">
              {skillCategories.map((category) => (
                <article className="skill-category-card" key={category.title}>
                  <h3>{category.title}</h3>
                  <div className="skill-badges">
                    {category.items.map((item) => (
                      <span key={item} className="skill-badge">{item}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <div className="skills-grid">
              {skills.map((skill) => (
                <div className="skill-card" key={skill.id}>
                  <div className="skill-icon">{iconMap[skill.icon] || <FaCode />}</div>
                  <h3>{skill.title}</h3>
                  <p>{skill.description}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default memo(Skills);
