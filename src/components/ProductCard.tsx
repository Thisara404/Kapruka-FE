"use client";

import React from "react";
import { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  onSelect: (productId: string, productName: string) => void;
  onViewDetails: (productId: string, productName: string) => void;
}

export default function ProductCard({
  product,
  onSelect,
  onViewDetails,
}: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: product.price.currency || "LKR",
    minimumFractionDigits: 0,
  }).format(product.price.amount);

  const hasComparePrice =
    product.compare_at_price && product.compare_at_price.amount > product.price.amount;

  const formattedComparePrice = hasComparePrice
    ? new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: product.compare_at_price!.currency || "LKR",
        minimumFractionDigits: 0,
      }).format(product.compare_at_price!.amount)
    : null;

  // Use Kapruka's default image placeholder if null
  const imageUrl = product.image_url || "/placeholder-product.png";

  return (
    <div className={`product-card glass ${!product.in_stock ? "out-of-stock" : ""}`}>
      <div className="product-image-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />
        {!product.in_stock && <div className="out-of-stock-badge">Out of Stock</div>}
        {product.category && (
          <span className="product-category-tag">{product.category.name}</span>
        )}
      </div>

      <div className="product-details">
        <h3 className="product-title" title={product.name}>
          {product.name}
        </h3>
        
        <p className="product-summary" title={product.summary}>
          {product.summary}
        </p>

        <div className="product-price-row">
          <span className="product-price">{formattedPrice}</span>
          {hasComparePrice && (
            <span className="product-compare-price">{formattedComparePrice}</span>
          )}
        </div>

        <div className="product-actions">
          <button
            onClick={() => onViewDetails(product.id, product.name)}
            className="product-btn secondary"
            type="button"
          >
            Details
          </button>
          <button
            onClick={() => onSelect(product.id, product.name)}
            disabled={!product.in_stock}
            className="product-btn primary"
            type="button"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
}
