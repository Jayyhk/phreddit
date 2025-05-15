// src/components/WelcomePage.js

import React, { useState } from "react";
import axios from "../axios";

export default function WelcomePage({ onLogin, onRegister, onGuest }) {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverMsg, setServerMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = "Email is required";
    if (!form.password) errs.password = "Password is required";
    return errs;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({});
    setServerMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/login", form, {
        withCredentials: true,
      });
      const { token } = response.data;
      sessionStorage.setItem("token", token);
      await onLogin();
    } catch (err) {
      console.error("Login failed:", err);
      const errorMsg =
        err.response?.data?.error || "Login failed. Please try again.";

      if (form.email && form.password) {
        setErrors({
          form: errorMsg,
        });
      } else {
        setErrors({
          [form.email ? "email" : "password"]: errorMsg,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (showLoginForm) {
    return (
      <div className="form-container">
        <h2>Log In</h2>
        {serverMsg && <div className="server-message">{serverMsg}</div>}
        <form onSubmit={handleSubmit} noValidate>
          {errors.form && <div className="error-message">{errors.form}</div>}
          {[
            { name: "email", label: "Email", type: "email" },
            { name: "password", label: "Password", type: "password" },
          ].map((f) => (
            <div className="form-field" key={f.name}>
              <label htmlFor={f.name}>{f.label}</label>
              <input
                id={f.name}
                name={f.name}
                type={f.type}
                value={form[f.name]}
                onChange={handleChange}
              />
              {errors[f.name] && (
                <div className="error-message">{errors[f.name]}</div>
              )}
            </div>
          ))}
          <div className="signup-footer">
            <div className="footer-buttons">
              <button
                type="submit"
                className="button_style button_hover"
                disabled={loading}
              >
                {loading ? "Logging in…" : "Log In"}
              </button>
              <button
                type="button"
                className="button_style button_hover"
                onClick={() => setShowLoginForm(false)}
              >
                Back
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1 style={{ color: "var(--reddit-color)" }}>Welcome to Phreddit</h1>
        <h2 style={{ color: "black" }}>The Phony Reddit</h2>

        <div className="welcome-options">
          <button
            type="button"
            className="welcome-button button_style button_hover"
            onClick={onGuest}
          >
            Continue as Guest
          </button>

          <button
            type="button"
            className="welcome-button button_style button_hover"
            onClick={() => setShowLoginForm(true)}
          >
            Log In
          </button>

          <button
            type="button"
            className="welcome-button button_style button_hover"
            onClick={onRegister}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
