import { useState, useEffect } from 'react';
import { FaExternalLinkAlt, FaGithub } from 'react-icons/fa';
import { getProjectsList, trackVisit } from '../../utils/api';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    getProjectsList()
      .then((data) => {
        if (isMounted) {
          setProjects(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        console.error('Projects fetch error:', err.message);
        if (isMounted) {
          setError('Could not load projects. Backend may be unavailable.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleProjectClick = (project, linkType) => {
    const ref = sessionStorage.getItem('folio_ref') || document.referrer || 'direct';
    const page = `/projects/${project.id}?link=${linkType}`;
    void trackVisit(ref, page);
  };

  return (
    <section className="projects" id="projects">
      <div className="projects-container">
        <h2 className="section-title">
          Featured <span className="highlight">Projects</span>
        </h2>
        {error && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>{error}</p>}
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
                <a
                  href={project.github}
                  aria-label="GitHub repo"
                  onClick={() => handleProjectClick(project, 'github')}
                >
                  <FaGithub /> Code
                </a>
                <a
                  href={project.live}
                  aria-label="Live demo"
                  onClick={() => handleProjectClick(project, 'live')}
                >
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
