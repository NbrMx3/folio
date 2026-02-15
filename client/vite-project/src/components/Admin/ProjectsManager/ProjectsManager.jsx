import { useState, useEffect } from 'react';
import { FaPlus, FaSave, FaTrash, FaTimes, FaGripVertical, FaExternalLinkAlt, FaGithub } from 'react-icons/fa';
import { getProjectsList, createProject, updateProject, deleteProject } from '../../../utils/api';
import './ProjectsManager.css';

const ProjectsManager = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [message, setMessage] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    tags: '',
    github: '',
    live: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getProjectsList();
      setProjects(data);
    } catch {
      setMessage('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newProject.title.trim()) return;
    setSaving('new');
    try {
      const project = await createProject({
        title: newProject.title,
        description: newProject.description,
        tags: newProject.tags.split(',').map((t) => t.trim()).filter(Boolean),
        github: newProject.github || '#',
        live: newProject.live || '#',
        sort_order: projects.length,
      });
      setProjects([...projects, project]);
      setNewProject({ title: '', description: '', tags: '', github: '', live: '' });
      setShowAdd(false);
      showMsg('Project added!');
    } catch {
      showMsg('Failed to add project', true);
    } finally {
      setSaving(null);
    }
  };

  const handleUpdate = async (id) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    setSaving(id);
    try {
      const tags = typeof project.tags === 'string'
        ? project.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : project.tags;
      const updated = await updateProject(id, { ...project, tags });
      setProjects(projects.map((p) => (p.id === id ? updated : p)));
      showMsg('Project updated!');
    } catch {
      showMsg('Failed to update project', true);
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    setSaving(id);
    try {
      await deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
      showMsg('Project deleted!');
    } catch {
      showMsg('Failed to delete project', true);
    } finally {
      setSaving(null);
    }
  };

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleFieldChange = (id, field, value) => {
    setProjects(projects.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const tagsToString = (tags) => {
    if (Array.isArray(tags)) return tags.join(', ');
    return tags || '';
  };

  if (loading) {
    return (
      <div className="projects-manager-loading">
        <div className="loader"></div>
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="projects-manager">
      <div className="manager-header">
        <div>
          <h2>Manage Projects</h2>
          <p className="manager-hint">Add, edit or remove projects displayed on your portfolio.</p>
        </div>
        <button className="add-btn" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? <FaTimes /> : <FaPlus />}
          {showAdd ? 'Cancel' : 'Add Project'}
        </button>
      </div>

      {message && (
        <div className={`manager-message ${message.includes('Failed') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Add new project form */}
      {showAdd && (
        <div className="project-form-card">
          <h3>New Project</h3>
          <div className="project-form-grid">
            <div className="form-field full-width">
              <label>Title</label>
              <input
                type="text"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                placeholder="e.g. E-Commerce Platform"
              />
            </div>
            <div className="form-field full-width">
              <label>Description</label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Brief description of the project..."
                rows={3}
              />
            </div>
            <div className="form-field full-width">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                value={newProject.tags}
                onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                placeholder="e.g. React, Node.js, MongoDB"
              />
            </div>
            <div className="form-field">
              <label>GitHub URL</label>
              <input
                type="text"
                value={newProject.github}
                onChange={(e) => setNewProject({ ...newProject, github: e.target.value })}
                placeholder="https://github.com/..."
              />
            </div>
            <div className="form-field">
              <label>Live Demo URL</label>
              <input
                type="text"
                value={newProject.live}
                onChange={(e) => setNewProject({ ...newProject, live: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <button
            className="save-btn"
            onClick={handleAdd}
            disabled={saving === 'new' || !newProject.title.trim()}
          >
            <FaPlus /> {saving === 'new' ? 'Adding...' : 'Add Project'}
          </button>
        </div>
      )}

      {/* Existing projects */}
      <div className="projects-list">
        {projects.map((project, index) => (
          <div className="project-edit-card" key={project.id}>
            <div className="project-edit-header">
              <div className="project-number-badge">0{index + 1}</div>
              <div className="project-drag">
                <FaGripVertical />
              </div>
            </div>
            <div className="project-edit-fields">
              <div className="form-field">
                <label>Title</label>
                <input
                  type="text"
                  value={project.title}
                  onChange={(e) => handleFieldChange(project.id, 'title', e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Description</label>
                <textarea
                  value={project.description}
                  onChange={(e) => handleFieldChange(project.id, 'description', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="form-field">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tagsToString(project.tags)}
                  onChange={(e) => handleFieldChange(project.id, 'tags', e.target.value)}
                />
              </div>
              <div className="project-links-row">
                <div className="form-field flex-1">
                  <label><FaGithub /> GitHub URL</label>
                  <input
                    type="text"
                    value={project.github || ''}
                    onChange={(e) => handleFieldChange(project.id, 'github', e.target.value)}
                    placeholder="https://github.com/..."
                  />
                </div>
                <div className="form-field flex-1">
                  <label><FaExternalLinkAlt /> Live Demo URL</label>
                  <input
                    type="text"
                    value={project.live || ''}
                    onChange={(e) => handleFieldChange(project.id, 'live', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
            <div className="project-actions">
              <button
                className="icon-btn save"
                onClick={() => handleUpdate(project.id)}
                disabled={saving === project.id}
                title="Save"
              >
                <FaSave />
              </button>
              <button
                className="icon-btn delete"
                onClick={() => handleDelete(project.id)}
                disabled={saving === project.id}
                title="Delete"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <p className="no-items">No projects yet. Click "Add Project" to get started.</p>
        )}
      </div>
    </div>
  );
};

export default ProjectsManager;
