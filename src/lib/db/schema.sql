-- Farmers table
CREATE TABLE IF NOT EXISTS farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  evening_delivery_enabled BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_phone CHECK (phone ~ '^(?:\+254|0)[17][0-9]{8}$')
);

CREATE INDEX idx_farmers_active ON farmers(active);
CREATE INDEX idx_farmers_created_at ON farmers(created_at);

-- Milk deliveries table
CREATE TABLE IF NOT EXISTS milk_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  date DATE NOT NULL,
  litres DECIMAL(6,2) NOT NULL,
  delivery_type VARCHAR(10) NOT NULL CHECK (delivery_type IN ('morning', 'evening')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  UNIQUE(farmer_id, date, delivery_type),
  CONSTRAINT valid_litres CHECK (
    litres > 0 AND
    litres::text ~ '^\d+(\.\d{1,2})?$'
  )
);

CREATE INDEX idx_milk_deliveries_farmer ON milk_deliveries(farmer_id);
CREATE INDEX idx_milk_deliveries_date ON milk_deliveries(date);
CREATE INDEX idx_milk_deliveries_created_at ON milk_deliveries(created_at);

-- Advances table
CREATE TABLE IF NOT EXISTS advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_advances_farmer ON advances(farmer_id);
CREATE INDEX idx_advances_date ON advances(date);

-- Ledger entries table (immutable transaction log)
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  entry_type VARCHAR(50) NOT NULL CHECK (
    entry_type IN (
      'milk_delivery',
      'evening_delivery',
      'advance_cash',
      'advance_goods',
      'payout_cash',
      'payout_mpesa',
      'adjustment'
    )
  ),
  amount_kes DECIMAL(12,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  CONSTRAINT immutable CHECK (created_at IS NOT NULL)
);

CREATE INDEX idx_ledger_farmer ON ledger_entries(farmer_id);
CREATE INDEX idx_ledger_transaction_date ON ledger_entries(transaction_date);
CREATE INDEX idx_ledger_entry_type ON ledger_entries(entry_type);
CREATE INDEX idx_ledger_created_at ON ledger_entries(created_at);

-- Monthly summaries table
CREATE TABLE IF NOT EXISTS monthly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  total_litres DECIMAL(8,2) NOT NULL DEFAULT 0,
  gross_earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_advances DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_payouts DECIMAL(12,2) NOT NULL DEFAULT 0,
  final_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(farmer_id, year, month)
);

CREATE INDEX idx_monthly_summaries_farmer ON monthly_summaries(farmer_id);
CREATE INDEX idx_monthly_summaries_year_month ON monthly_summaries(year, month);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  amount DECIMAL(12,2) NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('cash', 'mpesa')),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_payments_farmer ON payments(farmer_id);
CREATE INDEX idx_payments_date ON payments(date);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  action VARCHAR(255) NOT NULL,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_audit_logs_farmer ON audit_logs(farmer_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  buying_rate DECIMAL(8,2) NOT NULL DEFAULT 55.00,
  selling_rate DECIMAL(8,2) NOT NULL DEFAULT 70.00,
  pin_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(id)
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Server-side aggregates for milk and advances
CREATE VIEW IF NOT EXISTS daily_collection_summary AS
SELECT
  COALESCE(md.day, a.day) AS day,
  COALESCE(md.total_litres, 0)::DECIMAL(8,2) AS total_litres,
  COALESCE(md.total_farmers, 0) AS total_farmers,
  COALESCE(a.total_advances, 0) AS total_advances,
  (COALESCE(md.total_litres, 0)::DECIMAL(8,2) * COALESCE(s.buying_rate, 55.00) - COALESCE(a.total_advances, 0)) AS total_payout
FROM (
  SELECT date AS day, SUM(litres)::DECIMAL(8,2) AS total_litres, COUNT(DISTINCT farmer_id) AS total_farmers
  FROM milk_deliveries
  GROUP BY date
) md
FULL OUTER JOIN (
  SELECT transaction_date AS day, SUM(amount_kes) AS total_advances
  FROM ledger_entries
  WHERE entry_type IN ('advance_cash', 'advance_goods')
  GROUP BY transaction_date
) a ON md.day = a.day
CROSS JOIN LATERAL (
  SELECT buying_rate FROM settings LIMIT 1
) s;

CREATE VIEW IF NOT EXISTS daily_summary_view AS
SELECT
  day AS report_date,
  total_litres,
  total_farmers,
  total_advances,
  total_payout
FROM daily_collection_summary;

CREATE VIEW IF NOT EXISTS monthly_summary_view AS
SELECT
  date_trunc('month', report_date) AS month,
  COALESCE(SUM(total_litres), 0) AS total_litres,
  COALESCE(SUM(total_farmers), 0) AS total_farmers,
  COALESCE(SUM(total_advances), 0) AS total_advances,
  COALESCE(SUM(total_payout), 0) AS total_payout
FROM daily_summary_view
GROUP BY date_trunc('month', report_date);

-- Triggers for updated_at
CREATE TRIGGER update_milk_deliveries_updated_at
  BEFORE UPDATE ON milk_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_summaries_updated_at
  BEFORE UPDATE ON monthly_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create ledger entries from milk deliveries
CREATE OR REPLACE FUNCTION create_ledger_from_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_buying_rate DECIMAL(8,2);
BEGIN
  SELECT buying_rate INTO v_buying_rate FROM settings LIMIT 1;
  
  IF v_buying_rate IS NULL THEN
    v_buying_rate := 55.00;
  END IF;

  INSERT INTO ledger_entries (
    farmer_id,
    entry_type,
    amount_kes,
    transaction_date,
    reference_id,
    created_by
  ) VALUES (
    NEW.farmer_id,
    CASE WHEN NEW.delivery_type = 'morning' THEN 'milk_delivery' ELSE 'evening_delivery' END,
    NEW.litres * v_buying_rate,
    NEW.date,
    NEW.id,
    NEW.created_by
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_ledger_from_delivery
  AFTER INSERT ON milk_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION create_ledger_from_delivery();

-- Row Level Security
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies (allowing all for now - implement proper auth later)
CREATE POLICY "Enable all for authenticated users" ON farmers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON milk_deliveries
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON ledger_entries
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON payments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON monthly_summaries
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON audit_logs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON settings
  FOR ALL USING (true) WITH CHECK (true);
