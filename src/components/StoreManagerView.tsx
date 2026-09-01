import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, Package, Building, CheckCircle, Clock, Truck, ArrowUpRight, Store } from 'lucide-react';
import { Product, Supplier, Order } from '../types';

interface StoreManagerViewProps {
  onAddToCart: (product: Product, quantity: number) => void;
  refreshKey: number;
}

export const StoreManagerView: React.FC<StoreManagerViewProps> = ({ onAddToCart, refreshKey }) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<{ [productId: string]: number }>({});
  const [notification, setNotification] = useState<string | null>(null);

  const categories = ['All', 'Beverages', 'Fresh Food', 'Electronics', 'Household'];

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.ok && res.headers.get("content-type")?.includes("application/json") ? res.json() : null)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.products || []);
        setProducts(list);
        const initialQtys: { [key: string]: number } = {};
        list.forEach((p: Product) => {
          initialQtys[p.id] = p.moq || 1;
        });
        setQuantities(initialQtys);
      })
      .catch(() => setProducts([]));

    fetch('/api/suppliers')
      .then(res => res.ok && res.headers.get("content-type")?.includes("application/json") ? res.json() : [])
      .then(data => setSuppliers(Array.isArray(data) ? data : []))
      .catch(() => setSuppliers([]));

    fetch('/api/orders')
      .then(res => res.ok && res.headers.get("content-type")?.includes("application/json") ? res.json() : [])
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]));
  }, [refreshKey]);

  const handleQtyChange = (productId: string, val: number, moq: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(moq, val)
    }));
  };

  const handleAdd = (product: Product) => {
    const qty = quantities[product.id] || product.moq;
    onAddToCart(product, qty);
    setNotification(`Added ${qty} ${product.unit} of ${product.name} to cart`);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSupplier = !selectedSupplierId || p.supplierId === selectedSupplierId;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSupplier && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 border border-slate-700 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between">
        <div className="space-y-2 mb-4 md:mb-0">
          <div className="inline-flex items-center space-x-1.5 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold">
            <Store className="w-3.5 h-3.5" />
            <span>Store Manager Portal</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Streamlined B2B Procurement</h2>
          <p className="text-sm text-slate-300 max-w-xl">
            Source bulk inventory directly from verified manufacturers and distributors with Net-30 payment terms and automated settlements.
          </p>
        </div>
        <div className="flex bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'catalog' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Product Catalog
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'orders' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            My Orders ({orders.length})
          </button>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products, ingredients, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => {
              const qty = quantities[product.id] || product.moq;
              const subtotal = product.price * qty;

              return (
                <div key={product.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
                  <div className="h-48 overflow-hidden bg-slate-100 relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-semibold text-slate-800 shadow-sm">
                      {product.category}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-medium text-indigo-600">@{(product as any).supplierUsername || "supplier"}</span>
                        <span>Stock: {product.stock} {product.unit}</span>
                      </div>
                      <h3 className="font-bold text-slate-800 line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-xl font-bold text-slate-900">${product.price.toFixed(2)}</span>
                          <span className="text-xs text-slate-400 ml-1">/ {product.unit}</span>
                        </div>
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          MOQ: {product.moq} {product.unit}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
                          <span className="text-xs text-slate-400 mr-2">Qty:</span>
                          <input
                            type="number"
                            min={product.moq}
                            value={qty}
                            onChange={(e) => handleQtyChange(product.id, Number(e.target.value), product.moq)}
                            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                          />
                        </div>
                        <button
                          onClick={() => handleAdd(product)}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm hover:shadow transition flex items-center space-x-1.5 whitespace-nowrap"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Add (${subtotal.toFixed(2)})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-lg">Purchase Order History</h3>
            <span className="text-xs text-slate-500">Showing all submitted wholesale orders</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Store / Manager</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Payment Terms</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-indigo-600">{order.id}</td>
                    <td className="p-4 font-medium text-slate-800">@{(order as any).supplierUsername || "supplier"}</td>
                    <td className="p-4 text-slate-600">
                      <div className="font-medium text-slate-800">{order.storeName}</div>
                      <div className="text-xs text-slate-400">{order.storeManagerName}</div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="text-xs">
                          • {it.quantity} {it.unit} of {it.productName}
                        </div>
                      ))}
                    </td>
                    <td className="p-4 font-bold text-slate-900">${order.totalAmount.toFixed(2)}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center space-x-1 ${
                        order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700' :
                        order.status === 'Shipped' ? 'bg-blue-50 text-blue-700' :
                        order.status === 'Confirmed' ? 'bg-indigo-50 text-indigo-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {order.status === 'Delivered' && <CheckCircle className="w-3 h-3" />}
                        {order.status === 'Shipped' && <Truck className="w-3 h-3" />}
                        {order.status === 'Pending' && <Clock className="w-3 h-3" />}
                        <span>{order.status}</span>
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
