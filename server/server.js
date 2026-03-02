import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/data/routes/auth.js';
import profileRoutes from './src/data/routes/profile.js';
import skillsRoutes from './src/data/routes/skills.js';
import projectsRoutes from './src/data/routes/projects.js';
import analyticsRoutes from './src/data/routes/analytics.js';
import trackRouter from './src/data/routes/middleware/tracker.js';
import { initDatabase } from './src/data/utils/db.js';
import morgan from 'morgan';

// dotenv is loaded at module evaluation time via `import 'dotenv/config'` above


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
app.use(morgan("dev"));

// Allow requests from the Vercel frontend (set CLIENT_URL on Render)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, Render health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
// Serve uploaded files from the data uploads folder at /uploads
app.use('/uploads', express.static(path.join(__dirname, 'src', 'data', 'uploads')));

// Root health-check (prevents 404 on GET /)
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Folio API server is running' });
});

// Chrome DevTools workspace discovery endpoint (prevents 404 + CSP console errors)
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.json({});
});

// Track every visit to the portfolio
app.use('/api/track', trackRouter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Initialize database and start server
initDatabase()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the process using it or set PORT to a different value and restart.`);
        console.error('Hint: on Windows run `netstat -ano | findstr :<PORT>` to find the PID.');
        process.exit(1);
      }
      console.error('Server error:', err);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.warn('Database initialization failed; starting server with JSON fallback. Error:', err && err.message ? err.message : err);
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT} (JSON DB fallback)`);
    });

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the process using it or set PORT to a different value and restart.`);
        console.error('Hint: on Windows run `netstat -ano | findstr :<PORT>` to find the PID.');
        process.exit(1);
      }
      console.error('Server error:', err);
      process.exit(1);
    });
  });
