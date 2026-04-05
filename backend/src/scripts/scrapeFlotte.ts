import axios from 'axios';
import * as cheerio from 'cheerio';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function scrapeDesgagnes() {
  const client = await pool.connect();
  try {
    console.log('--- Scraping Desgagnés Fleet ---');
    await client.query('BEGIN');
    
    // 1. Add new column for Fiche Technique
    await client.query(`ALTER TABLE vessels ADD COLUMN IF NOT EXISTS technical_sheet_url TEXT;`);
    
    // Clear all existing images so we don't have artifacts
    await client.query(`UPDATE vessels SET image_url = NULL, technical_sheet_url = NULL;`);

    // 2. Fetch HTML
    const response = await axios.get('https://desgagnes.com/fr/flotte/');
    const html = response.data;
    const $ = cheerio.load(html);

    let updatedCounter = 0;

    // The ships are usually listed in h5 tags on the website, followed by content.
    // However, since we need to match the exact names of our database, let's query DB first.
    const { rows: vessels } = await client.query('SELECT id, name FROM vessels');
    
    for (const vessel of vessels) {
      // Find the ship name in the HTML. 
      // Their format is often "N/M Acadia Desgagnés" or "N/C Damia Desgagnés".
      // We'll search for the clean name.
      const searchName = vessel.name.trim();
      
      // Look for a heading that contains the vessel name
      let shipHeader: any = null;
      $('h5').each((i, el) => {
        if ($(el).text().includes(searchName)) {
          shipHeader = $(el);
        }
      });
      
      let imageUrl: string | null = null;
      let ficheUrl: string | null = null;

      if (shipHeader) {
        // Look for Fiche technique link nearby (usually in the next p tag or siblings)
        const nearbyA = shipHeader.nextUntil('h4, h5').find("a:contains('Fiche technique')");
        if (nearbyA.length > 0) {
          ficheUrl = nearbyA.attr('href') || null;
        } else {
            // Also check if the 'a' tag is direct sibling
            const directA = shipHeader.nextAll("a:contains('Fiche technique')").first();
            if (directA.length > 0) ficheUrl = directA.attr('href') || null;
        }

        // On Desgagnes website, the images for ships are sometimes set inside a div using Elementor,
        // or just above the h5 tag. We'll search for any img tag that is structurally close, 
        // or we'll just check if there's an image.
        // Let's grab the closest preceding or succeeding <img>.
        let img = shipHeader.parent().find('img').first();
        if (img.length === 0) {
           img = shipHeader.closest('.elementor-widget-wrap').find('img').first();
        }
        
        if (img.length > 0) {
           let src = img.attr('src');
           if (src && !src.includes('data:image')) {
               imageUrl = src;
           }
        }
      }

      await client.query(
        'UPDATE vessels SET image_url = $1, technical_sheet_url = $2 WHERE id = $3',
        [imageUrl, ficheUrl, vessel.id]
      );
      updatedCounter++;
      console.log(`- ${vessel.name}: Image=${imageUrl ? 'Found' : 'NULL'}, Fiche=${ficheUrl ? 'Found' : 'NULL'}`);
    }

    await client.query('COMMIT');
    console.log(`Success! Updated ${updatedCounter} vessels.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during scraping:', error);
  } finally {
    client.release();
    pool.end();
  }
}

scrapeDesgagnes();
