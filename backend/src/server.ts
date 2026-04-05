import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { pool } from './db';
import apiRoutes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false })); // allow images to be loaded
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1', apiRoutes);

// Database Health Check & Server start
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Failed to connect to the database', err);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
    app.listen(PORT, () => {
      console.log(`Maritime ERP Backend running on http://localhost:${PORT}`);
    });
  }
});
