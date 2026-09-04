
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/user");
const Task = require("./models/task");
const Goal = require("./models/goal");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==================== MONGODB ====================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.log("MongoDB Connection Error:", err);
  });

// ==================== HOME ====================

app.get("/", (req, res) => {
  res.send("Veyra Backend is running!");
});

// ==================== REGISTER ====================

app.post("/users", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// ==================== LOGIN ====================

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// ==================== JWT ====================

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Access denied. Token required.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.userId = decoded.userId;

    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// ==================== PROFILE ====================

app.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      user,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// ==================== TASKS ====================

// GET TASKS

app.get("/tasks", verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.userId,
    }).sort({
      createdAt: -1,
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// CREATE TASK

app.post("/tasks", verifyToken, async (req, res) => {
  try {
    const {
      title,
      deadline,
      priority,
      category,
      notes,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

    const task = await Task.create({
      title: title.trim(),
      deadline: deadline || null,
      priority: priority || "Medium",
      category: category || "General",
      notes: notes || "",
      userId: req.userId,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// COMPLETE / UNCOMPLETE

app.put("/tasks/:id", verifyToken, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    task.completed = !task.completed;

    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// UPDATE DETAILS

app.put("/tasks/:id/details", verifyToken, async (req, res) => {
  try {
    const {
      title,
      deadline,
      priority,
      category,
      notes,
    } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (title !== undefined) task.title = title.trim();
    if (deadline !== undefined) task.deadline = deadline || null;
    if (priority !== undefined) task.priority = priority;
    if (category !== undefined) task.category = category;
    if (notes !== undefined) task.notes = notes;

    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// DELETE

app.delete("/tasks/:id", verifyToken, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// ==================== GOALS ====================

// GET GOALS + PROGRESS

app.get("/goals", verifyToken, async (req, res) => {
  try {
    let goal = await Goal.findOne({
      userId: req.userId,
    });

    if (!goal) {
      goal = await Goal.create({
        userId: req.userId,
      });
    }

    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();

    startOfWeek.setDate(
      startOfWeek.getDate() - day
    );

    startOfWeek.setHours(0, 0, 0, 0);

    const todayCompleted = await Task.countDocuments({
      userId: req.userId,
      completed: true,
      updatedAt: {
        $gte: startOfDay,
      },
    });

    const weekCompleted = await Task.countDocuments({
      userId: req.userId,
      completed: true,
      updatedAt: {
        $gte: startOfWeek,
      },
    });

    const dailyProgress = Math.min(
      Math.round(
        (todayCompleted / goal.dailyGoal) * 100
      ),
      100
    );

    const weeklyProgress = Math.min(
      Math.round(
        (weekCompleted / goal.weeklyGoal) * 100
      ),
      100
    );

    // ==================== STREAK ====================

    const completedTasks = await Task.find({
      userId: req.userId,
      completed: true,
    }).sort({
      updatedAt: -1,
    });

    const completedDates = new Set();

    completedTasks.forEach((task) => {
      const date = new Date(task.updatedAt);

      completedDates.add(
        `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      );
    });

    let streak = 0;

    const checkDate = new Date();

    while (true) {
      const key =
        `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;

      if (!completedDates.has(key)) {
        break;
      }

      streak++;

      checkDate.setDate(
        checkDate.getDate() - 1
      );
    }

    res.json({
      dailyGoal: goal.dailyGoal,
      weeklyGoal: goal.weeklyGoal,
      todayCompleted,
      weekCompleted,
      dailyProgress,
      weeklyProgress,
      streak,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// UPDATE GOALS

app.put("/goals", verifyToken, async (req, res) => {
  try {
    const {
      dailyGoal,
      weeklyGoal,
    } = req.body;

    const goal = await Goal.findOneAndUpdate(
      { userId: req.userId },
      {
        dailyGoal,
        weeklyGoal,
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.json(goal);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});