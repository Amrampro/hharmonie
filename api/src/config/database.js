import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { preparePagination } from '../utils/sqlPagination.js';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommerce_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  namedPlaceholders: true
});

export const query = async (sql, params) => {
  try {
    const prepared = preparePagination(sql, params);
    const [results] = await pool.execute(prepared.sql, prepared.params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const getConnection = async () => {
  return await pool.getConnection();
};

export default pool;
