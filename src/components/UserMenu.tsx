"use client";

import React, { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";

interface UserMenuProps {
  session: any;
  onOpenAuth: () => void;
}

export default function UserMenu({ session, onOpenAuth }: UserMenuProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateMsg, setDeactivateMsg] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeactivate = async () => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    setDeactivating(true);
    setDeactivateMsg("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
      }
      const res = await fetch(`${BACKEND_URL}/api/user/deactivate`, {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to deactivate account");
      }
      setDeactivateMsg("Account deactivated! Signing you out...");
      setTimeout(() => {
        signOut({ callbackUrl: "/" });
      }, 2000);
    } catch (err: any) {
      setDeactivateMsg(err.message || "An error occurred");
      setDeactivating(false);
    }
  };

  if (!session?.user) {
    return (
      <button className="auth-trigger-btn" onClick={onOpenAuth}>
        Sign In / Register
      </button>
    );
  }

  const user = session.user;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="user-menu-container" ref={dropdownRef}>
      <button
        className="user-avatar-btn"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-label="User menu"
      >
        {user.image ? (
          <img src={user.image} alt={user.name || "User"} className="user-avatar-img" />
        ) : (
          <span className="user-avatar-initials">{initials}</span>
        )}
        <span className="user-display-name">{user.name}</span>
      </button>

      {dropdownOpen && (
        <div className="user-dropdown glass-strong animate-fade-in-up">
          <div className="user-dropdown-header">
            <p className="user-name">{user.name}</p>
            <p className="user-email">{user.email}</p>
          </div>
          <div className="user-dropdown-divider" />
          <button
            className="user-dropdown-item"
            onClick={() => {
              setDropdownOpen(false);
              window.location.reload();
            }}
          >
            New Chat Session
          </button>
          <button
            className="user-dropdown-item danger"
            onClick={() => {
              setDropdownOpen(false);
              setConfirmDeactivate(true);
            }}
          >
            Deactivate Account
          </button>
          <div className="user-dropdown-divider" />
          <button className="user-dropdown-item" onClick={() => signOut({ callbackUrl: "/" })}>
            Sign Out
          </button>
        </div>
      )}

      {confirmDeactivate && (
        <div className="auth-overlay animate-fade-in" onClick={() => !deactivating && setConfirmDeactivate(false)}>
          <div
            className="auth-container glass-strong"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "420px" }}
          >
            <h3 style={{ fontFamily: "var(--font-display)", marginBottom: "12px", color: "var(--danger)" }}>
              Deactivate Account?
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
              Are you sure you want to deactivate your account? Your account and all your chats,
              orders, and views will be permanently deleted after 48 hours. This action cannot be undone.
            </p>

            {deactivateMsg && (
              <div
                className={`auth-alert ${deactivateMsg.includes("Signing") ? "success" : "error"}`}
                style={{ marginBottom: "16px" }}
              >
                {deactivateMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                className="auth-google-btn"
                style={{ width: "auto", margin: 0, padding: "8px 16px", border: "1px solid var(--border-mid)" }}
                onClick={() => setConfirmDeactivate(false)}
                disabled={deactivating}
              >
                Cancel
              </button>
              <button
                className="auth-submit-btn"
                style={{ width: "auto", margin: 0, padding: "8px 16px", backgroundColor: "var(--danger)" }}
                onClick={handleDeactivate}
                disabled={deactivating}
              >
                {deactivating ? "Deactivating..." : "Yes, Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
