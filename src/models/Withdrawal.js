// Withdraawal.js
// mongoose
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const withdrawalSchema = Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: Number,
    date: Date,
    whenWithdrawn: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
