import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaExternalLinkAlt, FaFilter, FaGithub, FaSortAmountDown } from 'react-icons/fa';
import { getProjectsList, trackVisit } from '../../utils/api';
import { buildProjectCollection, normalizeTags } from '../../data/projectShowcase';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState('loading');
  const [filters, setFilters] = useState({
    stack: 'all',
    type: 'all',
    timeline: 'all',
    sort: 'featured',
  });

  useEffect(() => {
    let isMounted = true;

    getProjectsList()
      .then((data) => {
        if (isMounted) {
          const nextProjects = Array.isArray(data) ? data : [];
          setProjects(nextProjects);
          setDataSource(nextProjects.length > 0 ? 'api' : 'empty');
        }
      })
      .catch((err) => {
        console.error('Projects fetch error:', err.message);
        if (isMounted) {
          setProjects([]);
          setDataSource('fallback');
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

  const normalizedProjects = dataSource === 'fallback' ? buildProjectCollection([]) : buildProjectCollection(projects);
  const stackOptions = ['all', ...new Set(normalizedProjects.flatMap((project) => project.stack || []))];
  const typeOptions = ['all', ...new Set(normalizedProjects.map((project) => project.type).filter(Boolean))];
  const timelineOptions = ['all', ...new Set(normalizedProjects.map((project) => project.timeline).filter(Boolean))];

  const filteredProjects = normalizedProjects
    .filter((project) => {
      const stackMatch = filters.stack === 'all' || (project.stack || []).some((stack) => String(stack).toLowerCase() === filters.stack.toLowerCase());
      const typeMatch = filters.type === 'all' || String(project.type).toLowerCase() === filters.type.toLowerCase();
      const timelineMatch = filters.timeline === 'all' || String(project.timeline).toLowerCase() === filters.timeline.toLowerCase();
      return stackMatch && typeMatch && timelineMatch;
    })
    .sort((left, right) => {
      const leftYear = left.year || Number.parseInt(left.timeline, 10) || left.sort_order || 0;
      const rightYear = right.year || Number.parseInt(right.timeline, 10) || right.sort_order || 0;

      switch (filters.sort) {
        case 'title':
          return String(left.title).localeCompare(String(right.title));
        case 'oldest':
          return leftYear - rightYear;
        case 'newest':
          return rightYear - leftYear;
        case 'featured':
        default:
          if (Boolean(right.featured) !== Boolean(left.featured)) {
            return Number(Boolean(right.featured)) - Number(Boolean(left.featured));
          }
          if (rightYear !== leftYear) {
            return rightYear - leftYear;
          }
          return String(left.title).localeCompare(String(right.title));
      }
    });

  const handleProjectClick = (project, linkType) => {
    const ref = sessionStorage.getItem('folio_ref') || document.referrer || 'direct';
    const page = `/projects/${project.slug}?link=${linkType}`;
    void trackVisit(ref, page);
  };

  const handleProjectView = (project) => {
    const ref = sessionStorage.getItem('folio_ref') || document.referrer || 'direct';
    void trackVisit(ref, `/projects/${project.slug}/view`);
  };

  return (
    <section className="projects" id="projects">
      <div className="projects-container">
        <h2 className="section-title">
          Featured <span className="highlight">Projects</span>
        </h2>
        {isLoading ? (
          <>
            <div className="projects-toolbar projects-toolbar--loading" aria-busy="true">
              <div className="projects-toolbar-group projects-toolbar-group--loading">
                <div className="skeleton skeleton-line projects-skeleton-chip"></div>
                <div className="skeleton skeleton-line projects-skeleton-chip"></div>
                <div className="skeleton skeleton-line projects-skeleton-chip"></div>
                <div className="skeleton skeleton-line projects-skeleton-chip"></div>
              </div>
              <div className="skeleton skeleton-line projects-skeleton-counter"></div>
            </div>
            <div className="projects-grid projects-grid--loading">
              {Array.from({ length: 3 }).map((_, index) => (
                <div className="project-card project-card--loading" key={index}>
                  <div className="skeleton skeleton-line projects-skeleton-number"></div>
                  <div className="skeleton skeleton-line projects-skeleton-pill"></div>
                  <div className="skeleton skeleton-line skeleton-line--lg projects-skeleton-title"></div>
                  <div className="skeleton skeleton-line projects-skeleton-copy"></div>
                  <div className="skeleton skeleton-line projects-skeleton-copy projects-skeleton-copy--short"></div>
                  <div className="projects-skeleton-tags">
                    <span className="skeleton skeleton-block projects-skeleton-tag"></span>
                    <span className="skeleton skeleton-block projects-skeleton-tag"></span>
                    <span className="skeleton skeleton-block projects-skeleton-tag"></span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : dataSource === 'empty' ? (
          <div className="projects-empty projects-empty--wide">
            <h3>No projects published yet.</h3>
            <p>Add a project from the admin dashboard to show it here.</p>
          </div>
        ) : (
          <>
            <div className="projects-toolbar">
              <div className="projects-toolbar-group">
                <FaFilter />
                <label>
                  <span>Stack</span>
                  <select value={filters.stack} onChange={(event) => setFilters({ ...filters, stack: event.target.value })}>
                    {stackOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === 'all' ? 'All stacks' : option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Type</span>
                  <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
                    {typeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === 'all' ? 'All types' : option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Timeline</span>
                  <select value={filters.timeline} onChange={(event) => setFilters({ ...filters, timeline: event.target.value })}>
                    {timelineOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === 'all' ? 'All timelines' : option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Sort</span>
                  <select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}>
                    <option value="featured">Featured first</option>
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="title">Title A-Z</option>
                  </select>
                </label>
              </div>
              <div className="projects-toolbar-count">
                <FaSortAmountDown />
                <span>{filteredProjects.length} projects shown</span>
              </div>
            </div>

            {filteredProjects.length ? (
          <div className="projects-grid">
            {filteredProjects.map((project, index) => (
              <article className="project-card" key={project.slug || project.id}>
                <div className="project-number">0{index + 1}</div>
                <div className="project-card-top">
                  <span className="project-card-type">{project.type}</span>
                  <span className="project-card-timeline">{project.timeline}</span>
                </div>
                <h3>{project.title}</h3>
                <p>{project.summary || project.description}</p>
                <div className="project-card-meta">
                  <span>{(project.stack || []).slice(0, 2).join(' · ')}</span>
                  {project.featured && <span className="project-featured-badge">Featured</span>}
                </div>
                <div className="project-tags">
                  {normalizeTags(project.tags).map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="project-links">
                  <Link
                    to={`/projects/${project.slug}`}
                    className="project-link project-link-case-study"
                    onClick={() => {
                      handleProjectClick(project, 'case-study');
                      handleProjectView(project);
                    }}
                  >
                    Case Study <FaArrowRight />
                  </Link>
                  {project.github && project.github !== '#' && (
                    <a
                      href={project.github}
                      aria-label="GitHub repo"
                      onClick={() => handleProjectClick(project, 'github')}
                    >
                      <FaGithub /> Code
                    </a>
                  )}
                  {project.live && project.live !== '#' && (
                    <a
                      href={project.live}
                      aria-label="Live demo"
                      onClick={() => handleProjectClick(project, 'live')}
                    >
                      <FaExternalLinkAlt /> Demo
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="projects-empty">
            <h3>No projects match these filters.</h3>
            <p>Reset the filters to bring the full portfolio back into view.</p>
            <button type="button" onClick={() => setFilters({ stack: 'all', type: 'all', timeline: 'all', sort: 'featured' })}>
              Reset Filters
            </button>
          </div>
        )}
          </>
        )}
      </div>
    </section>
  );
};

export default Projects;
