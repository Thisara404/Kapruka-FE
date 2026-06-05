"use client";

import React from "react";
import { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  onSelectProduct: (productId: string, productName: string) => void;
  onViewDetails: (productId: string, productName: string) => void;
  onBuyNow?: (product: Product) => void;
}

export default function ProductGrid({
  products,
  onSelectProduct,
  onViewDetails,
  onBuyNow,
}: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="product-grid-empty glass">
        <p>No products found matching your search. Try another keyword.</p>
      </div>
    );
  }

  return (
    <div className="product-grid-wrapper animate-fade-in-up">
      <div className="product-grid-header">
        Showing {products.length} products found:
      </div>
      <div className="product-carousel">
        {products.map((product) => (
          <div key={product.id} className="product-carousel-item">
            <ProductCard
              product={product}
              onSelect={onSelectProduct}
              onViewDetails={onViewDetails}
              onBuyNow={onBuyNow}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
