// Deposit.js
// mongoose
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const depositSchema = Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: Number,
    date: Date,
    whenDesposited: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
    },
    bonus: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Deposit", depositSchema);
