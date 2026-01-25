# PayProof Setup Guide

This guide will help you set up PayProof for the Proof-of-Payment Share Links track.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- A Flare wallet with some test FLR tokens
- (Optional) ProofRails API key for enhanced ISO compliance

## Environment Setup

### 1. Frontend Environment (.env)

Create a `.env` file in the root directory:

```env
# Flare Network Configuration
VITE_FLARE_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
VITE_COSTON2_RPC_URL=https://coston2-api.flare.network/ext/C/rpc

# WalletConnect (get from https://cloud.walletconnect.com/)
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Backend API URL
VITE_API_URL=http://localhost:3001/api
```

### 2. Backend Environment (server/.env)

Create a `server/.env` file:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/payproof?schema=public"

# Flare Network Configuration
FLARE_RPC_URL="https://coston2-api.flare.network/ext/C/rpc"
FLARE_CHAIN_ID=114
PRIVATE_KEY=your_private_key_for_anchoring

# ProofRails (Optional - for enhanced ISO compliance)
PROOFRAILS_API_KEY=your_proofrails_api_key
PROOFRAILS_API_URL="https://api.proofrails.com/v1"

# JWT Secret
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=30d

# CORS
FRONTEND_URL="http://localhost:3000"
```

## Installation Steps

### 1. Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

### 2. Database Setup

```bash
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed the database
npx prisma db seed
```

### 3. Start Development Servers

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
npm run dev
```

## Required Configuration

### 1. Flare Wallet Setup

1. Install MetaMask or compatible wallet
2. Add Flare Coston2 Testnet:
   - Network Name: Flare Coston2
   - RPC URL: https://coston2-api.flare.network/ext/C/rpc
   - Chain ID: 114
   - Currency Symbol: C2FLR
   - Block Explorer: https://coston2-explorer.flare.network

3. Get test tokens from the [Flare Faucet](https://faucet.flare.network/)

### 2. Private Key for Anchoring

Generate a dedicated wallet for proof anchoring:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important**: This should be a separate wallet from your main wallet, funded with a small amount of C2FLR for gas fees.

### 3. PostgreSQL Database

Create a PostgreSQL database:

```sql
CREATE DATABASE payproof;
CREATE USER payproof_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE payproof TO payproof_user;
```

### 4. WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID to your `.env` file

## Optional Enhancements

### ProofRails Integration

For full ISO 20022 compliance:

1. Sign up at [ProofRails](https://proofrails.com/)
2. Get your API key
3. Add it to your `server/.env` file

Without ProofRails, the system will generate ISO-compliant records locally.

## Testing the Setup

1. **Frontend**: Visit http://localhost:3000
2. **Backend**: Visit http://localhost:3001/health
3. **Database**: Check that tables are created with `npx prisma studio`

## Key Features to Test

1. **Connect Wallet**: Use MetaMask to connect to the app
2. **Send Payment**: Send a small amount of C2FLR to another address
3. **View Proof**: Check that the proof page loads with transaction details
4. **Download Proof**: Test JSON and PDF downloads
5. **Share Link**: Copy and test the shareable proof link
6. **Verify Proof**: Check that proof verification works

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and credentials are correct
2. **RPC Errors**: Try alternative RPC endpoints if one is slow
3. **Wallet Connection**: Clear browser cache and reconnect wallet
4. **Transaction Failures**: Ensure sufficient C2FLR balance for gas

### Debug Mode

Enable debug logging:

```env
# In server/.env
NODE_ENV=development
LOG_LEVEL=debug
```

## Production Deployment

For production deployment:

1. Use Flare Mainnet instead of Coston2
2. Set up proper database with connection pooling
3. Use environment-specific secrets
4. Enable HTTPS and proper CORS settings
5. Set up monitoring and logging

## Support

If you encounter issues:

1. Check the console logs (browser and server)
2. Verify all environment variables are set
3. Ensure database migrations have run
4. Test with a fresh wallet and small amounts

The system is designed to work with or without ProofRails, so basic functionality should work even with minimal configuration.