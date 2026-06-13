"use client";

import React from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import styles from "./CartButton.module.css";

export default function CartButton() {
  const { totalItems, openCart } = useCart();

  return (
    <button
      className={styles.cartBtn}
      onClick={openCart}
      aria-label={`Open cart${totalItems > 0 ? `, ${totalItems} item${totalItems !== 1 ? "s" : ""}` : ""}`}
      title="View cart"
    >
      <ShoppingCart size={18} />
      {totalItems > 0 && (
        <span className={styles.badge} key={totalItems}>
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </button>
  );
}
