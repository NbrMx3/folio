import pg from 'pg';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
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

const DEFAULT_ADMIN_RECOVERY_EMAIL = process.env.ADMIN_RECOVERY_EMAIL || 'kipkemoi386@gmail.com';

function getDefaultAdminAuth() {
  return {
    email: process.env.ADMIN_EMAIL || 'admin@yourdomain.com',
    recoveryEmail: DEFAULT_ADMIN_RECOVERY_EMAIL,
    passwordHash: '',
    resetTokenHash: '',
    resetTokenExpiresAt: null,
    updatedAt: null,
  };
}

function normalizeAdminAuth(record = {}) {
  const defaults = getDefaultAdminAuth();

  return {
    email: record.email ?? defaults.email,
    recoveryEmail: record.recoveryEmail ?? record.recovery_email ?? defaults.recoveryEmail,
    passwordHash: record.passwordHash ?? record.password_hash ?? defaults.passwordHash,
    resetTokenHash: record.resetTokenHash ?? record.reset_token_hash ?? defaults.resetTokenHash,
    resetTokenExpiresAt:
      record.resetTokenExpiresAt ??
      record.reset_token_expires_at ??
      defaults.resetTokenExpiresAt,
    updatedAt: record.updatedAt ?? record.updated_at ?? defaults.updatedAt,
  };
}

export function getDefaultProfile() {
  return {
    picture: '',
    resume: '',
    name: 'CyberDev',
    title: 'Full-Stack Developer',
    bio: '',
    github: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    email: '',
  };
}

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

function normalizeDownloadType(value) {
  const normalized = String(value || 'other').trim().toLowerCase();
  if (normalized === 'resume' || normalized === 'gallery' || normalized === 'photo' || normalized === 'image') {
    return normalized === 'image' ? 'gallery' : normalized;
  }
  return 'other';
}

function toDateKey(value, granularity = 'day') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const iso = date.toISOString();
  if (granularity === 'year') return iso.slice(0, 4);
  if (granularity === 'month') return iso.slice(0, 7);
  return iso.slice(0, 10);
}

function buildDownloadOverview(rows = []) {
  const sorted = rows.slice().sort((a, b) => new Date(b.timestamp || b.created_at || 0) - new Date(a.timestamp || a.created_at || 0));
  const now = Date.now();
  const dayCutoff = now - 24 * 60 * 60 * 1000;
  const monthCutoff = now - 30 * 24 * 60 * 60 * 1000;
  const yearCutoff = now - 365 * 24 * 60 * 60 * 1000;

  const totalDownloads = sorted.length;
  const todayDownloads = sorted.filter((row) => new Date(row.timestamp || row.created_at || 0).getTime() >= dayCutoff).length;
  const monthDownloads = sorted.filter((row) => new Date(row.timestamp || row.created_at || 0).getTime() >= monthCutoff).length;
  const yearDownloads = sorted.filter((row) => new Date(row.timestamp || row.created_at || 0).getTime() >= yearCutoff).length;

  const dailyMap = new Map();
  const monthlyMap = new Map();
  const yearlyMap = new Map();
  const byType = { resume: 0, gallery: 0, other: 0 };

  for (const row of sorted) {
    const timestamp = row.timestamp || row.created_at || new Date().toISOString();
    const dayKey = toDateKey(timestamp, 'day');
    const monthKey = toDateKey(timestamp, 'month');
    const yearKey = toDateKey(timestamp, 'year');
    dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + 1);
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
    yearlyMap.set(yearKey, (yearlyMap.get(yearKey) || 0) + 1);
    const normalizedType = normalizeDownloadType(row.assetType || row.asset_type);
    byType[normalizedType] = (byType[normalizedType] || 0) + 1;
  }

  const dailyDownloads = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-30)
    .map(([label, count]) => ({ label, count }));

  const monthlyDownloads = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([label, count]) => ({ label, count }));

  const yearlyDownloads = Array.from(yearlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));

  return {
    totalDownloads,
    todayDownloads,
    monthDownloads,
    yearDownloads,
    byType,
    dailyDownloads,
    monthlyDownloads,
    yearlyDownloads,
    recentDownloads: sorted.slice(0, 20),
  };
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
            resume TEXT DEFAULT '',
            name TEXT DEFAULT 'CyberDev',
            title TEXT DEFAULT 'Full-Stack Developer',
            bio TEXT DEFAULT '',
            github TEXT DEFAULT '',
            linkedin TEXT DEFAULT '',
            twitter TEXT DEFAULT '',
            facebook TEXT DEFAULT '',
            instagram TEXT DEFAULT '',
            tiktok TEXT DEFAULT '',
            email TEXT DEFAULT '',
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);

        // Add columns if they don't exist (for existing databases)
        const profileCols = [
          'resume',
          'bio',
          'github',
          'linkedin',
          'twitter',
          'facebook',
          'instagram',
          'tiktok',
          'email',
        ];
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

        // Create gallery table
        await client.query(`
          CREATE TABLE IF NOT EXISTS gallery (
            id SERIAL PRIMARY KEY,
            url TEXT NOT NULL,
            type TEXT DEFAULT 'photo',
            title TEXT DEFAULT '',
            description TEXT DEFAULT '',
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);

        // Create contact messages table
        await client.query(`
          CREATE TABLE IF NOT EXISTS contact_messages (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            source TEXT DEFAULT 'portfolio',
            status TEXT DEFAULT 'new',
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
            continent TEXT DEFAULT 'Unknown',
            country TEXT DEFAULT 'Unknown',
            county TEXT DEFAULT 'Unknown',
            district TEXT DEFAULT 'Unknown',
            division TEXT DEFAULT 'Unknown',
            city TEXT DEFAULT 'Unknown',
            region TEXT DEFAULT 'Unknown',
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            page TEXT DEFAULT '/'
          )
        `);

        // Create download logs table
        await client.query(`
          CREATE TABLE IF NOT EXISTS download_logs (
            id TEXT PRIMARY KEY,
            asset_type TEXT DEFAULT 'other',
            asset_name TEXT DEFAULT '',
            asset_url TEXT DEFAULT '',
            action TEXT DEFAULT 'download',
            referrer TEXT DEFAULT 'direct',
            page TEXT DEFAULT '/',
            ip TEXT DEFAULT 'unknown',
            browser TEXT DEFAULT 'Unknown',
            os TEXT DEFAULT 'Unknown',
            device TEXT DEFAULT 'desktop',
            application TEXT DEFAULT 'Unknown',
            user_agent TEXT DEFAULT '',
            timestamp TIMESTAMP DEFAULT NOW()
          )
        `);

        // Migrate existing visitors table — add geo columns if absent
        const visitorTextCols = ['city', 'region', 'continent', 'county', 'district', 'division'];
        for (const col of visitorTextCols) {
          await client.query(`
            DO $$ BEGIN
              ALTER TABLE visitors ADD COLUMN ${col} TEXT DEFAULT 'Unknown';
            EXCEPTION WHEN duplicate_column THEN NULL;
            END $$
          `);
        }

        for (const col of ['latitude', 'longitude']) {
          await client.query(`
            DO $$ BEGIN
              ALTER TABLE visitors ADD COLUMN ${col} DOUBLE PRECISION;
            EXCEPTION WHEN duplicate_column THEN NULL;
            END $$
          `);
        }

        // Create platform_stats table
        await client.query(`
          CREATE TABLE IF NOT EXISTS platform_stats (
            platform TEXT PRIMARY KEY,
            views INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS admin_auth (
            id INTEGER PRIMARY KEY,
            email TEXT NOT NULL,
            recovery_email TEXT NOT NULL,
            password_hash TEXT DEFAULT '',
            reset_token_hash TEXT DEFAULT '',
            reset_token_expires_at TIMESTAMP NULL,
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);

        // Insert default profile if not exists
        const profileExists = await client.query('SELECT id FROM profile LIMIT 1');
        if (profileExists.rows.length === 0) {
          await client.query(`
            INSERT INTO profile (
              picture,
              resume,
              name,
              title,
              bio,
              github,
              linkedin,
              twitter,
              facebook,
              instagram,
              tiktok,
              email
            )
            VALUES ('', '', 'CyberDev', 'Full-Stack Developer', '', '', '', '', '', '', '', '')
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

        const defaultAdminAuth = getDefaultAdminAuth();
        await client.query(
          `
            INSERT INTO admin_auth (id, email, recovery_email)
            VALUES (1, $1, $2)
            ON CONFLICT (id) DO UPDATE
            SET
              email = COALESCE(NULLIF(admin_auth.email, ''), EXCLUDED.email),
              recovery_email = COALESCE(NULLIF(admin_auth.recovery_email, ''), EXCLUDED.recovery_email)
          `,
          [defaultAdminAuth.email, defaultAdminAuth.recoveryEmail]
        );

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
      const defaultProfile = {
        picture: '',
        resume: '',
        name: 'CyberDev',
        title: 'Full-Stack Developer',
        bio: '',
        github: '',
        linkedin: '',
        twitter: '',
        facebook: '',
        instagram: '',
        tiktok: '',
        email: '',
      };
      db.profile = { ...defaultProfile, ...(db.profile || {}) };
      if (!db.skills) db.skills = [
        { id: 1, icon: 'FaCode', title: 'Frontend Development', description: 'React, Vue, HTML5, CSS3, JavaScript, TypeScript', sort_order: 0 },
        { id: 2, icon: 'FaNodeJs', title: 'Backend Development', description: 'Node.js, Python, MongoDB, REST APIs, GraphQL', sort_order: 1 },
        { id: 3, icon: 'FaReact', title: 'Modern Frameworks', description: 'React, Next.js, Vite, Express, TailwindCSS', sort_order: 2 }
      ];
      if (!db.projects) db.projects = [];
      if (!db.gallery) db.gallery = [];
      if (!db.contactMessages) db.contactMessages = [];
      if (!db.visitors) db.visitors = [];
      if (!db.platformStats) db.platformStats = {};
      db.adminAuth = normalizeAdminAuth(db.adminAuth);
      await writeJsonDb(db);
      console.log('JSON DB initialized for local fallback');
    }

    await ensureJsonDefaults();
  }
}

// ─── Profile queries ───────────────────────────────────────
export async function getAdminAuth() {
  if (usingPostgres && pool) {
    const result = await pool.query(
      `
        SELECT email, recovery_email, password_hash, reset_token_hash, reset_token_expires_at, updated_at
        FROM admin_auth
        WHERE id = 1
        LIMIT 1
      `
    );

    return normalizeAdminAuth(result.rows[0]);
  }

  const db = await readJsonDb();
  return normalizeAdminAuth(db.adminAuth);
}

export async function updateAdminAuth(data) {
  if (usingPostgres && pool) {
    const columnMap = {
      email: 'email',
      recoveryEmail: 'recovery_email',
      passwordHash: 'password_hash',
      resetTokenHash: 'reset_token_hash',
      resetTokenExpiresAt: 'reset_token_expires_at',
    };

    const updates = [];
    const values = [];
    let index = 1;

    for (const [key, column] of Object.entries(columnMap)) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        updates.push(`${column} = $${index++}`);
        values.push(key === 'resetTokenExpiresAt' && data[key] ? new Date(data[key]) : data[key]);
      }
    }

    if (updates.length === 0) {
      return getAdminAuth();
    }

    updates.push('updated_at = NOW()');
    values.push(1);

    const result = await pool.query(
      `
        UPDATE admin_auth
        SET ${updates.join(', ')}
        WHERE id = $${index}
        RETURNING email, recovery_email, password_hash, reset_token_hash, reset_token_expires_at, updated_at
      `,
      values
    );

    return normalizeAdminAuth(result.rows[0]);
  }

  const db = await readJsonDb();
  db.adminAuth = normalizeAdminAuth({
    ...db.adminAuth,
    ...data,
  });
  await writeJsonDb(db);
  return db.adminAuth;
}

export async function getProfile() {
  if (usingPostgres && pool) {
    try {
      const result = await pool.query(
        'SELECT picture, resume, name, title, bio, github, linkedin, twitter, facebook, instagram, tiktok, email FROM profile LIMIT 1'
      );
      return result.rows[0] || getDefaultProfile();
    } catch (error) {
      console.warn('Postgres profile read failed, falling back to JSON DB:', error.message);
    }
  }

  const db = await readJsonDb();
  return { ...getDefaultProfile(), ...(db.profile || {}) };
}

export async function updateProfile(data) {
  if (usingPostgres && pool) {
    const {
      picture,
      resume,
      name,
      title,
      bio,
      github,
      linkedin,
      twitter,
      facebook,
      instagram,
      tiktok,
      email,
    } = data;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (picture !== undefined) { updates.push(`picture = $${paramCount++}`); values.push(picture); }
    if (resume !== undefined) { updates.push(`resume = $${paramCount++}`); values.push(resume); }
    if (name !== undefined) { updates.push(`name = $${paramCount++}`); values.push(name); }
    if (title !== undefined) { updates.push(`title = $${paramCount++}`); values.push(title); }
    if (bio !== undefined) { updates.push(`bio = $${paramCount++}`); values.push(bio); }
    if (github !== undefined) { updates.push(`github = $${paramCount++}`); values.push(github); }
    if (linkedin !== undefined) { updates.push(`linkedin = $${paramCount++}`); values.push(linkedin); }
    if (twitter !== undefined) { updates.push(`twitter = $${paramCount++}`); values.push(twitter); }
    if (facebook !== undefined) { updates.push(`facebook = $${paramCount++}`); values.push(facebook); }
    if (instagram !== undefined) { updates.push(`instagram = $${paramCount++}`); values.push(instagram); }
    if (tiktok !== undefined) { updates.push(`tiktok = $${paramCount++}`); values.push(tiktok); }
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
  db.profile = db.profile || {
    picture: '',
    resume: '',
    name: 'CyberDev',
    title: 'Full-Stack Developer',
    bio: '',
    github: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    email: '',
  };
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

// ─── Gallery queries ───────────────────────────────────────
export async function getGallery() {
  if (usingPostgres && pool) {
    const result = await pool.query('SELECT * FROM gallery ORDER BY created_at DESC, id DESC');
    return result.rows;
  }
  const db = await readJsonDb();
  return (db.gallery || []).sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : null;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : null;

    if (aTime && bTime) return bTime - aTime;
    if (aTime && !bTime) return -1;
    if (!aTime && bTime) return 1;
    return (b.id || 0) - (a.id || 0);
  });
}

export async function createGalleryItem(data) {
  if (usingPostgres && pool) {
    const { url, type, title, description, sort_order } = data;
    const result = await pool.query(
      'INSERT INTO gallery (url, type, title, description, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [url, type || 'photo', title || '', description || '', sort_order || 0]
    );
    return result.rows[0];
  }

  const db = await readJsonDb();
  db.gallery = db.gallery || [];
  const nextId = db.gallery.length ? Math.max(...db.gallery.map(g => g.id || 0)) + 1 : 1;
  const item = { id: nextId, url: data.url, type: data.type || 'photo', title: data.title || '', description: data.description || '', sort_order: data.sort_order || 0 };
  db.gallery.push(item);
  await writeJsonDb(db);
  return item;
}

export async function updateGalleryItem(id, data) {
  if (usingPostgres && pool) {
    const { url, type, title, description, sort_order } = data;
    const result = await pool.query(
      'UPDATE gallery SET url = COALESCE($1, url), type = COALESCE($2, type), title = COALESCE($3, title), description = COALESCE($4, description), sort_order = COALESCE($5, sort_order) WHERE id = $6 RETURNING *',
      [url, type, title, description, sort_order, id]
    );
    return result.rows[0];
  }

  const db = await readJsonDb();
  db.gallery = db.gallery || [];
  const idx = db.gallery.findIndex(g => String(g.id) === String(id));
  if (idx === -1) return null;
  db.gallery[idx] = { ...db.gallery[idx], ...data };
  await writeJsonDb(db);
  return db.gallery[idx];
}

export async function deleteGalleryItem(id) {
  if (usingPostgres && pool) {
    await pool.query('DELETE FROM gallery WHERE id = $1', [id]);
    return;
  }
  const db = await readJsonDb();
  db.gallery = (db.gallery || []).filter(g => String(g.id) !== String(id));
  await writeJsonDb(db);
}

// ─── Contact queries ──────────────────────────────────────
export async function createContactMessage(data) {
  const { name, email, message, source = 'portfolio', status = 'new' } = data;

  if (usingPostgres && pool) {
    const result = await pool.query(
      'INSERT INTO contact_messages (name, email, message, source, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, message, source, status]
    );
    return result.rows[0];
  }

  const db = await readJsonDb();
  db.contactMessages = db.contactMessages || [];
  const nextId = db.contactMessages.length ? Math.max(...db.contactMessages.map((entry) => entry.id || 0)) + 1 : 1;
  const entry = {
    id: nextId,
    name,
    email,
    message,
    source,
    status,
    created_at: new Date().toISOString(),
  };
  db.contactMessages.push(entry);
  await writeJsonDb(db);
  return entry;
}

// ─── Visitor queries ───────────────────────────────────────
export async function addVisitor(visitor) {
  const {
    id,
    ip,
    timestamp,
    source,
    referrer,
    browser,
    os,
    device,
    continent,
    country,
    county,
    district,
    division,
    city,
    region,
    latitude,
    longitude,
    page,
  } = visitor;
  if (usingPostgres && pool) {
    await pool.query(
      `INSERT INTO visitors (
        id, ip, timestamp, source, referrer, browser, os, device,
        continent, country, county, district, division, city, region,
        latitude, longitude, page
      )
       VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18
      )`,
      [
        id,
        ip,
        timestamp,
        source,
        referrer,
        browser,
        os,
        device,
        continent || 'Unknown',
        country || 'Unknown',
        county || 'Unknown',
        district || 'Unknown',
        division || 'Unknown',
        city || 'Unknown',
        region || 'Unknown',
        latitude ?? null,
        longitude ?? null,
        page,
      ]
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
  db.downloadLogs = db.downloadLogs || [];
  db.visitors.push({
    id,
    ip,
    timestamp,
    source,
    referrer,
    browser,
    os,
    device: device || 'desktop',
    continent: continent || 'Unknown',
    country: country || 'Unknown',
    county: county || 'Unknown',
    district: district || 'Unknown',
    division: division || 'Unknown',
    city: city || 'Unknown',
    region: region || 'Unknown',
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    page: page || '/',
  });
  db.platformStats[source] = (db.platformStats[source] || 0) + 1;
  await writeJsonDb(db);
}

export async function createDownloadLog(entry) {
  const normalizedEntry = {
    id: entry.id || randomUUID(),
    assetType: normalizeDownloadType(entry.assetType || entry.asset_type),
    assetName: entry.assetName || entry.asset_name || '',
    assetUrl: entry.assetUrl || entry.asset_url || '',
    action: entry.action || 'download',
    referrer: entry.referrer || 'direct',
    page: entry.page || '/',
    ip: entry.ip || 'unknown',
    browser: entry.browser || 'Unknown',
    os: entry.os || 'Unknown',
    device: entry.device || 'desktop',
    application: entry.application || entry.browser || 'Unknown',
    userAgent: entry.userAgent || entry.user_agent || '',
    timestamp: entry.timestamp || new Date().toISOString(),
  };

  if (usingPostgres && pool) {
    await pool.query(
      `INSERT INTO download_logs (
        id, asset_type, asset_name, asset_url, action, referrer, page, ip,
        browser, os, device, application, user_agent, timestamp
      )
       VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14
      )`,
      [
        normalizedEntry.id,
        normalizedEntry.assetType,
        normalizedEntry.assetName,
        normalizedEntry.assetUrl,
        normalizedEntry.action,
        normalizedEntry.referrer,
        normalizedEntry.page,
        normalizedEntry.ip,
        normalizedEntry.browser,
        normalizedEntry.os,
        normalizedEntry.device,
        normalizedEntry.application,
        normalizedEntry.userAgent,
        normalizedEntry.timestamp,
      ]
    );
    return normalizedEntry;
  }

  const db = await readJsonDb();
  db.downloadLogs = db.downloadLogs || [];
  db.downloadLogs.push(normalizedEntry);
  await writeJsonDb(db);
  return normalizedEntry;
}

export async function getDownloadLogs(page = 1, limit = 20) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

  if (usingPostgres && pool) {
    const offset = (safePage - 1) * safeLimit;
    const [logsResult, countResult] = await Promise.all([
      pool.query('SELECT * FROM download_logs ORDER BY timestamp DESC LIMIT $1 OFFSET $2', [safeLimit, offset]),
      pool.query('SELECT COUNT(*) as total FROM download_logs'),
    ]);

    return {
      logs: logsResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
      page: safePage,
      pages: Math.max(1, Math.ceil(parseInt(countResult.rows[0].total, 10) / safeLimit)),
    };
  }

  const db = await readJsonDb();
  const logs = (db.downloadLogs || [])
    .slice()
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  const total = logs.length;
  const offset = (safePage - 1) * safeLimit;

  return {
    logs: logs.slice(offset, offset + safeLimit),
    total,
    page: safePage,
    pages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export async function getDownloadSummary() {
  if (usingPostgres && pool) {
    const [rowsResult, dailyResult, monthlyResult, yearlyResult] = await Promise.all([
      pool.query('SELECT * FROM download_logs ORDER BY timestamp DESC'),
      pool.query(
        `SELECT COUNT(*) as count FROM download_logs WHERE timestamp >= NOW() - INTERVAL '1 day'`
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM download_logs WHERE timestamp >= NOW() - INTERVAL '30 days'`
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM download_logs WHERE timestamp >= NOW() - INTERVAL '365 days'`
      ),
    ]);

    const overview = buildDownloadOverview(rowsResult.rows);
    return {
      ...overview,
      todayDownloads: parseInt(dailyResult.rows[0].count, 10),
      monthDownloads: parseInt(monthlyResult.rows[0].count, 10),
      yearDownloads: parseInt(yearlyResult.rows[0].count, 10),
    };
  }

  const db = await readJsonDb();
  return buildDownloadOverview(db.downloadLogs || []);
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
    const countParams = [];
    const normalizedSource = typeof source === 'string' ? source.trim() : '';
    const isProjectClicks = normalizedSource === 'project_clicks';
    const isBrowserFilter = normalizedSource.startsWith('browser:');
    const isOsFilter = normalizedSource.startsWith('os:');
    const isIosSafari = normalizedSource === 'ios_safari';
    const isAndroid = normalizedSource === 'android';
    const isChrome = normalizedSource === 'chrome';

    if (isProjectClicks) {
      query += ' WHERE page LIKE $1 AND page LIKE $2';
      countQuery += ' WHERE page LIKE $1 AND page LIKE $2';
      params.push('/projects/%', '%link=%');
      countParams.push('/projects/%', '%link=%');
    } else if (isIosSafari) {
      query += ' WHERE os ILIKE $1 AND browser ILIKE $2';
      countQuery += ' WHERE os ILIKE $1 AND browser ILIKE $2';
      params.push('%iOS%', '%Safari%');
      countParams.push('%iOS%', '%Safari%');
    } else if (isAndroid) {
      query += ' WHERE os ILIKE $1';
      countQuery += ' WHERE os ILIKE $1';
      params.push('%Android%');
      countParams.push('%Android%');
    } else if (isChrome) {
      query += ' WHERE browser ILIKE $1';
      countQuery += ' WHERE browser ILIKE $1';
      params.push('%Chrome%');
      countParams.push('%Chrome%');
    } else if (isBrowserFilter) {
      const browserValue = normalizedSource.replace(/^browser:/i, '').trim();
      query += ' WHERE browser ILIKE $1';
      countQuery += ' WHERE browser ILIKE $1';
      params.push(`%${browserValue}%`);
      countParams.push(`%${browserValue}%`);
    } else if (isOsFilter) {
      const osValue = normalizedSource.replace(/^os:/i, '').trim();
      query += ' WHERE os ILIKE $1';
      countQuery += ' WHERE os ILIKE $1';
      params.push(`%${osValue}%`);
      countParams.push(`%${osValue}%`);
    } else if (normalizedSource && normalizedSource !== 'all') {
      query += ' WHERE source = $1';
      countQuery += ' WHERE source = $1';
      params.push(normalizedSource);
      countParams.push(normalizedSource);
    }

    query += ' ORDER BY timestamp DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const [visitors, count] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams),
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
  const normalizedSource = typeof source === 'string' ? source.trim() : '';
  if (normalizedSource === 'project_clicks') {
    visitors = visitors.filter((v) => {
      const pageValue = String(v.page || '');
      return pageValue.startsWith('/projects/') && pageValue.includes('link=');
    });
  } else if (normalizedSource === 'ios_safari') {
    visitors = visitors.filter((v) =>
      String(v.os || '').toLowerCase().includes('ios')
      && String(v.browser || '').toLowerCase().includes('safari')
    );
  } else if (normalizedSource === 'android') {
    visitors = visitors.filter((v) => String(v.os || '').toLowerCase().includes('android'));
  } else if (normalizedSource === 'chrome') {
    visitors = visitors.filter((v) => String(v.browser || '').toLowerCase().includes('chrome'));
  } else if (normalizedSource.startsWith('browser:')) {
    const browserValue = normalizedSource.replace(/^browser:/i, '').trim().toLowerCase();
    visitors = visitors.filter((v) => String(v.browser || '').toLowerCase().includes(browserValue));
  } else if (normalizedSource.startsWith('os:')) {
    const osValue = normalizedSource.replace(/^os:/i, '').trim().toLowerCase();
    visitors = visitors.filter((v) => String(v.os || '').toLowerCase().includes(osValue));
  } else if (normalizedSource && normalizedSource !== 'all') {
    visitors = visitors.filter(v => v.source === normalizedSource);
  }
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

export async function clearAnalyticsData() {
  if (usingPostgres && pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM visitors');
      await client.query('DELETE FROM platform_stats');
      await client.query('COMMIT');
      return;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  const db = await readJsonDb();
  db.visitors = [];
  db.platformStats = {};
  db.totalViews = 0;
  await writeJsonDb(db);
}
