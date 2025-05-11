// src/components/CreateAccountPage.js

import React, { useState } from "react";
import axios from "axios";

export default function CreateAccountPage({ onRegistered, onCancel, onError }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    displayName: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [serverMsg, setServerMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.lastName.trim()) e.lastName = "Last name is required.";
    if (!form.email) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Invalid email.";
    if (!form.displayName.trim()) e.displayName = "Display name is required.";
    if (!form.password) e.password = "Password is required.";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match.";
    ["firstName", "lastName", "displayName", "email"].forEach((field) => {
      if (
        form[field] &&
        form.password.toLowerCase().includes(form[field].toLowerCase())
      ) {
        e.password = "Password may not contain personal information.";
      }
    });
    return e;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({});
    setServerMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await axios.post("/users", form);
      onRegistered();
    } catch (err) {
      if (err.response?.status === 500) {
        // System error - use onError
        onError();
      } else {
        // Validation error from server - show to user
        setServerMsg(err.response?.data?.error || "Registration failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Create Account</h2>
      {serverMsg && <div className="server-message">{serverMsg}</div>}
      <form onSubmit={handleSubmit} noValidate>
        {[
          { label: "First Name", name: "firstName", type: "text" },
          { label: "Last Name", name: "lastName", type: "text" },
          { label: "Email", name: "email", type: "email" },
          { label: "Display Name", name: "displayName", type: "text" },
          { label: "Password", name: "password", type: "password" },
          {
            label: "Confirm Password",
            name: "confirmPassword",
            type: "password",
          },
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
          className="button_style button_hover"
          disabled={submitting}
        >
          {submitting ? "Creating…" : "Sign Up"}
        </button>
      </form>
      <div className="form-footer">
        <button
          type="button"
          className="button_style button_hover"
          onClick={onCancel}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
