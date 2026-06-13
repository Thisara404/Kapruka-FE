"use client";

import React, { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { AlertTriangle, LogOut, UserCheck } from "lucide-react";
import { deactivateAccount } from "@/lib/api";

interface UserMenuProps {
  session: any;
  onOpenAuth: () => void;
}

function UserAvatar({ user, size = 36 }: { user: any; size?: number }) {
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  return (
    <>
      {user.image ? (
        <img
          src={user.image}
          alt={user.name || "User"}
          className="user-avatar-img"
          referrerPolicy="no-referrer"
          width={size}
          height={size}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            (e.target as HTMLImageElement).nextElementSibling?.removeAttribute(
              "style",
            );
          }}
        />
      ) : null}
      <span
        className="user-avatar-initials"
        style={user.image ? { display: "none" } : undefined}
      >
        {initials}
      </span>
    </>
  );
}

function DeactivateConfirm({
  onCancel,
  onDeactivate,
}: {
  onCancel: () => void;
  onDeactivate: () => void;
}) {
  const [deactivating, setDeactivating] = useState(false);
  const [msg, setMsg] = useState("");

  const handleConfirm = async () => {
    setDeactivating(true);
    setMsg("");
    try {
      await onDeactivate();
      setMsg("Account deactivated! Signing you out...");
      setTimeout(() => signOut({ callbackUrl: "/" }), 2000);
    } catch (err: any) {
      setMsg(err.message || "An error occurred");
      setDeactivating(false);
    }
  };

  return (
    <div
      className="auth-overlay animate-fade-in"
      onClick={() => !deactivating && onCancel()}
    >
      <div
        className="auth-container glass-strong"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420 }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            marginBottom: 12,
            color: "var(--danger)",
          }}
        >
          Deactivate Account?
        </h3>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          Your account and all chats, orders, and history will be permanently
          deleted after 48 hours. This action cannot be undone.
        </p>
        {msg && (
          <div
            className={`auth-alert ${msg.includes("Signing") ? "success" : "error"}`}
            style={{ marginBottom: 16 }}
          >
            {msg}
          </div>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            className="auth-google-btn"
            style={{
              width: "auto",
              margin: 0,
              padding: "8px 16px",
              border: "1px solid var(--border-mid)",
            }}
            onClick={onCancel}
            disabled={deactivating}
          >
            Cancel
          </button>
          <button
            className="auth-submit-btn"
            style={{
              width: "auto",
              margin: 0,
              padding: "8px 16px",
              backgroundColor: "var(--danger)",
            }}
            onClick={handleConfirm}
            disabled={deactivating}
          >
            {deactivating ? "Deactivating..." : "Yes, Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserMenu({ session, onOpenAuth }: UserMenuProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  if (!session?.user) {
    return (
      <button className="auth-trigger-btn" onClick={onOpenAuth}>
        <UserCheck size={16} />
        Sign In
      </button>
    );
  }

  const user = session.user;
  const firstName = user.name?.split(" ")[0] ?? "You";

  return (
    <>
      <div className="user-menu-container" ref={dropdownRef}>
        <button
          className="user-avatar-btn"
          onClick={() => setDropdownOpen((o) => !o)}
          aria-label="User menu"
        >
          <UserAvatar user={user} />
          <span className="user-display-name">{firstName}</span>
        </button>

        {dropdownOpen && (
          <div className="user-dropdown glass-strong animate-fade-in-up">
            <div className="user-dropdown-header">
              <div className="user-dropdown-avatar">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="user-dropdown-avatar-img"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="user-dropdown-avatar-initials">
                    {user.name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase() ?? "U"}
                  </span>
                )}
              </div>
              <div>
                <p className="user-name">{user.name}</p>
                <p className="user-email">{user.email}</p>
              </div>
            </div>

            <div className="user-dropdown-divider" />

            <button
              className="user-dropdown-item danger"
              onClick={() => {
                setDropdownOpen(false);
                setShowDeactivate(true);
              }}
            >
              <AlertTriangle size={15} />
              Deactivate Account
            </button>

            <div className="user-dropdown-divider" />

            <button
              className="user-dropdown-item"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {showDeactivate && (
        <DeactivateConfirm
          onCancel={() => setShowDeactivate(false)}
          onDeactivate={() => deactivateAccount(session?.accessToken)}
        />
      )}
    </>
  );
}
