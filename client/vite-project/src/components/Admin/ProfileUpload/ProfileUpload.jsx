import { useState, useEffect, useRef } from 'react';
import { FaCamera, FaSave, FaUser, FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa';
import { getProfile, updateProfile, uploadProfilePicture } from '../../../utils/api';
import './ProfileUpload.css';

const ProfileUpload = () => {
  const [profile, setProfile] = useState({ picture: '', name: '', title: '', bio: '', github: '', linkedin: '', email: '' });
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
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
              <img src={preview} alt="Profile" />
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
