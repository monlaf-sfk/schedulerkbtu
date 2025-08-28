import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import courseRoutes from './routes/courseRoutes';
import morgan from 'morgan'

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5001;
const HOST = process.env.HOST || '0.0.0.0';
const API_HOST = process.env.API_HOST || '';
const PUBLIC_URL = process.env.PUBLIC_URL || (API_HOST ? (API_HOST.startsWith('http') ? `${API_HOST}:${PORT}` : `http://${API_HOST}:${PORT}`) : `http://localhost:${PORT}`);

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.FRONTEND_URL || 'https://schedulerkbtu.vercel.app';
app.set('trust proxy', true);  

const allowedOrigins = Array.from(new Set([
  FRONTEND_ORIGIN,
  PUBLIC_URL,
  'http://localhost:5173', 
])).filter(Boolean);

console.log('CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy: origin ${origin} is not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

 
app.use('/api', courseRoutes);

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server is listening on ${HOST}:${PORT}`);
  console.log(`🔗 Public URL (for clients): ${PUBLIC_URL}`);
});