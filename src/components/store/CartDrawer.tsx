"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
  } = useCartStore();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-brand-black/65 z-50"
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-[#0f0f0f] z-50 shadow-2xl shadow-black flex flex-col border-l border-white/8"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Your Cart
                  <span className="ml-2 text-sm font-bold text-white/35">({getTotalItems()})</span>
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="p-2.5 hover:bg-white/8 rounded-full transition-colors active:scale-95"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            {/* Red gradient accent line below header */}
            <div className="h-0.5 bg-linear-to-r from-brand-red via-brand-red/50 to-transparent" />

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {items.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="w-24 h-24 bg-brand-red/10 border border-brand-red/20 rounded-full flex items-center justify-center mb-6"
                  >
                    <ShoppingBag className="w-12 h-12 text-brand-red/60" />
                  </motion.div>
                  <h3 className="text-lg font-black text-white mb-2">Your cart is empty</h3>
                  <p className="text-white/40 mb-8 text-sm">
                    Looks like you haven&apos;t added any watches yet.
                  </p>
                  <Link
                    href="/store/products"
                    onClick={closeCart}
                    className="group relative overflow-hidden bg-brand-red text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-red-dark transition-colors active:scale-95"
                  >
                    <span aria-hidden className="absolute inset-0 -translate-x-full -skew-x-12 bg-white/15 group-hover:animate-shimmer-sweep pointer-events-none" />
                    Explore Watches
                  </Link>
                </div>
              ) : (
                /* Items list */
                <AnimatePresence mode="popLayout" initial={false}>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <motion.div
                        key={item.product.id}
                        layout
                        initial={{ opacity: 0, height: 0, y: -8 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, x: 40, height: 0 }}
                        transition={{ duration: 0.28, ease }}
                        className="flex gap-3 bg-white/5 border border-white/8 rounded-xl p-3 hover:border-brand-red/30 hover:bg-white/7 transition-colors overflow-hidden"
                      >
                        {/* Product Image */}
                        <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-white/12 shadow-sm">
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/store/products/${item.product.slug}`}
                            onClick={closeCart}
                            className="font-semibold text-white/85 hover:text-brand-red transition-colors line-clamp-2 text-sm"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-brand-red font-bold mt-1 text-sm">
                            {formatPrice(item.product.price)}
                          </p>

                          {/* Quantity + Remove */}
                          <div className="flex items-center justify-between mt-2.5">
                            {/* Pill-style quantity */}
                            <div className="flex items-center bg-white/6 border border-white/12 rounded-full overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="px-3 py-1.5 hover:bg-white/10 transition-colors active:scale-95"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3 text-white/60" />
                              </button>
                              <span className="px-3 py-1.5 text-xs font-bold text-white min-w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="px-3 py-1.5 hover:bg-white/10 transition-colors active:scale-95"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3 text-white/60" />
                              </button>
                            </div>

                            {/* Remove */}
                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="text-white/30 hover:text-brand-red hover:bg-brand-red/10 transition-all p-2 rounded-lg active:scale-95"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-white/8 px-5 pt-4 pb-20 lg:pb-4 space-y-4 bg-[#0a0a0a]">

                {/* Free shipping progress */}
                {(() => {
                  const subtotal = getTotalPrice();
                  const shipping = subtotal >= 50 ? 0 : 4;
                  const remaining = 50 - subtotal;
                  const progress = Math.min((subtotal / 50) * 100, 100);
                  return (
                    <>
                      {subtotal < 50 ? (
                        <div>
                          <p className="text-xs text-white/40 mb-2">
                            <span className="text-brand-red font-bold">{formatPrice(remaining)}</span> away from free shipping
                          </p>
                          <div className="w-full bg-white/10 rounded-full h-1.5">
                            <div
                              className="bg-linear-to-r from-brand-red/60 to-brand-red h-2 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="bg-brand-black text-white rounded-xl p-3 text-center">
                          <p className="text-xs font-bold tracking-wide">Free shipping unlocked</p>
                        </div>
                      )}

                      {/* Order Summary */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-white/45 text-sm">
                          <span>Subtotal</span>
                          <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-white/45 text-sm">
                          <span>Shipping</span>
                          <span className={shipping === 0 ? "text-brand-red font-semibold" : ""}>
                            {shipping === 0 ? "FREE" : formatPrice(shipping)}
                          </span>
                        </div>
                        <div className="flex justify-between font-black text-white text-base pt-2.5 border-t border-white/10">
                          <span>Total</span>
                          <span>{formatPrice(subtotal + shipping)}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Actions */}
                <div className="space-y-2.5">
                  {/* Primary: Checkout */}
                  <Link
                    href="/store/checkout"
                    onClick={closeCart}
                    className="group relative w-full overflow-hidden bg-brand-red text-white py-4 rounded-xl font-bold text-base hover:bg-brand-red-dark transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-brand-red/30"
                  >
                    <span aria-hidden className="absolute inset-0 -translate-x-full -skew-x-12 bg-white/15 group-hover:animate-shimmer-sweep pointer-events-none" />
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>

                  {/* Secondary: WhatsApp */}
                  <Link
                    href="/store/checkout/whatsapp"
                    onClick={closeCart}
                    className="w-full border border-green-600 text-green-700 py-3 rounded-xl font-semibold text-sm hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    Checkout via WhatsApp
                  </Link>

                  {/* Tertiary: Continue */}
                  <button
                    onClick={closeCart}
                    className="w-full text-white/30 text-sm font-medium hover:text-white/60 underline-offset-2 hover:underline transition-colors py-1"
                  >
                    Continue Shopping
                  </button>
                </div>

              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
