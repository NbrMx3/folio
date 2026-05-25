const projectShowcase = [
  {
    slug: 'signal-hub',
    title: 'Signal Hub',
    description: 'An operations dashboard that pulls live status, alerts, and activity into one calm command view.',
    summary: 'A focused dashboard experience designed to surface high-priority data without visual noise.',
    stack: ['React', 'Node.js', 'PostgreSQL'],
    type: 'Dashboard',
    timeline: '2026',
    year: 2026,
    tags: ['React', 'Analytics', 'Dashboard'],
    featured: true,
    problem: 'Operations data was spread across different tools, making it hard to spot issues quickly.',
    process: [
      'Mapped the alert flow and condensed the most important metrics into a single hierarchy.',
      'Built reusable cards and status panels with a consistent glow-heavy visual language.',
      'Kept the layout responsive so the same dashboard works on desktop and tablet screens.',
    ],
    results: [
      'A cleaner route to the right metric in fewer clicks.',
      'A stronger executive overview with more visual breathing room.',
      'Reusable components that can scale into deeper admin surfaces.',
    ],
    screenshots: [
      {
        title: 'Command Surface',
        caption: 'Live activity, alerts, and navigation condensed into one calm control panel.',
      },
      {
        title: 'Status Breakdown',
        caption: 'Operational categories separated into quick-scanning metric cards.',
      },
      {
        title: 'Responsive Detail',
        caption: 'A tablet-friendly layout that preserves hierarchy and spacing.',
      },
    ],
  },
  {
    slug: 'launchpad-commerce',
    title: 'Launchpad Commerce',
    description: 'A product storefront with tighter paths from discovery to checkout and stronger visual emphasis on featured items.',
    summary: 'A commerce interface that balances speed, clarity, and a conversion-oriented layout.',
    stack: ['React', 'TypeScript', 'REST API'],
    type: 'Commerce',
    timeline: '2025',
    year: 2025,
    tags: ['E-Commerce', 'React', 'Checkout'],
    featured: true,
    problem: 'The buying flow had too many decision points and not enough focus on top-selling products.',
    process: [
      'Reworked the product hierarchy so featured items show up earlier in the journey.',
      'Added stronger CTA placement and tighter spacing around pricing and trust cues.',
      'Used component-level patterns that make future promotions easy to drop in.',
    ],
    results: [
      'Less friction between browsing and intent.',
      'A more deliberate visual path for featured products.',
      'A layout that can support campaigns without heavy redesign.',
    ],
    screenshots: [
      {
        title: 'Featured Shelf',
        caption: 'A visual-first product view that keeps featured cards at the top.',
      },
      {
        title: 'Checkout Focus',
        caption: 'Streamlined purchase steps with fewer interruptions.',
      },
      {
        title: 'Promo Blocks',
        caption: 'Reusable campaign areas for discounts, bundles, and launches.',
      },
    ],
  },
  {
    slug: 'secure-profile-suite',
    title: 'Secure Profile Suite',
    description: 'A profile and content management interface built around safe uploads, clean settings, and easy admin control.',
    summary: 'A secure management surface for uploads, settings, and content maintenance.',
    stack: ['React', 'Express', 'Security'],
    type: 'Admin Tooling',
    timeline: '2024',
    year: 2024,
    tags: ['Security', 'Admin', 'Upload'],
    featured: false,
    problem: 'Content updates needed to feel safer and more controlled for non-technical operators.',
    process: [
      'Separated upload, settings, and access workflows into distinct panels.',
      'Applied clear status states so users always know what changed and what succeeded.',
      'Kept the interaction model simple enough for repeated admin use.',
    ],
    results: [
      'Safer handling of profile and media updates.',
      'A clearer admin experience with less ambiguity.',
      'A foundation for future role-based controls.',
    ],
    screenshots: [
      {
        title: 'Upload Flow',
        caption: 'A focused upload surface with clear validation and confirmation states.',
      },
      {
        title: 'Settings Panel',
        caption: 'Compact controls grouped by task instead of by technical system.',
      },
      {
        title: 'Access Check',
        caption: 'A secure layout that makes admin boundaries obvious.',
      },
    ],
  },
];

const slugifyProject = (value = '') => value
  .toString()
  .trim()
  .toLowerCase()
  .replace(/['"]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean);
  if (typeof tags === 'string') {
    return tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
};

const createFallbackDetails = (project, slug, index) => {
  const title = project.title || `Project ${index + 1}`;
  const tagList = normalizeTags(project.tags);
  const stack = project.stack || tagList.slice(0, 4);
  const type = project.type || (tagList.some((tag) => /admin|dashboard|analytics/i.test(tag)) ? 'Dashboard' : 'Web App');
  const timeline = project.timeline || project.year || `Phase ${index + 1}`;

  return {
    ...project,
    slug,
    title,
    description: project.description || `A practical ${type.toLowerCase()} designed around ${title.toLowerCase()}.`,
    summary: project.summary || project.description || `A practical ${type.toLowerCase()} built with a strong focus on clarity and responsiveness.`,
    stack: stack.length ? stack : ['React', 'Node.js'],
    type,
    timeline: String(timeline),
    year: Number.parseInt(project.year || timeline, 10) || undefined,
    tags: tagList.length ? tagList : stack,
    featured: Boolean(project.featured),
    problem: project.problem || `This project needed a clearer way to present ${title.toLowerCase()} and keep the experience easy to scan.`,
    process: Array.isArray(project.process) && project.process.length
      ? project.process
      : [
          'Defined the primary user path and trimmed the extra visual noise.',
          'Built reusable UI pieces so the feature can grow without duplication.',
          'Shaped the layout for desktop and mobile use from the beginning.',
        ],
    results: Array.isArray(project.results) && project.results.length
      ? project.results
      : [
          'A more direct path to the core action.',
          'A cleaner experience that is easier to extend.',
          'A stronger visual identity for the project showcase.',
        ],
    screenshots: Array.isArray(project.screenshots) && project.screenshots.length
      ? project.screenshots
      : [
          {
            title: 'Primary View',
            caption: `A focused overview of ${title.toLowerCase()} at a glance.`,
          },
          {
            title: 'Interaction State',
            caption: 'The key task flow highlighted with the important controls in view.',
          },
          {
            title: 'Responsive Frame',
            caption: 'The same layout adapted for smaller screens without losing hierarchy.',
          },
        ],
  };
};

export const buildProjectCollection = (projects = []) => {
  if (!Array.isArray(projects) || projects.length === 0) {
    return projectShowcase.map((project) => ({
      ...project,
      tags: project.tags || project.stack,
    }));
  }

  return projects
    .map((project, index) => {
      const slug = project.slug || slugifyProject(project.title || `project-${index + 1}`);
      const normalizedTitle = String(project.title || '').trim().toLowerCase();
      const matchingStory = projectShowcase.find((story) => story.slug === slug || String(story.title).trim().toLowerCase() === normalizedTitle);

      if (matchingStory) {
        return {
          ...matchingStory,
          ...project,
          slug: matchingStory.slug,
          title: project.title || matchingStory.title,
          description: project.description || matchingStory.description,
          summary: project.summary || matchingStory.summary,
          stack: Array.isArray(project.stack) && project.stack.length ? project.stack : matchingStory.stack,
          type: project.type || matchingStory.type,
          timeline: project.timeline || matchingStory.timeline,
          year: Number.parseInt(project.year || matchingStory.year, 10) || matchingStory.year,
          tags: normalizeTags(project.tags).length ? normalizeTags(project.tags) : matchingStory.tags,
          featured: project.featured ?? matchingStory.featured,
          problem: project.problem || matchingStory.problem,
          process: Array.isArray(project.process) && project.process.length ? project.process : matchingStory.process,
          results: Array.isArray(project.results) && project.results.length ? project.results : matchingStory.results,
          screenshots: Array.isArray(project.screenshots) && project.screenshots.length ? project.screenshots : matchingStory.screenshots,
        };
      }

      return createFallbackDetails(project, slug, index);
    })
    .sort((left, right) => {
      if (Boolean(right.featured) !== Boolean(left.featured)) {
        return Number(Boolean(right.featured)) - Number(Boolean(left.featured));
      }

      const rightYear = right.year || Number.parseInt(right.timeline, 10) || 0;
      const leftYear = left.year || Number.parseInt(left.timeline, 10) || 0;

      if (rightYear !== leftYear) {
        return rightYear - leftYear;
      }

      return String(left.title).localeCompare(String(right.title));
    });
};

export const findProjectBySlug = (projects = [], slug = '') => {
  const collection = buildProjectCollection(projects);
  return collection.find((project) => project.slug === slug || String(project.id) === String(slug))
    || projectShowcase.find((project) => project.slug === slug)
    || null;
};

export { normalizeTags, slugifyProject };
