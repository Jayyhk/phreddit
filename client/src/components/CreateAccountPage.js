// src/components/CreateAccountPage.js

import React, { useState } from "react";
import axios from "../axios";

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
      console.error("Registration failed:", err);
      const { error: msg, field } = err.response?.data || {};
      if (field) {
        // put the server error under the correct input
        setErrors({ [field]: msg });
      } else {
        // fall back to global banner for unexpected errors
        onError(msg || "Registration failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        {[
          { name: "firstName", label: "First Name", type: "text" },
          { name: "lastName", label: "Last Name", type: "text" },
          { name: "email", label: "Email", type: "email" },
          { name: "displayName", label: "Display Name", type: "text" },
          { name: "password", label: "Password", type: "password" },
          {
            name: "confirmPassword",
            label: "Confirm Password",
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
        <div className="signup-footer">
          <div className="footer-buttons">
            <button
              type="submit"
              className="button_style button_hover"
              disabled={submitting}
            >
              {submitting ? "Creating Account…" : "Sign Up"}
            </button>
            <button
              type="button"
              className="button_style button_hover"
              onClick={onCancel}
            >
              Back
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
