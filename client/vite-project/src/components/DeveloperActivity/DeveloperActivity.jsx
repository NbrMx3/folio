import { memo, useEffect, useMemo, useState } from 'react';
import { FaCodeBranch, FaGithub, FaLayerGroup, FaRocket, FaExternalLinkAlt } from 'react-icons/fa';
import { getProfile, getProjectsList } from '../../utils/api';
import { fallbackProfile } from '../../data/offlineContent';
import { buildProjectCollection } from '../../data/projectShowcase';
import './DeveloperActivity.css';

const DeveloperActivity = () => {
  const [profile, setProfile] = useState({ ...fallbackProfile });
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    let mounted = true;

    getProfile()
      .then((data) => {
        if (mounted && data && typeof data === 'object') {
          setProfile((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {
        if (mounted) setProfile(fallbackProfile);
      });

    getProjectsList()
      .then((data) => {
        if (mounted) setProjects(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (mounted) setProjects([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const collection = useMemo(() => buildProjectCollection(projects), [projects]);
  const recent = useMemo(() => collection.slice(0, 4), [collection]);
  const techCount = useMemo(() => new Set(collection.flatMap((item) => item.stack || [])).size, [collection]);

  const indicators = [
    { label: 'Repositories', value: String(collection.length || 12), icon: <FaCodeBranch /> },
    { label: 'Featured Projects', value: String(collection.filter((item) => item.featured).length || 3), icon: <FaRocket /> },
    { label: 'Technologies', value: String(techCount || 10), icon: <FaLayerGroup /> },
  ];

  const contributionCells = Array.from({ length: 56 }).map((_, index) => {
    const seed = (index * 17 + collection.length * 7) % 100;
    const level = seed > 74 ? 3 : seed > 52 ? 2 : seed > 28 ? 1 : 0;
    return { id: `cell-${index}`, level };
  });

  return (
    <section className="activity" id="activity" aria-labelledby="activity-title">
      <div className="activity-container">
        <div className="activity-head">
          <h2 className="section-title" id="activity-title">
            GitHub <span className="highlight">Activity</span>
          </h2>
          <a
            className="activity-github-link"
            href={profile.github || 'https://github.com'}
            target="_blank"
            rel="noreferrer"
          >
            <FaGithub />
            <span>View GitHub Profile</span>
            <FaExternalLinkAlt />
          </a>
        </div>

        <div className="activity-grid">
          <div className="activity-dashboard">
            <div className="activity-indicators">
              {indicators.map((item) => (
                <article className="activity-indicator" key={item.label}>
                  <span className="activity-indicator-icon" aria-hidden="true">{item.icon}</span>
                  <div>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="activity-heatmap" aria-label="Contribution style visualization">
              {contributionCells.map((cell) => (
                <span key={cell.id} className={`activity-cell level-${cell.level}`} aria-hidden="true"></span>
              ))}
            </div>
          </div>

          <aside className="activity-recent">
            <h3>Recent Projects</h3>
            <ul>
              {recent.map((project) => (
                <li key={project.slug}>
                  <strong>{project.title}</strong>
                  <span>{project.stack?.slice(0, 3).join(' · ')}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default memo(DeveloperActivity);
