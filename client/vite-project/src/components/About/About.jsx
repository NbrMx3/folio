import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { FaCamera } from 'react-icons/fa';
import { getProfile, getProjectsList, getToken, uploadProfilePicture } from '../../utils/api';
import { fallbackProfile } from '../../data/offlineContent';
import { buildProjectCollection } from '../../data/projectShowcase';
import './About.css';

const About = () => {
  const [profile, setProfile] = useState({ ...fallbackProfile });
  const [projects, setProjects] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState('');
  const fileRef = useRef(null);

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

  const isAuthenticated = Boolean(getToken());

  const handleProfileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadFeedback('');
    try {
      const response = await uploadProfilePicture(file);
      setProfile((prev) => ({ ...prev, picture: response?.picture || prev.picture }));
      setUploadFeedback('Profile image updated.');
    } catch (error) {
      setUploadFeedback(error?.message || 'Unable to upload profile image.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

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

        <aside className="about-side">
          <div className="about-avatar-wrap">
            <div className="about-avatar-frame">
              {profile.picture ? (
                <img src={profile.picture} alt={`${profile.name || 'Developer'} profile`} className="about-avatar" loading="lazy" />
              ) : (
                <div className="about-avatar-placeholder" aria-hidden="true">
                  {String(profile.name || 'DK').split(' ').map((part) => part[0]).slice(0, 2).join('')}
                </div>
              )}
              {isAuthenticated && (
                <button
                  type="button"
                  className="about-avatar-upload"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  <FaCamera />
                  <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleProfileUpload} />
            {uploadFeedback && <p className="about-upload-feedback">{uploadFeedback}</p>}
            {!isAuthenticated && (
              <p className="about-upload-feedback">
                To upload your profile picture, sign in from the admin dashboard.
              </p>
            )}
          </div>

          <div className="about-stats" aria-label="Developer statistics">
            {stats.map((stat) => (
              <article key={stat.label} className="about-stat-card">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
};

export default memo(About);
