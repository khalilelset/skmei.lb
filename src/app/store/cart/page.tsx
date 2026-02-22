'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import WhatsAppCheckoutModal from '@/components/store/WhatsAppCheckoutModal';

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCartStore();
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const subtotal = getTotalPrice();
  const shipping = subtotal >= 50 ? 0 : 5;
  const total = subtotal + shipping;
  const totalItems = getTotalItems();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 99) {
      updateQuantity(productId, newQuantity);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-brand-black mb-2">Shopping Cart</h1>
            <p className="text-brand-gray">Your cart is currently empty</p>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-12 h-12 text-brand-gray" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-brand-black mb-4">
                Your cart is empty
              </h2>
              <p className="text-brand-gray mb-8">
                Looks like you haven&apos;t added any watches yet. Start shopping to find your perfect timepiece!
              </p>
              <Link
                href="/store/products"
                className="inline-flex items-center justify-center bg-brand-red text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Start Shopping
              </Link>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-center md:justify-start gap-3 text-center md:text-left">
              <div className="w-12 h-12 bg-brand-red/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Truck className="w-6 h-6 text-brand-red" />
              </div>
              <div>
                <p className="font-semibold text-brand-black">Free Shipping</p>
                <p className="text-sm text-brand-gray">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3 text-center md:text-left">
              <div className="w-12 h-12 bg-brand-red/10 rounded-full flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-brand-red" />
              </div>
              <div>
                <p className="font-semibold text-brand-black">Secure Payment</p>
                <p className="text-sm text-brand-gray">100% secure checkout</p>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3 text-center md:text-left">
              <div className="w-12 h-12 bg-brand-red/10 rounded-full flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-6 h-6 text-brand-red" />
              </div>
              <div>
                <p className="font-semibold text-brand-black">Easy Returns</p>
                <p className="text-sm text-brand-gray">30-day return policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <Link
            href="/store/products"
            className="inline-flex items-center text-brand-gray hover:text-brand-red transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-black mb-2">Shopping Cart</h1>
          <p className="text-brand-gray">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="bg-white rounded-lg shadow-sm p-4 md:p-6"
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <Link
                    href={`/store/products/${item.product.slug}`}
                    className="flex-shrink-0"
                  >
                    <div className="relative w-24 h-24 md:w-28 md:h-28 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2 mb-2">
                      <Link href={`/store/products/${item.product.slug}`}>
                        <h3 className="font-semibold text-brand-black hover:text-brand-red transition-colors line-clamp-2">
                          {item.product.name}
                        </h3>
                      </Link>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-brand-gray hover:text-brand-red transition-colors flex-shrink-0"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-sm text-brand-gray mb-3">
                      SKU: {item.product.sku}
                    </p>

                    <div className="flex items-center justify-between gap-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            handleQuantityChange(item.product.id, value);
                          }}
                          className="w-12 text-center border-x border-gray-300 focus:outline-none"
                          min="1"
                          max="99"
                        />
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-bold text-lg text-brand-black">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                        <p className="text-sm text-brand-gray">
                          {formatPrice(item.product.price)} each
                        </p>
                      </div>
                    </div>

                    {/* Stock Warning */}
                    {item.quantity >= item.product.stock && (
                      <p className="text-sm text-red-600 mt-2">
                        Max quantity reached
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-brand-black mb-6">Order Summary</h2>

              {/* Pricing Details */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-brand-gray">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-brand-gray">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>

                {/* Free Shipping Progress */}
                {subtotal < 50 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-brand-gray mb-2">
                      Add {formatPrice(50 - subtotal)} more for FREE shipping!
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-brand-red h-2 rounded-full transition-all"
                        style={{ width: `${(subtotal / 50) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold text-brand-black pt-4 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout Buttons */}
              <button
                onClick={() => setShowWhatsAppModal(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 mb-3"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Checkout via WhatsApp
              </button>

              <Link
                href="/store/checkout"
                className="w-full block text-center bg-brand-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors mb-4"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/store/products"
                className="w-full block text-center border border-brand-gray text-brand-gray px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>

              {/* WhatsApp Checkout Modal */}
              <WhatsAppCheckoutModal
                isOpen={showWhatsAppModal}
                onClose={() => setShowWhatsAppModal(false)}
              />
            </div>

            {/* Trust Badges */}
            <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-brand-black mb-4">Why Shop With Us</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-red/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-brand-red" />
                  </div>
                  <div>
                    <p className="font-semibold text-brand-black text-sm">Free Shipping</p>
                    <p className="text-xs text-brand-gray">On orders over $50</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-red/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-brand-red" />
                  </div>
                  <div>
                    <p className="font-semibold text-brand-black text-sm">Secure Payment</p>
                    <p className="text-xs text-brand-gray">100% secure checkout</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-red/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-5 h-5 text-brand-red" />
                  </div>
                  <div>
                    <p className="font-semibold text-brand-black text-sm">Easy Returns</p>
                    <p className="text-xs text-brand-gray">30-day return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
