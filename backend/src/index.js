require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const routes = require("./routes");
const sepayController = require("./controllers/sepayController");
const { autoHideExpiredProducts } = require('./models/productModel');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join", ({ userId, vaiTro, maNongDan }) => {
    socket.join(`user_${userId}`);
    if (vaiTro === "nong_dan" && maNongDan) socket.join(`farmer_${maNongDan}`);
  });
});
app.use('/upload', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
app.use('/upload', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '..', 'upload')));

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.post('/api/webhook/sepay', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.rawBody = req.body.toString();
  try { req.body = JSON.parse(req.rawBody); } catch {}
  next();
}, sepayController.webhook);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use("/upload", express.static(path.join(__dirname, "..", "upload")));
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson(data);
  };
  next();
});

app.use("/api", routes);
app.get("/", (req, res) =>
  res.json({ message: "🌱 Chợ Nông Sản API đang chạy!", version: "1.0.0" }),
);
app.use((req, res) =>
  res.status(404).json({ message: `Route ${req.path} không tồn tại` }),
);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Lỗi server" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Backend: http://localhost:${PORT}`);
  console.log(`📡 API:     http://localhost:${PORT}/api\n`);

  // Chạy ngay lần đầu khi khởi động server
  autoHideExpiredProducts();
  // Sau đó chạy mỗi 1 giờ để ẩn sản phẩm hết hạn
  setInterval(autoHideExpiredProducts, 60 * 60 * 1000);
});
