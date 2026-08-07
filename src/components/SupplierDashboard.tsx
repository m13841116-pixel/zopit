import React, { useState, useEffect } from 'react';
import { Building2, Package, DollarSign, Plus, CheckCircle, Clock, Truck, Trash2, Edit2, X } from 'lucide-react';
import { Product, Order, Settlement } from '../types';

export const SupplierDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Product form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Beverages');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [moq, setMoq] = useState('10');
  const [stock, setStock] = useState('200');
  const [unit, setUnit] = useState('cases');
  const [image, setImage] = useState('');

  const supplierId = 'sup-1'; // Default supplier view

  const loadData = () => {
    fetch(`/api/products?supplierId=${supplierId}`)
      .then(res => res.ok && res.headers.get("content-type")?.includes("application/json") ? res.json() : [])
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));

    fetch(`/api/orders?supplierId=${supplierId}`)
      .then(res => res.ok && res.headers.get("content-type")?.includes("application/json") ? res.json() : [])
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]));

    fetch(`/api/settlements?supplierId=${supplierId}`)
      .then(res => res.ok && res.headers.get("content-type")?.includes("application/json") ? res.json() : [])
      .then(data => setSettlements(Array.isArray(data) ? data : []))
      .catch(() => setSettlements([]));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          supplierName: 'Apex Global Beverages',
          name,
          category,
          description,
          price: Number(price),
          moq: Number(moq),
          stock: Number(stock),
          unit,
          image: image || 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&auto=format&fit=crop&q=60'
        })
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setName('');
        setDescription('');
        setPrice('');
        setImage('');
        loadData();
      }
    } catch (err) {
      console.error('Failed to create product:', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to remove this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    loadData();
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadData();
  };

  const totalRevenue = settlements.reduce((sum, s) => sum + s.netPayout, 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Supplier Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-lg flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <img
            src="https://images.unsplash.com/photo-1541643600914-78b084683601?w=100&auto=format&fit=crop&q=60"
            alt="Apex Global"
            className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-inner"
          />
          <div>
            <div className="inline-flex items-center space-x-1 bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1">
              <Building2 className="w-3 h-3" />
              <span>Verified Supplier</span>
            </div>
            <h2 className="text-2xl font-bold">Apex Global Beverages</h2>
            <p className="text-xs text-slate-400">Chicago, IL • Rating: 4.9 ★</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md hover:shadow transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Catalog Product</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Net Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">${totalRevenue.toFixed(2)}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Incoming Orders</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{orders.length}</h3>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Active Products</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{products.length}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Pending Actions</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{pendingOrdersCount}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Incoming Orders Management */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">Incoming Store Orders</h3>
          <span className="text-xs text-slate-500">Fulfill purchase orders and update shipping statuses</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Order ID</th>
                <th className="p-4">Store Name</th>
                <th className="p-4">Order Items</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Payment Term</th>
                <th className="p-4">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-bold text-indigo-600">{order.id}</td>
                  <td className="p-4">
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
                    <div className="flex items-center space-x-2">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border outline-none ${
                          order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          order.status === 'Confirmed' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="Pending">Pending Review</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Catalog Management */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">Product Catalog Management</h3>
          <span className="text-xs text-slate-500">Manage wholesale pricing, stock levels, and MOQs</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
          {products.map(product => (
            <div key={product.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between space-y-3">
              <div className="flex space-x-3">
                <img src={product.image} alt={product.name} className="w-16 h-16 rounded-lg object-cover bg-white" />
                <div className="flex-1">
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{product.category}</span>
                  <h4 className="font-bold text-sm text-slate-800 line-clamp-1 mt-1">{product.name}</h4>
                  <div className="text-xs font-semibold text-slate-900 mt-0.5">${product.price.toFixed(2)} / {product.unit}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                <span>Stock: <strong className="text-slate-800">{product.stock} {product.unit}</strong></span>
                <span>MOQ: <strong className="text-slate-800">{product.moq}</strong></span>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="text-red-500 hover:text-red-700 transition p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Settlements Ledger */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">Financial Settlements & Payouts</h3>
          <span className="text-xs text-slate-500">Automated ACH net-30 payouts</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Settlement ID</th>
                <th className="p-4">Order Ref</th>
                <th className="p-4">Gross Amount</th>
                <th className="p-4">Platform Fee (5%)</th>
                <th className="p-4">Net Payout</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {settlements.map(stl => (
                <tr key={stl.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-bold text-indigo-600">{stl.id}</td>
                  <td className="p-4 font-medium text-slate-800">{stl.orderId}</td>
                  <td className="p-4 font-semibold text-slate-900">${stl.amount.toFixed(2)}</td>
                  <td className="p-4 text-red-600">-${stl.commission.toFixed(2)}</td>
                  <td className="p-4 font-bold text-emerald-600">${stl.netPayout.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      stl.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {stl.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-500">{new Date(stl.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Add New Wholesale Product</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium Cold Brew Coffee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white outline-none"
                  >
                    <option value="Beverages">Beverages</option>
                    <option value="Fresh Food">Fresh Food</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Household">Household</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Wholesale Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="25.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">MOQ</label>
                  <input
                    type="number"
                    required
                    value={moq}
                    onChange={(e) => setMoq(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Stock</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed product specs for store managers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Image URL (Unsplash)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
