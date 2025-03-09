require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SECRET_KEY = "secret123";

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers["authorization"].split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    const user = await User.findOne({ _id: decoded.userId });
    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    const userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      username: user.username,
      running_capital: user.running_capital,
      weekly_capital: user.weekly_capital,
      monthlyCapital: user.monthly_capital,
    };

    req.user = userData;

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};
