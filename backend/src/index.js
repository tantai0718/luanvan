require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const http    = require('http');
const path    = require('path');
const { Server } = require('socket.io');
const routes  = require('./routes');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET', 'POST'] }
});

io.on('connection', socket => {
  socket.on('join', ({ userId, vaiTro, maNongDan }) => {
    socket.join(`user_${userId}`);
    if (vaiTro === 'nong_dan' && maNongDan) socket.join(`farmer_${maNongDan}`);
  });
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/upload', express.static(path.join(__dirname, '..', 'upload')));
app.use((req, res, next) => { req.io = io; next(); });

app.use('/api', routes);
app.get('/', (req, res) => res.json({ message: '🌱 Chợ Nông Sản API đang chạy!', version: '1.0.0' }));
app.use((req, res) => res.status(404).json({ message: `Route ${req.path} không tồn tại` }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: err.message || 'Lỗi server' }); });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Backend: http://localhost:${PORT}`);
  console.log(`📡 API:     http://localhost:${PORT}/api\n`);
});
