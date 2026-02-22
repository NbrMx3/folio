import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/data/routes/auth.js';
import profileRoutes from './src/data/routes/profile.js';
import skillsRoutes from './src/data/routes/skills.js';
import projectsRoutes from './src/data/routes/projects.js';
import analyticsRoutes from './src/data/routes/analytics.js';
import { trackVisitor } from './src/data/routes/middleware/tracker.js';
import { initDatabase } from './src/data/utils/db.js';
import morgan from 'morgan';

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
app.use(morgan("dev"));


app.use(cors());
app.use(express.json());
app.use('/uploads/profile', express.static(path.join(__dirname, 'uploads/profile')));
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));

// Track every visit to the portfolio
app.use('/api/track', trackVisitor);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Initialize database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
