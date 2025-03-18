const router = require("express").Router();
const userController = require("../controllers/user.controller");
const { verifyToken } = require("../middleware");

// User routes

// router.put("/user", verifyToken, userController.updateUser);

// router.post("/deposit", verifyToken, userController.createDeposit);

// router.post("/withdraw", verifyToken, userController.createWithdrawal);

// router.get("/deposit", verifyToken, userController.getAllUserDeposits);

// router.get("/withdrawal", verifyToken, userController.getAllUserWithdrawal);

// router.put("/deposit/:id", verifyToken, userController.updateUserDeposit);

// router.put("/withdrawal/:id", verifyToken, userController.updateUserWithdrawal);

// router.delete("/deposit/:id", verifyToken, userController.deleteUserDeposit);

// router.delete(
//   "/withdrawal/:id",
//   verifyToken,
//   userController.deletUserWithdrawal
// );

// router.get("/signals", verifyToken, userController.getAllUserSignals);

// router.get("/revenue", verifyToken, userController.getUserRevenue);

// User routes
router.put("/user", verifyToken, userController.updateUser);

// Deposit routes
router.post("/add/deposit", verifyToken, userController.createDeposit);

router.get("/deposit", verifyToken, userController.getAllUserDeposits);
router.put("/deposit/:id", verifyToken, userController.updateUserDeposit);
router.delete("/deposit/:id", verifyToken, userController.deleteUserDeposit);

// Withdrawal routes
router.post("/withdrawal", verifyToken, userController.createWithdrawal);
router.get("/withdrawal", verifyToken, userController.getAllUserWithdrawal);
router.put("/withdrawal/:id", verifyToken, userController.updateUserWithdrawal);
router.delete(
  "/withdrawal/:id",
  verifyToken,
  userController.deletUserWithdrawal
);

// Signal routes
router.get("/signal", verifyToken, userController.getOrCreateUserSignal);

router.get(
  "/signal/stats",
  verifyToken,
  userController.getTotalProfitFromSignal
);

// Revenue routes
router.get("/revenue", verifyToken, userController.getUserRevenue);
router.post("/revenue", verifyToken, userController.createUserRevenue); // New endpoint for creating revenue

module.exports = router;
