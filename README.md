# PayPruf — Flare Network Payment Verification

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built on Flare](https://img.shields.io/badge/Built%20on-Flare%20Network-FF6B00)](https://flare.network/)

**PayPruf** is a decentralized solution for generating and verifying **audit-grade payment proofs** on the Flare Network.
It creates immutable, shareable payment confirmations to reduce disputes and ambiguity in crypto transactions.

---

## 📋 Table of Contents

* [Features](#-features)
* [Architecture](#-architecture)
* [Getting Started](#-getting-started)
* [Installation](#-installation)
* [Usage](#-usage)
* [API Reference](#-api-reference)
* [Project Structure](#-project-structure)
* [Configuration](#-configuration)
* [Contributing](#-contributing)
* [License](#-license)

---

## ✨ Features

* 🔗 **Shareable Proof Links**
  Generate public, read-only URLs for Flare payments.

* 🔍 **On-Chain Verification**
  Payments are verifiable directly on the Flare blockchain.

* 📄 **Human-Readable Receipts**
  Clear transaction details with timestamps and references.

* 📦 **Downloadable Proof Bundles**
  ISO-aligned records available in PDF / JSON formats.

* ✅ **Counterparty Acknowledgement (Optional)**
  Recipients can acknowledge payment receipt.

* 🛡️ **Immutable Anchoring**
  Proof hashes are anchored on Flare for auditability.

## 🎥 Video Demonstration

Watch the application in action:

[![PayPruf Demo](https://img.youtube.com/vi/DAzuCHnbZLg/0.jpg)](https://www.youtube.com/watch?v=DAzuCHnbZLg)

*Click the image above to watch the full demo on YouTube*

---

## 🏗 Architecture

### System Flow

```mermaid
flowchart TD
    A[User Initiates Payment]
    --> B[Flare Network Transaction]
    --> C[Transaction Confirmed]
    --> D[Generate ProofRails Record]
    --> E[Anchor Proof Hash on Flare]
    --> F[Generate Shareable Proof Link]
    --> G[Recipient Views Proof]
    --> H[Optional: Acknowledge Receipt]
```

---

## 🧰 Tech Stack

### Frontend

* **Framework:** React 18 + TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS, shadcn/ui
* **State Management:** React Query
* **Forms & Validation:** React Hook Form + Zod
* **Web3:** Wagmi + Viem
* **UI Components:** Radix UI
* **Charts:** Recharts

### Backend

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** PostgreSQL + Prisma ORM
* **Blockchain:** Viem, Ethers.js
* **Auth:** JWT
* **Logging:** Winston
* **Validation:** express-validator

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18+
* npm 9+
* PostgreSQL 14+
* Flare RPC endpoint
* MetaMask or compatible Web3 wallet

---

## 📦 Installation

### Clone the Repository

```bash
git clone https://github.com/Moses-main/paypruf.git
cd paypruf
```

### Install Frontend Dependencies

```bash
npm install
```

### Set Up Backend

```bash
cd server
npm install
cp .env.example .env
```

Configure environment variables, then run:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### Start Development Servers

```bash
# Frontend
npm run dev
```

```bash
# Backend
cd server
npm run dev
```

---

## 🛠 Project Structure

```text
paypruf/
├── src/                    # Frontend
│   ├── components/         # UI components
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities
│   ├── pages/              # App pages
│   └── types/              # Type definitions
│
└── server/                 # Backend
    ├── prisma/             # Database schema
    ├── src/
    │   ├── controllers/    # Request handlers
    │   ├── middleware/     # Express middleware
    │   ├── routes/         # API routes
    │   └── services/       # Business logic
    └── .env                # Environment config
```

---

## 🔧 Configuration

### Frontend (`.env`)

```env
VITE_FLARE_NETWORK_RPC=https://flare-api.flare.network/ext/bc/C/rpc
VITE_WALLET_CONNECT_PROJECT_ID=your_walletconnect_id
VITE_API_URL=http://localhost:3001
```

### Backend (`.env`)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/paypruf"
FLARE_NETWORK_RPC=https://flare-api.flare.network/ext/bc/C/rpc
JWT_SECRET=your_jwt_secret
PORT=3001
```

---

## 📚 API Reference

### Generate Payment Proof

```http
POST /api/proof/generate
Content-Type: application/json
```

```json
{
  "txHash": "0x...",
  "sender": "0x...",
  "recipient": "0x...",
  "amount": "1.5",
  "token": "FLR",
  "memo": "Invoice #123"
}
```

---

### Verify Payment Proof

```http
GET /api/proof/verify/:proofId
```

Returns a public, read-only payment proof with Flare verification status.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch

   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes

   ```bash
   git commit -m "Add AmazingFeature"
   ```
4. Push to the branch

   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**.
See `LICENSE` for more information.

---

## 🙏 Acknowledgments

* **Flare Network** — blockchain infrastructure
* **ProofRails** — ISO-aligned payment records
* Open-source contributors and the Web3 community
