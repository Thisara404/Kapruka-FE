import React from "react";

interface PasswordStrengthBarProps {
  password: string;
}

function calcStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const LABELS = ["Weak", "Fair", "Good", "Strong"];

export default function PasswordStrengthBar({
  password,
}: PasswordStrengthBarProps) {
  if (!password) return null;
  const strength = calcStrength(password);

  return (
    <div className="auth-password-meter">
      <span className={`bar ${strength >= 1 ? "on" : ""}`} />
      <span className={`bar ${strength >= 2 ? "on" : ""}`} />
      <span className={`bar ${strength >= 3 ? "on" : ""}`} />
      <span className={`bar ${strength >= 4 ? "on" : ""}`} />
      <span className="strength-label">{LABELS[strength - 1] ?? ""}</span>
    </div>
  );
}
