import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const generateRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

async function seedCrew() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if crew already exists to avoid massive duplication
    const { rows: existingCrew } = await client.query('SELECT count(*) FROM crew_members');
    if (parseInt(existingCrew[0].count) > 0) {
      console.log('Crew already seeded. Skipping.');
      client.release();
      pool.end();
      return;
    }

    // Ensure CREW role exists
    const roleResult = await client.query(
      `INSERT INTO roles (name, description) VALUES ('CREW', 'Membre Equipage') 
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`
    );
    const crewRoleId = roleResult.rows[0].id;

    // Get all vessels to assign them
    const { rows: vessels } = await client.query('SELECT id FROM vessels');

    const firstNames = ['Jean', 'Michel', 'Pierre', 'Luc', 'Marc', 'Karim', 'Ahmed', 'Youssef', 'David', 'Simon', 'Paul', 'Jacques', 'Nicolas', 'Alexandre', 'Thomas'];
    const lastNames = ['Tremblay', 'Gagnon', 'Roy', 'Cote', 'Bouchard', 'Gauthier', 'Morin', 'Lavoie', 'Fortin', 'Pelletier', 'Belanger', 'Levesque', 'Bergeron', 'Leblanc', 'Paquette'];
    const ranks = ['Captain', 'Chief Officer', '2nd Officer', 'Chief Engineer', '2nd Engineer', 'Able Seaman', 'Oiler', 'Cook', 'Bosun'];
    const nationalities = ['CA', 'FR', 'DZ', 'MA', 'PH', 'IN', 'UA'];

    const certNames = ['Basic Safety Training (BST)', 'Advanced Fire Fighting', 'Medical First Aid', 'GMDSS', 'Seafarers Medical Certificate', 'Ship Security Officer'];

    console.log('Seeding 50 crew members...');

    for (let i = 0; i < 50; i++) {
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@marelinx.com`;
      const password = await bcrypt.hash('crew123', 10);
      
      // 1. Insert User
      const userRes = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role_id) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [email, password, fName, lName, crewRoleId]
      );
      const userId = userRes.rows[0].id;

      // 2. Insert Crew Member
      const seamanNum = `CAN${Math.floor(100000 + Math.random() * 900000)}`;
      const nat = nationalities[Math.floor(Math.random() * nationalities.length)];
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      const dob = generateRandomDate(new Date(1960, 0, 1), new Date(2000, 0, 1));
      
      const crewRes = await client.query(
        `INSERT INTO crew_members (user_id, seaman_book_number, nationality, date_of_birth, rank) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [userId, seamanNum, nat, dob, rank]
      );
      const crewId = crewRes.rows[0].id;

      // 3. Insert Certifications (2 to 4 certs per crew)
      const numCerts = Math.floor(Math.random() * 3) + 2;
      for (let c = 0; c < numCerts; c++) {
        const certName = certNames[c];
        const issueDate = generateRandomDate(new Date(2019, 0, 1), new Date());
        const expiryDate = new Date(issueDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 5);
        if (Math.random() < 0.1) expiryDate.setFullYear(expiryDate.getFullYear() - 6);
        
        await client.query(
          `INSERT INTO certifications (crew_member_id, certificate_name, certificate_number, issue_date, expiry_date)
           VALUES ($1, $2, $3, $4, $5)`,
          [crewId, certName, `CERT-${Math.floor(1000 + Math.random() * 9000)}`, issueDate, expiryDate]
        );
      }

      // 4. Insert Assignment (70% chance to be assigned right now)
      if (Math.random() < 0.7 && vessels.length > 0) {
        const vesselId = vessels[Math.floor(Math.random() * vessels.length)].id;
        const signOnDate = generateRandomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date());
        
        await client.query(
          `INSERT INTO crew_assignments (crew_member_id, vessel_id, sign_on_date, role_onboard)
           VALUES ($1, $2, $3, $4)`,
          [crewId, vesselId, signOnDate, rank]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Successfully seeded 50 crew members with certs and assignments!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding crew:', error);
  } finally {
    client.release();
    pool.end();
  }
}

seedCrew();
