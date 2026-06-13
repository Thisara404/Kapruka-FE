"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { Plus } from "lucide-react";
import UserMenu from "@/components/auth/UserMenu";
import CartButton from "@/components/cart/CartButton";
import styles from "./Header.module.css";

interface HeaderProps {
  onNewChat: () => void;
  onOpenAuth: () => void;
}

export default function Header({ onNewChat, onOpenAuth }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.avatar} aria-hidden>
          ති
        </div>
        <div className={styles.brandText}>
          <h1 className={styles.title}>Thisari</h1>
          <span className={styles.subtitle}>
            තිසරි · Kapruka AI Shopping Assistant
          </span>
        </div>
      </div>

      <div className={styles.headerActions}>
        <div className={styles.statusContainer}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>Online</span>
        </div>
        {session?.user && (
          <button
            className={styles.newChatBtn}
            onClick={onNewChat}
            title="Start a new conversation"
            aria-label="New chat"
          >
            <Plus size={15} />
            New Chat
          </button>
        )}
        <CartButton />
        <UserMenu session={session} onOpenAuth={onOpenAuth} />
      </div>
    </header>
  );
}
