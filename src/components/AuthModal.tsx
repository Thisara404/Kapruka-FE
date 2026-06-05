"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (activeTab === "register") {
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        if (!name.trim()) {
          throw new Error("Name is required.");
        }

        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

        // 1. Submit email, name, password to NestJS server registration endpoint
        const registerRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const registerData = await registerRes.json();

        if (!registerRes.ok) {
          throw new Error(registerData.error || "Failed to register account.");
        }

        setMessage("Account registered successfully! Logging you in...");

        // 2. Auto sign-in after registration
        const loginRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (loginRes?.error) {
          throw new Error("Registration complete, but automatic login failed. Please sign in manually.");
        }

        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      } else {
        // 1. Sign in directly via NextAuth credentials provider
        const loginRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (loginRes?.error) {
          throw new Error("Invalid email or password.");
        }

        setMessage("Welcome back! Logging you in...");
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError("");
    setMessage("");
    setLoading(true);
    // Directly trigger NextAuth's native server-side Google OAuth flow
    signIn("google");
  };

  return (
    <div className="auth-overlay animate-fade-in" onClick={onClose}>
      <div
        className="auth-container glass-strong animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="auth-close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        <div className="auth-tabs">
          <button
            className={`auth-tab-btn ${activeTab === "login" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("login");
              setError("");
              setMessage("");
            }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab-btn ${activeTab === "register" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("register");
              setError("");
              setMessage("");
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-alert error">{error}</div>}
          {message && <div className="auth-alert success">{message}</div>}

          {activeTab === "register" && (
            <div className="auth-input-group">
              <label htmlFor="auth-name">Name</label>
              <input
                id="auth-name"
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="auth-input-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="auth-input-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Please wait..." : activeTab === "login" ? "Sign In" : "Register"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button className="auth-google-btn" onClick={handleGoogleSignIn} disabled={loading}>
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.94 5.94 0 0 1 8 12.571a5.94 5.94 0 0 1 5.991-5.943c1.606 0 3.124.62 4.256 1.743l2.943-2.943A9.95 9.95 0 0 0 13.99 2 9.94 9.94 0 0 0 4 11.943a9.94 9.94 0 0 0 9.99 9.943c5.526 0 10.01-4.004 10.01-9.943 0-.648-.076-1.286-.219-1.929H12.24z"
            />
          </svg>
          Sign In with Google
        </button>
      </div>
    </div>
  );
}
