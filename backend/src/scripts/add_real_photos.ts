import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addRealPhotos() {
  const client = await pool.connect();
  try {
    const photoMap: Record<string, string> = {
      'Acadia Desgagnés': 'https://desgagnes.com/wp-content/uploads/2019/12/Acadia_PageFlotte.jpg',
      'Annette A. Desgagnés': 'https://desgagnes.com/wp-content/uploads/2025/10/anette-optimise.jpg',
      'Argentia Desgagnés': 'https://desgagnes.com/wp-content/uploads/2019/12/Argentia_18_12_2019.jpg',
      'Bella Desgagnés': 'https://desgagnes.com/wp-content/uploads/2019/12/Bella_PageFlotte-700x523.jpg',
      'Berthe A. Desgagnés': 'https://desgagnes.com/wp-content/uploads/2025/10/berthe-optimise-700x523.jpg',
      'Claude A. Desgagnés': 'https://desgagnes.com/wp-content/uploads/2019/12/ClaudeA-700x523.jpg',
      'Marcellin A. Desgagnés': 'https://desgagnes.com/wp-content/uploads/2025/10/marcellin-desgagne-700x523.jpg',
      'Miena Desgagnés': 'https://desgagnes.com/wp-content/uploads/2019/12/Miena_PageFlotte-700x523.jpg',
      'Nordika Desgagnés': 'https://desgagnes.com/wp-content/uploads/2019/12/Nordika_PageFlotte-700x523.jpg',
      'Rosaire A. Desgagnés': 'https://desgagnes.com/wp-content/uploads/2019/12/RosaireA_PageFlotte-700x523.jpg',
      'Sedna Desgagnés': 'https://desgagnes.com/wp-content/uploads/2019/12/Sedna_PageFlotte-700x523.jpg',
      'Taïga Desgagnés': 'https://desgagnes.com/wp-content/uploads/2019/12/Taiga_18_12_2019-700x523.jpg',
      'Zelada Desgagnés': 'https://desgagnes.com/wp-content/uploads/2019/12/Zelada_PageFlotte-700x523.jpg'
    };

    console.log('--- Updating real photos ---');
    await client.query('BEGIN');
    
    let updatedCounter = 0;
    
    for (const [name, url] of Object.entries(photoMap)) {
      const res = await client.query('UPDATE vessels SET image_url = $1 WHERE name = $2', [url, name]);
      updatedCounter += res.rowCount || 0;
    }

    await client.query('COMMIT');
    console.log(`Success! Updated ${updatedCounter} vessels with real photos.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during updating photos:', error);
  } finally {
    client.release();
    pool.end();
  }
}

addRealPhotos();
