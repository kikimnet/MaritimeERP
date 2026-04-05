import { Router } from 'express';
import { pool } from '../db';
import { AIOptimizerService } from '../services/aiOptimizer';

const router = Router();

// GET /voyages
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT v.*, vs.name as vessel_name
            FROM voyages v
            LEFT JOIN vessels vs ON vs.id = v.vessel_id
            ORDER BY v.created_at DESC
        `);
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET /voyages/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(`
            SELECT v.*, vs.name as vessel_name
            FROM voyages v
            LEFT JOIN vessels vs ON vs.id = v.vessel_id
            WHERE v.id = $1
        `, [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Voyage not found' });
        
        // Fetch waypoints
        const waypoints = await pool.query('SELECT * FROM voyage_waypoints WHERE voyage_id = $1 ORDER BY order_index', [id]);
        res.json({ ...rows[0], waypoints: waypoints.rows });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /voyages
router.post('/', async (req, res) => {
    try {
        const {
            voyage_number, commercial_name, voyage_type, vessel_id,
            port_of_departure, port_of_arrival, speed_planned,
            ai_scenario_id, charter_party_ref, waypoints,
            operator_id
        } = req.body;

        await pool.query('BEGIN');

        const insertVoyage = `
            INSERT INTO voyages (
                voyage_number, commercial_name, voyage_type, vessel_id,
                port_of_departure, port_of_arrival, speed_planned, 
                ai_scenario_id, charter_party_ref, operator_id, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'planned')
            RETURNING *
        `;

        const { rows } = await pool.query(insertVoyage, [
            voyage_number, commercial_name, voyage_type, vessel_id,
            port_of_departure, port_of_arrival, speed_planned,
            ai_scenario_id || null, charter_party_ref, operator_id || null
        ]);

        const newVoyage = rows[0];

        // Insert waypoints if provided
        if (waypoints && Array.isArray(waypoints)) {
            for (let i = 0; i < waypoints.length; i++) {
                await pool.query(`
                    INSERT INTO voyage_waypoints (voyage_id, order_index, port_locode, terminal, eta_planned, etd_planned)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    newVoyage.id, i, waypoints[i].port_locode,
                    waypoints[i].terminal, waypoints[i].eta, waypoints[i].etd
                ]);
            }
        }

        // Link AI scenario to this voyage if AI was used
        if (ai_scenario_id) {
            await pool.query('UPDATE voyage_ai_scenarios SET voyage_id = $1 WHERE id = $2', [newVoyage.id, ai_scenario_id]);
        }

        await pool.query('COMMIT');
        res.status(201).json(newVoyage);
    } catch (err: any) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// PATCH /voyages/:id/status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'confirmed', 'in_progress', 'in_port', 'arrived', 'closed'
        
        const { rows } = await pool.query(`
            UPDATE voyages SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *
        `, [status, id]);
        
        res.json(rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /voyages/optimize (AI Optimizer)
router.post('/optimize', async (req, res) => {
    try {
        // Body matches AIScenarioRequest
        const scenarioResult = await AIOptimizerService.generateScenarios(req.body);
        res.status(200).json(scenarioResult);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /voyages/optimize/:session_id/select
router.post('/optimize/:session_id/select', async (req, res) => {
    try {
        const { session_id } = req.params;
        const { selected_scenario, overrides } = req.body; // 'scenario_a', 'scenario_b', 'scenario_c'

        const { rows } = await pool.query(`
            UPDATE voyage_ai_scenarios
            SET selected_scenario = $1, operator_overrides = $2, status = 'selected'
            WHERE id = $3
            RETURNING *
        `, [selected_scenario, JSON.stringify(overrides || {}), session_id]);

        if (rows.length === 0) return res.status(404).json({ error: 'AI Session not found' });
        
        res.json(rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export const voyagesRoutes = router;
