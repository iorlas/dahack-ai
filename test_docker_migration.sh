#!/bin/bash
# Test script to verify docker-compose migration setup

echo "Testing Docker Compose Migration Setup"
echo "======================================"

# Clean up any existing containers
echo "1. Cleaning up existing containers..."
docker-compose down -v

# Start only the database and migration services
echo -e "\n2. Starting database and running migrations..."
docker-compose up -d db
sleep 5  # Wait for DB to be ready

docker-compose up migrate
MIGRATION_EXIT_CODE=$?

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo -e "\n✓ Migrations completed successfully!"

    # Check if users table exists
    echo -e "\n3. Verifying users table exists..."
    docker-compose exec -T db psql -U postgres -d app -c "\dt users" | grep -q "users"

    if [ $? -eq 0 ]; then
        echo "✓ Users table created successfully!"

        # Check migration tracking table
        echo -e "\n4. Checking migration tracking..."
        docker-compose exec -T db psql -U postgres -d app -c "SELECT * FROM _sql_migrations;"

        echo -e "\n✓ All tests passed! Migration system is working correctly."
    else
        echo "✗ Users table not found!"
        exit 1
    fi
else
    echo "✗ Migrations failed!"
    exit 1
fi

# Clean up
echo -e "\n5. Cleaning up..."
docker-compose down

echo -e "\nTest completed!"
