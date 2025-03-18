// user.controller.js
const User = require("../models/User");
const Deposit = require("../models/Deposit");
const Withdrawal = require("../models/Withdrawal");
const Signal = require("../models/Signal");
const Revenue = require("../models/Revenue");
const {
  updateRevenueForMonthYear,
  updateRevenueForDepositChange,
  updateRevenueForWithdrawalChange,
} = require("../helper/index2");
const Withdraw = require("../models/Withdraw");

// Update user profile
exports.updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updates.password;
    delete updates.role;

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Create a new deposit
exports.createDeposit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, date, whenDesposited, bonus } = req.body;

    const newDeposit = new Deposit({
      user: userId,
      amount,
      date: date || new Date(),
      whenDesposited: whenDesposited || 0,
      bonus: bonus || 0,
    });

    const deposit = await newDeposit.save();

    // Update user's running capital
    // const user = await User.findById(userId);
    // user.running_capital += amount + (bonus || 0);
    // await user.save();

    // Update or create revenue record
    // await updateRevenueForMonthYear(userId, date || new Date(), amount, 0, 0);

    res.status(201).json({ success: true, data: deposit });
  } catch (error) {
    console.error("Error creating deposit:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Create a new withdrawal
exports.createWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, date, whenWithdrawn } = req.body;

    // Check if user has sufficient balance
    const user = await User.findById(userId);
    if (user.running_capital < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance for withdrawal",
      });
    }

    const newWithdrawal = new Withdrawal({
      user: userId,
      amount,
      date: date || new Date(),
      whenWithdrawn: whenWithdrawn || 0,
    });

    const withdrawal = await newWithdrawal.save();

    // Update user's running capital
    // user.running_capital -= amount;
    await user.save();

    // Update or create revenue record
    await updateRevenueForMonthYear(userId, date || new Date(), 0, amount, 0);

    res.status(201).json({ success: true, data: withdrawal });
  } catch (error) {
    console.error("Error creating withdrawal:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all deposits for a user
exports.getAllUserDeposits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    const query = { user: userId };

    // Add date filtering if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const deposits = await Deposit.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Deposit.countDocuments(query);

    res.status(200).json({
      success: true,
      data: deposits,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error getting deposits:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all withdrawals for a user
exports.getAllUserWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    const query = { user: userId };

    // Add date filtering if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const withdrawals = await Withdraw.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Withdrawal.countDocuments(query);

    res.status(200).json({
      success: true,
      data: withdrawals,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error getting withdrawals:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// exports.getAllUserWithdrawal = async (req, res) => {
//   try {
//     const user = req.user.id;

//     const withdraw = await Withdraw.find({ user }).sort({ date: -1 });

//     res.json({ success: true, withdraw });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, error: "Internal server error" });
//   }
// };
// Update a deposit
exports.updateUserDeposit = async (req, res) => {
  try {
    const userId = req.user.id;
    const depositId = req.params.id;
    const { amount, date, whenDesposited, bonus } = req.body;

    // Find the deposit and ensure it belongs to the user
    const deposit = await Deposit.findOne({ _id: depositId, user: userId });

    if (!deposit) {
      return res
        .status(404)
        .json({ success: false, message: "Deposit not found" });
    }

    // Calculate the difference in amount to update user's running capital
    const oldAmount = deposit.amount + (deposit.bonus || 0);
    const newAmount = amount + (bonus || 0);
    const difference = newAmount - oldAmount;

    // Update deposit
    deposit.amount = amount;
    if (date) deposit.date = date;
    if (whenDesposited !== undefined) deposit.whenDesposited = whenDesposited;
    if (bonus !== undefined) deposit.bonus = bonus;

    await deposit.save();

    // Update user's running capital
    if (difference !== 0) {
      const user = await User.findById(userId);
      user.running_capital += difference;
      await user.save();

      // Update revenue records if needed
      await updateRevenueForDepositChange(deposit, difference);
    }

    res.status(200).json({ success: true, data: deposit });
  } catch (error) {
    console.error("Error updating deposit:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Update a withdrawal
exports.updateUserWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const withdrawalId = req.params.id;
    const { amount, date, whenWithdrawn } = req.body;

    // Find the withdrawal and ensure it belongs to the user
    const withdrawal = await Withdrawal.findOne({
      _id: withdrawalId,
      user: userId,
    });

    if (!withdrawal) {
      return res
        .status(404)
        .json({ success: false, message: "Withdrawal not found" });
    }

    // Calculate the difference in amount to update user's running capital
    const oldAmount = withdrawal.amount;
    const difference = oldAmount - amount;

    // Check if user has sufficient balance if increasing withdrawal amount
    if (difference < 0) {
      const user = await User.findById(userId);
      if (user.running_capital < Math.abs(difference)) {
        return res.status(400).json({
          success: false,
          message: "Insufficient balance for withdrawal update",
        });
      }
    }

    // Update withdrawal
    withdrawal.amount = amount;
    if (date) withdrawal.date = date;
    if (whenWithdrawn !== undefined) withdrawal.whenWithdrawn = whenWithdrawn;

    await withdrawal.save();

    // Update user's running capital
    if (difference !== 0) {
      //   const user = await User.findById(userId);
      //   user.running_capital += difference;
      //   await user.save();

      // Update revenue records if needed
      await updateRevenueForWithdrawalChange(withdrawal, -difference);
    }

    res.status(200).json({ success: true, data: withdrawal });
  } catch (error) {
    console.error("Error updating withdrawal:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete a deposit
exports.deleteUserDeposit = async (req, res) => {
  try {
    const userId = req.user.id;
    const depositId = req.params.id;

    // Find the deposit and ensure it belongs to the user
    const deposit = await Deposit.findOne({ _id: depositId, user: userId });

    if (!deposit) {
      return res
        .status(404)
        .json({ success: false, message: "Deposit not found" });
    }

    // Update user's running capital
    const user = await User.findById(userId);
    // user.running_capital -= deposit.amount + (deposit.bonus || 0);
    // await user.save();

    // Update revenue records
    await updateRevenueForDepositChange(
      deposit,
      -(deposit.amount + (deposit.bonus || 0))
    );

    // Delete the deposit
    await Deposit.findByIdAndDelete(depositId);

    res
      .status(200)
      .json({ success: true, message: "Deposit deleted successfully" });
  } catch (error) {
    console.error("Error deleting deposit:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete a withdrawal
exports.deletUserWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const withdrawalId = req.params.id;

    // Find the withdrawal and ensure it belongs to the user
    const withdrawal = await Withdrawal.findOne({
      _id: withdrawalId,
      user: userId,
    });

    if (!withdrawal) {
      return res
        .status(404)
        .json({ success: false, message: "Withdrawal not found" });
    }

    // Update user's running capital
    // const user = await User.findById(userId);
    // user.running_capital += withdrawal.amount;
    // await user.save();

    // Update revenue records
    await updateRevenueForWithdrawalChange(withdrawal, withdrawal.amount);

    // Delete the withdrawal
    await Withdrawal.findByIdAndDelete(withdrawalId);

    res
      .status(200)
      .json({ success: true, message: "Withdrawal deleted successfully" });
  } catch (error) {
    console.error("Error deleting withdrawal:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all signals for a user
exports.getAllUserSignals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: userId };

    // Add status filtering if provided
    if (status) {
      query.status = status;
    }

    const signals = await Signal.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Signal.countDocuments(query);

    res.status(200).json({
      success: true,
      data: signals,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error getting signals:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get user revenue statistics
exports.getUserRevenue = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.query;

    const query = { user: userId };

    if (year) query.year = parseInt(year);
    if (month) query.month = month;

    const revenueData = await Revenue.find(query).sort({ year: -1, month: -1 });

    res.status(200).json({ success: true, data: revenueData });
  } catch (error) {
    console.error("Error getting revenue:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Create revenue record for a user
exports.createUserRevenue = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year, total_deposit, total_withdrawal, total_profit } =
      req.body;

    // Validate required fields
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required fields",
      });
    }

    // Check if revenue record already exists for this month/year
    const existingRevenue = await Revenue.findOne({
      user: userId,
      month,
      year: parseInt(year),
    });

    if (existingRevenue) {
      return res.status(400).json({
        success: false,
        message: "Revenue record already exists for this month and year",
      });
    }

    // Create new revenue record
    const newRevenue = new Revenue({
      user: userId,
      month,
      year: parseInt(year),
      total_deposit: total_deposit || 0,
      total_withdrawal: total_withdrawal || 0,
      total_profit: total_profit || 0,
      total_revenue:
        (total_deposit || 0) - (total_withdrawal || 0) + (total_profit || 0),
    });

    const savedRevenue = await newRevenue.save();

    res.status(201).json({
      success: true,
      data: savedRevenue,
    });
  } catch (error) {
    console.error("Error creating revenue:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getTotalProfitFromSignal = async (req, res) => {
  // get total_profit, average_profit
  try {
    const user = req.user.id;
    const signals = await Signal.find({ user });

    const completed = signals.filter((signal) => signal.status === "completed");

    let totalProfit = 0;
    let averageProfit = 0;

    signals.forEach((signal) => {
      totalProfit += signal.profit;
    });

    averageProfit = totalProfit / completed.length;

    res.json({
      success: true,
      total_profit: totalProfit,
      average_profit: averageProfit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.getOrCreateUserSignal = async (req, res) => {
  try {
    const { id } = req.user;
    const today = new Date().toISOString().split("T")[0];

    const user = await User.findOne({ _id: id });

    let signals;

    signals = await Signal.find({
      user,
      time: new RegExp(today, "i"), // Case insensitive search for today's date
    }).sort({ time: 1 });

    if (signals.length === 0) {
      const result = await createDailySignalForUser(user);
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      signals = result.signals;
    }

    res.json({ success: true, signals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const createDailySignalForUser = async (user) => {
  try {
    // First fetch the user to get the capital
    const userCapital = await User.findById(user);
    if (!userCapital) {
      throw new Error("User not found");
    }

    // Get today's date in ISO format (YYYY-MM-DD)
    const today = new Date().toISOString().split("T")[0];

    // Check if user has any signals for today
    const existingSignals = await Signal.findOne({
      user,
      time: new RegExp(today, "i"), // Case insensitive search for today's date
    });

    if (existingSignals) {
      return {
        success: false,
        error: "User already has signals for today",
      };
    }

    const signals = [
      {
        title: "Signal 1",
        time: `${today} 14:00 - 14:30`,
        traded: false,
        status: "not-started",
        startingCapital: parseFloat(userCapital.running_capital) || 0,
        finalCapital: 0,
        user,
      },
      {
        title: "Signal 2",
        time: `${today} 19:00 - 19:30`,
        traded: false,
        status: "not-started",
        startingCapital: 0,
        finalCapital: 0,
        user,
      },
    ];

    const createdSignals = await Signal.insertMany(signals);

    console.log(createdSignals);

    return {
      success: true,
      signals: createdSignals,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};
