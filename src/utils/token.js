const jwt = require("jsonwebtoken");

const SECRET_KEY = "secret123";
const REFRESH_SECRET = "refreshSecret123";
// Generate Tokens
const generateAccessToken = (user) =>
  jwt.sign(user, SECRET_KEY, { expiresIn: "30m" });
const generateRefreshToken = (user) =>
  jwt.sign(user, REFRESH_SECRET, { expiresIn: "7d" }); // Increased from 1m

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
