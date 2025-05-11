// src/components/WelcomePage.js

import React, { useState } from "react";
import axios from "axios";

axios.defaults.withCredentials = true;

export default function WelcomePage({ onLogin, onRegister, onGuest }) {
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
      const res = await axios.post("/login", form);
      await onLogin();
      setServerMsg(res.data.message);
    } catch (err) {
      setServerMsg(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Log In</h2>
      {serverMsg && <div className="server-message">{serverMsg}</div>}
      <form onSubmit={handleSubmit} noValidate>
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
        <button
          type="submit"
          className="button_style button_hover full-width"
          disabled={loading}
        >
          {loading ? "Logging in…" : "Log In"}
        </button>
      </form>

      <div className="signup-footer">
        <span className="footer-text">Don't have an account?</span>
        <div className="footer-buttons">
          <button
            type="button"
            className="button_style button_hover"
            onClick={onGuest}
          >
            Continue as Guest
          </button>
          <button
            type="button"
            className="button_style button_hover"
            onClick={onRegister}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
