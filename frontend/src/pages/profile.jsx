import { useEffect, useState } from "react";

function Profile() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch("http://localhost:5000/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load profile");
        }

        setUser(data.user);
      })
      .catch((error) => {
        setMessage(error.message);
      });
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (message) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Profile</h1>
          <p>{message}</p>
          <button onClick={logout}>Back to Login</button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>My Profile 👤</h1>
      <p>Your Veyra account information</p>

      <div className="auth-card">
        <h2>{user.name}</h2>

        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <p>
          <strong>Account ID:</strong> {user._id}
        </p>

        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
}

export default Profile;