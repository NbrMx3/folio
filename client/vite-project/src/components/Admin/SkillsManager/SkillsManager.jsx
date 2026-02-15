import { useState, useEffect } from 'react';
import { FaPlus, FaSave, FaTrash, FaGripVertical, FaTimes } from 'react-icons/fa';
import { getSkills, createSkill, updateSkill, deleteSkill } from '../../../utils/api';
import './SkillsManager.css';

const ICON_OPTIONS = [
  { value: 'FaCode', label: 'Code' },
  { value: 'FaNodeJs', label: 'Node.js' },
  { value: 'FaReact', label: 'React' },
  { value: 'FaDatabase', label: 'Database' },
  { value: 'FaPaintBrush', label: 'Design' },
  { value: 'FaPlug', label: 'Integration' },
  { value: 'FaServer', label: 'Server' },
  { value: 'FaMobile', label: 'Mobile' },
  { value: 'FaShieldAlt', label: 'Security' },
  { value: 'FaCloud', label: 'Cloud' },
  { value: 'FaCogs', label: 'Settings' },
  { value: 'FaRocket', label: 'Performance' },
];

const SkillsManager = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [message, setMessage] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newSkill, setNewSkill] = useState({ icon: 'FaCode', title: '', description: '' });

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const data = await getSkills();
      setSkills(data);
    } catch {
      setMessage('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newSkill.title.trim()) return;
    setSaving('new');
    try {
      const skill = await createSkill({
        ...newSkill,
        sort_order: skills.length,
      });
      setSkills([...skills, skill]);
      setNewSkill({ icon: 'FaCode', title: '', description: '' });
      setShowAdd(false);
      showMessage('Skill added!');
    } catch {
      showMessage('Failed to add skill', true);
    } finally {
      setSaving(null);
    }
  };

  const handleUpdate = async (id, data) => {
    setSaving(id);
    try {
      const updated = await updateSkill(id, data);
      setSkills(skills.map((s) => (s.id === id ? updated : s)));
      showMessage('Skill updated!');
    } catch {
      showMessage('Failed to update skill', true);
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this skill?')) return;
    setSaving(id);
    try {
      await deleteSkill(id);
      setSkills(skills.filter((s) => s.id !== id));
      showMessage('Skill deleted!');
    } catch {
      showMessage('Failed to delete skill', true);
    } finally {
      setSaving(null);
    }
  };

  const showMessage = (msg, isError = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleFieldChange = (id, field, value) => {
    setSkills(skills.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  if (loading) {
    return (
      <div className="skills-manager-loading">
        <div className="loader"></div>
        <p>Loading skills...</p>
      </div>
    );
  }

  return (
    <div className="skills-manager">
      <div className="manager-header">
        <div>
          <h2>Manage Skills</h2>
          <p className="manager-hint">Add, edit or remove skills shown on your portfolio.</p>
        </div>
        <button className="add-btn" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? <FaTimes /> : <FaPlus />}
          {showAdd ? 'Cancel' : 'Add Skill'}
        </button>
      </div>

      {message && (
        <div className={`manager-message ${message.includes('Failed') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Add new skill form */}
      {showAdd && (
        <div className="skill-form-card">
          <h3>New Skill</h3>
          <div className="skill-form-grid">
            <div className="form-field">
              <label>Icon</label>
              <select
                value={newSkill.icon}
                onChange={(e) => setNewSkill({ ...newSkill, icon: e.target.value })}
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Title</label>
              <input
                type="text"
                value={newSkill.title}
                onChange={(e) => setNewSkill({ ...newSkill, title: e.target.value })}
                placeholder="e.g. Frontend Development"
              />
            </div>
            <div className="form-field full-width">
              <label>Description</label>
              <input
                type="text"
                value={newSkill.description}
                onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                placeholder="e.g. React, Vue, HTML5, CSS3, JavaScript"
              />
            </div>
          </div>
          <button
            className="save-btn"
            onClick={handleAdd}
            disabled={saving === 'new' || !newSkill.title.trim()}
          >
            <FaPlus /> {saving === 'new' ? 'Adding...' : 'Add Skill'}
          </button>
        </div>
      )}

      {/* Existing skills */}
      <div className="skills-list">
        {skills.map((skill) => (
          <div className="skill-edit-card" key={skill.id}>
            <div className="skill-drag">
              <FaGripVertical />
            </div>
            <div className="skill-edit-fields">
              <div className="skill-edit-row">
                <div className="form-field compact">
                  <label>Icon</label>
                  <select
                    value={skill.icon}
                    onChange={(e) => handleFieldChange(skill.id, 'icon', e.target.value)}
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field compact flex-1">
                  <label>Title</label>
                  <input
                    type="text"
                    value={skill.title}
                    onChange={(e) => handleFieldChange(skill.id, 'title', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-field compact">
                <label>Description</label>
                <input
                  type="text"
                  value={skill.description}
                  onChange={(e) => handleFieldChange(skill.id, 'description', e.target.value)}
                />
              </div>
            </div>
            <div className="skill-actions">
              <button
                className="icon-btn save"
                onClick={() => handleUpdate(skill.id, skill)}
                disabled={saving === skill.id}
                title="Save"
              >
                <FaSave />
              </button>
              <button
                className="icon-btn delete"
                onClick={() => handleDelete(skill.id)}
                disabled={saving === skill.id}
                title="Delete"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}

        {skills.length === 0 && (
          <p className="no-items">No skills yet. Click "Add Skill" to get started.</p>
        )}
      </div>
    </div>
  );
};

export default SkillsManager;
