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

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://schedulerkbtu.vercel.app';
app.set('trust proxy', true); // when running behind nginx / reverse proxy
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

 
app.use('/api', courseRoutes);

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server is listening on ${HOST}:${PORT}`);
  console.log(`🔗 Public URL (for clients): ${PUBLIC_URL}`);
});