#!/bin/bash

# Quick database setup for local testing
# Fixes permission issues with PostgreSQL

echo "🔧 Fixing PostgreSQL database permissions..."

# Grant permissions to tradinguser on tradingdb
psql -d tradingdb -c "GRANT ALL PRIVILEGES ON DATABASE tradingdb TO tradinguser;" 2>/dev/null || {
    echo "⚠️  Could not grant permissions. Trying alternative approach..."
    
    # Try connecting as the current user
    psql -d tradingdb -c "GRANT ALL PRIVILEGES ON SCHEMA public TO tradinguser;"
    psql -d tradingdb -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tradinguser;"
    psql -d tradingdb -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tradinguser;"
}

echo "✅ Database permissions updated!"
echo ""
echo "📋 Now run: npx prisma db push --accept-data-loss"
