// BE/config/db.js
import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config(); // Đảm bảo nạp biến môi trường nếu có file .env

const config = {
  // 1. Dùng 127.0.0.1 thay vì localhost để tránh lỗi IPv6 của Node.js
  server: process.env.DB_SERVER || '127.0.0.1', 
  
  // 2. Thêm port 1433 rõ ràng để không bị nhầm
  port: parseInt(process.env.DB_PORT) || 1433,

  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'UNIQLO_DB',
  
  options: {
    encrypt: false, 
    trustServerCertificate: true,
    enableArithAbort: true // Thêm dòng này giúp ổn định query
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise;

async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(config)
      .then(pool => {
        console.log('✅ Connected to SQL Server successfully!');
        return pool;
      })
      .catch(err => {
        console.error('❌ Database connection failed:', err);
        poolPromise = null; // Reset để lần sau thử lại
        throw err;
      });
  }
  return poolPromise;
}

export {
  sql,
  getPool
};