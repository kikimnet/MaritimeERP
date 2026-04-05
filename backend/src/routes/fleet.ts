import { Router } from 'express';
import { query } from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';

export const fleetRoutes = Router();

fleetRoutes.get('/', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM vessels ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching vessels:', error);
    res.status(500).json({ error: 'Failed to fetch vessels' });
  }
});

fleetRoutes.get('/:id', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM vessels WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Vessel not found' });
    
    // Fetch actual crew count ON BOARD
    const { rows: crewRows } = await query(`
      SELECT count(*) as count 
      FROM crew_assignments 
      WHERE vessel_id = $1 AND sign_on_date <= NOW() AND (sign_off_date IS NULL OR sign_off_date > NOW())
    `, [req.params.id]);
    
    const vessel = {
      ...rows[0],
      currentCrew: parseInt(crewRows[0].count)
    };
    
    res.json(vessel);
  } catch (error) {
    console.error('Error fetching vessel:', error);
    res.status(500).json({ error: 'Failed to fetch vessel' });
  }
});

// Create new vessel (Protected)
fleetRoutes.post('/', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  const { name, imo, type, flag, dwt, yearBuilt, imageUrl, technicalSheetUrl } = req.body;
  try {
    const result = await query(
      `INSERT INTO vessels (name, imo_number, vessel_type, flag, dwt, year_built, status, image_url, technical_sheet_url)
       VALUES ($1, $2, $3, $4, $5, $6, 'MOORED', $7, $8)
       RETURNING *`,
      [name, imo, type, flag, dwt || null, yearBuilt || null, imageUrl || null, technicalSheetUrl || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating vessel:', error);
    res.status(500).json({ error: 'Failed to create vessel' });
  }
});

// Update vessel (Protected)
fleetRoutes.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  const { name, imo, type, flag, dwt, yearBuilt, imageUrl, technicalSheetUrl, status } = req.body;
  
  try {
    const result = await query(
      `UPDATE vessels 
       SET name = $1, imo_number = $2, vessel_type = $3, flag = $4, dwt = $5, year_built = $6, image_url = $7, technical_sheet_url = $8, status = $9, updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [name, imo, type, flag, dwt || null, yearBuilt || null, imageUrl || null, technicalSheetUrl || null, status || 'MOORED', id]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vessel not found' });
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating vessel:', error);
    res.status(500).json({ error: 'Failed to update vessel' });
  }
});
