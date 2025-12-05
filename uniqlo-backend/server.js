// BE/server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import productRoutes from './routes/productRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
app.use(cors());

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/auth', authRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ UNIQLO Mini backend running on port ${PORT}`);
});
