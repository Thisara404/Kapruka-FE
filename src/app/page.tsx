"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import ChatWindow from "@/components/ChatWindow";
import UserMenu from "@/components/UserMenu";
import AuthModal from "@/components/AuthModal";
import styles from "./page.module.css";

export default function Home() {
  const { data: session } = useSession();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.avatar}>ති</div>
          <div className={styles.brandText}>
            <h1 className={styles.title}>Thisari</h1>
            <span className={styles.subtitle}>තිසරි · Kapruka AI Shopping Assistant</span>
          </div>
        </div>

        <div className="header-actions">
          <div className={styles.statusContainer}>
            <span className={styles.statusDot} />
            <span className={styles.statusText}>Active</span>
          </div>
          <UserMenu session={session} onOpenAuth={() => setIsAuthOpen(true)} />
        </div>
      </header>

      <section className={styles.chatSection}>
        <ChatWindow session={session} />
      </section>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </main>
  );
}
