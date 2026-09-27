# PredictX Web

PredictX Web is a Next.js frontend for a Stellar-based football prediction market. Users connect a Freighter wallet, vote on match outcomes, and earn rewards when the community consensus resolves correctly.

## Prerequisites

- Node.js >= 18
- pnpm >= 10.11.0
- A Freighter wallet extension installed in your browser
- Stellar testnet credentials (Freighter defaults to testnet)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build the production bundle |
| `pnpm start` | Run the production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking without emitting |

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_PREDICTION_MARKET=CABC...XYZ
NEXT_PUBLIC_CONTRACT_POLL=CDEF...UVW
NEXT_PUBLIC_USE_MOCK_DATA=true
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_STELLAR_NETWORK` | Stellar network to target (`testnet` or `mainnet`) |
| `NEXT_PUBLIC_CONTRACT_PREDICTION_MARKET` | Soroban prediction market contract ID |
| `NEXT_PUBLIC_CONTRACT_POLL` | Soroban poll contract ID |
| `NEXT_PUBLIC_USE_MOCK_DATA` | When `true`, use local mock data instead of on-chain state |

## Freighter Wallet Setup

1. Install the [Freighter](https://freighter.app) browser extension.
2. Create or import a wallet.
3. Switch Freighter to **Testnet** (Settings > Network > Testnet).
4. Fund your testnet account from the [Stellar Friendbot](https://laboratory.stellar.org/#friendbot?testnet=true).
5. Refresh the app and click **Connect Wallet**.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- Zustand
- @stellar/freighter-api
- Sonner (toasts)
- Framer Motion

## Product Requirements

See [`predictx-web-prd-web.md`](./predictx-web-prd-web.md) for the full product requirements document.

## License

Private — Rejira Technologies
