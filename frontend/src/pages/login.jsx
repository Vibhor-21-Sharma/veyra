import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://veyra-gt15.onrender.com/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || data.error || "Login failed.");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);

      setMessage("Login successful! Redirecting...");

      setTimeout(() => {
        window.location.href = "/#/dashboard";
      }, 500);
    } catch (error) {
      setMessage("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome Back</h1>

        <p>Login to continue using Veyra</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && <p>{message}</p>}

        <p>
          Don't have an account?{" "}
          <a href="#/register">Create Account</a>
        </p>
      </div>
    </div>
  );
}

export default Login;