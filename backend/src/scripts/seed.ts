import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const DESGAGNES_FLEET = [
  { name: 'Acadia Desgagnés', imo: '9804473', type: 'Cargo', flag: 'CA', dwt: 15200, yearBuilt: 2017, status: 'IN TRANSIT' },
  { name: 'Annette A. Desgagnés', imo: '9374026', type: 'Cargo', flag: 'BB', dwt: 13000, yearBuilt: 2007, status: 'MOORED' },
  { name: 'Argentia Desgagnés', imo: '9374038', type: 'Cargo', flag: 'CA', dwt: 14000, yearBuilt: 2007, status: 'AT ANCHOR' },
  { name: 'Bella Desgagnés', imo: '9618161', type: 'Cargo/Passenger', flag: 'CA', dwt: 5000, yearBuilt: 2013, status: 'IN TRANSIT' },
  { name: 'Berthe A. Desgagnés', imo: '9374040', type: 'Cargo', flag: 'CA', dwt: 13500, yearBuilt: 2008, status: 'IN TRANSIT' },
  { name: 'Claude A. Desgagnés', imo: '9424675', type: 'Cargo', flag: 'BB', dwt: 15000, yearBuilt: 2011, status: 'MOORED' },
  { name: 'Marcellin A. Desgagnés', imo: '9424687', type: 'Cargo', flag: 'CA', dwt: 15000, yearBuilt: 2011, status: 'IN TRANSIT' },
  { name: 'Miena Desgagnés', imo: '9768655', type: 'Tanker', flag: 'CA', dwt: 15000, yearBuilt: 2017, status: 'IN TRANSIT' },
  { name: 'Nordika Desgagnés', imo: '9437191', type: 'Cargo', flag: 'BB', dwt: 17000, yearBuilt: 2010, status: 'AT ANCHOR' },
  { name: 'Rosaire A. Desgagnés', imo: '9424704', type: 'Cargo', flag: 'BB', dwt: 15000, yearBuilt: 2011, status: 'IN TRANSIT' },
  { name: 'Sedna Desgagnés', imo: '9437206', type: 'Cargo', flag: 'BB', dwt: 17000, yearBuilt: 2010, status: 'MOORED' },
  { name: 'Taïga Desgagnés', imo: '9367126', type: 'Cargo', flag: 'BB', dwt: 12000, yearBuilt: 2007, status: 'IN TRANSIT' },
  { name: 'Zelada Desgagnés', imo: '9424716', type: 'Cargo', flag: 'BB', dwt: 15000, yearBuilt: 2009, status: 'IN TRANSIT' }
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('--- Seeding MaritimeERP Database ---');
    await client.query('BEGIN');
    
    // Check if empty
    const { rows } = await client.query('SELECT COUNT(*) FROM vessels');
    if (parseInt(rows[0].count) > 0) {
      console.log('Database already has vessels. Cleaning...');
      await client.query('DELETE FROM vessels');
    }

    let inserted = 0;
    for (const v of DESGAGNES_FLEET) {
      await client.query(`
        INSERT INTO vessels (name, imo_number, flag, vessel_type, dwt, year_built, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [v.name, v.imo, v.flag, v.type, v.dwt, v.yearBuilt, v.status]);
      inserted++;
    }

    await client.query('COMMIT');
    console.log(`Success! Inserted ${inserted} vessels into the database.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
