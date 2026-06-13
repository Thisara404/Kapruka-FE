"use client";

import React, { useState } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useSession } from "next-auth/react";
import CheckoutModal from "@/components/checkout/CheckoutModal";
import { Product } from "@/lib/types";
import styles from "./CartDrawer.module.css";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQty,
    totalItems,
    totalPrice,
    clearCart,
  } = useCart();
  const { data: session } = useSession();
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);

  const currency = items[0]?.product.price.currency || "LKR";

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={closeCart} aria-hidden="true" />

      {/* Drawer panel */}
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* ── Header ── */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitle}>
            <ShoppingBag size={20} />
            <span>Your Cart</span>
            {totalItems > 0 && (
              <span className={styles.itemCount}>
                {totalItems} item{totalItems !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className={styles.drawerActions}>
            {items.length > 0 && (
              <button className={styles.clearBtn} onClick={clearCart}>
                Clear all
              </button>
            )}
            <button
              className={styles.closeBtn}
              onClick={closeCart}
              aria-label="Close cart"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Items list ── */}
        <div className={styles.itemsList}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <ShoppingBag size={52} strokeWidth={1} />
              <p>Your cart is empty</p>
              <span>Search for products and click &quot;Add to Cart&quot;</span>
            </div>
          ) : (
            items.map((item) => {
              const img = item.product.image_url || "/placeholder-product.png";
              const lineTotal = item.product.price.amount * item.quantity;
              return (
                <div key={item.product.id} className={styles.cartItem}>
                  <div className={styles.itemImage}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={item.product.name} loading="lazy" />
                  </div>

                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.product.name}</p>
                    <p className={styles.itemUnitPrice}>
                      {formatPrice(item.product.price.amount)} each
                    </p>

                    <div className={styles.qtyRow}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() =>
                          updateQty(item.product.id, item.quantity - 1)
                        }
                        aria-label="Decrease quantity"
                      >
                        <Minus size={11} />
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() =>
                          updateQty(item.product.id, item.quantity + 1)
                        }
                        aria-label="Increase quantity"
                      >
                        <Plus size={11} />
                      </button>
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeItem(item.product.id)}
                        aria-label="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.itemRight}>
                    <span className={styles.itemTotal}>
                      {formatPrice(lineTotal)}
                    </span>
                    <button
                      className={styles.orderBtn}
                      disabled={!item.product.in_stock}
                      onClick={() => setCheckoutProduct(item.product)}
                      title="Proceed to checkout for this item"
                    >
                      Order
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        {items.length > 0 && (
          <div className={styles.drawerFooter}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Subtotal</span>
              <span className={styles.totalAmount}>
                {formatPrice(totalPrice)}
              </span>
            </div>
            <p className={styles.footerNote}>
              Delivery fees calculated at checkout · Each item ordered
              separately
            </p>
          </div>
        )}
      </aside>

      {/* Per-item checkout modal */}
      {checkoutProduct && (
        <CheckoutModal
          product={checkoutProduct}
          senderName={session?.user?.name || ""}
          accessToken={(session as any)?.accessToken}
          onClose={() => setCheckoutProduct(null)}
          onSuccess={(result: unknown) => {
            setCheckoutProduct(null);
            removeItem(checkoutProduct.id);
            const r = result as Record<string, unknown> | null | undefined;
            if (r?.checkout_url) {
              window.open(
                String(r.checkout_url),
                "_blank",
                "noopener,noreferrer",
              );
            }
          }}
        />
      )}
    </>
  );
}
