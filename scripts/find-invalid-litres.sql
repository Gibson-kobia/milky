-- Query to find all milk delivery records with invalid litres (not quarter-step increments)
-- Run this in Supabase SQL editor to identify records that need fixing

SELECT 
  id,
  farmer_id,
  date,
  delivery_type,
  litres,
  ROUND(litres::NUMERIC, 2) as litres_rounded,
  (litres * 100)::INTEGER as litres_times_100,
  ((litres * 100)::INTEGER % 25) as modulo_25_remainder,
  created_at,
  updated_at
FROM milk_deliveries
WHERE ((litres * 100)::INTEGER % 25) != 0
ORDER BY date DESC, litres;

-- Count of invalid records
SELECT COUNT(*) as invalid_count
FROM milk_deliveries
WHERE ((litres * 100)::INTEGER % 25) != 0;

-- Examples of invalid values found and how to fix them:
-- litres = 4.8 should probably be 4.75 or 5.00
-- litres = 3.3 should probably be 3.25 or 3.50
-- Contact the farmer to confirm the correct value, then update manually or use:
-- UPDATE milk_deliveries SET litres = 4.75 WHERE id = '199a0d74-faf4-4007-8b44-b1fe7eb56d9f';
