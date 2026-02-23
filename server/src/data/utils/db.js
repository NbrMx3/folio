import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const { Pool } = pg;

// Try to use a Postgres pool when DATABASE_URL is provided; otherwise fall back to JSON file DB
const rawDatabaseUrl = process.env.DATABASE_URL;
let usingPostgres = false;
let pool = null;

function maskDatabaseUrl(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = '*****';
    return u.toString();
  } catch (e) {
    return url.replace(/:(\/\/)?([^:]+):([^@]+)@/, ':$1$2:*****@');
  }
}

let connectionString = null;
if (rawDatabaseUrl) {
  try {
    const u = new URL(rawDatabaseUrl);
    u.search = '';
    connectionString = u.toString();
  } catch (err) {
    connectionString = rawDatabaseUrl.split('?')[0];
  }

  console.log('Using DATABASE_URL:', maskDatabaseUrl(connectionString));

  try {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected pool error:', err.message);
    });

    usingPostgres = true;
  } catch (e) {
    console.warn('Postgres pool creation failed, falling back to JSON DB:', e.message);
    usingPostgres = false;
    pool = null;
  }
} else {
  console.warn('DATABASE_URL not set — using JSON file fallback for data storage');
}

export { pool };

// JSON DB helpers
const DB_JSON_PATH = path.join(__dirname, '..', 'db.json');

async function readJsonDb() {
  try {
    const raw = await fs.readFile(DB_JSON_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return {};
    }
    throw e;
  }
}

async function writeJsonDb(obj) {
  await fs.writeFile(DB_JSON_PATH, JSON.stringify(obj, null, 2), 'utf-8');
}

// Initialize database tables
export async function initDatabase() {
  // If Postgres is available, try to initialize the schema there.
  if (usingPostgres && pool) {
    try {
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
    } catch (err) {
      console.error('Could not connect to Postgres during init:', err.message);
      usingPostgres = false;
    }
  }

  // If Postgres is not used, ensure JSON DB has sensible defaults
  if (!usingPostgres) {
    async function ensureJsonDefaults() {
      const db = await readJsonDb();
      if (!db.profile) db.profile = { picture: '', name: 'CyberDev', title: 'Full-Stack Developer', bio: '', github: '', linkedin: '', email: '' };
      if (!db.skills) db.skills = [
        { id: 1, icon: 'FaCode', title: 'Frontend Development', description: 'React, Vue, HTML5, CSS3, JavaScript, TypeScript', sort_order: 0 },
        { id: 2, icon: 'FaNodeJs', title: 'Backend Development', description: 'Node.js, Python, MongoDB, REST APIs, GraphQL', sort_order: 1 },
        { id: 3, icon: 'FaReact', title: 'Modern Frameworks', description: 'React, Next.js, Vite, Express, TailwindCSS', sort_order: 2 }
      ];
      if (!db.projects) db.projects = [];
      if (!db.visitors) db.visitors = [];
      if (!db.platformStats) db.platformStats = {};
      await writeJsonDb(db);
      console.log('JSON DB initialized for local fallback');
    }

    await ensureJsonDefaults();
  }
}

// ─── Profile queries ───────────────────────────────────────
export async function getProfile() {
  if (usingPostgres && pool) {
    const result = await pool.query('SELECT picture, name, title, bio, github, linkedin, email FROM profile LIMIT 1');
    return result.rows[0] || { picture: '', name: 'CyberDev', title: 'Full-Stack Developer', bio: '', github: '', linkedin: '', email: '' };
  }

  const db = await readJsonDb();
  return db.profile || { picture: '', name: 'CyberDev', title: 'Full-Stack Developer', bio: '', github: '', linkedin: '', email: '' };
}

export async function updateProfile(data) {
  if (usingPostgres && pool) {
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

  const db = await readJsonDb();
  db.profile = db.profile || { picture: '', name: 'CyberDev', title: 'Full-Stack Developer', bio: '', github: '', linkedin: '', email: '' };
  db.profile = { ...db.profile, ...data };
  await writeJsonDb(db);
  return db.profile;
}

// ─── Skills queries ────────────────────────────────────────
export async function getSkills() {
  if (usingPostgres && pool) {
    const result = await pool.query('SELECT * FROM skills ORDER BY sort_order ASC, id ASC');
    return result.rows;
  }
  const db = await readJsonDb();
  return (db.skills || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

export async function createSkill(data) {
  if (usingPostgres && pool) {
    const { icon, title, description, sort_order } = data;
    const result = await pool.query(
      'INSERT INTO skills (icon, title, description, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [icon || 'FaCode', title, description || '', sort_order || 0]
    );
    return result.rows[0];
  }

  const db = await readJsonDb();
  db.skills = db.skills || [];
  const nextId = db.skills.length ? Math.max(...db.skills.map(s => s.id || 0)) + 1 : 1;
  const skill = { id: nextId, icon: data.icon || 'FaCode', title: data.title, description: data.description || '', sort_order: data.sort_order || 0 };
  db.skills.push(skill);
  await writeJsonDb(db);
  return skill;
}

export async function updateSkill(id, data) {
  if (usingPostgres && pool) {
    const { icon, title, description, sort_order } = data;
    const result = await pool.query(
      'UPDATE skills SET icon = COALESCE($1, icon), title = COALESCE($2, title), description = COALESCE($3, description), sort_order = COALESCE($4, sort_order) WHERE id = $5 RETURNING *',
      [icon, title, description, sort_order, id]
    );
    return result.rows[0];
  }

  const db = await readJsonDb();
  db.skills = db.skills || [];
  const idx = db.skills.findIndex(s => String(s.id) === String(id));
  if (idx === -1) return null;
  db.skills[idx] = { ...db.skills[idx], ...data };
  await writeJsonDb(db);
  return db.skills[idx];
}

export async function deleteSkill(id) {
  if (usingPostgres && pool) {
    await pool.query('DELETE FROM skills WHERE id = $1', [id]);
    return;
  }
  const db = await readJsonDb();
  db.skills = (db.skills || []).filter(s => String(s.id) !== String(id));
  await writeJsonDb(db);
}

// ─── Projects queries ──────────────────────────────────────
export async function getProjects() {
  if (usingPostgres && pool) {
    const result = await pool.query('SELECT * FROM projects ORDER BY sort_order ASC, id ASC');
    return result.rows.map(row => ({
      ...row,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
    }));
  }
  const db = await readJsonDb();
  return (db.projects || []).map(p => ({ ...p, tags: p.tags || [] })).sort((a,b)=> (a.sort_order||0)-(b.sort_order||0));
}

export async function createProject(data) {
  if (usingPostgres && pool) {
    const { title, description, tags, github, live, image, sort_order } = data;
    const result = await pool.query(
      'INSERT INTO projects (title, description, tags, github, live, image, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title, description || '', JSON.stringify(tags || []), github || '#', live || '#', image || '', sort_order || 0]
    );
    const row = result.rows[0];
    row.tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;
    return row;
  }

  const db = await readJsonDb();
  db.projects = db.projects || [];
  const nextId = db.projects.length ? Math.max(...db.projects.map(p => p.id || 0)) + 1 : 1;
  const project = { id: nextId, title: data.title, description: data.description || '', tags: data.tags || [], github: data.github || '#', live: data.live || '#', image: data.image || '', sort_order: data.sort_order || 0 };
  db.projects.push(project);
  await writeJsonDb(db);
  return project;
}

export async function updateProject(id, data) {
  if (usingPostgres && pool) {
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

  const db = await readJsonDb();
  db.projects = db.projects || [];
  const idx = db.projects.findIndex(p => String(p.id) === String(id));
  if (idx === -1) return null;
  const updated = { ...db.projects[idx], ...data };
  if (data.tags !== undefined) updated.tags = data.tags;
  db.projects[idx] = updated;
  await writeJsonDb(db);
  return updated;
}

export async function deleteProject(id) {
  if (usingPostgres && pool) {
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    return;
  }
  const db = await readJsonDb();
  db.projects = (db.projects || []).filter(p => String(p.id) !== String(id));
  await writeJsonDb(db);
}

// ─── Visitor queries ───────────────────────────────────────
export async function addVisitor(visitor) {
  const { id, ip, timestamp, source, referrer, browser, os, device, country, page } = visitor;
  if (usingPostgres && pool) {
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
    return;
  }

  const db = await readJsonDb();
  db.visitors = db.visitors || [];
  db.platformStats = db.platformStats || {};
  db.visitors.push({ id, ip, timestamp, source, referrer, browser, os, device: device || 'desktop', country: country || 'Unknown', page: page || '/' });
  db.platformStats[source] = (db.platformStats[source] || 0) + 1;
  await writeJsonDb(db);
}

export async function getTotalViews() {
  if (usingPostgres && pool) {
    const result = await pool.query('SELECT COUNT(*) as total FROM visitors');
    return parseInt(result.rows[0].total);
  }
  const db = await readJsonDb();
  return (db.visitors || []).length;
}

export async function getViewsByTimeRange(days) {
  if (usingPostgres && pool) {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM visitors WHERE timestamp >= NOW() - INTERVAL '${parseInt(days)} days'`
    );
    return parseInt(result.rows[0].count);
  }
  const db = await readJsonDb();
  const cutoff = Date.now() - parseInt(days) * 24 * 60 * 60 * 1000;
  return (db.visitors || []).filter(v => new Date(v.timestamp).getTime() >= cutoff).length;
}

export async function getPlatformStats() {
  if (usingPostgres && pool) {
    const result = await pool.query('SELECT platform, views FROM platform_stats ORDER BY views DESC');
    const stats = {};
    result.rows.forEach((row) => {
      stats[row.platform] = row.views;
    });
    return stats;
  }
  const db = await readJsonDb();
  return db.platformStats || {};
}

export async function getVisitors(page = 1, limit = 20, source = null) {
  if (usingPostgres && pool) {
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

  const db = await readJsonDb();
  let visitors = db.visitors || [];
  if (source && source !== 'all') visitors = visitors.filter(v => v.source === source);
  visitors = visitors.slice().sort((a,b)=> new Date(b.timestamp) - new Date(a.timestamp));
  const total = visitors.length;
  const start = (page - 1) * limit;
  const pageItems = visitors.slice(start, start + limit);
  return { visitors: pageItems, total, page, pages: Math.ceil(total / limit) };
}

export async function getChartData(days = 30) {
  if (usingPostgres && pool) {
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

  const db = await readJsonDb();
  const now = new Date();
  const daysArr = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    daysArr.push({ dateStr, label: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }) });
  }
  const counts = {};
  (db.visitors || []).forEach(v => {
    const d = new Date(v.timestamp).toISOString().split('T')[0];
    counts[d] = (counts[d] || 0) + 1;
  });
  return daysArr.map(d => ({ date: d.dateStr, views: counts[d.dateStr] || 0, label: d.label }));
}

export async function getPlatformDetails() {
  if (usingPostgres && pool) {
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

  const db = await readJsonDb();
  const platforms = {};
  (db.visitors || []).forEach((v) => {
    const src = v.source || 'Unknown';
    if (!platforms[src]) platforms[src] = { views: 0, browsers: {}, devices: {} };
    platforms[src].views += 1;
    platforms[src].browsers[v.browser] = (platforms[src].browsers[v.browser] || 0) + 1;
    platforms[src].devices[v.device || 'desktop'] = (platforms[src].devices[v.device || 'desktop'] || 0) + 1;
  });
  return platforms;
}
