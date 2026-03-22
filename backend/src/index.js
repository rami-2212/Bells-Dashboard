require('dotenv').config();
const http    = require('http');
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const { initWSS }           = require('./websocket/wsServer');
const { globalErrorHandler } = require('./middleware/errorHandler');
const wfsRoutes    = require('./routes/wfs');
const polesRoutes  = require('./routes/poles');
const iotRoutes    = require('./routes/iot');
const alertRoutes  = require('./routes/alerts');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET','POST','PUT','PATCH','DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Smart Road GIS API',
    version: '1.0.0',
    region: 'Waterberg District, South Africa',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/wfs',    wfsRoutes);
app.use('/api/poles',  polesRoutes);
app.use('/api/iot',    iotRoutes);
app.use('/api/ai',     alertRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.path} not found` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(globalErrorHandler);

// ─── HTTP + WebSocket server ──────────────────────────────────────────────────
const server = http.createServer(app);
initWSS(server);

server.listen(PORT, () => {
  console.log(`\n  Smart Road GIS Backend`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  HTTP API  : http://localhost:${PORT}`);
  console.log(`  WebSocket : ws://localhost:${PORT}/ws`);
  console.log(`  Health    : http://localhost:${PORT}/health`);
  console.log(`  WFS       : http://localhost:${PORT}/api/wfs/capabilities`);
  console.log(`  Region    : Waterberg District, South Africa`);
  console.log(`  ─────────────────────────────────────────\n`);
});

module.exports = { app, server };
