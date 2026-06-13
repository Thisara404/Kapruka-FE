"use client";

import React from "react";
import { ShoppingCart, Check, Eye } from "lucide-react";
import { Product } from "@/lib/types";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  product: Product;
  onViewDetails: (productId: string, productName: string) => void;
}

export default function ProductCard({
  product,
  onViewDetails,
}: ProductCardProps) {
  const { addItem, items } = useCart();
  const cartItem = items.find((i) => i.product.id === product.id);
  const inCart = !!cartItem;

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: currency || "LKR",
      minimumFractionDigits: 0,
    }).format(amount);

  const hasDiscount =
    product.compare_at_price &&
    product.compare_at_price.amount > product.price.amount;

  const discountPct = hasDiscount
    ? Math.round(
        ((product.compare_at_price!.amount - product.price.amount) /
          product.compare_at_price!.amount) *
          100,
      )
    : 0;

  return (
    <div
      className={[
        "product-card glass",
        !product.in_stock ? "out-of-stock" : "",
        inCart ? "in-cart" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Image */}
      <div className="product-image-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url || "/placeholder-product.png"}
          alt={product.name}
          className="product-image"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder-product.png";
          }}
        />
        {!product.in_stock && (
          <div className="out-of-stock-badge">Out of Stock</div>
        )}
        {inCart && (
          <div className="in-cart-badge">
            <Check size={10} />
            {cartItem!.quantity > 1
              ? `×${cartItem!.quantity} In Cart`
              : "In Cart"}
          </div>
        )}
        {product.category && (
          <span className="product-category-tag">{product.category.name}</span>
        )}
      </div>

      {/* Details */}
      <div className="product-details">
        <h3 className="product-title" title={product.name}>
          {product.name}
        </h3>
        <p className="product-summary" title={product.summary}>
          {product.summary}
        </p>

        <div className="product-price-row">
          <span className="product-price">
            {formatCurrency(product.price.amount, product.price.currency)}
          </span>
          {hasDiscount && (
            <>
              <span className="product-compare-price">
                {formatCurrency(
                  product.compare_at_price!.amount,
                  product.compare_at_price!.currency,
                )}
              </span>
              <span className="product-discount-badge">{discountPct}% OFF</span>
            </>
          )}
        </div>

        <div className="product-actions">
          <button
            onClick={() => onViewDetails(product.id, product.name)}
            className="product-btn secondary"
            type="button"
          >
            <Eye size={13} />
            Details
          </button>
          <button
            onClick={() => product.in_stock && addItem(product)}
            disabled={!product.in_stock}
            className={`product-btn ${inCart ? "in-cart-btn" : "primary"}`}
            type="button"
          >
            {inCart ? (
              <>
                <Check size={13} />
                In Cart
              </>
            ) : (
              <>
                <ShoppingCart size={13} />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
