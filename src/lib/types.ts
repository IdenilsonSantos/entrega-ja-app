/** Contrato da API (o mesmo do site) */
export type VehicleType = 'MOTORCYCLE' | 'BICYCLE' | 'CAR' | 'SCOOTER' | 'WALKING';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'DELIVERED' | 'REJECTED' | 'CANCELLED';

export interface CourierProfile {
  vehicleType: VehicleType;
  vehicleModel: string | null;
  vehicleColor: string | null;
  vehiclePlate: string | null;
  document: string | null;
  licenseNumber: string | null;
  pixKey: string | null;
  missing?: string[];
}

export interface Me {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: 'CUSTOMER' | 'COURIER' | 'MERCHANT' | 'ADMIN';
  status: 'ACTIVE' | 'PENDING' | 'BLOCKED';
  statusReason: string | null;
  courier?: CourierProfile;
}

export interface Offer {
  orderId: string;
  number: number;
  storeName: string;
  storeAddress: string;
  storeLat: number;
  storeLng: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  pickupKm: number | null;
  tripKm: number;
  feeCents: number;
  expiresAt: string;
}

export interface Order {
  id: string;
  number: number;
  status: OrderStatus;
  items: { name: string; qty: number; options: { name: string }[]; notes?: string }[];
  totalCents: number;
  paymentMethod: 'PIX' | 'CARD' | 'CASH';
  changeForCents: number | null;
  deliveryAddress: string;
  deliveryComplement: string | null;
  deliveryReference: string | null;
  deliveryLat: number;
  deliveryLng: number;
  distanceKm: number;
  courierFeeCents?: number;
  createdAt: string;
  deliveredAt: string | null;
  store: { id: string; name: string; address: string; lat: number; lng: number; phone: string | null };
  customer?: { name: string; phone: string | null };
}

export interface CourierStatus {
  approved: boolean;
  online: boolean;
  wantsOnline: boolean;
  offer: Offer | null;
  active: Order[];
}

export interface Route {
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
  source: string;
}
