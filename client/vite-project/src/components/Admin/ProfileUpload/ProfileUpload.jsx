import { useState, useEffect, useRef } from 'react';
import {
  FaCamera,
  FaDownload,
  FaFileExport,
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
    const base = import.meta.env.PROD ? 'https://folioo-dxty.onrender.com' : '';
    return `${base}${path}`;
  };
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef(null);
  const resumeRef = useRef(null);
  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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

  const handleExportProfilePdf = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (!printWindow) {
      setMessage('Pop-up blocked. Please allow pop-ups and try again.');
      return;
    }

    const fullName = escapeHtml(profile.name || 'Dennis Kipkemoi');
    const title = escapeHtml(profile.title || 'Software Developer');
    const safeBio = escapeHtml(profile.bio || 'No biography provided yet.');
    const sections = [
      ['Email', profile.email],
      ['Phone', profile.phone],
      ['WhatsApp', profile.whatsapp],
      ['GitHub', profile.github],
      ['LinkedIn', profile.linkedin],
      ['X', profile.twitter],
      ['Facebook', profile.facebook],
      ['Instagram', profile.instagram],
      ['TikTok', profile.tiktok],
    ].filter(([, value]) => value);

    const rows = sections.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('');
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${fullName} Profile Export</title>
          <style>
            body { font-family: Inter, Arial, sans-serif; margin: 2rem; color: #0f172a; }
            h1 { margin-bottom: 0.2rem; }
            p { margin-top: 0; color: #334155; }
            table { width: 100%; border-collapse: collapse; margin-top: 1.2rem; }
            th, td { text-align: left; border: 1px solid #cbd5e1; padding: 0.55rem 0.65rem; }
            th { width: 180px; background: #f8fafc; }
            .bio { margin-top: 1rem; line-height: 1.65; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>${fullName}</h1>
          <p>${title}</p>
          <div class="bio">${safeBio}</div>
          <table>
            <tbody>${rows || '<tr><td colspan="2">No contact links provided.</td></tr>'}</tbody>
          </table>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
            <button type="button" className="resume-preview-link" onClick={handleExportProfilePdf}>
              <FaFileExport /> Export Profile PDF
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
          Add or edit these numbers here. To delete one, clear its field and save.
        </p>
        <div className="profile-field">
          <label><FaPhoneAlt /> Phone Number</label>
          <div className="profile-field-action">
            <input
              type="tel"
              value={profile.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="Add a phone number"
            />
            {profile.phone && (
              <button type="button" className="clear-contact-btn" onClick={() => setProfile({ ...profile, phone: '' })}>
                Remove
              </button>
            )}
          </div>
        </div>
        <div className="profile-field">
          <label><FaWhatsapp /> WhatsApp Number</label>
          <div className="profile-field-action">
            <input
              type="tel"
              value={profile.whatsapp || ''}
              onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
              placeholder="Add a WhatsApp number"
            />
            {profile.whatsapp && (
              <button type="button" className="clear-contact-btn" onClick={() => setProfile({ ...profile, whatsapp: '' })}>
                Remove
              </button>
            )}
          </div>
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
