const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware");

router.post("/auth/verify", verifyToken, authController.verifyToken);

router.post("/login", authController.logIn);

router.post("/logout", authController.logout);

module.exports = router;
