import { Router } from 'express';
import { query } from '../db';

export const contractsRoutes = Router();

contractsRoutes.get('/', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT a.id, c.seaman_book_number, u.first_name, u.last_name, v.name as vessel_name, a.sign_on_date, a.sign_off_date, a.role_onboard
      FROM crew_assignments a
      JOIN crew_members c ON a.crew_member_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN vessels v ON a.vessel_id = v.id
      ORDER BY a.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

contractsRoutes.post('/', async (req, res) => {
  const { sailor_id, vessel_id, start_date, end_date, port_sign_on, port_sign_off } = req.body;
  try {
    const result = await query(
      `INSERT INTO crew_assignments (crew_member_id, vessel_id, sign_on_date, sign_off_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [sailor_id, vessel_id, start_date, end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Failed to create contract' });
  }
});
