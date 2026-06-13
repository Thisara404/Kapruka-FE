"use client";

import React from "react";
import { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  onViewDetails: (productId: string, productName: string) => void;
}

export default function ProductGrid({
  products,
  onViewDetails,
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
        {products.length} product{products.length !== 1 ? "s" : ""} found —
        scroll to explore ›
      </div>
      <div className="product-carousel">
        {products.map((product) => (
          <div key={product.id} className="product-carousel-item">
            <ProductCard product={product} onViewDetails={onViewDetails} />
          </div>
        ))}
      </div>
    </div>
  );
}
