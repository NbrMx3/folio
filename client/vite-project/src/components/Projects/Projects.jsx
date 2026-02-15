import { useState, useEffect } from 'react';
import { FaExternalLinkAlt, FaGithub } from 'react-icons/fa';
import { getProjectsList } from '../../utils/api';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getProjectsList();
      setProjects(data);
    } catch {
      // ignore
    }
  };

  return (
    <section className="projects" id="projects">
      <div className="projects-container">
        <h2 className="section-title">
          Featured <span className="highlight">Projects</span>
        </h2>
        <div className="projects-grid">
          {projects.map((project, index) => (
            <div className="project-card" key={project.id}>
              <div className="project-number">0{index + 1}</div>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <div className="project-tags">
                {(Array.isArray(project.tags) ? project.tags : []).map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
              <div className="project-links">
                <a href={project.github} aria-label="GitHub repo">
                  <FaGithub /> Code
                </a>
                <a href={project.live} aria-label="Live demo">
                  <FaExternalLinkAlt /> Demo
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
