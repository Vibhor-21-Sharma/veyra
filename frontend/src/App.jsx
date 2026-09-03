import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";

function Home() {
  return (
    <div className="home">
      <h1>Veyra</h1>

      <p>
        Your simple space to organize tasks,
        stay focused and get things done.
      </p>

      <div className="home-buttons">
        <a href="/login">
          <button className="secondary-btn">Login</button>
        </a>

        <a href="/register">
          <button className="primary-btn">Get Started</button>
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;