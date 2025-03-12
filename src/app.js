// SERVER CODE (save as server.js)
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoute = require("./routes/auth.route");
const userRoute = require("./routes/user.route");
const { updateUsersSignal } = require("./utils/job");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB using modern syntax
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
  },
});

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Routes
app.use("/api/v1", authRoute);
app.use("/api/v1", userRoute);

app.get("/api/cron", (req, res) => {
  console.log("Cron job triggered at:", new Date().toLocaleString());
  updateUsersSignal();
  res.json({ message: "Cron job executed successfully!" });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// fetchUser();

// For serverless environments
module.exports = (req, res) => app(req, res);
