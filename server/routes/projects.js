import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getProjects, createProject, updateProject, deleteProject } from '../utils/db.js';

const router = express.Router();

// GET /api/projects — public
router.get('/', async (req, res) => {
  try {
    const projects = await getProjects();
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects — admin only
router.post('/', verifyToken, async (req, res) => {
  try {
    const project = await createProject(req.body);
    res.json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id — admin only
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const project = await updateProject(parseInt(req.params.id), req.body);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id — admin only
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await deleteProject(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
