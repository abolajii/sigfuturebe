export const MONTHS = [
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

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const formatValue = (value = 0, currency, nairaRate = 1600) => {
  const options = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  const amount = currency === "NGN" ? value * nairaRate : value;
  const formattedAmount = amount.toLocaleString("en-US", options);
  return `${currency === "NGN" ? "₦" : "$"}${formattedAmount}`;
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const calculateProfit = (
  initialCapital,
  withdraws = [],
  deposits = []
) => {
  // Calculate total withdrawals
  const totalWithdraws = withdraws.reduce((sum, item) => sum + item.amount, 0);

  // Calculate total deposits
  const totalDeposits = deposits.reduce((sum, item) => sum + item.amount, 0);

  // Calculate current capital
  const currentCapital = initialCapital + totalDeposits - totalWithdraws;

  // Calculate profit
  const profit = currentCapital - initialCapital;

  // Calculate profit percentage
  const profitPercentage =
    initialCapital > 0 ? (profit / initialCapital) * 100 : 0;

  return {
    initialCapital,
    currentCapital,
    totalDeposits,
    totalWithdraws,
    profit,
    profitPercentage,
  };
};

export class TradingSchedule {
  constructor(initialCapital) {
    this.yearlyData = [];
    this.monthlyData = [];
    this.weeklyData = [];
    this.initialCapital = initialCapital;
  }

  generateYearlyData(numberOfSignal = 3, deposits = [], withdraws = []) {
    const currentDate = new Date("2025-02-23");
    let runningCapital = this.initialCapital;
    const currentYear = currentDate.getFullYear();
    this.yearlyData = [];

    // Generate data for each month of the current year
    for (let month = 0; month < 12; month++) {
      const date = new Date(currentYear, month, 1);

      // Apply deposits and withdrawals for this month
      const monthDeposits = deposits.filter((d) => {
        const depositDate = new Date(d.date);
        return (
          depositDate.getMonth() === month &&
          depositDate.getFullYear() === currentYear
        );
      });

      const monthWithdraws = withdraws.filter((w) => {
        const withdrawDate = new Date(w.date);
        return (
          withdrawDate.getMonth() === month &&
          withdrawDate.getFullYear() === currentYear
        );
      });

      // Sum deposits for this month
      const totalMonthDeposits = monthDeposits.reduce(
        (sum, d) => sum + d.amount,
        0
      );

      // Sum withdrawals for this month
      const totalMonthWithdraws = monthWithdraws.reduce(
        (sum, w) => sum + w.amount,
        0
      );

      // Update running capital with deposits and withdrawals
      const initialMonthBalance =
        runningCapital + totalMonthDeposits - totalMonthWithdraws;
      let currentBalance = initialMonthBalance;

      // Calculate signals based on numberOfSignal parameter
      const signals = [];
      let totalProfit = 0;

      if (numberOfSignal >= 1) {
        const signal1Capital = currentBalance * 0.01;
        const signal1Profit = signal1Capital * 0.88;
        currentBalance += signal1Profit;
        totalProfit += signal1Profit;
        signals.push({
          time: "Signal 1",
          capital: signal1Capital,
          profit: signal1Profit,
          percentage: ((signal1Profit / signal1Capital) * 100).toFixed(2),
        });
      }

      if (numberOfSignal >= 2) {
        const signal2Capital = currentBalance * 0.01;
        const signal2Profit = signal2Capital * 0.88;
        currentBalance += signal2Profit;
        totalProfit += signal2Profit;
        signals.push({
          time: "Signal 2",
          capital: signal2Capital,
          profit: signal2Profit,
          percentage: ((signal2Profit / signal2Capital) * 100).toFixed(2),
        });
      }

      if (numberOfSignal >= 3) {
        const signal3Capital = currentBalance * 0.01;
        const signal3Profit = signal3Capital * 0.88;
        currentBalance += signal3Profit;
        totalProfit += signal3Profit;
        signals.push({
          time: "Signal 3",
          capital: signal3Capital,
          profit: signal3Profit,
          percentage: ((signal3Profit / signal3Capital) * 100).toFixed(2),
        });
      }

      // Set running capital to final monthly balance
      runningCapital = currentBalance;

      // Create the month entry
      this.yearlyData.push({
        month: MONTHS[month],
        startingCapital: initialMonthBalance,
        finalCapital: currentBalance,
        deposits: monthDeposits,
        withdraws: monthWithdraws,
        totalDeposits: totalMonthDeposits,
        totalWithdraws: totalMonthWithdraws,
        signals,
        totalProfit: totalProfit,
        profitPercentage:
          initialMonthBalance > 0
            ? ((totalProfit / initialMonthBalance) * 100).toFixed(2)
            : "0.00",
      });
    }

    return this.yearlyData;
  }

  generateMonthlyData(numberOfSignal = 3, deposits = [], withdraws = []) {
    const currentDate = new Date("2025-02-23");
    let runningCapital = this.initialCapital;
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    this.monthlyData = [];

    // Get the number of days in the current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Generate data for each day of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);

      // Apply deposits and withdrawals for this day
      const dayDeposits = deposits.filter((d) => {
        const depositDate = new Date(d.date);
        return (
          depositDate.getDate() === day &&
          depositDate.getMonth() === currentMonth &&
          depositDate.getFullYear() === currentYear
        );
      });

      const dayWithdraws = withdraws.filter((w) => {
        const withdrawDate = new Date(w.date);
        return (
          withdrawDate.getDate() === day &&
          withdrawDate.getMonth() === currentMonth &&
          withdrawDate.getFullYear() === currentYear
        );
      });

      // Sum deposits for this day
      const totalDayDeposits = dayDeposits.reduce(
        (sum, d) => sum + d.amount,
        0
      );

      // Sum withdrawals for this day
      const totalDayWithdraws = dayWithdraws.reduce(
        (sum, w) => sum + w.amount,
        0
      );

      // Update running capital with deposits and withdrawals
      const initialDayBalance =
        runningCapital + totalDayDeposits - totalDayWithdraws;
      let currentBalance = initialDayBalance;

      // Calculate signals based on numberOfSignal parameter
      const signals = [];
      let totalProfit = 0;

      const signalCheck = this.checkTime(date);

      if (numberOfSignal >= 1 && signalCheck.firstSignalPassed) {
        const signal1Capital = currentBalance * 0.01;
        const signal1Profit = signal1Capital * 0.88;
        currentBalance += signal1Profit;
        totalProfit += signal1Profit;
        signals.push({
          time: "Signal 1",
          capital: signal1Capital,
          profit: signal1Profit,
          percentage: ((signal1Profit / signal1Capital) * 100).toFixed(2),
        });
      }

      if (numberOfSignal >= 2 && signalCheck.secondSignalPassed) {
        const signal2Capital = currentBalance * 0.01;
        const signal2Profit = signal2Capital * 0.88;
        currentBalance += signal2Profit;
        totalProfit += signal2Profit;
        signals.push({
          time: "Signal 2",
          capital: signal2Capital,
          profit: signal2Profit,
          percentage: ((signal2Profit / signal2Capital) * 100).toFixed(2),
        });
      }

      if (numberOfSignal >= 3 && signalCheck.thirdSignalPassed) {
        const signal3Capital = currentBalance * 0.01;
        const signal3Profit = signal3Capital * 0.88;
        currentBalance += signal3Profit;
        totalProfit += signal3Profit;
        signals.push({
          time: "Signal 3",
          capital: signal3Capital,
          profit: signal3Profit,
          percentage: ((signal3Profit / signal3Capital) * 100).toFixed(2),
        });
      }

      // Set running capital to final daily balance
      runningCapital = currentBalance;

      // Create the day entry
      this.monthlyData.push({
        day: day,
        dayOfWeek: WEEKDAYS[date.getDay()],
        date: date.toISOString().split("T")[0],
        startingCapital: initialDayBalance,
        finalCapital: currentBalance,
        deposits: dayDeposits,
        withdraws: dayWithdraws,
        totalDeposits: totalDayDeposits,
        totalWithdraws: totalDayWithdraws,
        signals,
        totalProfit: totalProfit,
        profitPercentage:
          initialDayBalance > 0
            ? ((totalProfit / initialDayBalance) * 100).toFixed(2)
            : "0.00",
      });
    }

    return this.monthlyData;
  }

  generateWeeklyData(numberOfSignal = 3, deposits = [], withdraws = []) {
    const currentDate = new Date("2025-02-23");
    let runningCapital = this.initialCapital;
    this.weeklyData = [];

    // Get the current day of the week (0 = Sunday, 6 = Saturday)
    const currentDayOfWeek = currentDate.getDay();

    // Calculate the date of the first day of the current week (Sunday)
    const firstDayOfWeek = new Date(currentDate);
    firstDayOfWeek.setDate(currentDate.getDate() - currentDayOfWeek);

    // Generate data for each day of the current week
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + dayOffset);

      // Apply deposits and withdrawals for this day
      const dayDeposits = deposits.filter((d) => {
        const depositDate = new Date(d.date);
        return depositDate.toDateString() === date.toDateString();
      });

      const dayWithdraws = withdraws.filter((w) => {
        const withdrawDate = new Date(w.date);
        return withdrawDate.toDateString() === date.toDateString();
      });

      // Sum deposits for this day
      const totalDayDeposits = dayDeposits.reduce(
        (sum, d) => sum + d.amount,
        0
      );

      // Sum withdrawals for this day
      const totalDayWithdraws = dayWithdraws.reduce(
        (sum, w) => sum + w.amount,
        0
      );

      // Update running capital with deposits and withdrawals
      const initialDayBalance =
        runningCapital + totalDayDeposits - totalDayWithdraws;
      let currentBalance = initialDayBalance;

      // Calculate signals based on numberOfSignal parameter
      const signals = [];
      let totalProfit = 0;

      const signalCheck = this.checkTime(date);

      if (numberOfSignal >= 1 && signalCheck.firstSignalPassed) {
        const signal1Capital = currentBalance * 0.01;
        const signal1Profit = signal1Capital * 0.88;
        currentBalance += signal1Profit;
        totalProfit += signal1Profit;
        signals.push({
          time: "Signal 1",
          capital: signal1Capital,
          profit: signal1Profit,
          percentage: ((signal1Profit / signal1Capital) * 100).toFixed(2),
        });
      }

      if (numberOfSignal >= 2 && signalCheck.secondSignalPassed) {
        const signal2Capital = currentBalance * 0.01;
        const signal2Profit = signal2Capital * 0.88;
        currentBalance += signal2Profit;
        totalProfit += signal2Profit;
        signals.push({
          time: "Signal 2",
          capital: signal2Capital,
          profit: signal2Profit,
          percentage: ((signal2Profit / signal2Capital) * 100).toFixed(2),
        });
      }

      if (numberOfSignal >= 3 && signalCheck.thirdSignalPassed) {
        const signal3Capital = currentBalance * 0.01;
        const signal3Profit = signal3Capital * 0.88;
        currentBalance += signal3Profit;
        totalProfit += signal3Profit;
        signals.push({
          time: "Signal 3",
          capital: signal3Capital,
          profit: signal3Profit,
          percentage: ((signal3Profit / signal3Capital) * 100).toFixed(2),
        });
      }

      // Set running capital to final daily balance
      runningCapital = currentBalance;

      // Create the day entry for the week
      this.weeklyData.push({
        day: date.getDate(),
        dayOfWeek: WEEKDAYS[date.getDay()],
        date: date.toISOString().split("T")[0],
        startingCapital: initialDayBalance,
        finalCapital: currentBalance,
        deposits: dayDeposits,
        withdraws: dayWithdraws,
        totalDeposits: totalDayDeposits,
        totalWithdraws: totalDayWithdraws,
        signals,
        totalProfit: totalProfit,
        profitPercentage:
          initialDayBalance > 0
            ? ((totalProfit / initialDayBalance) * 100).toFixed(2)
            : "0.00",
      });
    }

    return this.weeklyData;
  }

  checkTime(date) {
    const now = new Date();
    const signalTimes = {
      firstSignalTime: 14,
      secondSignalTime: 19,
      thirdSignalTime: 24,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0);

    if (inputDate < today) {
      return {
        firstSignalPassed: true,
        secondSignalPassed: true,
        thirdSignalPassed: true,
      };
    } else if (inputDate.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      return {
        firstSignalPassed: currentHour >= signalTimes.firstSignalTime,
        secondSignalPassed: currentHour >= signalTimes.secondSignalTime,
        thirdSignalPassed: currentHour >= signalTimes.thirdSignalTime,
      };
    }
    return {
      firstSignalPassed: false,
      secondSignalPassed: false,
      thirdSignalPassed: false,
    };
  }

  getDaySuffix(day) {
    if (day >= 11 && day <= 13) {
      return "th";
    }

    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }
}
