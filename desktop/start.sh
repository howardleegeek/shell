#!/bin/bash
# Shell Desktop Startup Script
# Starts all required services for Shell Web3 Dev Studio

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting Shell Web3 Dev Studio..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prereq() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed${NC}"
        exit 1
    fi
}

# Check for required tools
echo "Checking prerequisites..."
check_prereq "node"
check_prereq "npm"
check_prereq "cargo"

# Load MCP config
if [ -f "mcp-servers.json" ]; then
    echo "Found MCP config"
else
    echo -e "${YELLOW}Warning: mcp-servers.json not found${NC}"
fi

# Function to check if a port is in use
port_in_use() {
    lsof -i:$1 &> /dev/null
}

# Start OpenCode Server
start_opencode() {
    if port_in_use 4096; then
        echo -e "${YELLOW}OpenCode server already running on port 4096${NC}"
    else
        echo "Starting OpenCode server..."
        opencode serve --port 4096 &
        OPENCODE_PID=$!
        echo -e "${GREEN}OpenCode server started (PID: $OPENCODE_PID)${NC}"
    fi
}

# Start Solana MCP Server
start_solana_mcp() {
    echo "Starting Solana MCP server..."
    npx -y solana-web3js-mcp-server &
    SOLANA_MCP_PID=$!
    echo -e "${GREEN}Solana MCP server started (PID: $SOLANA_MCP_PID)${NC}"
}

# Start EVM MCP Server
start_evm_mcp() {
    echo "Starting EVM MCP server..."
    npx -y web3-mcp-hub &
    EVM_MCP_PID=$!
    echo -e "${GREEN}EVM MCP server started (PID: $EVM_MCP_PID)${NC}"
}

# Health check
health_check() {
    local url=$1
    local name=$2
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}$name is ready${NC}"
            return 0
        fi
        echo "Waiting for $name... ($attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}$name failed to start${NC}"
    return 1
}

# Parse arguments
START_MCP=true
START_OPENCODE=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-mcp)
            START_MCP=false
            shift
            ;;
        --no-opencode)
            START_OPENCODE=false
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --no-mcp       Don't start MCP servers"
            echo "  --no-opencode  Don't start OpenCode server"
            echo "  --help         Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Start services
if [ "$START_OPENCODE" = true ]; then
    start_opencode
fi

if [ "$START_MCP" = true ]; then
    start_solana_mcp
    start_evm_mcp
fi

echo ""
echo "✅ All services started!"
echo ""
echo "Next steps:"
echo "  1. Run 'pnpm tauri dev' to start the desktop app"
echo "  2. Or 'pnpm dev' to start just the frontend"
echo ""
echo "To stop services:"
echo "  pkill -f 'solana-web3js-mcp-server'"
echo "  pkill -f 'web3-mcp-hub'"
echo "  pkill -f 'opencode serve'"
