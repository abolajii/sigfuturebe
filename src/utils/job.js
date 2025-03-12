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
    const timeSlotToCheck =
      currentHour < 19 ? morningTimeSlot : eveningTimeSlot;

    console.log(`Checking for signals on ${formattedDate}`);

    for (const user of users) {
      // Get the user's most recent signal to use as base for calculations
      const latestSignal = await Signal.findOne({
        user: user._id,
        traded: true,
        status: "completed",
      }).sort({ time: -1 });

      if (!latestSignal) {
        console.log(`No previous signals found for user ${user._id}`);
        continue;
      }

      // Check if today's signal exists but is untraded
      const todaySignal = await Signal.findOne({
        user: user._id,
        time: timeSlotToCheck,
        traded: false,
      });

      if (todaySignal) {
        console.log(
          `Processing existing untraded signal for user ${user._id} at ${timeSlotToCheck}`
        );

        // Calculate profit based on the latest completed signal
        const { balanceBeforeTrade, profitFromTrade, balanceAfterTrade } =
          calculateProfit(latestSignal.finalCapital);

        // Update the signal
        todaySignal.startingCapital = balanceBeforeTrade;
        todaySignal.finalCapital = balanceAfterTrade;
        todaySignal.profit = profitFromTrade;
        todaySignal.traded = true;
        todaySignal.status = "completed";

        user.running_capital = balanceAfterTrade;
        await updateUserRevenueForTheMonth(user._id, profitFromTrade);

        await todaySignal.save();
        await user.save();
        console.log(`Updated signal ${todaySignal._id} for user ${user._id}`);
      } else {
        // Determine the next signal number
        const signalNumber = latestSignal.title.includes("Signal")
          ? parseInt(latestSignal.title.split(" ")[1]) + 1
          : 1;

        console.log(
          `Creating new signal for user ${user._id} at ${timeSlotToCheck}`
        );

        // Calculate profit based on the latest signal
        const { balanceBeforeTrade, profitFromTrade, balanceAfterTrade } =
          calculateProfit(latestSignal.finalCapital);

        // Create a new signal
        const newSignal = new Signal({
          startingCapital: balanceBeforeTrade,
          finalCapital: balanceAfterTrade,
          time: timeSlotToCheck,
          title: `Signal ${signalNumber}`,
          user: user._id,
          traded: true,
          profit: profitFromTrade,
          status: "completed",
        });

        await newSignal.save();
        user.running_capital = balanceAfterTrade;
        await user.save();

        await updateUserRevenueForTheMonth(user._id, profitFromTrade);

        console.log(`Created new signal ${newSignal._id} for user ${user._id}`);
      }
    }

    console.log("Signal update process completed successfully");
  } catch (error) {
    console.error("Error updating user signals:", error);
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
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}`;

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
      { user: userId, month },
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
