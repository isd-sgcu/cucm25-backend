import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import routerManager from '@/router';
import { errorHandler } from '@/middleware/errorHandler';

const app = express();
const PORT = 8080;

app.use(
  cors({
    origin: [
      /^https?:\/\/localhost(:[0-9]{1,5})?$/,
      /^https?:\/\/127\.0\.0\.1(:[0-9]{1,5})?$/,
      /^https?:\/\/sso\.comucos\.com(:[0-9]{1,5})?$/,
      /^https?:\/\/(.+\.)?cucm25\.me(:[0-9]{1,5})?$/,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/api', routerManager());

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timeStamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
