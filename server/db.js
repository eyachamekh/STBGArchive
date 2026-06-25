const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stbgarchive',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0
});

db.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error("MySQL connection was closed!");
    }
    if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
      console.error("MySQL fatal error in connection");
    }
    if (err.code === 'PROTOCOL_ENQUEUE_AFTER_CLOSE') {
      console.error("MySQL connection was closed!");
    }
    console.error("MySQL connection error:", err.message);
    return;
  }
  if (connection) {
    console.log("MySQL Connected via Pool");
    connection.release();
  }
});

// Handle connection errors
db.on('error', (err) => {
  console.error('MySQL Pool Error:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('MySQL connection was closed!');
  }
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
    console.error('MySQL connection pool was destroyed!');
  }
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_CLOSE') {
    console.error('MySQL connection pool was closed!');
  }
});

module.exports = db;