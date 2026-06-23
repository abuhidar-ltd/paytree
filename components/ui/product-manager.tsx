"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { GlassBrick } from "./obsidian-card"
import { toast } from "sonner"

interface Product {
  id: string
  title: string
  description?: string
  price: number
  currency: string
  downloadUrl?: string
  downloadName?: string
  imageUrl?: string
  enabled: boolean
  totalRevenue?: number
  salesCount?: number
}

interface ProductManagerProps {
  products: Product[]
  onProductsChange: (products: Product[]) => void
  isPro: boolean
}

export function ProductManager({ products, onProductsChange, isPro }: ProductManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: "",
    downloadUrl: "",
    downloadName: "",
    imageUrl: "",
  })
  
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProduct.title || !newProduct.price) return
    
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newProduct.title,
          description: newProduct.description || undefined,
          price: Math.round(parseFloat(newProduct.price) * 100), // Convert to cents
          downloadUrl: newProduct.downloadUrl || undefined,
          downloadName: newProduct.downloadName || undefined,
          imageUrl: newProduct.imageUrl || undefined,
        }),
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create product")
      }
      
      const product = await res.json()
      onProductsChange([product, ...products])
      setNewProduct({ title: "", description: "", price: "", downloadUrl: "", downloadName: "", imageUrl: "" })
      setIsAdding(false)
      toast.success("Product created!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create product")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const toggleProduct = async (id: string, enabled: boolean) => {
    onProductsChange(products.map(p => p.id === id ? { ...p, enabled } : p))
    
    try {
      await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
    } catch (error) {
      onProductsChange(products.map(p => p.id === id ? { ...p, enabled: !enabled } : p))
    }
  }
  
  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return
    
    const previous = [...products]
    onProductsChange(products.filter(p => p.id !== id))
    
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" })
      toast.success("Product deleted")
    } catch (error) {
      onProductsChange(previous)
      toast.error("Failed to delete product")
    }
  }
  
  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100)
  }
  
  if (!isPro) {
    return (
      <GlassBrick className="text-center py-12">
        <div className="text-5xl mb-4">🛒</div>
        <h3 className="font-bold text-white text-xl mb-2">Sell Products, Services & Content</h3>
        <p className="text-[#888888] mb-6 max-w-sm mx-auto">
          Sell products, services, and content directly from your Paytree with 0% fees.
        </p>
        <Link href="/upgrade" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-bold">
          Upgrade
        </Link>
      </GlassBrick>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Stats */}
      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <GlassBrick className="!p-4 text-center">
            <div className="text-2xl font-bold text-[#00ff88]">
              {formatPrice(products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0), "usd")}
            </div>
            <div className="label">Total Revenue</div>
          </GlassBrick>
          <GlassBrick className="!p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {products.reduce((sum, p) => sum + (p.salesCount || 0), 0)}
            </div>
            <div className="label">Total Sales</div>
          </GlassBrick>
        </div>
      )}
      
      {/* Add Product Form */}
      <AnimatePresence mode="wait">
        {!isAdding ? (
          <motion.button
            key="add-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAdding(true)}
            className="w-full glass-brick text-center group py-8"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🛒</div>
            <div className="font-bold text-white">Add Digital Product</div>
            <div className="text-sm text-[#888888] mt-1">PDFs, presets, courses & more</div>
          </motion.button>
        ) : (
          <motion.form
            key="add-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleAddProduct}
            className="obsidian-card-static p-6 space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white">New Product</h3>
              <button type="button" onClick={() => setIsAdding(false)} className="text-[#888888] hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <input
              value={newProduct.title}
              onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
              placeholder="Product title"
              className="input-obsidian w-full"
              required
              autoFocus
            />
            
            <textarea
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              placeholder="Description (optional)"
              className="input-obsidian w-full resize-none"
              rows={3}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888888]">$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="Price"
                  className="input-obsidian w-full pl-8"
                  required
                />
              </div>
              <input
                value={newProduct.imageUrl}
                onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                placeholder="Image URL (optional)"
                className="input-obsidian w-full"
              />
            </div>
            
            <input
              value={newProduct.downloadUrl}
              onChange={(e) => setNewProduct({ ...newProduct, downloadUrl: e.target.value })}
              placeholder="Download URL (for digital delivery)"
              className="input-obsidian w-full"
            />
            
            <input
              value={newProduct.downloadName}
              onChange={(e) => setNewProduct({ ...newProduct, downloadName: e.target.value })}
              placeholder="Download filename (e.g., 'my-ebook.pdf')"
              className="input-obsidian w-full"
            />
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !newProduct.title || !newProduct.price}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-bold disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Product"}
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] text-white font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
      
      {/* Product List */}
      {products.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-white">Your Products</h3>
          {products.map((product) => (
            <GlassBrick key={product.id} className="flex items-center gap-4 !p-4">
              {/* Product Image */}
              <div className="w-16 h-16 rounded-xl bg-[rgba(255,255,255,0.05)] overflow-hidden flex-shrink-0">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">{product.title}</div>
                <div className="text-sm text-[#00ff88] font-bold">
                  {formatPrice(product.price, product.currency)}
                </div>
                <div className="text-xs text-[#888888] mt-1">
                  {product.salesCount || 0} sales • {formatPrice(product.totalRevenue || 0, product.currency)} revenue
                </div>
              </div>
              
              {/* Toggle */}
              <button
                onClick={() => toggleProduct(product.id, !product.enabled)}
                className={`
                  w-12 h-7 rounded-full transition-all border relative flex-shrink-0
                  ${product.enabled 
                    ? "bg-[rgba(0,255,136,0.2)] border-[rgba(0,255,136,0.5)]" 
                    : "bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.1)]"
                  }
                `}
              >
                <motion.div
                  className={`absolute top-0.5 w-6 h-6 rounded-full ${product.enabled ? "bg-[#00ff88]" : "bg-white"}`}
                  animate={{ left: product.enabled ? "calc(100% - 26px)" : "2px" }}
                />
              </button>
              
              {/* Delete */}
              <button
                onClick={() => deleteProduct(product.id)}
                className="p-2 text-[#888888] hover:text-red-500 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </GlassBrick>
          ))}
        </div>
      )}
      
      {products.length === 0 && !isAdding && (
        <GlassBrick className="text-center py-12">
          <div className="text-5xl mb-4 opacity-40">📦</div>
          <p className="font-bold text-white">No products yet</p>
          <p className="text-sm text-[#888888] mt-2">Start selling digital products</p>
        </GlassBrick>
      )}
    </div>
  )
}
