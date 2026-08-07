import React, { useState } from 'react';
import { X, Trash2, ShoppingCart, ArrowRight, ShieldCheck } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOrderPlaced: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
}) => {
  const [storeManagerName, setStoreManagerName] = useState('Sarah Jenkins');
  const [storeName, setStoreName] = useState('Metro Fresh Mart #402');
  const [paymentStatus, setPaymentStatus] = useState<'Pending Net-30' | 'Paid' | 'COD'>('Pending Net-30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeManagerName,
          storeName,
          paymentStatus,
          items: cart.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            unit: item.product.unit,
          })),
        }),
      });

      if (res.ok) {
        setSuccessMsg(true);
        setTimeout(() => {
          setSuccessMsg(false);
          onClearCart();
          onOrderPlaced();
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to submit order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-lg">Wholesale Purchase Order</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 text-2xl font-bold animate-bounce">
              ✓
            </div>
            <h3 className="text-xl font-bold text-slate-800">Order Placed Successfully!</h3>
            <p className="text-sm text-slate-500 mt-2">Your wholesale purchase order has been dispatched to the supplier with Net-30 terms.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium text-slate-600">Your wholesale cart is empty</p>
                  <p className="text-xs text-slate-400 mt-1">Browse products and meet minimum order quantities to place orders.</p>
                </div>
              ) : (
                <>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-800 flex items-start space-x-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">B2B Trade Protection:</span> All bulk orders include secure escrow settlement and verified supplier guarantees.
                    </div>
                  </div>

                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex-1 pr-3">
                          <h4 className="font-medium text-sm text-slate-800 line-clamp-1">{item.product.name}</h4>
                          <p className="text-xs text-slate-500">{item.product.supplierName}</p>
                          <div className="text-xs font-semibold text-indigo-600 mt-1">
                            ${item.product.price.toFixed(2)} / {item.product.unit} (MOQ: {item.product.moq})
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min={item.product.moq}
                            value={item.quantity}
                            onChange={(e) => onUpdateQuantity(item.product.id, Math.max(item.product.moq, Number(e.target.value)))}
                            className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form id="order-details-form" onSubmit={handleCheckout} className="space-y-3 pt-4 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Store Manager Name</label>
                      <input
                        type="text"
                        value={storeManagerName}
                        onChange={(e) => setStoreManagerName(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Store / Branch Name</label>
                      <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Payment Term</label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      >
                        <option value="Pending Net-30">Net-30 Days (Approved Trade Credit)</option>
                        <option value="Paid">Paid via Wire Transfer (ACH)</option>
                        <option value="COD">Cash on Delivery (COD)</option>
                      </select>
                    </div>
                  </form>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-600 font-medium">Total Bulk Amount</span>
                  <span className="text-xl font-bold text-slate-900">${totalAmount.toFixed(2)}</span>
                </div>
                <button
                  type="submit"
                  form="order-details-form"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Dispatching Order...' : 'Submit Purchase Order'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
