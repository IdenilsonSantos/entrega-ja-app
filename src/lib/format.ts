import type { VehicleType } from './types';

export const money = (c: number) => `R$ ${(c / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
export const km = (v: number | null | undefined) => (v == null ? '—' : `${v.toFixed(1).replace('.', ',')} km`);
export const VEHICLE: Record<VehicleType, string> = { MOTORCYCLE: 'Moto', BICYCLE: 'Bicicleta', CAR: 'Carro', SCOOTER: 'Patinete', WALKING: 'A pé' };
export const NEEDS_PLATE: VehicleType[] = ['MOTORCYCLE', 'CAR'];
export const PAYMENT = { PIX: 'Pix na entrega', CARD: 'Cartão na entrega', CASH: 'Dinheiro' } as const;
export const MISSING: Record<string, string> = { vehiclePlate: 'placa', licenseNumber: 'CNH', vehicleModel: 'modelo do veículo', document: 'CPF', pixKey: 'chave Pix' };
export const profileFor = (v?: VehicleType | null) => (v === 'BICYCLE' || v === 'SCOOTER' ? 'cycling' : v === 'WALKING' ? 'walking' : 'driving');
export const dateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
