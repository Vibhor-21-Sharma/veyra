const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    dailyGoal: {
      type: Number,
      default: 3,
    },

    weeklyGoal: {
      type: Number,
      default: 15,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Goal", goalSchema);