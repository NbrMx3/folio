import { useState, useEffect, useRef } from 'react';
import {
  FaCamera,
  FaDownload,
  FaFilePdf,
  FaSave,
  FaUser,
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaEnvelope,
  FaPhoneAlt,
  FaWhatsapp,
} from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si';
import { getProfile, updateProfile, uploadProfilePicture, uploadProfileResume } from '../../../utils/api';
import './ProfileUpload.css';

const ProfileUpload = () => {
  const [profile, setProfile] = useState({
    picture: '',
    name: '',
    title: '',
    bio: '',
    github: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    phone: '',
    whatsapp: '',
    email: '',
  });
  const [preview, setPreview] = useState('');

  // Helper to get absolute image URL in production
  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = import.meta.env.VITE_API_BASE_URL || '';
    return `${base}${path}`;
  };
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef(null);
  const resumeRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setProfile((prev) => ({ ...prev, ...data }));
      if (data.picture) {
        setPreview(data.picture);
      }
    } catch {
      // ignore
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload
    setSaving(true);
    setMessage('');
    try {
      const data = await uploadProfilePicture(file);
      setProfile((prev) => ({ ...prev, picture: data.picture }));
      setPreview(data.picture);
      setMessage('Profile picture updated!');
    } catch {
      setMessage('Upload failed. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setMessage('Resume must be a PDF file.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const data = await uploadProfileResume(file);
      setProfile((prev) => ({ ...prev, resume: data.resume }));
      setMessage('Resume updated!');
    } catch {
      setMessage('Resume upload failed. Try again.');
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await updateProfile({
        name: profile.name,
        title: profile.title,
        bio: profile.bio,
        github: profile.github,
        linkedin: profile.linkedin,
        twitter: profile.twitter,
        facebook: profile.facebook,
        instagram: profile.instagram,
        tiktok: profile.tiktok,
        phone: profile.phone,
        whatsapp: profile.whatsapp,
        email: profile.email,
      });
      setMessage('Profile saved!');
    } catch {
      setMessage('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-upload">
      <div className="profile-card">
        <h2>Profile Picture</h2>
        <p className="profile-hint">
          Upload a profile photo for your portfolio hero section.
        </p>
        <div className="avatar-section">
          <div
            className="avatar-preview"
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img src={getImageUrl(preview)} alt="Profile" />
            ) : (
              <div className="avatar-placeholder">
                <FaUser />
              </div>
            )}
            <div className="avatar-overlay">
              <FaCamera />
              <span>Change</span>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            hidden
          />
        </div>

        {message && (
          <div className={`profile-message ${message.includes('failed') || message.includes('Failed') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="profile-card">
        <h2>Resume / CV</h2>
        <p className="profile-hint">
          Upload a PDF resume so visitors can download your latest CV from the portfolio landing page.
        </p>
        <div className="resume-card">
          <div className="resume-meta">
            <FaFilePdf />
            <div>
              <strong>{profile.resume ? 'Resume uploaded' : 'No resume uploaded yet'}</strong>
              <span>{profile.resume ? 'Visitors will download the uploaded file.' : 'Upload a PDF to enable the download button.'}</span>
            </div>
          </div>
          <div className="resume-actions">
            <button type="button" className="resume-upload-btn" onClick={() => resumeRef.current?.click()} disabled={saving}>
              <FaDownload /> {profile.resume ? 'Replace Resume' : 'Upload Resume'}
            </button>
            {profile.resume && (
              <a href={profile.resume} className="resume-preview-link" target="_blank" rel="noreferrer">
                Preview Current File
              </a>
            )}
          </div>
        </div>
        <input
          ref={resumeRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleResumeChange}
          hidden
        />
      </div>

      <div className="profile-card profile-contact-card">
        <h2>Contact Details</h2>
        <p className="profile-hint">
          These values appear on the public Phone and WhatsApp contact cards. Edit them here, then save.
        </p>
        <div className="profile-field">
          <label><FaPhoneAlt /> Phone Number</label>
          <input
            type="tel"
            value={profile.phone || ''}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            placeholder="0710393746"
          />
        </div>
        <div className="profile-field">
          <label><FaWhatsapp /> WhatsApp Number</label>
          <input
            type="tel"
            value={profile.whatsapp || ''}
            onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
            placeholder="0112267013"
          />
        </div>
        <button className="save-btn" onClick={handleSave} disabled={saving}>
          <FaSave /> {saving ? 'Saving...' : 'Save Contact Details'}
        </button>
      </div>

      <div className="profile-card">
        <h2>Profile Details</h2>
        <div className="profile-field">
          <label>Display Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Your Name"
          />
        </div>
        <div className="profile-field">
          <label>Job Title</label>
          <input
            type="text"
            value={profile.title}
            onChange={(e) => setProfile({ ...profile, title: e.target.value })}
            placeholder="Full-Stack Developer"
          />
        </div>
        <div className="profile-field">
          <label>Bio</label>
          <textarea
            value={profile.bio || ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="A short bio about yourself..."
            rows={3}
          />
        </div>
        <div className="profile-field">
          <label><FaGithub /> GitHub URL</label>
          <input
            type="text"
            value={profile.github || ''}
            onChange={(e) => setProfile({ ...profile, github: e.target.value })}
            placeholder="https://github.com/yourusername"
          />
        </div>
        <div className="profile-field">
          <label><FaLinkedin /> LinkedIn URL</label>
          <input
            type="text"
            value={profile.linkedin || ''}
            onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
            placeholder="https://linkedin.com/in/yourusername"
          />
        </div>
        <div className="profile-field">
          <label><FaTwitter /> X (Twitter) URL</label>
          <input
            type="text"
            value={profile.twitter || ''}
            onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
            placeholder="https://x.com/yourusername"
          />
        </div>
        <div className="profile-field">
          <label><FaFacebook /> Facebook URL</label>
          <input
            type="text"
            value={profile.facebook || ''}
            onChange={(e) => setProfile({ ...profile, facebook: e.target.value })}
            placeholder="https://facebook.com/yourusername"
          />
        </div>
        <div className="profile-field">
          <label><FaInstagram /> Instagram URL</label>
          <input
            type="text"
            value={profile.instagram || ''}
            onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
            placeholder="https://instagram.com/yourusername"
          />
        </div>
        <div className="profile-field">
          <label><SiTiktok /> TikTok URL</label>
          <input
            type="text"
            value={profile.tiktok || ''}
            onChange={(e) => setProfile({ ...profile, tiktok: e.target.value })}
            placeholder="https://tiktok.com/@yourusername"
          />
        </div>
        <div className="profile-field">
          <label><FaEnvelope /> Contact Email</label>
          <input
            type="email"
            value={profile.email || ''}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            placeholder="you@example.com"
          />
        </div>
        <button className="save-btn" onClick={handleSave} disabled={saving}>
          <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default ProfileUpload;
