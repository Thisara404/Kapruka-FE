import ChatWindow from "@/components/ChatWindow";
import styles from "./page.module.css";

export default function Home() {
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
        <div className={styles.statusContainer}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>Active</span>
        </div>
      </header>

      <section className={styles.chatSection}>
        <ChatWindow />
      </section>
    </main>
  );
}
