import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getSkills, createSkill, updateSkill, deleteSkill } from '../utils/db.js';

const router = express.Router();

// GET /api/skills — public
router.get('/', async (req, res) => {
  try {
    const skills = await getSkills();
    res.json(skills);
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// POST /api/skills — admin only
router.post('/', verifyToken, async (req, res) => {
  try {
    const skill = await createSkill(req.body);
    res.json(skill);
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

// PUT /api/skills/:id — admin only
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const skill = await updateSkill(parseInt(req.params.id), req.body);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    res.json(skill);
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

// DELETE /api/skills/:id — admin only
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await deleteSkill(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

export default router;
