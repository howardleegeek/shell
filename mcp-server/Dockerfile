FROM node:22-bookworm-slim
WORKDIR /app

# CI-friendly env
ENV HUSKY=0
ENV CI=true

# Use pnpm
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Ensure git is available for build and runtime scripts
RUN apt-get update && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/*

# Install Slither for security audit
RUN pip3 install slither-analyzer

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm fetch

# Copy source and install
COPY . .
RUN pnpm install --offline --frozen-lockfile

# Build the MCP server
RUN tsc