const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");

// Either store refresh tokens in a database or use Redis for production
let refreshTokens = [];

const SECRET_KEY = "secret123";
const REFRESH_SECRET = "refreshSecret123";

exports.logIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, error: "Incorrect password" });
    }

    // Use user's id or email for token generation
    const accessToken = generateAccessToken({ userId: user._id });
    const refreshToken = generateRefreshToken({ userId: user._id });

    // Store refresh token (in a production environment, store in DB instead)
    refreshTokens.push(refreshToken);

    console.log(refreshTokens);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        running_capital: user.running_capital,
        weekly_capital: user.weekly_capital,
        monthlyCapital: user.monthly_capital,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.verifyToken = async (req, res) => {
  const { accessToken, refreshToken } = req.body;
  const user = req.user;

  if (!refreshToken || !refreshTokens.includes(refreshToken))
    return res.status(403).json({ message: "Invalid refresh token" });

  jwt.verify(accessToken, SECRET_KEY, (err, data) => {
    if (!err) return res.json({ accessToken, user });

    jwt.verify(refreshToken, REFRESH_SECRET, (err, data) => {
      if (err)
        return res.status(403).json({ message: "Invalid refresh token" });
      const newAccessToken = generateAccessToken({ userId: user.id });
      res.json({ accessToken: newAccessToken, user });
    });
  });
};

exports.logout = async (req, res) => {
  refreshTokens = refreshTokens.filter((t) => t !== req.body.refreshToken);
  res.json({ message: "Logged out" });
};
