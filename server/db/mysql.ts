
import 'dotenv/config';
import mysql from 'mysql2/promise';

const isProduction = process.env.NODE_ENV === 'production';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'academic_progression_db',

  // Enable SSL for the cloud database
  ...(isProduction ? { ssl: { rejectUnauthorized: true } } : {}),

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});
