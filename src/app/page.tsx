"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import ChatWindow from "@/components/chat/ChatWindow";
import Header from "@/components/layout/Header";
import AuthModal from "@/components/auth/AuthModal";
import CartDrawer from "@/components/cart/CartDrawer";
import { CartProvider } from "@/contexts/CartContext";
import styles from "./page.module.css";

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function HomeContent() {
  const { data: session } = useSession();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const handleNewChat = () => {
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

      <Header
        onNewChat={handleNewChat}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <section className={styles.chatSection}>
        <ChatWindow key={sessionKey} session={session} />
      </section>

      <CartDrawer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </main>
  );
}

export default function Home() {
  return (
    <CartProvider>
      <HomeContent />
    </CartProvider>
  );
}
