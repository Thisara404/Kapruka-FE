"use client";

import React from "react";
import { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  onSelectProduct: (productId: string, productName: string) => void;
  onViewDetails: (productId: string, productName: string) => void;
}

export default function ProductGrid({
  products,
  onSelectProduct,
  onViewDetails,
}: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="product-grid-empty glass">
        <p>No products found matching your search. Try another keyword! 🎁</p>
      </div>
    );
  }

  return (
    <div className="product-grid-wrapper animate-fade-in-up">
      <div className="product-grid-header">
        Showing {products.length} products found:
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onSelect={onSelectProduct}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
}
