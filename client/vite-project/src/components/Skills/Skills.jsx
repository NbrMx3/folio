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

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const data = await getSkills();
      setSkills(data);
    } catch {
      // ignore
    }
  };

  return (
    <section className="skills" id="skills">
      <div className="skills-container">
        <h2 className="section-title">
          Technical <span className="highlight">Expertise</span>
        </h2>
        <div className="skills-grid">
          {skills.map((skill) => (
            <div className="skill-card" key={skill.id}>
              <div className="skill-icon">{iconMap[skill.icon] || <FaCode />}</div>
              <h3>{skill.title}</h3>
              <p>{skill.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
