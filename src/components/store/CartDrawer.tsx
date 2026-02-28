"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";

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
  // Close cart on escape key
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
    <>

      {!isOpen ? null : <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-black/60 z-50 transition-opacity duration-300 ease-in-out animate-in fade-in"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-brand-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-brand-silver">
          <h2 className="text-lg sm:text-xl font-semibold text-brand-black">
            Shopping Cart ({getTotalItems()})
          </h2>
          <button
            onClick={closeCart}
            className="p-3 hover:bg-brand-silver/30 rounded-full transition-colors duration-200 active:scale-95 touch-manipulation"
            aria-label="Close cart"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-brand-black" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-brand-silver/30 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="w-12 h-12 sm:w-14 sm:h-14 text-brand-gray" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-brand-black mb-2">
                Your cart is empty
              </h3>
              <p className="text-brand-gray mb-8 text-sm sm:text-base">
                Looks like you haven&apos;t added any watches yet.
              </p>
              <button
                onClick={closeCart}
                className="bg-brand-red text-brand-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-red/90 transition-all duration-200 active:scale-95 touch-manipulation min-h-12"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 sm:gap-4 bg-brand-silver/10 rounded-xl p-3 sm:p-4 transition-all duration-200 hover:bg-brand-silver/20"
                >
                  {/* Product Image */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-brand-white border border-brand-silver">
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
                      href={`/products/${item.product.slug}`}
                      onClick={closeCart}
                      className="font-medium text-brand-black hover:text-brand-red transition-colors duration-200 line-clamp-2 text-sm sm:text-base"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-brand-red font-bold mt-1 text-sm sm:text-base">
                      {formatPrice(item.product.price)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-3 gap-2">
                      <div className="flex items-center border border-brand-silver rounded-lg bg-brand-white">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="p-2.5 sm:p-3 hover:bg-brand-silver/30 transition-colors duration-200 active:scale-95 touch-manipulation rounded-l-lg"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4 text-brand-black" />
                        </button>
                        <span className="px-4 sm:px-5 py-2 text-sm sm:text-base font-semibold text-brand-black min-w-12 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="p-2.5 sm:p-3 hover:bg-brand-silver/30 transition-colors duration-200 active:scale-95 touch-manipulation rounded-r-lg"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4 text-brand-black" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-brand-red hover:bg-brand-red/10 transition-all duration-200 p-2.5 sm:p-3 rounded-lg active:scale-95 touch-manipulation"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-brand-silver p-4 sm:p-5 space-y-4 sm:space-y-5 bg-brand-white">

            {/* Free shipping progress */}
            {(() => {
              const subtotal = getTotalPrice();
              const shipping = subtotal >= 50 ? 0 : 4;
              const remaining = 50 - subtotal;
              const progress = Math.min((subtotal / 50) * 100, 100);
              return (
                <>
                  {subtotal < 50 && (
                    <div className="bg-brand-silver/20 rounded-xl p-3">
                      <p className="text-xs font-medium text-brand-black mb-2">
                        Add <span className="text-brand-red font-bold">{formatPrice(remaining)}</span> more for <span className="font-bold">FREE shipping!</span>
                      </p>
                      <div className="w-full bg-brand-silver rounded-full h-1.5">
                        <div
                          className="bg-brand-red h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {subtotal >= 50 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                      <p className="text-xs font-semibold text-green-700">🎉 You qualify for FREE shipping!</p>
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-brand-gray">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-brand-gray">
                      <span>Shipping</span>
                      <span className={shipping === 0 ? 'text-green-600 font-semibold' : ''}>
                        {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-brand-black text-base pt-2 border-t border-brand-silver">
                      <span>Total</span>
                      <span>{formatPrice(subtotal + shipping)}</span>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/store/checkout/whatsapp"
                onClick={closeCart}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 touch-manipulation min-h-[52px]"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Checkout via WhatsApp
              </Link>
              <Link
                href="/store/checkout"
                onClick={closeCart}
                className="w-full bg-brand-red text-brand-white py-4 rounded-lg font-semibold hover:bg-brand-red/90 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 touch-manipulation min-h-[52px]"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={closeCart}
                className="w-full bg-brand-silver/30 text-brand-black py-4 rounded-lg font-semibold hover:bg-brand-silver/50 transition-all duration-200 text-center active:scale-95 touch-manipulation min-h-[52px] flex items-center justify-center"
              >
                Continue Shopping
              </button>
            </div>

          </div>
        )}
      </div>
      </>}
    </>
  );
}
