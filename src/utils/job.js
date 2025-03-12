const Revenue = require("../models/Revenue");
const Signal = require("../models/Signal");
const User = require("../models/User");

const checkIfSunday = (date) => {
  const day = date.getDay();
  return day === 0; // 0 is Sunday
};

exports.updateUsersSignal = async () => {
  try {
    const users = await User.find({});
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Define the time slots we're looking for
    const morningTimeSlot = `${formattedDate} 14:00 - 14:30`;
    const eveningTimeSlot = `${formattedDate} 19:00 - 19:30`;

    // Determine which time slot to check based on current time
    const currentHour = today.getHours();

    console.log(`Processing signals for ${formattedDate}`);

    for (const user of users) {
      // Process morning slot first if we're in the evening
      if (currentHour >= 19) {
        await processTimeSlot(user, morningTimeSlot, true);
      }

      // Then process the current time slot (morning or evening)
      const timeSlotToCheck =
        currentHour < 19 ? morningTimeSlot : eveningTimeSlot;
      await processTimeSlot(
        user,
        timeSlotToCheck,
        timeSlotToCheck === morningTimeSlot
      );
    }

    console.log("Signal update process completed successfully");
  } catch (error) {
    console.error("Error updating user signals:", error);
  }
};

// Helper function to process a specific time slot for a user
const processTimeSlot = async (user, timeSlot, isMorningSlot) => {
  try {
    // Check if signal for this time slot already exists and is traded
    const existingTradedSignal = await Signal.findOne({
      user: user._id,
      time: timeSlot,
      traded: true,
    });

    if (existingTradedSignal) {
      console.log(
        `Signal for ${timeSlot} already processed for user ${user._id}`
      );
      return;
    }

    // Check if today's signal exists but is untraded
    const untradedSignal = await Signal.findOne({
      user: user._id,
      time: timeSlot,
      traded: false,
    });

    // For morning slot, always use user.running_capital
    // For evening slot, get the latest signal (which should be the morning slot)
    let startingCapital;

    if (isMorningSlot) {
      startingCapital = user.running_capital;
    } else {
      // For evening slot, get the latest signal (which should be morning slot)
      const latestSignal = await Signal.findOne({
        user: user._id,
        traded: true,
        status: "completed",
      }).sort({ time: -1 });

      startingCapital = latestSignal
        ? latestSignal.finalCapital
        : user.running_capital;
    }

    // If no starting capital is found, log and exit
    if (!startingCapital) {
      console.log(`No starting capital found for user ${user._id}`);
      return;
    }

    // Calculate profit
    const { balanceBeforeTrade, profitFromTrade, balanceAfterTrade } =
      calculateProfit(startingCapital);

    if (untradedSignal) {
      console.log(
        `Processing existing untraded signal for user ${user._id} at ${timeSlot}`
      );

      // Update the signal
      untradedSignal.startingCapital = balanceBeforeTrade;
      untradedSignal.finalCapital = balanceAfterTrade;
      untradedSignal.profit = profitFromTrade;
      untradedSignal.traded = true;
      untradedSignal.status = "completed";

      await untradedSignal.save();
      console.log(`Updated signal ${untradedSignal._id} for user ${user._id}`);
    } else {
      // Find the signal number from latest signal
      const latestSignal = await Signal.findOne({
        user: user._id,
      }).sort({ time: -1 });

      const signalNumber =
        latestSignal && latestSignal.title.includes("Signal")
          ? parseInt(latestSignal.title.split(" ")[1]) + 1
          : 1;

      console.log(`Creating new signal for user ${user._id} at ${timeSlot}`);

      // Create a new signal
      const newSignal = new Signal({
        startingCapital: balanceBeforeTrade,
        finalCapital: balanceAfterTrade,
        time: timeSlot,
        title: `Signal ${signalNumber}`,
        user: user._id,
        traded: true,
        profit: profitFromTrade,
        status: "completed",
      });

      await newSignal.save();
      console.log(`Created new signal ${newSignal._id} for user ${user._id}`);
    }

    // Update user's running capital and save
    user.running_capital = balanceAfterTrade;
    await user.save();

    // Update monthly revenue with the profit
    await updateUserRevenueForTheMonth(user._id, balanceAfterTrade);

    return balanceAfterTrade;
  } catch (error) {
    console.error(
      `Error processing time slot ${timeSlot} for user ${user._id}:`,
      error
    );
    throw error;
  }
};

// Your existing calculation function
const calculateProfit = (recentCapital) => {
  const balanceBeforeTrade = recentCapital;
  const tradingCapital = recentCapital * 0.01;
  const profitFromTrade = tradingCapital * 0.88;
  const balanceAfterTrade = balanceBeforeTrade + profitFromTrade;

  return {
    balanceBeforeTrade,
    tradingCapital,
    profitFromTrade,
    balanceAfterTrade,
  };
};

const updateUserRevenueForTheMonth = async (userId, profitAmount) => {
  const today = new Date();
  const month = today.getMonth() + 1;
  console.log(month);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  try {
    const user = await User.findById(userId);

    if (!user) {
      console.log(`User not found with ID: ${userId}`);
      return null;
    }

    // Get existing revenue for the month
    const existingRevenue = await Revenue.findOne({ user: userId, month });

    // Calculate new total revenue
    const currentTotal = existingRevenue ? existingRevenue.total_revenue : 0;
    const newTotal = currentTotal + profitAmount;

    // Update the revenue record
    const revenue = await Revenue.findOneAndUpdate(
      { user: userId, month: months[month] },
      {
        total_revenue: newTotal,
      },
      { new: true, upsert: true }
    );

    console.log(`Updated revenue for user ${userId}, month ${month}:`, revenue);
    return revenue;
  } catch (error) {
    console.error("Error updating user revenue:", error);
    throw error;
  }
};
