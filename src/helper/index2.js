const User = require("../models/User");
const Revenue = require("../models/Revenue");
const Withdrawal = require("../models/Withdrawal");
const Deposit = require("../models/Deposit");
const Signal = require("../models/Signal");

// Helper function to paginate results

const paginateData = (data, page, limit) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results = {};

  if (endIndex < data.length) {
    results.next = {
      page: page + 1,
      limit: limit,
    };
  }

  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit: limit,
    };
  }

  results.data = data.slice(startIndex, endIndex);
  results.totalPages = Math.ceil(data.length / limit);
  results.currentPage = page;

  return results;
};

// Helper function to update revenue for a specific month and year
exports.updateRevenueForMonthYear = async (
  userId,
  date,
  depositAmount = 0,
  withdrawalAmount = 0,
  profitAmount = 0
) => {
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  try {
    let revenue = await Revenue.findOne({
      user: userId,
      month,
      year,
    });

    if (!revenue) {
      revenue = new Revenue({
        user: userId,
        month,
        year,
        total_deposit: depositAmount,
        total_withdrawal: withdrawalAmount,
        total_profit: profitAmount,
        total_revenue: depositAmount - withdrawalAmount + profitAmount,
      });
    } else {
      revenue.total_deposit += depositAmount;
      revenue.total_withdrawal += withdrawalAmount;
      revenue.total_profit += profitAmount;
      revenue.total_revenue =
        revenue.total_deposit - revenue.total_withdrawal + revenue.total_profit;
    }

    await revenue.save();
    return revenue;
  } catch (error) {
    console.error("Error updating revenue:", error);
    throw error;
  }
};

// Helper function to update revenue when a deposit is changed
exports.updateRevenueForDepositChange = async (deposit, amountDifference) => {
  const date = deposit.date;
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  try {
    const revenue = await Revenue.findOne({
      user: deposit.user,
      month,
      year,
    });

    if (revenue) {
      revenue.total_deposit += amountDifference;
      revenue.total_revenue += amountDifference;
      await revenue.save();
    }
  } catch (error) {
    console.error("Error updating revenue for deposit change:", error);
    throw error;
  }
};

// Helper function to update revenue when a withdrawal is changed
exports.updateRevenueForWithdrawalChange = async (
  withdrawal,
  amountDifference
) => {
  const date = withdrawal.date;
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  try {
    const revenue = await Revenue.findOne({
      user: withdrawal.user,
      month,
      year,
    });

    if (revenue) {
      revenue.total_withdrawal += amountDifference;
      revenue.total_revenue -= amountDifference;
      await revenue.save();
    }
  } catch (error) {
    console.error("Error updating revenue for withdrawal change:", error);
    throw error;
  }
};

// Update user profile with service function
exports.updateLoggedInUser = async (user) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(user.id, user, {
      new: true,
      runValidators: true,
    }).select("-password");

    return updatedUser;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Create deposit for user with service function
exports.createDepositForUser = async (user, depositData) => {
  try {
    const { amount, date, whenDesposited, bonus } = depositData;

    const newDeposit = new Deposit({
      user: user.id,
      amount,
      date: date || new Date(),
      whenDesposited: whenDesposited || 0,
      bonus: bonus || 0,
    });

    const deposit = await newDeposit.save();

    // Update user's running capital
    const userDoc = await User.findById(user.id);
    userDoc.running_capital += amount + (bonus || 0);
    await userDoc.save();

    // Update or create revenue record
    await updateRevenueForMonthYear(user.id, date || new Date(), amount, 0, 0);

    return deposit;
  } catch (error) {
    console.error("Error creating deposit for user:", error);
    throw error;
  }
};

// Create withdrawal for user with service function
exports.createWithdrawalForUser = async (user, withdrawalData) => {
  try {
    const { amount, date, whenWithdrawn } = withdrawalData;

    // Check if user has sufficient balance
    const userDoc = await User.findById(user.id);
    if (userDoc.running_capital < amount) {
      throw new Error("Insufficient balance for withdrawal");
    }

    const newWithdrawal = new Withdrawal({
      user: user.id,
      amount,
      date: date || new Date(),
      whenWithdrawn: whenWithdrawn || 0,
    });

    const withdrawal = await newWithdrawal.save();

    // Update user's running capital
    userDoc.running_capital -= amount;
    await userDoc.save();

    // Update or create revenue record
    await updateRevenueForMonthYear(user.id, date || new Date(), 0, amount, 0);

    return withdrawal;
  } catch (error) {
    console.error("Error creating withdrawal for user:", error);
    throw error;
  }
};

// Get all deposits for user with service function
exports.getAllDepositsForUser = async (user, filterOptions = {}) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = filterOptions;

    const query = { user: user.id };

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

    return {
      deposits,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error getting deposits for user:", error);
    throw error;
  }
};

// Get all signals for user with service function
exports.getAllSignalsForUser = async (user, filterOptions = {}) => {
  try {
    const { page = 1, limit = 10, status } = filterOptions;

    const query = { user: user.id };

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

    return {
      signals,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error getting signals for user:", error);
    throw error;
  }
};

// Get all withdrawals for user with service function
exports.getAllWithdrawalsForUser = async (user, filterOptions = {}) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = filterOptions;

    const query = { user: user.id };

    // Add date filtering if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const withdrawals = await Withdrawal.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Withdrawal.countDocuments(query);

    return {
      withdrawals,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error getting withdrawals for user:", error);
    throw error;
  }
};

// Update deposit for user with service function
exports.updateDepositForUser = async (user, depositId, updateData) => {
  try {
    const { amount, date, whenDesposited, bonus } = updateData;

    // Find the deposit and ensure it belongs to the user
    const deposit = await Deposit.findOne({ _id: depositId, user: user.id });

    if (!deposit) {
      throw new Error("Deposit not found");
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
      const userDoc = await User.findById(user.id);
      userDoc.running_capital += difference;
      await userDoc.save();

      // Update revenue records if needed
      await updateRevenueForDepositChange(deposit, difference);
    }

    return deposit;
  } catch (error) {
    console.error("Error updating deposit for user:", error);
    throw error;
  }
};

// Update withdrawal for user with service function
exports.updateWithdrawalForUser = async (user, withdrawalId, updateData) => {
  try {
    const { amount, date, whenWithdrawn } = updateData;

    // Find the withdrawal and ensure it belongs to the user
    const withdrawal = await Withdrawal.findOne({
      _id: withdrawalId,
      user: user.id,
    });

    if (!withdrawal) {
      throw new Error("Withdrawal not found");
    }

    // Calculate the difference in amount to update user's running capital
    const oldAmount = withdrawal.amount;
    const difference = oldAmount - amount;

    // Check if user has sufficient balance if increasing withdrawal amount
    if (difference < 0) {
      const userDoc = await User.findById(user.id);
      if (userDoc.running_capital < Math.abs(difference)) {
        throw new Error("Insufficient balance for withdrawal update");
      }
    }

    // Update withdrawal
    withdrawal.amount = amount;
    if (date) withdrawal.date = date;
    if (whenWithdrawn !== undefined) withdrawal.whenWithdrawn = whenWithdrawn;

    await withdrawal.save();

    // Update user's running capital
    if (difference !== 0) {
      const userDoc = await User.findById(user.id);
      userDoc.running_capital += difference;
      await userDoc.save();

      // Update revenue records if needed
      await updateRevenueForWithdrawalChange(withdrawal, -difference);
    }

    return withdrawal;
  } catch (error) {
    console.error("Error updating withdrawal for user:", error);
    throw error;
  }
};

// Delete deposit for user with service function
exports.deleteDepositForUser = async (user, depositId) => {
  try {
    // Find the deposit and ensure it belongs to the user
    const deposit = await Deposit.findOne({ _id: depositId, user: user.id });

    if (!deposit) {
      throw new Error("Deposit not found");
    }

    // Update user's running capital
    const userDoc = await User.findById(user.id);
    userDoc.running_capital -= deposit.amount + (deposit.bonus || 0);
    await userDoc.save();

    // Update revenue records
    await updateRevenueForDepositChange(
      deposit,
      -(deposit.amount + (deposit.bonus || 0))
    );

    // Delete the deposit
    await Deposit.findByIdAndDelete(depositId);

    return { success: true };
  } catch (error) {
    console.error("Error deleting deposit for user:", error);
    throw error;
  }
};

// Delete withdrawal for user with service function
exports.deleteWithdrawalForUser = async (user, withdrawalId) => {
  try {
    // Find the withdrawal and ensure it belongs to the user
    const withdrawal = await Withdrawal.findOne({
      _id: withdrawalId,
      user: user.id,
    });

    if (!withdrawal) {
      throw new Error("Withdrawal not found");
    }

    // Update user's running capital
    const userDoc = await User.findById(user.id);
    userDoc.running_capital += withdrawal.amount;
    await userDoc.save();

    // Update revenue records
    await updateRevenueForWithdrawalChange(withdrawal, withdrawal.amount);

    // Delete the withdrawal
    await Withdrawal.findByIdAndDelete(withdrawalId);

    return { success: true };
  } catch (error) {
    console.error("Error deleting withdrawal for user:", error);
    throw error;
  }
};

// Create revenue for user with service function
exports.createRevenueForUser = async (user, revenueData) => {
  try {
    const { month, year, total_deposit, total_withdrawal, total_profit } =
      revenueData;

    // Check if revenue record already exists
    const existingRevenue = await Revenue.findOne({
      user: user.id,
      month,
      year,
    });

    if (existingRevenue) {
      throw new Error("Revenue record already exists for this month and year");
    }

    const newRevenue = new Revenue({
      user: user.id,
      month,
      year,
      total_deposit: total_deposit || 0,
      total_withdrawal: total_withdrawal || 0,
      total_profit: total_profit || 0,
      total_revenue:
        (total_deposit || 0) - (total_withdrawal || 0) + (total_profit || 0),
    });

    return await newRevenue.save();
  } catch (error) {
    console.error("Error creating revenue for user:", error);
    throw error;
  }
};

// Get revenue for user with service function
exports.getRevenueForUser = async (user, filterOptions = {}) => {
  try {
    const { year, month } = filterOptions;

    const query = { user: user.id };

    if (year) query.year = parseInt(year);
    if (month) query.month = month;

    const revenueData = await Revenue.find(query).sort({ year: -1, month: -1 });

    return revenueData;
  } catch (error) {
    console.error("Error getting revenue for user:", error);
    throw error;
  }
};
