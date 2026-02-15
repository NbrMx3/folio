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
} from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si';
import { getChartData, getVisitors, getPlatforms } from '../../../utils/api';
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

const AnalyticsDashboard = ({ overview }) => {
  const [chartData, setChartData] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [platforms, setPlatforms] = useState({});
  const [visitorPage, setVisitorPage] = useState(1);
  const [visitorPages, setVisitorPages] = useState(1);
  const [filterSource, setFilterSource] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadVisitors();
  }, [visitorPage, filterSource]);

  const loadData = async () => {
    try {
      const [chart, plat] = await Promise.all([getChartData(), getPlatforms()]);
      setChartData(chart);
      setPlatforms(plat);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadVisitors = async () => {
    try {
      const data = await getVisitors(visitorPage, filterSource);
      setVisitors(data.visitors);
      setVisitorPages(data.pages);
    } catch {
      // ignore
    }
  };

  const maxViews = Math.max(...chartData.map((d) => d.views), 1);

  return (
    <div className="analytics-dashboard">
      {/* Platform Breakdown */}
      <div className="analytics-section">
        <h3>Platform Breakdown</h3>
        <p className="section-hint">
          See who viewed your portfolio from each social media platform
        </p>
        <div className="platform-grid">
          {overview?.platformStats &&
            Object.entries(overview.platformStats)
              .sort(([, a], [, b]) => b - a)
              .map(([platform, views]) => (
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
                        width: `${(views / (overview.totalViews || 1)) * 100}%`,
                        background: platformColors[platform] || '#888',
                      }}
                    ></div>
                  </div>
                </div>
              ))}
          {(!overview?.platformStats ||
            Object.keys(overview.platformStats).length === 0) && (
            <p className="no-data">
              No platform data yet. Share your portfolio on social media to start tracking!
            </p>
          )}
        </div>
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

      {/* Recent Visitors */}
      <div className="analytics-section">
        <div className="visitors-header">
          <h3>Recent Visitors</h3>
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
              <option value="LinkedIn">LinkedIn</option>
              <option value="GitHub">GitHub</option>
              <option value="Twitter/X">Twitter/X</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Google">Google</option>
              <option value="Direct">Direct</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div className="visitors-table-wrapper">
          <table className="visitors-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Source</th>
                <th>Browser</th>
                <th>Device</th>
                <th>OS</th>
                <th>Page</th>
              </tr>
            </thead>
            <tbody>
              {visitors.length > 0 ? (
                visitors.map((v) => (
                  <tr key={v.id}>
                    <td>{new Date(v.timestamp).toLocaleString()}</td>
                    <td>
                      <span
                        className="source-badge"
                        style={{
                          background: `${platformColors[v.source] || '#888'}20`,
                          color: platformColors[v.source] || '#888',
                        }}
                      >
                        {v.source}
                      </span>
                    </td>
                    <td>{v.browser}</td>
                    <td>{v.device}</td>
                    <td>{v.os}</td>
                    <td>{v.page}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
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
