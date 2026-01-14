#!/bin/bash

# Fix duplicate QQQ positions by consolidating them into one

echo "🔧 Consolidating QQQ positions..."

ssh root@165.227.104.40 << 'EOF'
# Connect to PostgreSQL as postgres user
sudo -u postgres psql -d tradingdb << 'SQL'

-- Show current QQQ positions
\echo '📊 Current QQQ positions:'
SELECT id, symbol, broker, quantity, "avgEntryPrice", "isOpen" FROM "Position" WHERE symbol = 'QQQ' AND "isOpen" = true;

-- Calculate and update consolidated position
WITH consolidated AS (
  SELECT 
    broker,
    SUM(quantity) as total_qty,
    SUM("avgEntryPrice" * quantity) / NULLIF(SUM(quantity), 0) as weighted_avg_price,
    MAX("currentPrice") as current_price,
    MIN(id) as keep_id
  FROM "Position"
  WHERE symbol = 'QQQ' AND "isOpen" = true
  GROUP BY broker
)
UPDATE "Position" p
SET 
  quantity = c.total_qty,
  "avgEntryPrice" = c.weighted_avg_price,
  "currentPrice" = c.current_price,
  "unrealizedPnL" = (c.current_price - c.weighted_avg_price) * c.total_qty
FROM consolidated c
WHERE p.id = c.keep_id 
  AND p.symbol = 'QQQ';

-- Delete duplicate positions
DELETE FROM "Position"
WHERE symbol = 'QQQ' 
  AND "isOpen" = true 
  AND id NOT IN (
    SELECT MIN(id) FROM "Position" 
    WHERE symbol = 'QQQ' AND "isOpen" = true 
    GROUP BY broker
  );

-- Show consolidated result
\echo ''
\echo '✅ Consolidated QQQ position:'
SELECT id, symbol, broker, quantity, "avgEntryPrice", "currentPrice", "unrealizedPnL", "isOpen" 
FROM "Position" 
WHERE symbol = 'QQQ' AND "isOpen" = true;

SQL
EOF

echo ""
echo "✅ QQQ positions consolidated!"
echo "🔄 Now refresh your browser (Ctrl+Shift+R) to see the single position"
