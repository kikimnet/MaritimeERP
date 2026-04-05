import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Adding photo_url column to crew_members if not exists...');
    await client.query('ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS photo_url TEXT');

    console.log('Fetching all crew members to generate random realistic avatars...');
    const { rows } = await client.query(`
      SELECT c.id, u.first_name, u.last_name 
      FROM crew_members c 
      JOIN users u ON c.user_id = u.id
    `);

    for (const crew of rows) {
      // Create a deterministic but random realistic face using randomuser.me
      // Men IDs go from 1 to 99
      const randomId = Math.floor(Math.random() * 99);
      
      // We use 'men' because the seed list had predominantly male names 
      // (Jean, Michel, Pierre, Karim, etc.)
      const avatarUrl = `https://randomuser.me/api/portraits/men/${randomId}.jpg`;
      
      await client.query('UPDATE crew_members SET photo_url = $1 WHERE id = $2', [avatarUrl, crew.id]);
    }

    await client.query('COMMIT');
    console.log('Successfully updated crew members with random avatars!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding photos:', error);
  } finally {
    client.release();
    pool.end();
  }
}

run();
