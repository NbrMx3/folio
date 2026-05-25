import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaExternalLinkAlt, FaGithub } from 'react-icons/fa';
import { getProjectsList, trackVisit } from '../../utils/api';
import { findProjectBySlug } from '../../data/projectShowcase';
import './ProjectCaseStudy.css';

const ProjectCaseStudy = () => {
  const { projectSlug } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    getProjectsList()
      .then((data) => {
        if (!isMounted) return;
        const match = findProjectBySlug(Array.isArray(data) ? data : [], projectSlug);
        if (match) {
          setProject(match);
        } else {
          setError('Project case study not found.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Project case study load error:', err.message);
        const fallback = findProjectBySlug([], projectSlug);
        if (fallback) {
          setProject(fallback);
        } else {
          setError('Could not load project details right now.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [projectSlug]);

  useEffect(() => {
    if (!project) return;
    const ref = sessionStorage.getItem('folio_ref') || document.referrer || 'direct';
    void trackVisit(ref, window.location.pathname);
  }, [project]);

  if (error) {
    return (
      <main className="case-study case-study-error">
        <div className="case-study-shell">
          <Link className="case-study-back" to="/#projects">
            <FaArrowLeft /> Back to projects
          </Link>
          <div className="case-study-panel">
            <h1>{error}</h1>
            <p>Try another project from the portfolio grid.</p>
          </div>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="case-study case-study-loading">
        <div className="case-study-shell">
          <div className="case-study-panel">
            <p>Loading project details...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="case-study">
      <div className="case-study-shell">
        <Link className="case-study-back" to="/#projects">
          <FaArrowLeft /> Back to projects
        </Link>

        <section className="case-study-hero">
          <div className="case-study-copy">
            <span className="case-study-kicker">Case Study</span>
            <h1>{project.title}</h1>
            <p>{project.summary || project.description}</p>
            <div className="case-study-meta">
              <span>{project.type}</span>
              <span>{project.timeline}</span>
              <span>{(project.stack || []).slice(0, 4).join(' · ')}</span>
            </div>
            <div className="case-study-links">
              {project.live && project.live !== '#' && (
                <a href={project.live} target="_blank" rel="noreferrer">
                  <FaExternalLinkAlt /> Live Demo
                </a>
              )}
              {project.github && project.github !== '#' && (
                <a href={project.github} target="_blank" rel="noreferrer">
                  <FaGithub /> Source
                </a>
              )}
            </div>
          </div>

          <div className="case-study-stats">
            <article>
              <span>Focus</span>
              <strong>{project.type}</strong>
            </article>
            <article>
              <span>Timeline</span>
              <strong>{project.timeline}</strong>
            </article>
            <article>
              <span>Stack</span>
              <strong>{(project.stack || []).slice(0, 3).join(' + ')}</strong>
            </article>
          </div>
        </section>

        <section className="case-study-grid">
          <article className="case-study-panel">
            <h2>Problem</h2>
            <p>{project.problem}</p>
          </article>

          <article className="case-study-panel">
            <h2>Process</h2>
            <ol className="case-study-list">
              {(project.process || []).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
        </section>

        <section className="case-study-panel">
          <div className="case-study-panel-head">
            <h2>Screenshots</h2>
            <p>Key surfaces from the project flow.</p>
          </div>
          <div className="case-study-shots">
            {(project.screenshots || []).map((shot) => (
              <article key={shot.title} className="case-study-shot">
                <div className="case-study-shot-frame">
                  <span>{shot.title}</span>
                </div>
                <h3>{shot.title}</h3>
                <p>{shot.caption}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="case-study-panel">
          <div className="case-study-panel-head">
            <h2>Results</h2>
            <p>What changed after the build.</p>
          </div>
          <div className="case-study-results">
            {(project.results || []).map((result) => (
              <article key={result}>
                <strong>{result}</strong>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProjectCaseStudy;
