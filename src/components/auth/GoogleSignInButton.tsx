import React from "react";

interface GoogleSignInButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function GoogleSignInButton({
  onClick,
  disabled,
}: GoogleSignInButtonProps) {
  return (
    <button
      className="auth-google-btn"
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      <svg
        className="google-icon"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        aria-hidden="true"
      >
        <path
          fill="#EA4335"
          d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.94 5.94 0 0 1 8 12.571a5.94 5.94 0 0 1 5.991-5.943c1.606 0 3.124.62 4.256 1.743l2.943-2.943A9.95 9.95 0 0 0 13.99 2 9.94 9.94 0 0 0 4 11.943a9.94 9.94 0 0 0 9.99 9.943c5.526 0 10.01-4.004 10.01-9.943 0-.648-.076-1.286-.219-1.929H12.24z"
        />
      </svg>
      Sign In with Google
    </button>
  );
}
