import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FaChartBar,
  FaUser,
  FaSignOutAlt,
  FaHome,
  FaEye,
  FaGlobe,
  FaCalendarDay,
  FaCalendarWeek,
  FaCode,
  FaKey,
  FaProjectDiagram,
  FaImages,
  FaExternalLinkAlt,
  FaPenNib,
} from 'react-icons/fa';
import { verifyAuth, removeToken } from '../../utils/api';
import { useAdminStore } from '../../store/useAdminStore';
import ProfileUpload from '../../components/Admin/ProfileUpload/ProfileUpload';
import AnalyticsDashboard from '../../components/Admin/AnalyticsDashboard/AnalyticsDashboard';
import SkillsManager from '../../components/Admin/SkillsManager/SkillsManager';
import ProjectsManager from '../../components/Admin/ProjectsManager/ProjectsManager';
import GalleryManager from '../../components/Admin/GalleryManager/GalleryManager';
import AuthenticationSettings from '../../components/Admin/AuthenticationSettings/AuthenticationSettings';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { activeTab, overview, loading, setActiveTab, loadOverview, resetAdmin } = useAdminStore();
  const navigate = useNavigate();

  useEffect(() => {
    let isActive = true;

    const checkAuth = async () => {
      try {
        const res = await verifyAuth();
        if (!isActive) return;

        if (!res.valid) {
          navigate('/admin/login');
          return;
        }

        await loadOverview();
      } catch {
        if (isActive) {
          navigate('/admin/login');
        }
      }
    };

    void checkAuth();

    return () => {
      isActive = false;
    };
  }, [loadOverview, navigate]);

  const handleLogout = () => {
    resetAdmin();
    removeToken();
    navigate('/admin/login');
  };

  const handleQuickEdit = (tab) => {
    setActiveTab(tab);
  };

  const handlePreviewPublicSite = () => {
    window.open('/', '_blank', 'noopener,noreferrer');
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'analytics': return 'Analytics Dashboard';
      case 'profile': return 'Profile Settings';
      case 'skills': return 'Skills Management';
      case 'projects': return 'Projects Management';
      case 'gallery': return 'Gallery Management';
      case 'authentication': return 'Authentication';
      default: return 'Dashboard';
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loader"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <h2>
            Cyber<span className="highlight">Dev</span>
          </h2>
          <span className="sidebar-badge">Admin</span>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <FaChartBar /> Analytics
          </button>
          <button
            className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FaUser /> Profile
          </button>
          <button
            className={`sidebar-link ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            <FaCode /> Skills
          </button>
          <button
            className={`sidebar-link ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <FaProjectDiagram /> Projects
          </button>
          <button
            className={`sidebar-link ${activeTab === 'gallery' ? 'active' : ''}`}
            onClick={() => setActiveTab('gallery')}
          >
            <FaImages /> Gallery
          </button>
          <button
            className={`sidebar-link ${activeTab === 'authentication' ? 'active' : ''}`}
            onClick={() => setActiveTab('authentication')}
          >
            <FaKey /> Authentication
          </button>
          <Link to="/" className="sidebar-link">
            <FaHome /> View Site
          </Link>
        </nav>
        <button className="sidebar-logout" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-top">
            <div>
              <h1>{getTabTitle()}</h1>
              <p className="admin-date">
                {new Date().toLocaleDateString('en', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="admin-header-actions">
              <button type="button" className="admin-header-action" onClick={handlePreviewPublicSite}>
                <FaExternalLinkAlt /> Preview Public Site
              </button>
              <button type="button" className="admin-header-action admin-header-action--ghost" onClick={() => handleQuickEdit('profile')}>
                <FaPenNib /> Quick Edit
              </button>
            </div>
          </div>
        </header>

        {/* Overview Stats */}
        {overview && activeTab === 'analytics' && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon total">
                <FaEye />
              </div>
              <div className="stat-info">
                <span className="stat-number">{overview.totalViews}</span>
                <span className="stat-label">Total Views</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon today">
                <FaCalendarDay />
              </div>
              <div className="stat-info">
                <span className="stat-number">{overview.todayViews}</span>
                <span className="stat-label">Today</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon week">
                <FaCalendarWeek />
              </div>
              <div className="stat-info">
                <span className="stat-number">{overview.weekViews}</span>
                <span className="stat-label">This Week</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon platforms">
                <FaGlobe />
              </div>
              <div className="stat-info">
                <span className="stat-number">
                  {Object.keys(overview.platformStats).length}
                </span>
                <span className="stat-label">Platforms</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            overview={overview}
            onAnalyticsCleared={loadOverview}
            onQuickEdit={handleQuickEdit}
          />
        )}
        {activeTab === 'profile' && <ProfileUpload />}
        {activeTab === 'skills' && <SkillsManager />}
        {activeTab === 'projects' && <ProjectsManager />}
        {activeTab === 'gallery' && <GalleryManager />}
        {activeTab === 'authentication' && <AuthenticationSettings />}
      </main>
    </div>
  );
};

export default AdminDashboard;
