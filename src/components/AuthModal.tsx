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

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  if (!isOpen) return null;

  const clearState = () => {
    setError("");
    setMessage("");
    setFieldErrors({});
  };

  const getFirebaseErrorMessage = (err: any) => {
    const code = err?.code || "";
    switch (code) {
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
        return err.message || "An authentication error occurred. Please try again.";
    }
  };

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};

    if (activeTab === "register" && !name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Enter a valid email format.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();
    if (!validate()) return;

    setLoading(true);
    try {
      if (activeTab === "register") {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);

        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName: name.trim() });
        }

        setMessage("Account registered successfully. Signing you in...");

        const loginRes = await signIn("credentials", {
          email: email.trim(),
          name: name.trim(),
          isFirebase: "true",
          redirect: false,
        });

        if (loginRes?.error) {
          throw new Error("Registration complete, but automatic login failed.");
        }

        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1200);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        setMessage("Welcome back! Logging you in...");

        const loginRes = await signIn("credentials", {
          email: email.trim(),
          name: userCredential.user.displayName || email.trim(),
          isFirebase: "true",
          redirect: false,
        });

        if (loginRes?.error) {
          throw new Error("Failed to synchronize session with backend.");
        }

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

  const handleGoogleSignIn = async () => {
    clearState();
    setLoading(true);

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);

      if (userCredential.user) {
        const user = userCredential.user;
        setMessage("Google sign-in successful. Syncing session...");

        const loginRes = await signIn("credentials", {
          email: user.email!,
          name: user.displayName || user.email!,
          image: user.photoURL || undefined,
          isFirebase: "true",
          redirect: false,
        });

        if (loginRes?.error) {
          throw new Error("Failed to synchronize Google session with backend.");
        }

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

        <div className="auth-tabs">
          <button
            className={`auth-tab-btn ${activeTab === "login" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("login");
              clearState();
            }}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`auth-tab-btn ${activeTab === "register" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("register");
              clearState();
            }}
            type="button"
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error && (
            <div className="auth-alert error">
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
              <div className={`auth-input-shell ${fieldErrors.name ? "invalid" : ""}`}>
                <User size={16} className="auth-input-icon" />
                <input
                  id="auth-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
                  }}
                  required
                  disabled={loading}
                />
              </div>
              {fieldErrors.name && <span className="auth-field-error">{fieldErrors.name}</span>}
            </div>
          )}

          <div className="auth-input-group">
            <label htmlFor="auth-email">Email Address</label>
            <div className={`auth-input-shell ${fieldErrors.email ? "invalid" : ""}`}>
              <Mail size={16} className="auth-input-icon" />
              <input
                id="auth-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                }}
                required
                disabled={loading}
              />
            </div>
            {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
          </div>

          <div className="auth-input-group">
            <label htmlFor="auth-password">Password</label>
            <div className={`auth-input-shell ${fieldErrors.password ? "invalid" : ""}`}>
              <Lock size={16} className="auth-input-icon" />
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
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
            {activeTab === "register" && password.length > 0 && (
              <div className="auth-password-meter">
                <span className={`bar ${passwordStrength >= 1 ? "on" : ""}`} />
                <span className={`bar ${passwordStrength >= 2 ? "on" : ""}`} />
                <span className={`bar ${passwordStrength >= 3 ? "on" : ""}`} />
                <span className={`bar ${passwordStrength >= 4 ? "on" : ""}`} />
              </div>
            )}
            {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}
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
