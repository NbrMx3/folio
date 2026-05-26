const projectShowcase = [
  {
    slug: 'signal-hub',
    title: 'Signal Hub',
    description: 'An operations dashboard that pulls live status, alerts, and activity into one calm command view.',
    summary: 'A focused dashboard experience designed to surface high-priority data without visual noise.',
    stack: ['React', 'Node.js', 'PostgreSQL', 'WebSockets', 'Charting'],
    type: 'Dashboard',
    timeline: '2026',
    year: 2026,
    tags: ['React', 'Analytics', 'Dashboard'],
    featured: true,
    problem: 'Operations data was spread across different tools and alert channels, making it hard to spot issues before they escalated.',
    process: [
      'Mapped the alert flow and reduced the dashboard to one primary hierarchy for active incidents, live metrics, and trend movement.',
      'Built reusable cards, status panels, and chart wrappers so the dashboard could grow without breaking the layout system.',
      'Tested the interface on wide and medium breakpoints to keep scan speed high on desktop and tablet screens.',
    ],
    results: [
      'Operators can jump from alert to context without hunting across multiple tools.',
      'Leadership gets a calmer overview with more breathing room around the highest priority signals.',
      'The component structure is reusable enough to support deeper admin surfaces and future drill-downs.',
    ],
    screenshots: [
      {
        title: 'Command Surface',
        caption: 'Live activity, alert severity, and quick navigation condensed into one calm control panel.',
        highlights: ['Incident queue', 'Live chart', 'Priority chips'],
      },
      {
        title: 'Status Breakdown',
        caption: 'Operational categories separated into quick-scanning metric cards and trend summaries.',
        highlights: ['Health score', 'Trend delta', 'Service state'],
      },
      {
        title: 'Responsive Detail',
        caption: 'A tablet-friendly layout that preserves hierarchy, spacing, and action targets.',
        highlights: ['Adaptive grid', 'Readable labels', 'Touch-safe buttons'],
      },
    ],
  },
  {
    slug: 'launchpad-commerce',
    title: 'Launchpad Commerce',
    description: 'A product storefront with tighter paths from discovery to checkout and stronger visual emphasis on featured items.',
    summary: 'A commerce interface that balances speed, clarity, and a conversion-oriented layout.',
    stack: ['React', 'TypeScript', 'REST API', 'Stripe', 'Accessibility'],
    type: 'Commerce',
    timeline: '2025',
    year: 2025,
    tags: ['E-Commerce', 'React', 'Checkout'],
    featured: true,
    problem: 'The buying flow had too many decision points and not enough focus on top-selling products or trust signals.',
    process: [
      'Reworked the product hierarchy so featured items appear earlier in the journey and stay visible while browsing.',
      'Added stronger CTA placement, pricing emphasis, and trust cues around shipping and returns.',
      'Used component-level patterns that make future promotions, seasonal offers, and landing-page variants easier to ship.',
    ],
    results: [
      'Less friction between browsing and purchase intent.',
      'A more deliberate visual path for featured products and campaign offers.',
      'A layout that can support promotions without a heavy redesign each time.',
    ],
    screenshots: [
      {
        title: 'Featured Shelf',
        caption: 'A visual-first product view that keeps featured cards and value props at the top.',
        highlights: ['Hero product', 'Trust badges', 'Quick add'],
      },
      {
        title: 'Checkout Focus',
        caption: 'Streamlined purchase steps with fewer interruptions and clearer confirmation states.',
        highlights: ['Shipping step', 'Payment step', 'Order summary'],
      },
      {
        title: 'Promo Blocks',
        caption: 'Reusable campaign areas for discounts, bundles, and launches without breaking layout rhythm.',
        highlights: ['Discount tile', 'Bundle callout', 'Launch banner'],
      },
    ],
  },
  {
    slug: 'secure-profile-suite',
    title: 'Secure Profile Suite',
    description: 'A profile and content management interface built around safe uploads, clean settings, and easy admin control.',
    summary: 'A secure management surface for uploads, settings, and content maintenance.',
    stack: ['React', 'Express', 'Security', 'File Uploads', 'Role-aware UI'],
    type: 'Admin Tooling',
    timeline: '2024',
    year: 2024,
    tags: ['Security', 'Admin', 'Upload'],
    featured: false,
    problem: 'Content updates needed to feel safer, more controlled, and less error-prone for non-technical operators.',
    process: [
      'Separated upload, settings, and access workflows into distinct panels so operators always know where they are.',
      'Applied clear status states and inline feedback so users always know what changed, what saved, and what needs attention.',
      'Kept the interaction model simple enough for repeated admin use while still supporting future permissions work.',
    ],
    results: [
      'Safer handling of profile and media updates with fewer accidental edits.',
      'A clearer admin experience with less ambiguity during routine maintenance.',
      'A foundation for future role-based controls and more granular permissions.',
    ],
    screenshots: [
      {
        title: 'Upload Flow',
        caption: 'A focused upload surface with clear validation, preview, and confirmation states.',
        highlights: ['File picker', 'Preview state', 'Success toast'],
      },
      {
        title: 'Settings Panel',
        caption: 'Compact controls grouped by task instead of by technical system.',
        highlights: ['Profile fields', 'Visibility toggle', 'Save actions'],
      },
      {
        title: 'Access Check',
        caption: 'A secure layout that makes admin boundaries and permission states obvious.',
        highlights: ['Role badge', 'Protected action', 'Locked controls'],
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
