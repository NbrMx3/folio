import { memo, useEffect, useMemo, useState } from 'react';
import { getProfile, getProjectsList } from '../../utils/api';
import { fallbackProfile } from '../../data/offlineContent';
import { buildProjectCollection } from '../../data/projectShowcase';
import './About.css';

const About = () => {
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

  const projectCollection = useMemo(() => buildProjectCollection(projects), [projects]);
  const stackCount = useMemo(() => {
    const values = new Set(projectCollection.flatMap((project) => project.stack || []));
    return values.size;
  }, [projectCollection]);

  const stats = [
    { label: 'Projects Delivered', value: `${projectCollection.length}+` },
    { label: 'Technologies Applied', value: `${stackCount || 12}+` },
    { label: 'Delivery Focus', value: 'Full-Stack Development' },
    { label: 'Growth Mindset', value: 'Always Learning' },
  ];

  return (
    <section className="about" id="about" aria-labelledby="about-title">
      <div className="about-container">
        <div className="about-copy">
          <h2 className="section-title" id="about-title">
            About <span className="highlight">Me</span>
          </h2>
          <p>
            I&apos;m {profile.name || 'a software developer'} focused on building modern, scalable,
            and user-centered products with strong engineering quality.
          </p>
          <p>
            My work blends frontend product craftsmanship with backend reliability to deliver
            interfaces that are clean to use and systems that are safe to evolve.
          </p>
          <p>
            I&apos;m especially interested in full-stack product engineering, developer tooling,
            and platform-ready applications that support growth from MVP to production.
          </p>
        </div>

        <div className="about-stats" aria-label="Developer statistics">
          {stats.map((stat) => (
            <article key={stat.label} className="about-stat-card">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default memo(About);
