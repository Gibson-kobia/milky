// Farmer types
export interface Farmer {
  id: string;
  name: string;
  phone: string | null;
  active: boolean;
  evening_delivery_enabled: boolean;
  notes: string | null;
  created_at: string;
  archived_at: string | null;
}

// Milk delivery types
export type DeliveryType = 'morning' | 'evening';

export interface MilkDelivery {
  id: string;
  farmer_id: string;
  date: string;
  litres: number;
  delivery_type: DeliveryType;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// Ledger entry types
export type LedgerEntryType =
  | 'milk_delivery'
  | 'evening_delivery'
  | 'advance_cash'
  | 'advance_goods'
  | 'payout_cash'
  | 'payout_mpesa'
  | 'adjustment';

export interface LedgerEntry {
  id: string;
  farmer_id: string;
  entry_type: LedgerEntryType;
  amount_kes: number;
  description: string | null;
  created_at: string;
  created_by: string | null;
  transaction_date: string;
  reference_id: string | null;
}

// Monthly summary
export interface MonthlySummary {
  id: string;
  farmer_id: string;
  year: number;
  month: number;
  total_litres: number;
  gross_earnings: number;
  total_advances: number;
  total_payouts: number;
  final_balance: number;
  created_at: string;
  updated_at: string;
}

// Payment types
export type PaymentMethod = 'cash' | 'mpesa';

export interface Payment {
  id: string;
  farmer_id: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

// Sync queue for offline support
export interface SyncQueueItem {
  id: string;
  type: 'milk_delivery' | 'advance' | 'payment' | 'farmer';
  action?: 'create' | 'update';
  data: Record<string, unknown>;
  created_at: string;
  synced_at?: string | null;
}

// Audit log
export interface AuditLog {
  id: string;
  farmer_id: string | null;
  action: string;
  changes: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
}

// Dashboard stats
export interface DailyStats {
  total_litres: number;
  total_farmers: number;
  estimated_gross_profit: number;
  estimated_payout: number;
}

export interface MonthlyStats {
  total_litres: number;
  total_payout_liability: number;
  total_advances: number;
  estimated_gross_profit: number;
  active_farmers_count: number;
}
