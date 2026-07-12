#!/bin/bash

echo "🚀 TransitOps Backend Setup"
echo "============================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Start PostgreSQL
echo "📦 Starting PostgreSQL database..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate

# Run migrations
echo "🗄️  Running database migrations..."
npm run prisma:migrate

# Seed database
echo "🌱 Seeding database with demo data..."
npm run prisma:seed

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Start the dev server: npm run dev"
echo "   2. API will be available at: http://localhost:5000"
echo "   3. Health check: http://localhost:5000/health"
echo ""
echo "🔐 Demo credentials:"
echo "   admin@transitops.com / password123"
echo "   dispatcher@transitops.com / password123"
echo ""
