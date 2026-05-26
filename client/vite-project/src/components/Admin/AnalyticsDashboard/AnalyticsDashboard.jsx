import { useState, useEffect } from 'react';
import {
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaReddit,
  FaGoogle,
  FaGlobe,
  FaDesktop,
  FaMobile,
  FaTablet,
  FaFilter,
  FaTrash,
  FaExclamationTriangle,
  FaCheckCircle,
} from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si';
import {
  getChartData,
  getVisitors,
  getPlatforms,
  getTraccarOverview,
  getDownloadSummary,
  getDownloadLogs,
  clearDownloadAnalytics,
  getProfile,
  getSkills,
  getProjectsList,
  getGallery,
  clearAnalytics,
} from '../../../utils/api';
import './AnalyticsDashboard.css';

const platformIcons = {
  LinkedIn: <FaLinkedin />,
  GitHub: <FaGithub />,
  'Twitter/X': <FaTwitter />,
  Facebook: <FaFacebook />,
  Instagram: <FaInstagram />,
  YouTube: <FaYoutube />,
  TikTok: <SiTiktok />,
  Reddit: <FaReddit />,
  Google: <FaGoogle />,
  Direct: <FaGlobe />,
  Other: <FaGlobe />,
  Bing: <FaGlobe />,
};

const platformColors = {
  LinkedIn: '#0a66c2',
  GitHub: '#6e40c9',
  'Twitter/X': '#1da1f2',
  Facebook: '#1877f2',
  Instagram: '#e4405f',
  YouTube: '#ff0000',
  TikTok: '#00f2ea',
  Reddit: '#ff4500',
  Google: '#4285f4',
  Direct: '#00ff41',
  Bing: '#008373',
  Other: '#888',
};

const platformOrder = [
  'LinkedIn',
  'GitHub',
  'Twitter/X',
  'Facebook',
  'Instagram',
  'TikTok',
  'YouTube',
  'Reddit',
  'Google',
  'Bing',
  'Direct',
  'Other',
];

const socialAccountIcons = [
  { key: 'github', label: 'GitHub', icon: <FaGithub /> },
  { key: 'linkedin', label: 'LinkedIn', icon: <FaLinkedin /> },
  { key: 'twitter', label: 'X', icon: <FaTwitter /> },
  { key: 'facebook', label: 'Facebook', icon: <FaFacebook /> },
  { key: 'instagram', label: 'Instagram', icon: <FaInstagram /> },
  { key: 'tiktok', label: 'TikTok', icon: <SiTiktok /> },
];

const profileFields = [
  { key: 'picture', label: 'Profile picture' },
  { key: 'name', label: 'Display name' },
  { key: 'title', label: 'Job title' },
  { key: 'bio', label: 'Bio' },
  { key: 'resume', label: 'Resume' },
  { key: 'email', label: 'Contact email' },
  { key: 'github', label: 'GitHub' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'twitter', label: 'X' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
];

const isMissingValue = (value) => {
  if (value == null) return true;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return true;
    return trimmed === '/resume.pdf';
  }
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

const resolveAssetUrl = (value) => {
  if (!value) return '';
  if (value.startsWith('http')) return value;
  return value;
};

const isPictureItem = (item) => {
  const type = String(item?.type || '').toLowerCase();
  if (type === 'photo' || type === 'image') return true;
  const url = String(item?.url || '').toLowerCase();
  return /\.(png|jpe?g|webp|gif|svg)(\?|$)/.test(url);
};

const AnalyticsDashboard = ({ overview, onAnalyticsCleared, onQuickEdit }) => {
  const [chartData, setChartData] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [platforms, setPlatforms] = useState({});
  const [traccarOverview, setTraccarOverview] = useState(null);
  const [traccarLoading, setTraccarLoading] = useState(true);
  const [downloadSummary, setDownloadSummary] = useState(null);
  const [downloadLogs, setDownloadLogs] = useState([]);
  const [downloadLoading, setDownloadLoading] = useState(true);
  const [isClearingDownloads, setIsClearingDownloads] = useState(false);
  const [contentHealth, setContentHealth] = useState(null);
  const [contentHealthLoading, setContentHealthLoading] = useState(true);
  const [visitorPage, setVisitorPage] = useState(1);
  const [visitorPages, setVisitorPages] = useState(1);
  const [filterSource, setFilterSource] = useState('all');
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [chartResult, platformResult, traccarResult] = await Promise.allSettled([
          getChartData(),
          getPlatforms(),
          getTraccarOverview(),
        ]);
        if (cancelled) return;
        setChartData(chartResult.status === 'fulfilled' && Array.isArray(chartResult.value) ? chartResult.value : []);
        setPlatforms(platformResult.status === 'fulfilled' && platformResult.value ? platformResult.value : {});
        setTraccarOverview(traccarResult.status === 'fulfilled' ? traccarResult.value : null);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setTraccarLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDownloads = async () => {
      try {
        const [summaryResult, logsResult] = await Promise.allSettled([
          getDownloadSummary(),
          getDownloadLogs(1, 10),
        ]);

        if (cancelled) return;

        setDownloadSummary(summaryResult.status === 'fulfilled' ? summaryResult.value : null);
        setDownloadLogs(
          logsResult.status === 'fulfilled' && Array.isArray(logsResult.value?.logs)
            ? logsResult.value.logs
            : []
        );
      } finally {
        if (!cancelled) {
          setDownloadLoading(false);
        }
      }
    };

    loadDownloads();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadContentHealth = async () => {
      try {
        const [profileResult, skillsResult, projectsResult, galleryResult] = await Promise.allSettled([
          getProfile(),
          getSkills(),
          getProjectsList(),
          getGallery(),
        ]);

        if (cancelled) return;

        const profile = profileResult.status === 'fulfilled' && profileResult.value ? profileResult.value : null;
        const skills = skillsResult.status === 'fulfilled' && Array.isArray(skillsResult.value) ? skillsResult.value : [];
        const projects = projectsResult.status === 'fulfilled' && Array.isArray(projectsResult.value) ? projectsResult.value : [];
        const gallery = galleryResult.status === 'fulfilled' && Array.isArray(galleryResult.value) ? galleryResult.value : [];
        const galleryPhotos = gallery.filter(isPictureItem);

        const missingProfileFields = profile
          ? profileFields.filter(({ key }) => isMissingValue(profile[key])).map(({ label }) => label)
          : profileFields.map(({ label }) => label);

        const sections = [
          {
            name: 'Skills',
            status: skills.length > 0 ? 'ready' : 'missing',
            detail: skills.length > 0 ? `${skills.length} skill${skills.length === 1 ? '' : 's'} published` : 'No skills have been added yet.',
          },
          {
            name: 'Projects',
            status: projects.length > 0 ? 'ready' : 'missing',
            detail: projects.length > 0 ? `${projects.length} project${projects.length === 1 ? '' : 's'} published` : 'No projects have been added yet.',
          },
          {
            name: 'Gallery',
            status: galleryPhotos.length > 0 ? 'ready' : 'missing',
            detail: galleryPhotos.length > 0 ? `${galleryPhotos.length} photo${galleryPhotos.length === 1 ? '' : 's'} published` : 'No gallery photos have been uploaded yet.',
          },
        ];

        const missingSections = sections.filter((section) => section.status === 'missing');

        setContentHealth({
          profileStatus: profile ? (missingProfileFields.length ? 'partial' : 'complete') : 'missing',
          missingProfileFields,
          sections,
          missingSections,
          profilePicture: profile?.picture ? resolveAssetUrl(profile.picture) : '',
          galleryPhotos: galleryPhotos.slice(0, 6).map((item) => ({
            id: item.id,
            title: item.title || 'Untitled photo',
            url: resolveAssetUrl(item.url),
          })),
        });
      } finally {
        if (!cancelled) {
          setContentHealthLoading(false);
        }
      }
    };

    loadContentHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadVisitors = async () => {
      try {
        const data = await getVisitors(visitorPage, filterSource);
        if (cancelled) return;
        setVisitors(data.visitors);
        setVisitorPages(data.pages);
      } catch {
        // ignore
      }

        {/* Content Health */}
        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <h3>Content Health</h3>
            <p className="section-hint">
              Missing profile fields and empty content sections are tracked here so you can fill gaps quickly.
            </p>
            {contentHealthLoading ? (
              <p className="no-data">Checking content completeness...</p>
            ) : contentHealth ? (
              <div className="content-health-grid">
                <article className={`content-health-card ${contentHealth.profileStatus}`}>
                  <div className="content-health-header">
                    <span className="content-health-title">Profile</span>
                    <span className="content-health-badge">{contentHealth.profileStatus}</span>
                  </div>
                  <div className="asset-preview-row">
                    <div className="asset-preview-frame profile-frame">
                      {contentHealth.profilePicture ? (
                          <img src={contentHealth.profilePicture} alt="Profile image preview" loading="lazy" decoding="async" />
                      ) : (
                        <div className="asset-preview-empty">
                          <FaExclamationTriangle />
                          <span>No profile image uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {contentHealth.missingProfileFields.length > 0 ? (
                    <>
                      <p className="content-health-message">
                        {contentHealth.missingProfileFields.length} profile field{contentHealth.missingProfileFields.length === 1 ? '' : 's'} are missing.
                      </p>
                      <div className="missing-chips">
                        {contentHealth.missingProfileFields.map((field) => (
                          <span className="missing-chip" key={field}>
                            <FaExclamationTriangle />
                            {field}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="content-health-message success">
                      <FaCheckCircle /> Profile data is complete.
                    </p>
                  )}
                  <button type="button" className="content-health-card-action" onClick={() => onQuickEdit?.('profile')}>
                    Quick edit profile
                  </button>
                </article>

                {contentHealth.sections.map((section) => (
                  <article key={section.name} className={`content-health-card ${section.status}`}>
                    <div className="content-health-header">
                      <span className="content-health-title">{section.name}</span>
                      <span className="content-health-badge">{section.status}</span>
                    </div>
                    {section.name === 'Gallery' && (
                      <div className="asset-preview-grid">
                        {contentHealth.galleryPhotos.length > 0 ? (
                          contentHealth.galleryPhotos.map((photo) => (
                            <div className="asset-preview-frame gallery-frame" key={photo.id || photo.url} title={photo.title}>
                              <img src={photo.url} alt={photo.title ? `${photo.title} preview` : 'Gallery photo preview'} loading="lazy" decoding="async" />
                            </div>
                          ))
                        ) : (
                          <div className="asset-preview-empty asset-preview-empty-wide">
                            <FaExclamationTriangle />
                            <span>No gallery photos uploaded</span>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="content-health-message">{section.detail}</p>
                    <button type="button" className="content-health-card-action" onClick={() => onQuickEdit?.(section.name.toLowerCase())}>
                      Quick edit {section.name.toLowerCase()}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="no-data">Content health data could not be loaded.</p>
            )}
          </div>
        )}
    };
    loadVisitors();
    return () => { cancelled = true; };
  }, [visitorPage, filterSource]);

  const maxViews = Math.max(...chartData.map((d) => d.views), 1);

  const traccarSummary = traccarOverview?.summary || {
    deviceCount: 0,
    onlineCount: 0,
    movingCount: 0,
    stoppedCount: 0,
  };

  const handleClearAnalytics = async () => {
    const shouldClear = window.confirm(
      'Are you sure you want to clear all analytics data? This action cannot be undone.'
    );

    if (!shouldClear || isClearing) return;

    try {
      setIsClearing(true);
      await clearAnalytics();
      setChartData([]);
      setPlatforms({});
      setVisitors([]);
      setVisitorPage(1);
      setVisitorPages(1);
      if (onAnalyticsCleared) {
        await onAnalyticsCleared();
      }
    } catch {
      window.alert('Failed to clear analytics. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearDownloadAnalytics = async () => {
    const shouldClear = window.confirm(
      'Are you sure you want to clear all download analytics data? This action cannot be undone.'
    );

    if (!shouldClear || isClearingDownloads) return;

    try {
      setIsClearingDownloads(true);
      await clearDownloadAnalytics();
      setDownloadSummary({
        totalDownloads: 0,
        todayDownloads: 0,
        monthDownloads: 0,
        yearDownloads: 0,
      });
      setDownloadLogs([]);
    } catch {
      window.alert('Failed to clear download analytics. Please try again.');
    } finally {
      setIsClearingDownloads(false);
    }
  };

  const describeActivity = (visitor) => {
    const pageValue = String(visitor?.page || '');
    if (pageValue.startsWith('/projects/') && pageValue.includes('link=')) {
      const linkType = pageValue.split('link=')[1] || '';
      const cleanType = linkType.split('&')[0] || 'project';
      return `Clicked project link (${cleanType})`;
    }
    if (pageValue.startsWith('/projects/') && pageValue.endsWith('/view')) {
      return 'Viewed project case study';
    }
    if (pageValue.startsWith('/cta/')) {
      const action = pageValue.split('/cta/')[1] || 'action';
      return `Clicked contact action (${action})`;
    }
    if (pageValue && pageValue !== '/') {
      return `Visited ${pageValue}`;
    }
    return 'Viewed portfolio';
  };

  const missingSections = contentHealth?.missingSections || [];
  const missingProfileFields = contentHealth?.missingProfileFields || [];
  const hasContentWarnings = Boolean(contentHealth && (missingSections.length > 0 || missingProfileFields.length > 0));

  const quickEditTargets = [
    { label: 'Profile', tab: 'profile' },
    { label: 'Projects', tab: 'projects' },
    { label: 'Gallery', tab: 'gallery' },
    { label: 'Skills', tab: 'skills' },
  ];

  return (
    <div className="analytics-dashboard">
      {hasContentWarnings && (
        <div className="content-health-alert" role="status" aria-live="polite">
          <div className="content-health-alert-copy">
            <FaExclamationTriangle />
            <div>
              <strong>Content completeness needs attention.</strong>
              <p>
                {missingProfileFields.length > 0 && `${missingProfileFields.length} profile field${missingProfileFields.length === 1 ? '' : 's'} missing.`}
                {missingProfileFields.length > 0 && missingSections.length > 0 && ' '}
                {missingSections.length > 0 && `${missingSections.length} section${missingSections.length === 1 ? '' : 's'} still empty.`}
              </p>
            </div>
          </div>
          <div className="content-health-alert-actions">
            {quickEditTargets.map((target) => (
              <button
                key={target.tab}
                type="button"
                className="content-health-action"
                onClick={() => onQuickEdit?.(target.tab)}
              >
                Edit {target.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Platform Breakdown */}
      <div className="analytics-section">
        <h3>Platform Breakdown</h3>
        <p className="section-hint">
          See who viewed your portfolio from each social media platform
        </p>
        <div className="platform-grid">
          {platformOrder.map((platform) => {
            const views = overview?.platformStats?.[platform] || 0;
            return (
              <div className="platform-card" key={platform}>
                <div
                  className="platform-icon"
                  style={{
                    background: `${platformColors[platform] || '#888'}20`,
                    color: platformColors[platform] || '#888',
                  }}
                >
                  {platformIcons[platform] || <FaGlobe />}
                </div>
                <div className="platform-info">
                  <span className="platform-name">{platform}</span>
                  <span className="platform-views">{views} views</span>
                </div>
                <div className="platform-bar-wrapper">
                  <div
                    className="platform-bar"
                    style={{
                      width: `${(views / (overview?.totalViews || 1)) * 100}%`,
                      background: platformColors[platform] || '#888',
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Traccar GPRS Integration */}
      <div className="analytics-section">
        <h3>GPRS Traccar API</h3>
        <p className="section-hint">
          Live tracker metrics from your Traccar API configuration.
        </p>
        {traccarLoading ? (
          <p className="no-data">Loading Traccar metrics...</p>
        ) : traccarOverview?.routeMissing ? (
          <p className="no-data">
            {traccarOverview?.error || 'Traccar endpoint is missing on the API server. Redeploy backend and verify VITE_API_BASE.'}
          </p>
        ) : !traccarOverview?.configured ? (
          <p className="no-data">
            Traccar is not configured on the server yet. Add
            `TRACCAR_BASE_URL`, `TRACCAR_USERNAME`, and `TRACCAR_PASSWORD`.
          </p>
        ) : !traccarOverview?.connected ? (
          <p className="no-data">
            Could not connect to Traccar. {traccarOverview?.error || 'Check API URL and credentials.'}
          </p>
        ) : (
          <>
            <div className="traccar-summary-grid">
              <article className="traccar-summary-card">
                <span>Total Devices</span>
                <strong>{traccarSummary.deviceCount || 0}</strong>
              </article>
              <article className="traccar-summary-card">
                <span>Online</span>
                <strong>{traccarSummary.onlineCount || 0}</strong>
              </article>
              <article className="traccar-summary-card">
                <span>Moving</span>
                <strong>{traccarSummary.movingCount || 0}</strong>
              </article>
              <article className="traccar-summary-card">
                <span>Stopped</span>
                <strong>{traccarSummary.stoppedCount || 0}</strong>
              </article>
            </div>

            <div className="traccar-table-wrapper">
              <table className="traccar-table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Status</th>
                    <th>Speed (km/h)</th>
                    <th>Last Update</th>
                    <th>Coordinates</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(traccarOverview?.devices) && traccarOverview.devices.length > 0 ? (
                    traccarOverview.devices.slice(0, 15).map((device) => (
                      <tr key={device.id}>
                        <td>{device.name}</td>
                        <td style={{ textTransform: 'capitalize' }}>{device.status || 'unknown'}</td>
                        <td>{device.speedKph ?? 0}</td>
                        <td>
                          {device.lastUpdate ? new Date(device.lastUpdate).toLocaleString() : '-'}
                        </td>
                        <td>
                          {device.latitude != null && device.longitude != null
                            ? `${Number(device.latitude).toFixed(5)}, ${Number(device.longitude).toFixed(5)}`
                            : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-data">
                        No Traccar devices returned by API.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Views Chart */}
      <div className="analytics-section">
        <h3>Views Over Time (Last 30 Days)</h3>
        <div className="chart-container">
          {chartData.length > 0 ? (
            <div className="bar-chart">
              {chartData.map((d, i) => (
                <div className="bar-col" key={i} title={`${d.label}: ${d.views} views`}>
                  <div className="bar-value">{d.views > 0 ? d.views : ''}</div>
                  <div
                    className="bar"
                    style={{
                      height: `${(d.views / maxViews) * 100}%`,
                      minHeight: d.views > 0 ? '4px' : '0',
                    }}
                  ></div>
                  <div className="bar-label">{i % 5 === 0 ? d.label : ''}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No chart data available yet.</p>
          )}
        </div>
      </div>

      {/* Device Breakdown from platforms */}
      {Object.keys(platforms).length > 0 && (
        <div className="analytics-section">
          <h3>Device & Browser Stats</h3>
          <div className="device-grid">
            {Object.entries(platforms).map(([name, data]) => (
              <div className="device-card" key={name}>
                <h4>
                  <span
                    style={{ color: platformColors[name] || '#888' }}
                  >
                    {platformIcons[name] || <FaGlobe />}
                  </span>{' '}
                  {name}
                </h4>
                <div className="device-stats">
                  <div className="device-row">
                    <span className="device-label">
                      <FaDesktop /> Desktop
                    </span>
                    <span>{data.devices?.desktop || 0}</span>
                  </div>
                  <div className="device-row">
                    <span className="device-label">
                      <FaMobile /> Mobile
                    </span>
                    <span>{data.devices?.mobile || 0}</span>
                  </div>
                  <div className="device-row">
                    <span className="device-label">
                      <FaTablet /> Tablet
                    </span>
                    <span>{data.devices?.tablet || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="analytics-section">
        <div className="visitors-header">
          <div>
            <h3>Download Activity</h3>
            <p className="section-hint">
              Independent resume and gallery download logs with daily, monthly, and yearly totals.
            </p>
          </div>
          <div className="visitors-actions">
            <button
              type="button"
              className="clear-analytics-btn"
              onClick={handleClearDownloadAnalytics}
              disabled={isClearingDownloads}
            >
              <FaTrash /> {isClearingDownloads ? 'Clearing...' : 'Delete Download Analytics'}
            </button>
          </div>
        </div>
        {downloadLoading ? (
          <p className="no-data">Loading download activity...</p>
        ) : downloadSummary ? (
          <>
            <div className="traccar-summary-grid">
              <article className="traccar-summary-card">
                <span>Total Downloads</span>
                <strong>{downloadSummary.totalDownloads || 0}</strong>
              </article>
              <article className="traccar-summary-card">
                <span>Today</span>
                <strong>{downloadSummary.todayDownloads || 0}</strong>
              </article>
              <article className="traccar-summary-card">
                <span>This Month</span>
                <strong>{downloadSummary.monthDownloads || 0}</strong>
              </article>
              <article className="traccar-summary-card">
                <span>This Year</span>
                <strong>{downloadSummary.yearDownloads || 0}</strong>
              </article>
            </div>

            <div className="visitors-table-wrapper">
              <table className="visitors-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Asset</th>
                    <th>Type</th>
                    <th>Application</th>
                    <th>OS</th>
                    <th>IP</th>
                    <th>Referrer</th>
                  </tr>
                </thead>
                <tbody>
                  {downloadLogs.length > 0 ? (
                    downloadLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}</td>
                        <td>{log.assetName || log.asset_name || 'Unnamed asset'}</td>
                        <td style={{ textTransform: 'capitalize' }}>{log.assetType || log.asset_type || 'other'}</td>
                        <td>{log.application || log.browser || 'Unknown'}</td>
                        <td>{log.os || 'Unknown'}</td>
                        <td>{log.ip || '—'}</td>
                        <td>{log.referrer || 'direct'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="no-data">
                        No download logs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="no-data">Download activity could not be loaded.</p>
        )}
      </div>

      {/* Activity Logs */}
      <div className="analytics-section">
        <div className="visitors-header">
          <h3>Activity Logs</h3>
          <div className="visitors-actions">
            <div className="visitors-filter">
              <FaFilter />
              <select
                value={filterSource}
                onChange={(e) => {
                  setFilterSource(e.target.value);
                  setVisitorPage(1);
                }}
              >
                <option value="all">All Platforms</option>
                <option value="project_clicks">Project Clicks Only</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="GitHub">GitHub</option>
                <option value="Twitter/X">Twitter/X</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube</option>
                <option value="Reddit">Reddit</option>
                <option value="Google">Google</option>
                <option value="chrome">Chrome Browser</option>
                <option value="browser:safari">Safari Browser</option>
                <option value="android">Android</option>
                <option value="os:iOS">iOS</option>
                <option value="ios_safari">iOS Safari</option>
                <option value="Bing">Bing</option>
                <option value="Direct">Direct</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button
              type="button"
              className="clear-analytics-btn"
              onClick={handleClearAnalytics}
              disabled={isClearing}
            >
              <FaTrash /> {isClearing ? 'Clearing...' : 'Clear Analytics'}
            </button>
          </div>
        </div>
        <div className="visitors-table-wrapper">
          <table className="visitors-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Activity</th>
                <th>Source</th>
                <th>IP</th>
                <th>Continent</th>
                <th>Country</th>
                <th>Region</th>
                <th>County</th>
                <th>District</th>
                <th>Division</th>
                <th>Device</th>
                <th>Browser</th>
                <th>OS</th>
                <th>Page</th>
                <th>Social Accounts</th>
              </tr>
            </thead>
            <tbody>
              {visitors.length > 0 ? (
                visitors.map((v) => (
                  <tr key={v.id}>
                    <td>{new Date(v.timestamp).toLocaleString()}</td>
                    <td>{describeActivity(v)}</td>
                    <td>
                      <span
                        className="source-badge"
                        style={{
                          background: `${platformColors[v.source] || '#888'}20`,
                          color: platformColors[v.source] || '#888',
                        }}
                      >
                        {platformIcons[v.source] || <FaGlobe />}{' '}{v.source}
                      </span>
                    </td>
                    <td>{v.ip || '—'}</td>
                    <td>
                      {v.continent && v.continent !== 'Unknown' ? v.continent : '—'}
                    </td>
                    <td>{v.country && v.country !== 'Unknown' ? v.country : '—'}</td>
                    <td>{v.region && v.region !== 'Unknown' ? v.region : '—'}</td>
                    <td>{v.county && v.county !== 'Unknown' ? v.county : '—'}</td>
                    <td>{v.district && v.district !== 'Unknown' ? v.district : '—'}</td>
                    <td>{v.division && v.division !== 'Unknown' ? v.division : '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{v.device}</td>
                    <td>{v.browser}</td>
                    <td>{v.os}</td>
                    <td>{v.page}</td>
                    <td>
                      {v.socialAccounts ? (
                        <div className="visitor-social-links">
                          {socialAccountIcons
                            .filter((social) => v.socialAccounts?.[social.key])
                            .map((social) => (
                              <a
                                key={social.key}
                                href={v.socialAccounts[social.key]}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={social.label}
                              >
                                {social.icon}
                              </a>
                            ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="15" className="no-data">
                    No visitors recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {visitorPages > 1 && (
          <div className="pagination">
            <button
              disabled={visitorPage <= 1}
              onClick={() => setVisitorPage((p) => p - 1)}
            >
              Previous
            </button>
            <span>
              Page {visitorPage} of {visitorPages}
            </span>
            <button
              disabled={visitorPage >= visitorPages}
              onClick={() => setVisitorPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
