# 🛡️ Community Watch

> A decentralized, AI-powered community safety platform that unifies neighborhood reporting, blockchain transparency, and real-time intelligence — transforming how communities protect themselves.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-green?logo=supabase)](https://supabase.com)
[![Xion Blockchain](https://img.shields.io/badge/Xion-CosmWasm-purple)](https://burnt.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 🌍 What is Community Watch?

Community Watch is a next-generation public safety platform built for neighborhoods, communities, and local organizations. It replaces fragmented, reactive security systems with a unified, proactive, and transparent infrastructure — powered by AI, blockchain, and community collaboration.

**Key problems we solve:**
- Siloed incident reporting with no community feedback loop
- Lack of transparency in how reports are handled
- No accountability or tamper-proof records for critical safety events
- Reactive (not proactive) neighborhood security

---

## ✨ Features

### 🗺️ Real-Time Safety Map
- Live danger hotspot visualization with analytics bubbles
- Interactive map with missing persons & sightings density
- Auto-refreshes every 30 seconds via `GET /api/map/bubbles`

### 📋 Community Reports
- Submit incident and missing persons reports with photo attachments
- AI-powered report analysis and categorization
- Report status tracking with full audit trail
- Export reports as structured vCon JSON — `GET /api/reports/:id/vcon`

### 🤖 AI Community Assistant
- Context-aware neighborhood safety assistant
- Powered by real report data from your area
- Accessible from the main dashboard

### ⛓️ Blockchain Integration (Xion / CosmWasm)
- Optionally anchor reports on-chain for immutable records
- Smart contracts for community governance and identity
- Transparent, tamper-proof audit log

### 🗳️ Governance
- Create and vote on community proposals
- On-chain voting for decentralized decision-making

### 🪪 Decentralized Identity
- Build an on-chain reputation profile
- Request community verification
- Portable, self-sovereign identity

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS 4, Radix UI |
| **Auth & Database** | Supabase (PostgreSQL + Auth) |
| **Blockchain** | Xion Network (CosmWasm smart contracts) |
| **AI** | Integrated AI chat API |
| **Deployment** | Vercel |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account
- (Optional) A [Xion wallet](https://wallet.xion.burnt.com) for blockchain features

### 1. Clone the repository
```bash
git clone https://github.com/Therealvictorr/community-watch.git
cd community-watch
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Set up the database
Run these SQL scripts in your Supabase SQL editor (in order):
```
supabase/migrations/001_create_profiles.sql
supabase/migrations/002_create_reports.sql
supabase/migrations/003_create_attachments.sql
supabase/migrations/004_create_sightings.sql
supabase/migrations/005_create_sighting_photos.sql
```

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** If Supabase env vars are not set, the app runs in demo mode with mock data — useful for quick previews.

---

## 🔗 Blockchain Setup (Optional)

### Quick start (5 minutes)
1. Create a wallet at [wallet.xion.burnt.com](https://wallet.xion.burnt.com)
2. Get free testnet XION tokens from the built-in faucet
3. Connect wallet in the app → click **"Connect Xion Wallet"**

### Deploy smart contracts (advanced)
```bash
./scripts/deploy-contracts.sh
```

---

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (reports, sightings, AI, map)
│   ├── governance/        # Community voting page
│   ├── identity/          # Blockchain identity page
│   └── reports/           # Report detail pages
├── components/            # React components
│   ├── ai/               # AI assistant
│   ├── governance/        # Voting UI
│   ├── identity/          # Identity profile UI
│   ├── map/              # Interactive map
│   ├── reports/           # Reports feed
│   └── ui/               # Shared UI primitives
├── contracts/             # CosmWasm smart contracts (Rust)
├── lib/                   # Utilities, Supabase client, Xion client
├── hooks/                 # Custom React hooks
├── scripts/               # Deployment & migration scripts
└── supabase/migrations/   # Database schema migrations
```

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

*Built with ❤️ for safer communities.*
