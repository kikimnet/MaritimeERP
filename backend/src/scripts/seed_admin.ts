import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedAdmin() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Create ADMIN role if it doesn't exist
    const roleResult = await client.query(
      `INSERT INTO roles (name, description) VALUES ('ADMIN', 'Super Administrateur') 
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`
    );
    const roleId = roleResult.rows[0].id;
    console.log(`ADMIN Role ID: ${roleId}`);

    // 2. Hash password
    const email = 'karim.laifaoui@gmail.com';
    const plainPassword = '222Kikimnet';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // 3. Create Admin user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role_id) 
       VALUES ($1, $2, 'Karim', 'Laifaoui', $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash 
       RETURNING id, email`,
      [email, hashedPassword, roleId]
    );
    
    console.log(`Successfully seeded Admin User: ${userResult.rows[0].email}`);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding admin:', error);
  } finally {
    client.release();
    pool.end();
  }
}

seedAdmin();
