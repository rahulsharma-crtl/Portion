import { db } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  getDoc 
} from "firebase/firestore";
import { UserProfile, Shop, Order } from "../types";

// --- Helper for Distance Calculation ---
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// --- Shop Operations ---

export const registerShopInDatabase = async (profile: UserProfile) => {
  // Use phone number as document ID for uniqueness and easy lookup
  const shopRef = doc(db, "shops", profile.phone);
  await setDoc(shopRef, {
    name: profile.shopName,
    type: profile.shopType,
    location: profile.location,
    coordinates: profile.coordinates || "", // Ensure it's never undefined
    ownerName: profile.name,
    phone: profile.phone
  }, { merge: true }); // Merge allows updating details without overwriting everything
};

export const getNearbyShops = async (userCoordinates: string): Promise<Shop[]> => {
  // In a real production app with millions of shops, we would use GeoFire or Algolia.
  // For this scale, fetching all shops and filtering client-side is acceptable and fast.
  const shopsRef = collection(db, "shops");
  const snapshot = await getDocs(shopsRef);
  const shops: Shop[] = [];

  // Parse user coordinates safely
  let userLat = NaN;
  let userLng = NaN;
  
  if (userCoordinates && typeof userCoordinates === 'string' && userCoordinates.includes(',')) {
    const parts = userCoordinates.split(',');
    if (parts.length === 2) {
      userLat = parseFloat(parts[0].trim());
      userLng = parseFloat(parts[1].trim());
    }
  }

  snapshot.forEach((doc) => {
    const data = doc.data() as Shop;
    let distanceStr = "Unknown";
    let distanceVal = 99999;

    // Check if we have valid user coordinates AND valid shop coordinates
    if (!isNaN(userLat) && !isNaN(userLng) && data.coordinates && typeof data.coordinates === 'string') {
      const parts = data.coordinates.split(',');
      if (parts.length === 2) {
        const shopLat = parseFloat(parts[0].trim());
        const shopLng = parseFloat(parts[1].trim());
        
        if (!isNaN(shopLat) && !isNaN(shopLng)) {
          const d = calculateDistance(userLat, userLng, shopLat, shopLng);
          distanceVal = d;
          distanceStr = d < 1 ? `${(d * 1000).toFixed(0)} m` : `${d.toFixed(1)} km`;
        }
      }
    }

    shops.push({
      ...data,
      distance: distanceStr,
      // @ts-ignore: storing raw value for sorting
      _rawDistance: distanceVal 
    });
  });

  // Sort by distance
  // @ts-ignore
  return shops.sort((a, b) => a._rawDistance - b._rawDistance);
};

// --- Order Operations ---

export const sendOrder = async (order: Order) => {
  // Create a document in 'orders' collection
  const orderRef = doc(db, "orders", order.id);
  await setDoc(orderRef, order);
};

export const subscribeToShopOrders = (shopPhone: string, callback: (orders: Order[]) => void) => {
  const q = query(
    collection(db, "orders"), 
    where("shopPhone", "==", shopPhone)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((doc) => {
      orders.push(doc.data() as Order);
    });
    // Sort orders client-side by createdAt (newest first)
    orders.sort((a, b) => b.createdAt - a.createdAt);
    callback(orders);
  });

  return unsubscribe;
};

export const subscribeToCustomerOrders = (customerPhone: string, callback: (orders: Order[]) => void) => {
  const q = query(
    collection(db, "orders"), 
    where("customerPhone", "==", customerPhone)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((doc) => {
      orders.push(doc.data() as Order);
    });
    // Sort orders client-side by createdAt (newest first)
    orders.sort((a, b) => b.createdAt - a.createdAt);
    callback(orders);
  });

  return unsubscribe;
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, { status });
};

export const updateOrderItemAvailability = async (orderId: string, itemIndex: number, available: boolean) => {
  const orderRef = doc(db, "orders", orderId);
  
  // We need to read the current state to update a specific index in the array
  // Firestore arrayUnion/Remove doesn't work well for updating properties of objects in arrays
  const orderSnap = await getDoc(orderRef);
  
  if (orderSnap.exists()) {
    const order = orderSnap.data() as Order;
    // Create a deep copy of items to modify
    const newItems = [...order.items];
    
    if (newItems[itemIndex]) {
      newItems[itemIndex] = { ...newItems[itemIndex], available };
      await updateDoc(orderRef, { items: newItems });
    }
  }
};