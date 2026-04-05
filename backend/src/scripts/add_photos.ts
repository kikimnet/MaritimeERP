import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addPhotos() {
  const client = await pool.connect();
  try {
    console.log('--- Altering vessels table to add image_url ---');
    await client.query('BEGIN');
    
    // Add column if it doesn't exist
    await client.query(`
      ALTER TABLE vessels 
      ADD COLUMN IF NOT EXISTS image_url TEXT
    `);

    // Assigning high-quality realistic ship photos as seed
    const photoMap: Record<string, string> = {
      'Acadia Desgagnés': 'https://images.unsplash.com/photo-1588344445851-fcd800fa1b7c?w=800&q=80',
      'Annette A. Desgagnés': 'https://images.unsplash.com/photo-1596701047514-4eb952e4fa77?w=800&q=80',
      'Argentia Desgagnés': 'https://images.unsplash.com/photo-1563815049302-863a14a38382?w=800&q=80',
      'Bella Desgagnés': 'https://images.unsplash.com/photo-1549443560-643c1ea6ea92?w=800&q=80', // passenger
      'Berthe A. Desgagnés': 'https://images.unsplash.com/photo-1582231269384-7548bed98971?w=800&q=80',
      'Claude A. Desgagnés': 'https://images.unsplash.com/photo-1621217735393-24becc251da6?w=800&q=80',
      'Marcellin A. Desgagnés': 'https://images.unsplash.com/photo-1585526936302-0e572d41ac14?w=800&q=80',
      'Miena Desgagnés': 'https://images.unsplash.com/photo-1599388331398-380d38ae1126?w=800&q=80', // tanker
      'Nordika Desgagnés': 'https://images.unsplash.com/photo-1570535316314-e69d7b43a9b1?w=800&q=80',
      'Rosaire A. Desgagnés': 'https://plus.unsplash.com/premium_photo-1661962386121-82d27453eb51?w=800&q=80',
      'Sedna Desgagnés': 'https://images.unsplash.com/photo-1563815049302-863a14a38382?w=800&q=80',
      'Taïga Desgagnés': 'https://images.unsplash.com/photo-1569106037326-d66aef1f630f?w=800&q=80',
      'Zelada Desgagnés': 'https://images.unsplash.com/photo-1520697204934-8c819cdcc2ab?w=800&q=80'
    };

    let updated = 0;
    for (const [name, url] of Object.entries(photoMap)) {
      const res = await client.query('UPDATE vessels SET image_url = $1 WHERE name = $2', [url, name]);
      updated += res.rowCount || 0;
    }

    await client.query('COMMIT');
    console.log(`Success! Updated ${updated} vessels with photos.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding photos:', error);
  } finally {
    client.release();
    pool.end();
  }
}

addPhotos();
