import { useEffect, useMemo, useState } from "react";
import "../App.css";

const API = "https://veyra-gt15.onrender.com";

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState({
    dailyGoal: 3,
    weeklyGoal: 15,
    dailyCompleted: 0,
    weeklyCompleted: 0,
    streak: 0,
  });

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [newTask, setNewTask] = useState({
    title: "",
    deadline: "",
    priority: "Medium",
    category: "General",
    notes: "",
  });

  const [editingId, setEditingId] = useState(null);

  const [editTask, setEditTask] = useState({
    title: "",
    deadline: "",
    priority: "Medium",
    category: "General",
    notes: "",
  });

  const [showGoalSettings, setShowGoalSettings] = useState(false);

  const [goalForm, setGoalForm] = useState({
    dailyGoal: 3,
    weeklyGoal: 15,
  });

  const [toast, setToast] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTasks();
    fetchGoals();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message) => {
    setToast(message);
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
      showToast("Unable to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const response = await fetch(`${API}/goals`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch goals");
      }

      const data = await response.json();

      setGoals(data);

      setGoalForm({
        dailyGoal: data.dailyGoal || 3,
        weeklyGoal: data.weeklyGoal || 15,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();

    if (!newTask.title.trim()) {
      showToast("Enter a task title");
      return;
    }

    try {
      const response = await fetch(`${API}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error("Failed to add task");
      }

      const data = await response.json();

      setTasks((prev) => [data, ...prev]);

      setNewTask({
        title: "",
        deadline: "",
        priority: "Medium",
        category: "General",
        notes: "",
      });

      showToast("Task added");
      fetchGoals();
    } catch (error) {
      console.error(error);
      showToast("Could not add task");
    }
  };

  const toggleTask = async (id) => {
    try {
      const response = await fetch(`${API}/tasks/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const updatedTask = await response.json();

      setTasks((prev) =>
        prev.map((task) =>
          task._id === id ? updatedTask : task
        )
      );

      fetchGoals();
    } catch (error) {
      console.error(error);
      showToast("Could not update task");
    }
  };

  const deleteTask = async (id) => {
    try {
      const response = await fetch(`${API}/tasks/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      setTasks((prev) =>
        prev.filter((task) => task._id !== id)
      );

      showToast("Task deleted");
      fetchGoals();
    } catch (error) {
      console.error(error);
      showToast("Could not delete task");
    }
  };

  const startEditing = (task) => {
    setEditingId(task._id);

    setEditTask({
      title: task.title || "",
      deadline: task.deadline
        ? new Date(task.deadline).toISOString().slice(0, 16)
        : "",
      priority: task.priority || "Medium",
      category: task.category || "General",
      notes: task.notes || "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);

    setEditTask({
      title: "",
      deadline: "",
      priority: "Medium",
      category: "General",
      notes: "",
    });
  };

  const saveEdit = async (id) => {
    if (!editTask.title.trim()) {
      showToast("Task title cannot be empty");
      return;
    }

    try {
      const response = await fetch(`${API}/tasks/${id}/details`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editTask),
      });

      if (!response.ok) {
        throw new Error("Failed to edit task");
      }

      const updatedTask = await response.json();

      setTasks((prev) =>
        prev.map((task) =>
          task._id === id ? updatedTask : task
        )
      );

      cancelEditing();
      showToast("Task updated");
    } catch (error) {
      console.error(error);
      showToast("Could not update task");
    }
  };

  const saveGoals = async () => {
    try {
      const response = await fetch(`${API}/goals`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dailyGoal: Number(goalForm.dailyGoal),
          weeklyGoal: Number(goalForm.weeklyGoal),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save goals");
      }

      const data = await response.json();

      setGoals(data);
      setShowGoalSettings(false);

      showToast("Goals updated");
    } catch (error) {
      console.error(error);
      showToast("Could not update goals");
    }
  };

  const filteredTasks = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        searchValue === "" ||
        task.title?.toLowerCase().includes(searchValue) ||
        task.notes?.toLowerCase().includes(searchValue) ||
        task.category?.toLowerCase().includes(searchValue);

      const matchesPriority =
        priorityFilter === "All" ||
        task.priority === priorityFilter;

      const matchesCategory =
        categoryFilter === "All" ||
        task.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Completed" && task.completed) ||
        (statusFilter === "Pending" && !task.completed);

      return (
        matchesSearch &&
        matchesPriority &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    tasks,
    search,
    priorityFilter,
    categoryFilter,
    statusFilter,
  ]);

  const searchMatches = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) return [];

    return tasks.filter(
      (task) =>
        task.title?.toLowerCase().includes(searchValue) ||
        task.notes?.toLowerCase().includes(searchValue) ||
        task.category?.toLowerCase().includes(searchValue)
    );
  }, [tasks, search]);

  const categories = useMemo(() => {
    const values = tasks
      .map((task) => task.category)
      .filter(Boolean);

    return ["All", ...new Set(values)];
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    const now = new Date();

    return [...tasks]
      .filter((task) => task.deadline && !task.completed)
      .filter((task) => new Date(task.deadline) >= now)
      .sort(
        (a, b) =>
          new Date(a.deadline) -
          new Date(b.deadline)
      )
      .slice(0, 5);
  }, [tasks]);

  const calendarTasks = useMemo(() => {
    const grouped = {};

    tasks.forEach((task) => {
      if (!task.deadline) return;

      const date = new Date(task.deadline)
        .toISOString()
        .split("T")[0];

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push(task);
    });

    return grouped;
  }, [tasks]);

  const dailyPercentage =
    goals.dailyGoal > 0
      ? Math.min(
          100,
          Math.round(
            (goals.dailyCompleted / goals.dailyGoal) * 100
          )
        )
      : 0;

  const weeklyPercentage =
    goals.weeklyGoal > 0
      ? Math.min(
          100,
          Math.round(
            (goals.weeklyCompleted / goals.weeklyGoal) * 100
          )
        )
      : 0;

  const formatDeadline = (deadline) => {
    if (!deadline) return "No deadline";

    const date = new Date(deadline);

    return date.toLocaleString([], {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;

    return (
      new Date(deadline) < new Date()
    );
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      showToast("Notifications are not supported");
      return;
    }

    const permission =
      await Notification.requestPermission();

    if (permission === "granted") {
      showToast("Reminders enabled");
    } else {
      showToast("Notification permission denied");
    }
  };

  return (
    <div className="dashboard-page">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="brand-dot"></span>
          Veyra
        </div>

        <div className="navbar-links">
          <a href="/dashboard">Dashboard</a>
          <a href="/profile">Profile</a>

          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">YOUR SPACE</p>

          <h1>
            Welcome back 👋
          </h1>

          <p className="hero-subtitle">
            Organize your work. Track your progress.
            Stay consistent.
          </p>
        </div>

        <div className="hero-stat">
          <strong>{tasks.length}</strong>
          <span>Total Tasks</span>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">
            Total
          </span>

          <strong>{tasks.length}</strong>

          <p>Tasks created</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            Completed
          </span>

          <strong>
            {tasks.filter((task) => task.completed).length}
          </strong>

          <p>Tasks finished</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            Pending
          </span>

          <strong>
            {tasks.filter((task) => !task.completed).length}
          </strong>

          <p>Still to do</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            Streak
          </span>

          <strong>
            {goals.streak || 0} 🔥
          </strong>

          <p>Days consistent</p>
        </div>
      </section>

      {/* ADD TASK */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PLAN</p>
            <h2>Create a Task ✨</h2>
          </div>
        </div>

        <form
          className="task-form"
          onSubmit={addTask}
        >
          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTask.title}
            onChange={(e) =>
              setNewTask({
                ...newTask,
                title: e.target.value,
              })
            }
          />

          <input
            type="datetime-local"
            value={newTask.deadline}
            onChange={(e) =>
              setNewTask({
                ...newTask,
                deadline: e.target.value,
              })
            }
          />

          <select
            value={newTask.priority}
            onChange={(e) =>
              setNewTask({
                ...newTask,
                priority: e.target.value,
              })
            }
          >
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
          </select>

          <input
            type="text"
            placeholder="Category"
            value={newTask.category}
            onChange={(e) =>
              setNewTask({
                ...newTask,
                category: e.target.value,
              })
            }
          />

          <textarea
            placeholder="Notes (optional)"
            value={newTask.notes}
            onChange={(e) =>
              setNewTask({
                ...newTask,
                notes: e.target.value,
              })
            }
          />

          <button
            type="submit"
            className="primary-btn"
          >
            + Add Task
          </button>
        </form>
      </section>

      {/* GOALS */}
      <section className="dashboard-section goals-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PROGRESS</p>
            <h2>Goals 🎯</h2>
          </div>

          <button
            className="secondary-btn"
            onClick={() =>
              setShowGoalSettings(!showGoalSettings)
            }
          >
            ⚙ Goal Settings
          </button>
        </div>

        {showGoalSettings && (
          <div className="goal-settings">
            <div>
              <label>Daily Goal</label>

              <input
                type="number"
                min="1"
                value={goalForm.dailyGoal}
                onChange={(e) =>
                  setGoalForm({
                    ...goalForm,
                    dailyGoal: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label>Weekly Goal</label>

              <input
                type="number"
                min="1"
                value={goalForm.weeklyGoal}
                onChange={(e) =>
                  setGoalForm({
                    ...goalForm,
                    weeklyGoal: e.target.value,
                  })
                }
              />
            </div>

            <button
              className="primary-btn"
              onClick={saveGoals}
            >
              Save Goals
            </button>
          </div>
        )}

        <div className="goals-grid">
          <div className="goal-card">
            <div className="goal-top">
              <div>
                <span>Daily Goal</span>

                <h3>
                  {goals.dailyCompleted} /{" "}
                  {goals.dailyGoal}
                </h3>
              </div>

              <strong>
                {dailyPercentage}%
              </strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${dailyPercentage}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="goal-card">
            <div className="goal-top">
              <div>
                <span>Weekly Goal</span>

                <h3>
                  {goals.weeklyCompleted} /{" "}
                  {goals.weeklyGoal}
                </h3>
              </div>

              <strong>
                {weeklyPercentage}%
              </strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${weeklyPercentage}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH */}
      <section className="dashboard-section search-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ORGANIZE</p>

            <h2>
              Find Tasks 🔎
            </h2>
          </div>

          <span className="result-count">
            {filteredTasks.length} shown
          </span>
        </div>

        <div className="filter-grid">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value)
            }
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value)
            }
          >
            {categories.map((category) => (
              <option
                value={category}
                key={category}
              >
                {category}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Completed">
              Completed
            </option>
          </select>
        </div>

        {/* ⭐ INLINE SEARCH RESULT */}
        {search.trim() !== "" && (
          <div className="search-result-box">
            <div className="search-result-header">
              <span>🔎 Matching Task</span>

              <span>
                {searchMatches.length} match
                {searchMatches.length !== 1
                  ? "es"
                  : ""}
              </span>
            </div>

            {searchMatches.length > 0 ? (
              <div className="search-result-list">
                {searchMatches.map((task) => (
                  <div
                    key={task._id}
                    className={`search-result-item ${
                      task.completed
                        ? "completed-task"
                        : ""
                    }`}
                  >
                    <div className="search-result-main">
                      <strong>
                        {task.title}
                      </strong>

                      <div className="search-result-meta">
                        <span
                          className={`priority-badge ${
                            task.priority
                              ?.toLowerCase()
                          }`}
                        >
                          {task.priority}
                        </span>

                        <span>
                          {task.category ||
                            "General"}
                        </span>

                        <span>
                          {task.completed
                            ? "Completed"
                            : "Pending"}
                        </span>
                      </div>

                      {task.notes && (
                        <p>
                          {task.notes}
                        </p>
                      )}
                    </div>

                    <button
                      className="secondary-btn"
                      onClick={() =>
                        startEditing(task)
                      }
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="search-no-result">
                No matching task found.
              </div>
            )}
          </div>
        )}
      </section>

      {/* CALENDAR */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PLAN AHEAD</p>
            <h2>Calendar 📅</h2>
          </div>
        </div>

        {Object.keys(calendarTasks).length === 0 ? (
          <div className="empty-state">
            <div>📅</div>
            <h3>No deadlines yet</h3>
            <p>
              Add deadlines to your tasks and they
              will appear here.
            </p>
          </div>
        ) : (
          <div className="calendar-list">
            {Object.entries(calendarTasks)
              .sort(
                ([a], [b]) =>
                  new Date(a) - new Date(b)
              )
              .map(([date, dayTasks]) => (
                <div
                  className="calendar-day"
                  key={date}
                >
                  <div className="calendar-date">
                    {new Date(
                      `${date}T00:00:00`
                    ).toLocaleDateString([], {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </div>

                  <div className="calendar-tasks">
                    {dayTasks.map((task) => (
                      <div
                        className="calendar-task"
                        key={task._id}
                      >
                        <span
                          className={`priority-dot ${
                            task.priority?.toLowerCase()
                          }`}
                        ></span>

                        <span>
                          {task.title}
                        </span>

                        <small>
                          {formatDeadline(
                            task.deadline
                          )}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* REMINDERS */}
      <section className="dashboard-section reminders-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">STAY ON TRACK</p>
            <h2>Reminders 🔔</h2>
          </div>

          <button
            className="secondary-btn"
            onClick={requestNotifications}
          >
            Enable Notifications
          </button>
        </div>

        <div className="reminder-card">
          <div className="reminder-icon">
            🔔
          </div>

          <div>
            <h3>
              Never miss an important deadline
            </h3>

            <p>
              Enable browser notifications to get
              reminders for your upcoming tasks.
            </p>
          </div>
        </div>
      </section>

      {/* UPCOMING DEADLINES */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">COMING UP</p>
            <h2>
              Upcoming Deadlines ⏰
            </h2>
          </div>
        </div>

        {upcomingTasks.length === 0 ? (
          <div className="empty-state">
            <div>🎉</div>
            <h3>Nothing coming up</h3>
            <p>
              You're all clear for now.
            </p>
          </div>
        ) : (
          <div className="upcoming-list">
            {upcomingTasks.map((task) => (
              <div
                className="upcoming-item"
                key={task._id}
              >
                <div>
                  <strong>
                    {task.title}
                  </strong>

                  <span>
                    {task.category ||
                      "General"}
                  </span>
                </div>

                <div
                  className={
                    isOverdue(task.deadline)
                      ? "deadline overdue"
                      : "deadline"
                  }
                >
                  {formatDeadline(
                    task.deadline
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MY TASKS */}
      <section className="dashboard-section tasks-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              WORKSPACE
            </p>

            <h2>
              My Tasks 📋
            </h2>
          </div>

          <span className="result-count">
            {filteredTasks.length} task
            {filteredTasks.length !== 1
              ? "s"
              : ""}
          </span>
        </div>

        {loading ? (
          <div className="loading-state">
            Loading your tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div>✨</div>

            <h3>
              No tasks found
            </h3>

            <p>
              Try changing your filters or create
              a new task.
            </p>
          </div>
        ) : (
          <div className="tasks-list">
            {filteredTasks.map((task) => {
              const searchValue =
                search.trim().toLowerCase();

              const isSearchMatch =
                searchValue !== "" &&
                (
                  task.title
                    ?.toLowerCase()
                    .includes(searchValue) ||
                  task.notes
                    ?.toLowerCase()
                    .includes(searchValue) ||
                  task.category
                    ?.toLowerCase()
                    .includes(searchValue)
                );

              return (
                <div
                  key={task._id}
                  className={`task-card ${
                    task.completed
                      ? "completed-task"
                      : ""
                  } ${
                    isSearchMatch
                      ? "search-highlight"
                      : ""
                  }`}
                >
                  {editingId === task._id ? (
                    <div className="edit-area">
                      <input
                        type="text"
                        value={editTask.title}
                        onChange={(e) =>
                          setEditTask({
                            ...editTask,
                            title:
                              e.target.value,
                          })
                        }
                      />

                      <div className="edit-grid">
                        <input
                          type="datetime-local"
                          value={
                            editTask.deadline
                          }
                          onChange={(e) =>
                            setEditTask({
                              ...editTask,
                              deadline:
                                e.target.value,
                            })
                          }
                        />

                        <select
                          value={
                            editTask.priority
                          }
                          onChange={(e) =>
                            setEditTask({
                              ...editTask,
                              priority:
                                e.target.value,
                            })
                          }
                        >
                          <option value="Low">
                            Low
                          </option>

                          <option value="Medium">
                            Medium
                          </option>

                          <option value="High">
                            High
                          </option>
                        </select>

                        <input
                          type="text"
                          value={
                            editTask.category
                          }
                          onChange={(e) =>
                            setEditTask({
                              ...editTask,
                              category:
                                e.target.value,
                            })
                          }
                        />
                      </div>

                      <textarea
                        value={editTask.notes}
                        onChange={(e) =>
                          setEditTask({
                            ...editTask,
                            notes:
                              e.target.value,
                          })
                        }
                        placeholder="Notes"
                      />

                      <div className="edit-actions">
                        <button
                          className="primary-btn"
                          onClick={() =>
                            saveEdit(task._id)
                          }
                        >
                          Save
                        </button>

                        <button
                          className="secondary-btn"
                          onClick={
                            cancelEditing
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="task-main">
                        <button
                          className={`task-check ${
                            task.completed
                              ? "checked"
                              : ""
                          }`}
                          onClick={() =>
                            toggleTask(task._id)
                          }
                          aria-label={
                            task.completed
                              ? "Mark pending"
                              : "Mark completed"
                          }
                        >
                          {task.completed
                            ? "✓"
                            : ""}
                        </button>

                        <div className="task-content">
                          <h3>
                            {task.title}
                          </h3>

                          {task.notes && (
                            <p className="task-notes">
                              {task.notes}
                            </p>
                          )}

                          <div className="task-meta">
                            <span
                              className={`priority-badge ${
                                task.priority?.toLowerCase()
                              }`}
                            >
                              {task.priority}
                            </span>

                            <span className="category-badge">
                              {task.category ||
                                "General"}
                            </span>

                            {task.deadline && (
                              <span
                                className={
                                  isOverdue(
                                    task.deadline
                                  ) &&
                                  !task.completed
                                    ? "deadline overdue"
                                    : "deadline"
                                }
                              >
                                ⏰{" "}
                                {formatDeadline(
                                  task.deadline
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="task-actions">
                        <button
                          className="edit-btn"
                          onClick={() =>
                            startEditing(task)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() =>
                            deleteTask(task._id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* TOAST */}
      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
    </div>
  );
}

export default Dashboard;