import { Router } from 'express';
import { query } from '../db';

export const crewRoutes = Router();

crewRoutes.get('/', async (req, res) => {
  try {
    // We fetch crew members and join with vessels if they are assigned
    const { rows } = await query(`
      SELECT c.id, u.first_name, u.last_name, c.nationality, c.rank, c.photo_url,
             a.status, v.name as vessel_name, a.sign_off_date
      FROM crew_members c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN (
        -- Select the most recent active assignment for each crew member
        SELECT crew_member_id, vessel_id, sign_off_date, 'ON BOARD' as status
        FROM crew_assignments
        WHERE sign_on_date <= NOW() AND (sign_off_date IS NULL OR sign_off_date > NOW())
      ) a ON c.id = a.crew_member_id
      LEFT JOIN vessels v ON a.vessel_id = v.id
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching crew:', error);
    res.status(500).json({ error: 'Failed to fetch crew parameters' });
  }
});

crewRoutes.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Get crew basic info
    const { rows: crewRes } = await query(`
      SELECT c.id, u.first_name, u.last_name, u.email, c.nationality, c.date_of_birth, c.rank, c.seaman_book_number, c.photo_url
      FROM crew_members c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [id]);

    if (crewRes.length === 0) return res.status(404).json({ error: 'Crew not found' });
    const crew = crewRes[0];

    // 2. Get certifications
    const { rows: certs } = await query(`
      SELECT id, certificate_name, certificate_number, issue_date, expiry_date
      FROM certifications
      WHERE crew_member_id = $1
      ORDER BY expiry_date ASC
    `, [id]);

    // 3. Get assignment history
    const { rows: assignments } = await query(`
      SELECT a.id, v.name as vessel_name, a.role_onboard, a.sign_on_date, a.sign_off_date
      FROM crew_assignments a
      JOIN vessels v ON a.vessel_id = v.id
      WHERE a.crew_member_id = $1
      ORDER BY a.sign_on_date DESC
    `, [id]);

    res.json({
      ...crew,
      certifications: certs,
      assignments: assignments
    });

  } catch (error) {
    console.error('Error fetching crew details:', error);
    res.status(500).json({ error: 'Failed to fetch crew details' });
  }
});

import { authenticateToken, requireRole } from '../middleware/auth';

// Update crew member specific details
crewRoutes.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, seaman_book_number, rank, nationality, date_of_birth, photo_url } = req.body;

  try {
    await query('BEGIN');

    // 1. Get user_id from the crew member
    const { rows: crewRows } = await query('SELECT user_id FROM crew_members WHERE id = $1', [id]);
    if (crewRows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'Crew member not found' });
    }
    const userId = crewRows[0].user_id;

    // 2. Update users table
    await query(
      `UPDATE users SET first_name = $1, last_name = $2, email = $3, updated_at = NOW() WHERE id = $4`,
      [first_name, last_name, email, userId]
    );

    // 3. Update crew_members table
    const result = await query(
      `UPDATE crew_members 
       SET seaman_book_number = $1, rank = $2, nationality = $3, date_of_birth = $4, photo_url = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [seaman_book_number, rank, nationality, date_of_birth, photo_url, id]
    );

    await query('COMMIT');

    res.json({
       ...result.rows[0],
       first_name, 
       last_name, 
       email
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Error updating crew member:', error);
    res.status(500).json({ error: 'Failed to update crew member' });
  }
});

import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${req.params.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

crewRoutes.post('/:id/photo', authenticateToken, requireRole(['ADMIN']), upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { id } = req.params;
  const photoUrl = `http://localhost:4000/uploads/avatars/${req.file.filename}`;

  try {
    const result = await query(
      `UPDATE crew_members SET photo_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [photoUrl, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Crew member not found' });

    res.json({ photo_url: photoUrl });
  } catch (err) {
    console.error('Error updating crew photo:', err);
    res.status(500).json({ error: 'Failed to save photo' });
  }
});

// Add a new certification
crewRoutes.post('/:id/certifications', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  const { certificate_name, certificate_number, issue_date, expiry_date } = req.body;

  try {
    const result = await query(
      `INSERT INTO certifications (crew_member_id, certificate_name, certificate_number, issue_date, expiry_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, certificate_name, certificate_number, issue_date, expiry_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding certification:', error);
    res.status(500).json({ error: 'Failed to add certification' });
  }
});

// Add a new assignment
crewRoutes.post('/:id/assignments', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  const { vessel_id, sign_on_date, role_onboard } = req.body;

  try {
    await query('BEGIN');

    // 1. End any existing active assignments for this crew member automatically
    await query(
      `UPDATE crew_assignments 
       SET sign_off_date = $1, updated_at = NOW() 
       WHERE crew_member_id = $2 AND sign_off_date IS NULL`,
      [sign_on_date, id] // Closes on the same day as the new sign-on
    );

    // 2. Create the new active assignment
    const result = await query(
      `INSERT INTO crew_assignments (crew_member_id, vessel_id, sign_on_date, role_onboard)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, vessel_id, sign_on_date, role_onboard]
    );

    await query('COMMIT');

    // Fetch the inserted assignment with vessel joined to return fully formed record
    const { rows } = await query(`
      SELECT a.id, v.name as vessel_name, a.role_onboard, a.sign_on_date, a.sign_off_date
      FROM crew_assignments a
      JOIN vessels v ON a.vessel_id = v.id
      WHERE a.id = $1
    `, [result.rows[0].id]);

    res.status(201).json(rows[0]);
  } catch (error) {
    await query('ROLLBACK');
    console.error('Error adding assignment:', error);
    res.status(500).json({ error: 'Failed to add assignment' });
  }
});

// Sign-off / End an assignment
crewRoutes.put('/:id/assignments/:assignmentId', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  const { id, assignmentId } = req.params;
  const { sign_off_date } = req.body;

  try {
    const result = await query(
      `UPDATE crew_assignments 
       SET sign_off_date = $1, updated_at = NOW()
       WHERE id = $2 AND crew_member_id = $3
       RETURNING *`,
      [sign_off_date, assignmentId, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Assignment not found' });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error ending assignment:', error);
    res.status(500).json({ error: 'Failed to end assignment' });
  }
});
