#!/bin/bash

# Backend Setup Script
# This script installs dependencies and verifies the setup

echo "========================================"
echo "Backend Setup Script"
echo "========================================"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null
then
    echo "❌ Python3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✓ Python3 found: $(python3 --version)"
echo ""

# Check if pip is available
if ! command -v pip3 &> /dev/null
then
    echo "❌ pip3 is not installed. Please install pip."
    exit 1
fi

echo "✓ pip3 found"
echo ""

# Install dependencies
echo "========================================"
echo "Installing dependencies..."
echo "========================================"
echo ""

pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "✓ Dependencies installed successfully!"
    echo "========================================"
else
    echo ""
    echo "========================================"
    echo "❌ Failed to install dependencies"
    echo "========================================"
    exit 1
fi

echo ""
echo "========================================"
echo "Setup complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Run the server:  python3 app.py"
echo "  2. Test services:   python3 test_services.py"
echo "  3. Check health:    curl http://localhost:5000/health"
echo ""
echo "Documentation:"
echo "  • README.md        - Full API documentation"
echo "  • QUICKSTART.md    - Quick start guide"
echo "  • ARCHITECTURE.md  - Architecture overview"
echo ""
