import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const { Pool } = pg;

// Remove sslmode from connection string and handle SSL in config
const connectionString = process.env.DATABASE_URL?.split('?')[0];

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Handle pool errors gracefully so the server doesn't crash
pool.on('error', (err) => {
  console.error('Unexpected pool error:', err.message);
});

// Initialize database tables
export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create profile table
    await client.query(`
      CREATE TABLE IF NOT EXISTS profile (
        id SERIAL PRIMARY KEY,
        picture TEXT DEFAULT '',
        name TEXT DEFAULT 'CyberDev',
        title TEXT DEFAULT 'Full-Stack Developer',
        bio TEXT DEFAULT '',
        github TEXT DEFAULT '',
        linkedin TEXT DEFAULT '',
        email TEXT DEFAULT '',
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add columns if they don't exist (for existing databases)
    const profileCols = ['bio', 'github', 'linkedin', 'email'];
    for (const col of profileCols) {
      await client.query(`
        DO $$ BEGIN
          ALTER TABLE profile ADD COLUMN ${col} TEXT DEFAULT '';
        EXCEPTION WHEN duplicate_column THEN NULL;
        END $$
      `);
    }

    // Create skills table
    await client.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        icon TEXT DEFAULT 'FaCode',
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        github TEXT DEFAULT '#',
        live TEXT DEFAULT '#',
        image TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create visitors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id TEXT PRIMARY KEY,
        ip TEXT,
        timestamp TIMESTAMP DEFAULT NOW(),
        source TEXT,
        referrer TEXT,
        browser TEXT,
        os TEXT,
        device TEXT DEFAULT 'desktop',
        country TEXT DEFAULT 'Unknown',
        page TEXT DEFAULT '/'
      )
    `);

    // Create platform_stats table
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_stats (
        platform TEXT PRIMARY KEY,
        views INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert default profile if not exists
    const profileExists = await client.query('SELECT id FROM profile LIMIT 1');
    if (profileExists.rows.length === 0) {
      await client.query(`
        INSERT INTO profile (picture, name, title, bio, github, linkedin, email) 
        VALUES ('', 'CyberDev', 'Full-Stack Developer', '', '', '', '')
      `);
    }

    // Insert default skills if none exist
    const skillsExist = await client.query('SELECT id FROM skills LIMIT 1');
    if (skillsExist.rows.length === 0) {
      await client.query(`
        INSERT INTO skills (icon, title, description, sort_order) VALUES
        ('FaCode', 'Frontend Development', 'React, Vue, HTML5, CSS3, JavaScript, TypeScript', 0),
        ('FaNodeJs', 'Backend Development', 'Node.js, Python, MongoDB, REST APIs, GraphQL', 1),
        ('FaReact', 'Modern Frameworks', 'React, Next.js, Vite, Express, TailwindCSS', 2),
        ('FaDatabase', 'Database & DevOps', 'PostgreSQL, MongoDB, Docker, CI/CD, AWS', 3),
        ('FaPaintBrush', 'UI/UX Design', 'Figma, Responsive Design, Animations, Accessibility', 4),
        ('FaPlug', 'API & Integration', 'RESTful APIs, WebSockets, OAuth, Third-party APIs', 5)
      `);
    }

    // Insert default projects if none exist
    const projectsExist = await client.query('SELECT id FROM projects LIMIT 1');
    if (projectsExist.rows.length === 0) {
      await client.query(`
        INSERT INTO projects (title, description, tags, github, live, sort_order) VALUES
        ('E-Commerce Platform', 'A full-stack e-commerce application with payment integration, user authentication, and admin dashboard.', '["React","Node.js","MongoDB","Stripe"]', '#', '#', 0),
        ('Real-Time Chat App', 'WebSocket-powered chat application with rooms, typing indicators, and message history.', '["React","Socket.io","Express","Redis"]', '#', '#', 1),
        ('AI Dashboard', 'Analytics dashboard integrating machine learning APIs for data visualization and insights.', '["Next.js","Python","TensorFlow","D3.js"]', '#', '#', 2)
      `);
    }

    await client.query('COMMIT');
    console.log('Database initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// ─── Profile queries ───────────────────────────────────────
export async function getProfile() {
  const result = await pool.query('SELECT picture, name, title, bio, github, linkedin, email FROM profile LIMIT 1');
  return result.rows[0] || { picture: '', name: 'CyberDev', title: 'Full-Stack Developer', bio: '', github: '', linkedin: '', email: '' };
}

export async function updateProfile(data) {
  const { picture, name, title, bio, github, linkedin, email } = data;
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (picture !== undefined) { updates.push(`picture = $${paramCount++}`); values.push(picture); }
  if (name !== undefined) { updates.push(`name = $${paramCount++}`); values.push(name); }
  if (title !== undefined) { updates.push(`title = $${paramCount++}`); values.push(title); }
  if (bio !== undefined) { updates.push(`bio = $${paramCount++}`); values.push(bio); }
  if (github !== undefined) { updates.push(`github = $${paramCount++}`); values.push(github); }
  if (linkedin !== undefined) { updates.push(`linkedin = $${paramCount++}`); values.push(linkedin); }
  if (email !== undefined) { updates.push(`email = $${paramCount++}`); values.push(email); }

  if (updates.length > 0) {
    updates.push(`updated_at = NOW()`);
    const query = `UPDATE profile SET ${updates.join(', ')} WHERE id = 1 RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  return getProfile();
}

// ─── Skills queries ────────────────────────────────────────
export async function getSkills() {
  const result = await pool.query('SELECT * FROM skills ORDER BY sort_order ASC, id ASC');
  return result.rows;
}

export async function createSkill(data) {
  const { icon, title, description, sort_order } = data;
  const result = await pool.query(
    'INSERT INTO skills (icon, title, description, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
    [icon || 'FaCode', title, description || '', sort_order || 0]
  );
  return result.rows[0];
}

export async function updateSkill(id, data) {
  const { icon, title, description, sort_order } = data;
  const result = await pool.query(
    'UPDATE skills SET icon = COALESCE($1, icon), title = COALESCE($2, title), description = COALESCE($3, description), sort_order = COALESCE($4, sort_order) WHERE id = $5 RETURNING *',
    [icon, title, description, sort_order, id]
  );
  return result.rows[0];
}

export async function deleteSkill(id) {
  await pool.query('DELETE FROM skills WHERE id = $1', [id]);
}

// ─── Projects queries ──────────────────────────────────────
export async function getProjects() {
  const result = await pool.query('SELECT * FROM projects ORDER BY sort_order ASC, id ASC');
  return result.rows.map(row => ({
    ...row,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
  }));
}

export async function createProject(data) {
  const { title, description, tags, github, live, image, sort_order } = data;
  const result = await pool.query(
    'INSERT INTO projects (title, description, tags, github, live, image, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [title, description || '', JSON.stringify(tags || []), github || '#', live || '#', image || '', sort_order || 0]
  );
  const row = result.rows[0];
  row.tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;
  return row;
}

export async function updateProject(id, data) {
  const { title, description, tags, github, live, image, sort_order } = data;
  const tagsStr = tags !== undefined ? JSON.stringify(tags) : undefined;
  const result = await pool.query(
    `UPDATE projects SET 
      title = COALESCE($1, title), 
      description = COALESCE($2, description), 
      tags = COALESCE($3, tags), 
      github = COALESCE($4, github), 
      live = COALESCE($5, live), 
      image = COALESCE($6, image), 
      sort_order = COALESCE($7, sort_order)
    WHERE id = $8 RETURNING *`,
    [title, description, tagsStr, github, live, image, sort_order, id]
  );
  const row = result.rows[0];
  if (row) row.tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;
  return row;
}

export async function deleteProject(id) {
  await pool.query('DELETE FROM projects WHERE id = $1', [id]);
}

// ─── Visitor queries ───────────────────────────────────────
export async function addVisitor(visitor) {
  const { id, ip, timestamp, source, referrer, browser, os, device, country, page } = visitor;
  await pool.query(
    `INSERT INTO visitors (id, ip, timestamp, source, referrer, browser, os, device, country, page)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, ip, timestamp, source, referrer, browser, os, device, country, page]
  );

  // Update platform stats
  await pool.query(
    `INSERT INTO platform_stats (platform, views, updated_at) 
     VALUES ($1, 1, NOW())
     ON CONFLICT (platform) 
     DO UPDATE SET views = platform_stats.views + 1, updated_at = NOW()`,
    [source]
  );
}

export async function getTotalViews() {
  const result = await pool.query('SELECT COUNT(*) as total FROM visitors');
  return parseInt(result.rows[0].total);
}

export async function getViewsByTimeRange(days) {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM visitors WHERE timestamp >= NOW() - INTERVAL '${parseInt(days)} days'`
  );
  return parseInt(result.rows[0].count);
}

export async function getPlatformStats() {
  const result = await pool.query('SELECT platform, views FROM platform_stats ORDER BY views DESC');
  const stats = {};
  result.rows.forEach((row) => {
    stats[row.platform] = row.views;
  });
  return stats;
}

export async function getVisitors(page = 1, limit = 20, source = null) {
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM visitors';
  let countQuery = 'SELECT COUNT(*) as total FROM visitors';
  const params = [];

  if (source && source !== 'all') {
    query += ' WHERE source = $1';
    countQuery += ' WHERE source = $1';
    params.push(source);
  }

  query += ' ORDER BY timestamp DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(limit, offset);

  const [visitors, count] = await Promise.all([
    pool.query(query, params),
    pool.query(countQuery, source && source !== 'all' ? [source] : []),
  ]);

  return {
    visitors: visitors.rows,
    total: parseInt(count.rows[0].total),
    page,
    pages: Math.ceil(parseInt(count.rows[0].total) / limit),
  };
}

export async function getChartData(days = 30) {
  const result = await pool.query(
    `SELECT DATE(timestamp) as date, COUNT(*) as views
     FROM visitors
     WHERE timestamp >= NOW() - INTERVAL '${days} days'
     GROUP BY DATE(timestamp)
     ORDER BY date ASC`
  );

  const chartData = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dataPoint = result.rows.find((r) => r.date.toISOString().split('T')[0] === dateStr);

    chartData.push({
      date: dateStr,
      views: dataPoint ? parseInt(dataPoint.views) : 0,
      label: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    });
  }

  return chartData;
}

export async function getPlatformDetails() {
  const result = await pool.query(
    `SELECT source, browser, device, COUNT(*) as count
     FROM visitors
     GROUP BY source, browser, device`
  );

  const platforms = {};
  result.rows.forEach((row) => {
    if (!platforms[row.source]) {
      platforms[row.source] = { views: 0, browsers: {}, devices: {} };
    }
    platforms[row.source].views += parseInt(row.count);
    platforms[row.source].browsers[row.browser] =
      (platforms[row.source].browsers[row.browser] || 0) + parseInt(row.count);
    platforms[row.source].devices[row.device] =
      (platforms[row.source].devices[row.device] || 0) + parseInt(row.count);
  });

  return platforms;
}
