import React, { useEffect, useState } from 'react';
import { Store, CheckCircle, Home, MapPin, User, Package, Clock, Phone, Check, X, ThumbsUp, ThumbsDown, Archive } from 'lucide-react';
import { UserProfile, Order } from '../types';
import { subscribeToShopOrders, updateOrderStatus, updateOrderItemAvailability } from '../services/shopService';

interface ShopOwnerDashboardProps {
  profile: UserProfile;
  onGoHome: () => void;
}

const ShopOwnerDashboard: React.FC<ShopOwnerDashboardProps> = ({ profile, onGoHome }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribeToShopOrders(profile.phone, (data) => {
      setOrders(data);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [profile.phone]);

  const handleUpdateStatus = async (id: string, status: Order['status']) => {
    await updateOrderStatus(id, status);
  };

  const toggleItemAvailability = async (orderId: string, itemIndex: number, currentStatus?: boolean) => {
    const newStatus = !currentStatus;
    // Optimistic update for UI responsiveness
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const newItems = [...o.items];
      newItems[itemIndex] = { ...newItems[itemIndex], available: newStatus };
      return { ...o, items: newItems };
    }));
    
    // Sync with backend
    await updateOrderItemAvailability(orderId, itemIndex, newStatus);
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => o.status === 'accepted');
  const completedOrders = orders.filter(o => o.status === 'completed');

  return (
    <div className="animate-in fade-in zoom-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden text-center sticky top-24">
            <div className="bg-blue-600 p-8 flex justify-center">
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <Store className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-stone-800 mb-1">Dashboard</h1>
                <p className="text-stone-500 text-sm">Manage incoming orders</p>
              </div>

              <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 space-y-3 text-left">
                 <div className="flex items-center gap-3">
                    <Store className="w-5 h-5 text-blue-500" />
                    <div>
                       <p className="font-bold text-stone-800">{profile.shopName}</p>
                       <p className="text-xs text-blue-600 bg-blue-50 inline-block px-1.5 rounded font-medium">{profile.shopType}</p>
                    </div>
                 </div>
                 <div className="h-px bg-stone-200 w-full"></div>
                 <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-stone-400" />
                    <p className="font-medium text-stone-700 text-sm">{profile.name}</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-stone-400" />
                    <p className="font-medium text-stone-700 text-sm truncate">{profile.location}</p>
                 </div>
              </div>

              <button
                onClick={onGoHome}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Return to Home
              </button>
            </div>
          </div>
        </div>

        {/* Orders Feed */}
        <div className="lg:col-span-2 space-y-6">
           {/* Stats */}
           <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col items-center justify-center text-center">
                 <p className="text-stone-500 text-xs font-bold uppercase tracking-wide mb-1">Pending</p>
                 <p className="text-3xl font-bold text-orange-500">{pendingOrders.length}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col items-center justify-center text-center">
                 <p className="text-stone-500 text-xs font-bold uppercase tracking-wide mb-1">Active</p>
                 <p className="text-3xl font-bold text-blue-500">{activeOrders.length}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col items-center justify-center text-center">
                 <p className="text-stone-500 text-xs font-bold uppercase tracking-wide mb-1">Done</p>
                 <p className="text-3xl font-bold text-emerald-500">{completedOrders.length}</p>
              </div>
           </div>

           <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
             <Package className="w-5 h-5 text-stone-600" />
             Order Queue
           </h2>

           {orders.length === 0 ? (
             <div className="bg-white rounded-xl p-12 text-center border border-dashed border-stone-300">
                <Package className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                <p className="text-stone-500 font-medium">No orders received yet.</p>
                <p className="text-stone-400 text-sm">Customer orders will appear here automatically.</p>
             </div>
           ) : (
             <div className="space-y-4">
               {orders.map((order) => {
                 const isRejected = order.status === 'rejected';
                 const isCompleted = order.status === 'completed';
                 const isAccepted = order.status === 'accepted';
                 const isPending = order.status === 'pending';

                 if (isRejected && !isPending) return null; // Optionally hide rejected orders to clean up view

                 return (
                  <div 
                      key={order.id} 
                      className={`bg-white rounded-xl border shadow-sm p-5 transition-all ${
                        isCompleted ? 'border-stone-200 opacity-60' : 
                        isAccepted ? 'border-blue-200 ring-1 ring-blue-50 shadow-md' :
                        isRejected ? 'border-red-200 bg-red-50' :
                        'border-orange-200 ring-1 ring-orange-50 shadow-md'
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-4 pb-4 border-b border-stone-100 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                                order.listType === 'Vegetable' ? 'bg-green-100 text-green-700' : 
                                order.listType === 'Grocery' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-700'
                              }`}>
                                {order.listType} List
                              </span>
                              <span className="text-stone-400 text-xs">
                                {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                              {isPending && <span className="text-orange-600 text-xs font-bold px-2 py-0.5 bg-orange-100 rounded-full animate-pulse">New Request</span>}
                          </div>
                          <h3 className="font-bold text-lg text-stone-800">{order.customerName}</h3>
                          <div className="flex items-center gap-1 text-sm text-stone-500">
                              <Phone className="w-3.5 h-3.5" />
                              <a href={`tel:${order.customerPhone}`} className="hover:text-blue-600 hover:underline">{order.customerPhone}</a>
                          </div>
                        </div>

                        {/* Status Actions */}
                        <div className="flex gap-2">
                          {isPending && (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(order.id, 'rejected')}
                                className="px-3 py-2 bg-white border border-stone-200 text-stone-600 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
                                title="Reject Order"
                              >
                                <ThumbsDown className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(order.id, 'accepted')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 font-medium"
                              >
                                <ThumbsUp className="w-4 h-4" />
                                Accept
                              </button>
                            </>
                          )}

                          {isAccepted && (
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'completed')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm transition-colors active:scale-95 whitespace-nowrap"
                            >
                              <Check className="w-4 h-4" />
                              Mark Ready
                            </button>
                          )}

                          {isCompleted && (
                            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg font-medium text-sm border border-emerald-100">
                              <CheckCircle className="w-4 h-4" />
                              Completed
                            </span>
                          )}

                          {isRejected && (
                             <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg font-medium text-sm border border-red-100">
                              <X className="w-4 h-4" />
                              Rejected
                            </span>
                          )}
                        </div>
                    </div>

                    {/* Order Items */}
                    {!isRejected && (
                      <div className={`bg-stone-50 rounded-lg p-3 ${!isAccepted && !isCompleted ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        <p className="text-xs font-bold text-stone-500 uppercase mb-2 flex justify-between items-center">
                          <span>Items Requested ({order.items.length})</span>
                          <span className="text-[10px] font-normal normal-case text-stone-400">
                            {isPending ? 'Accept order to manage items' : 'Click checkmark if item is available'}
                          </span>
                        </p>
                        <ul className="space-y-2">
                          {order.items.map((item, idx) => (
                              <li key={idx} className="flex justify-between items-center text-sm p-2 bg-white rounded border border-stone-100">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => toggleItemAvailability(order.id, idx, item.available)}
                                    className={`p-1 rounded-full transition-all ${
                                      item.available 
                                        ? 'bg-green-500 text-white shadow-sm ring-2 ring-green-100' 
                                        : 'bg-stone-200 text-stone-400 hover:bg-stone-300'
                                    }`}
                                    title={item.available ? "Mark as unavailable" : "Mark as available"}
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <span className={`${item.available ? 'text-stone-900 font-medium' : 'text-stone-500'}`}>
                                      {item.name}
                                  </span>
                                </div>
                                <span className="font-bold text-stone-900">{item.quantity} {item.unit}</span>
                              </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                 );
               })}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ShopOwnerDashboard;