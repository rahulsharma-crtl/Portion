import React, { useEffect, useState } from 'react';
import { Store, MapPin, Navigation, Phone, Send, Check, Loader2, RefreshCw, XCircle, ThumbsUp } from 'lucide-react';
import { Shop, ShoppingList, UserProfile, Order } from '../types';
import { sendOrder, subscribeToCustomerOrders } from '../services/shopService';

interface NearbyShopsProps {
  shops: Shop[];
  shoppingList?: ShoppingList;
  userProfile?: UserProfile;
}

const NearbyShops: React.FC<NearbyShopsProps> = ({ shops, shoppingList, userProfile }) => {
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [sendingShopPhone, setSendingShopPhone] = useState<string | null>(null);

  // Real-time subscription for customer's own orders
  useEffect(() => {
    if (!userProfile) return;

    const unsubscribe = subscribeToCustomerOrders(userProfile.phone, (orders) => {
      setCustomerOrders(orders);
    });

    return () => unsubscribe();
  }, [userProfile]);

  if (shops.length === 0) return null;

  const handleSendList = async (shop: Shop) => {
    if (!shoppingList || !userProfile) return;

    setSendingShopPhone(shop.phone);

    // Determine which part of the list to send
    let itemsToSend = [];
    let listType: 'Vegetable' | 'Grocery' | 'Mixed' = 'Mixed';

    if (shop.type === 'Vegetable Shop') {
      itemsToSend = shoppingList.VegetableShop;
      listType = 'Vegetable';
    } else if (shop.type === 'Grocery Store' || shop.type === 'Bakery') {
      itemsToSend = shoppingList.GroceryShop;
      listType = 'Grocery';
    } else {
      // Supermarkets get everything
      itemsToSend = [...shoppingList.VegetableShop, ...shoppingList.GroceryShop];
      listType = 'Mixed';
    }

    if (itemsToSend.length === 0) {
      alert(`Your ${listType} list is empty, nothing to send!`);
      setSendingShopPhone(null);
      return;
    }

    const newOrder: Order = {
      // Temporary ID, backend will assign/overwrite
      id: crypto.randomUUID(), 
      customerName: userProfile.name,
      customerPhone: userProfile.phone,
      shopPhone: shop.phone,
      shopId: shop.phone,
      shopName: shop.name,
      items: itemsToSend.map(i => ({...i, available: false})),
      listType,
      status: 'pending',
      createdAt: Date.now()
    };

    try {
      await sendOrder(newOrder);
    } catch (e) {
      alert("Failed to send order. Please try again.");
    } finally {
      setSendingShopPhone(null);
    }
  };

  const getActiveOrderForShop = (shopPhone: string) => {
    // Return the most recent order from this shop
    return customerOrders.find(o => o.shopPhone === shopPhone);
  };

  return (
    <div className="mt-8 animate-in slide-in-from-bottom-6 duration-700 pb-10">
      <h3 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
        <Store className="w-6 h-6 text-blue-600" />
        Sourcing Partner Shops
        <span className="text-xs font-normal text-stone-500 bg-stone-100 px-2 py-1 rounded-full border border-stone-200">
          Sorted by distance
        </span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shops.map((shop, idx) => {
          const activeOrder = getActiveOrderForShop(shop.phone);
          const isOrderSent = !!activeOrder;
          const availableCount = activeOrder?.items.filter(i => i.available).length || 0;
          const totalCount = activeOrder?.items.length || 0;
          const isSending = sendingShopPhone === shop.phone;

          return (
            <div 
              key={idx} 
              className={`bg-white rounded-xl border transition-all group flex flex-col justify-between ${
                isOrderSent ? 'border-blue-200 shadow-md ring-1 ring-blue-50' : 'border-stone-200 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="p-4 pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-stone-800 group-hover:text-blue-700 transition-colors">
                      {shop.name}
                    </h4>
                    <p className="text-xs text-stone-500 font-medium bg-stone-50 inline-block px-1.5 py-0.5 rounded border border-stone-100 mt-1">
                      {shop.type}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="flex items-center text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      <Navigation className="w-3 h-3 mr-1" />
                      {shop.distance}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mt-4 mb-4">
                  <div className="flex items-center text-sm text-stone-600">
                    <MapPin className="w-4 h-4 mr-2 text-stone-400" />
                    <span className="truncate">{shop.location || "Location unavailable"}</span>
                  </div>
                  <div className="flex items-center text-sm text-stone-600">
                    <Phone className="w-4 h-4 mr-2 text-stone-400" />
                    <span>{shop.phone}</span>
                  </div>
                </div>
              </div>
              
              {/* Order Status Section */}
              {isOrderSent && activeOrder ? (
                <div className="bg-stone-50 border-t border-stone-100 p-3 rounded-b-xl">
                   <div className="flex justify-between items-center mb-3">
                      {activeOrder.status === 'completed' ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 shadow-sm animate-in zoom-in duration-300">
                           <Check className="w-5 h-5 stroke-[3]" />
                           <span className="font-extrabold text-sm uppercase tracking-wide">Ready</span>
                        </div>
                      ) : activeOrder.status === 'accepted' ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg border border-blue-200 shadow-sm animate-in zoom-in duration-300">
                           <ThumbsUp className="w-4 h-4" />
                           <span className="font-extrabold text-sm uppercase tracking-wide">Accepted</span>
                        </div>
                      ) : activeOrder.status === 'rejected' ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-lg border border-red-200 shadow-sm animate-in zoom-in duration-300">
                           <XCircle className="w-4 h-4" />
                           <span className="font-extrabold text-sm uppercase tracking-wide">Declined</span>
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1">
                          <span className="text-orange-500 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin"/> Sent</span>
                        </div>
                      )}

                      {activeOrder.status !== 'rejected' && (
                        <span className="text-xs font-bold bg-white border border-stone-200 px-2 py-1 rounded-full text-stone-600 shadow-sm">
                          {availableCount}/{totalCount} Found
                        </span>
                      )}
                   </div>
                   
                   {activeOrder.status !== 'rejected' && (
                     <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {activeOrder.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className={`truncate max-w-[70%] ${item.available ? 'text-stone-700 font-medium' : 'text-stone-400'}`}>
                              {item.name}
                            </span>
                            {item.available ? (
                               <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                               <span className="text-[10px] text-stone-300 italic">pending</span>
                            )}
                          </div>
                        ))}
                     </div>
                   )}
                </div>
              ) : (
                <div className="p-4 pt-0">
                   {shoppingList && (
                    <button
                      onClick={() => handleSendList(shop)}
                      disabled={isSending}
                      className="w-full py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all bg-stone-800 text-white hover:bg-stone-900 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                      Send Shopping List
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NearbyShops;