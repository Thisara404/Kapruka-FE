"use client";

import React, { useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { auth, googleProvider } from "@/lib/firebase";
import PasswordStrengthBar from "./PasswordStrengthBar";
import GoogleSignInButton from "./GoogleSignInButton";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FieldErrors = { name?: string; email?: string; password?: string };

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getFirebaseErrorMessage(err: any): string {
  switch (err?.code) {
    case "auth/email-already-in-use":
      return "This email address is already registered.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters long.";
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was closed before completion.";
    default:
      return (
        err.message || "An authentication error occurred. Please try again."
      );
  }
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const clearState = () => {
    setError("");
    setMessage("");
    setFieldErrors({});
  };

  const validate = (): boolean => {
    const e: FieldErrors = {};
    if (activeTab === "register" && !name.trim()) e.name = "Name is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!isValidEmail(email)) e.email = "Enter a valid email format.";
    if (!password.trim()) e.password = "Password is required.";
    else if (password.length < 6)
      e.password = "Password must be at least 6 characters.";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();
    if (!validate()) return;
    setLoading(true);
    try {
      if (activeTab === "register") {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        if (cred.user)
          await updateProfile(cred.user, { displayName: name.trim() });
        setMessage("Account registered successfully. Signing you in...");
        const res = await signIn("credentials", {
          email: email.trim(),
          name: name.trim(),
          isFirebase: "true",
          redirect: false,
        });
        if (res?.error)
          throw new Error("Registration complete, but automatic login failed.");
      } else {
        const cred = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        setMessage("Welcome back! Logging you in...");
        const res = await signIn("credentials", {
          email: email.trim(),
          name: cred.user.displayName || email.trim(),
          isFirebase: "true",
          redirect: false,
        });
        if (res?.error)
          throw new Error("Failed to synchronize session with backend.");
      }
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearState();
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        setMessage("Google sign-in successful. Syncing session...");
        const res = await signIn("credentials", {
          email: cred.user.email!,
          name: cred.user.displayName || cred.user.email!,
          image: cred.user.photoURL || undefined,
          isFirebase: "true",
          redirect: false,
        });
        if (res?.error)
          throw new Error("Failed to synchronize Google session with backend.");
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 900);
      }
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
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

        {/* Tabs */}
        <div className="auth-tabs">
          {(["login", "register"] as const).map((tab) => (
            <button
              key={tab}
              className={`auth-tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab);
                clearState();
              }}
              type="button"
            >
              {tab === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error && (
            <div className="auth-alert error">
              {" "}
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="auth-alert success">
              <CheckCircle2 size={15} />
              <span>{message}</span>
            </div>
          )}

          {activeTab === "register" && (
            <div className="auth-input-group">
              <label htmlFor="auth-name">Name</label>
              <div
                className={`auth-input-shell ${fieldErrors.name ? "invalid" : ""}`}
              >
                <User size={16} className="auth-input-icon" />
                <input
                  id="auth-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFieldErrors((p) => ({ ...p, name: undefined }));
                  }}
                  required
                  disabled={loading}
                />
              </div>
              {fieldErrors.name && (
                <span className="auth-field-error">{fieldErrors.name}</span>
              )}
            </div>
          )}

          <div className="auth-input-group">
            <label htmlFor="auth-email">Email Address</label>
            <div
              className={`auth-input-shell ${fieldErrors.email ? "invalid" : ""}`}
            >
              <Mail size={16} className="auth-input-icon" />
              <input
                id="auth-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors((p) => ({ ...p, email: undefined }));
                }}
                required
                disabled={loading}
              />
            </div>
            {fieldErrors.email && (
              <span className="auth-field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="auth-input-group">
            <label htmlFor="auth-password">Password</label>
            <div
              className={`auth-input-shell ${fieldErrors.password ? "invalid" : ""}`}
            >
              <Lock size={16} className="auth-input-icon" />
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((p) => ({ ...p, password: undefined }));
                }}
                required
                disabled={loading}
              />
              <button
                className="auth-eye-btn"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {activeTab === "register" && (
              <PasswordStrengthBar password={password} />
            )}
            {fieldErrors.password && (
              <span className="auth-field-error">{fieldErrors.password}</span>
            )}
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading
              ? "Please wait..."
              : activeTab === "login"
                ? "Sign In"
                : "Register"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <GoogleSignInButton onClick={handleGoogleSignIn} disabled={loading} />
      </div>
    </div>
  );
}
