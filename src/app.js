// SERVER CODE (save as server.js)
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoute = require("./routes/auth.route");
const userRoute = require("./routes/user.route");
const User = require("./models/User");
const Revenue = require("./models/Revenue");
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

const allUser = {
  admin: {
    _id: "67b1bc98d981de5d7bd00023",
    weekly_capital: 3900,
    running_capital: 3934.64,
    report: {
      total_withdrawals: 59.88,
      total_revenue: 3934.64,
    },
  },
  innocent: {
    _id: "67b1bca8a00bacd62f1e30ed",
    weekly_capital: 836.42,
    running_capital: 843.78,
    report: {
      total_withdrawals: 0,
      total_revenue: 843.78,
    },
  },
};

const updateUsers = async () => {
  try {
    const admin = allUser.admin;
    const innocent = allUser.innocent;

    // Update users
    const updatedAdmin = await User.findByIdAndUpdate(
      admin._id,
      {
        weekly_capital: admin.weekly_capital,
        running_capital: admin.running_capital,
      },
      { new: true }
    );

    const updatedInnocent = await User.findByIdAndUpdate(
      innocent._id,
      {
        weekly_capital: innocent.weekly_capital,
        running_capital: innocent.running_capital,
      },
      { new: true }
    );

    // Update revenue reports for each user
    const updatedAdminRevenue = await Revenue.findOneAndUpdate(
      { user: admin._id, month: "March" },
      {
        // total_revenue: 0,
        // total_withdrawals: 0,

        total_revenue: admin.report.total_revenue,
        total_withdrawal: admin.report.total_withdrawals,
      },
      { new: true, upsert: true }
    );

    const updatedInnocentRevenue = await Revenue.findOneAndUpdate(
      { user: innocent._id, month: "March" },
      {
        // total_revenue: 0,
        // total_withdrawals: 0,
        total_revenue: innocent.report.total_revenue,
        total_withdrawal: innocent.report.total_withdrawals,
      },
      { new: true, upsert: true }
    );

    console.log("Updated users:", updatedAdmin, updatedInnocent);
    console.log(
      "Updated revenues:",
      updatedAdminRevenue,
      updatedInnocentRevenue
    );
  } catch (error) {
    console.error("Error updating users:", error);
  }
};

updateUsers();
// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const fetchUser = async () => {
  try {
    const users = await User.find({});
    console.log("User:", users);

    // updateUsers();
  } catch (error) {
    console.error("Error fetching user:", error);
  }
};

// fetchUser();

// For serverless environments
module.exports = (req, res) => app(req, res);
