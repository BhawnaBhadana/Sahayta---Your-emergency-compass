import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import sosRoutes from './routes/sosRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import shelterRoutes from './routes/shelterRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import resourceRequestRoutes from './routes/resourceRequestRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import responderRoutes from './routes/responderRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import missingPersonRoutes from './routes/missingPersonRoutes.js';
import familyRoutes from './routes/familyRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import demoRoutes from './routes/demoRoutes.js';
import userRoutes from './routes/userRoutes.js';

import { apiLimiter } from './middleware/rateLimit.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(__dirname, '../', process.env.UPLOAD_DIR || 'uploads')));
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', service: 'sahayta-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/reports', incidentRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/resource-requests', resourceRequestRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/responders', responderRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/missing-persons', missingPersonRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/users', userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
