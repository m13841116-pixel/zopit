import React, { createContext, useContext, useState, useEffect } from "react";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  storeId: number;
  storeName: string;
  supplierId?: number;
  supplierName?: string;
  image?: string;
};

type CartContextType = {
  cartItems: CartItem[];
  addItem: (product: any) => { success: boolean; error?: string };
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType>({
  cartItems: [],
  addItem: () => ({ success: false }),
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("shopping_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("shopping_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addItem = (product: any) => {
    const rawSupId = product.supplierId || product.supplier?.id || product.supplier_id || 0;
    const pSupplierId = Number(rawSupId) || 0;
    const pSupplierName = product.supplier?.companyName || product.supplierName || product.supplier?.user?.name || "";

    if (cartItems.length > 0 && pSupplierId > 0) {
      const currentSupplierId = Number(cartItems[0].supplierId) || 0;
      if (currentSupplierId > 0 && currentSupplierId !== pSupplierId) {
        return {
          success: false,
          error: "امکان افزودن کالاهای چند تامین‌کننده مختلف در یک سفارش وجود ندارد. طبق سیاست پلتفرم زوپیت جهت محاسبه و ارسال دقیق مرسوله پستی، تمامی کالاهای یک سفارش باید از یک تامین‌کننده باشند."
        };
      }
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price || product.finalPrice || product.supplierBasePrice || 0,
        quantity: 1,
        storeId: product.storeId || 0,
        storeName: product.storeName || "فروشگاه زوپیت",
        supplierId: pSupplierId,
        supplierName: pSupplierName,
        image: product.imageUrl || product.image || (product.images && product.images[0]?.url)
      }];
    });

    return { success: true };
  };

  const removeItem = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{ cartItems, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

