"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import ChatWindow from "@/components/ChatWindow";
import UserMenu from "@/components/UserMenu";
import AuthModal from "@/components/AuthModal";
import { Plus } from "lucide-react";
import styles from "./page.module.css";

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function Home() {
  const { data: session } = useSession();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const handleNewChat = () => {
    // Generate a fresh session ID and force remount of ChatWindow
    const newId = generateUUID();
    localStorage.setItem("thisari_session_id", newId);
    setSessionKey((k) => k + 1);
  };

  return (
    <main className={styles.main}>
      {/* Animated background orbs */}
      <div className={styles.orb1} aria-hidden />
      <div className={styles.orb2} aria-hidden />
      <div className={styles.orb3} aria-hidden />

      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.avatar}>ති</div>
          <div className={styles.brandText}>
            <h1 className={styles.title}>Thisari</h1>
            <span className={styles.subtitle}>තිසරි · Kapruka AI Shopping Assistant</span>
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
              onClick={handleNewChat}
              title="Start a new conversation"
              aria-label="New chat"
            >
              <Plus size={15} />
              New Chat
            </button>
          )}
          <UserMenu session={session} onOpenAuth={() => setIsAuthOpen(true)} />
        </div>
      </header>

      <section className={styles.chatSection}>
        <ChatWindow key={sessionKey} session={session} />
      </section>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </main>
  );
}

