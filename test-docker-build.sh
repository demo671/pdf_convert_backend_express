#!/bin/bash
# Test Docker build locally before deploying to Railway

echo "🔨 Building Docker image..."
docker build -t pdfgate-backend .

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "Test the container with:"
    echo "docker run -p 5000:5000 --env-file .env pdfgate-backend"
else
    echo "❌ Build failed!"
    exit 1
fi

