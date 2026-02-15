<<<<<<< HEAD
# Voting Frontend - Lace Wallet Integration

A Vite + React TypeScript frontend for interacting with the voting smart contract deployed on Midnight network. Users connect their Lace wallet and participate in voting.

**Important:** Run all commands from **within WSL**, not from Windows PowerShell.

## Quick Start

### 1. Enter WSL
```bash
wsl
```

### 2. Navigate to Project
```bash
cd /home/swastika/final_boss/franchise/midnight-starter-template-windows/voting-frontend
```

### 3. Install Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### 4. Start Dev Server
```bash
npm run dev
```

Visit **http://localhost:5173**

## Wallet Connection ✅ READY

The **Lace wallet connection is fully implemented**:

1. Click **"Connect Lace Wallet"**
2. Lace popup opens (real CIP-30 integration)
3. Approve connection in popup
4. Your wallet is securely connected

See [LACE_SETUP.md](./LACE_SETUP.md) for wallet setup instructions.

## Contract Integration Status

### ✅ Complete
- Lace wallet connection with CIP-30 popup
- Wallet address retrieval & storage
- Error handling for wallet operations

### ⏳ TODO - Needs Implementation
- Circuit calls to smart contract
- Transaction signing & submission
- On-chain ledger state queries
- Network RPC connection

## Contract Overview

The contract (in `voting-contract/`) has three main operations:

### 1. open_voting()
```
Circuit: open_voting()
Effect: Sets ledger.is_open = true
Access: Admin only
Verification: Zero-knowledge proof
```

### 2. close_voting()
```
Circuit: close_voting()
Effect: Sets ledger.is_open = false
Access: Admin only
Verification: Zero-knowledge proof
```

### 3. vote(voter_id, choice)
```
Circuit: vote(voter_id: Uint8Array, choice: boolean)
Parameters:
  - voter_id: Wallet address as bytes
  - choice: true (YES vote) or false (NO vote)
Ledger effects:
  - Increments yes_votes or no_votes
  - Adds voter to voters set
  - Prevents double voting via set membership check
Verification: Zero-knowledge proof
```

## Integration Checklist

In `src/api.ts`, follow these TODO markers:

### connectWallet() ✅ COMPLETE
```typescript
// Already implemented:
// - Detects Lace wallet
// - Shows CIP-30 popup
// - Retrieves addresses
// - Stores wallet address
```

### getContractState() ⏳ TODO
Needs to query contract ledger:
```typescript
// Steps:
// 1. Connect to Midnight RPC (using node RPC URL)
// 2. Query ledger state via indexer or contract
// 3. Return is_open boolean
const ledger = await queryContractLedger(CONTRACT_ADDRESS)
return ledger.is_open ? 'open' : 'closed'
```

### openVoting() ⏳ TODO
Needs to call open_voting circuit:
```typescript
// Steps:
// 1. Create circuit context
// 2. Call contract.impureCircuits.open_voting(context)
// 3. Sign result with connected wallet
// 4. Submit transaction to network
// 5. Wait for confirmation
```

### closeVoting() ⏳ TODO
Similar to openVoting() but calls close_voting circuit

### castVote() ⏳ TODO
Needs to call vote circuit:
```typescript
// Steps:
// 1. Check if voting is open
// 2. Check if user already voted (voters set)
// 3. Convert wallet address to Uint8Array for voter_id
// 4. Call contract.impureCircuits.vote(context, voterId, choice)
// 5. Sign and submit
// 6. Update local voter tracking
```

## Network Endpoints

Configure these in the implementation (currently stub values):

```
Indexer (GraphQL): http://127.0.0.1:8088/api/v3/graphql
Indexer WS: ws://127.0.0.1:8088/api/v3/graphql/ws
Node RPC: http://127.0.0.1:9944
Proof Server: http://127.0.0.1:6300
Network ID: undeployed (from deployment.json)
```

## Current Demo State

Using in-memory state for testing:
```typescript
contractState = {
  isOpen: false,
  yesVotes: 0n,
  noVotes: 0n,
  voters: Set<string>
}
```

Once integrated, this will reflect actual on-chain ledger state.

## Features

✅ **Lace Wallet** — CIP-30 popup connection  
✅ **Secure** — No key management on frontend  
✅ **Voting UI** — Open/Close/Vote buttons  
✅ **Double Vote Protection** — Tracks voters  
✅ **Dark Theme** — Purple & green color scheme  
✅ **Error Handling** — Clear messages  

## Build for Production

```bash
npm run build
npm run preview
```

## Theme

- **Background**: Dark gradient
- **Primary Accent**: Purple (#a855f7)
- **Secondary**: Green (#10b981)
- **Text**: Light gray (#e0e0e0)

## File Structure

```
src/
├── main.tsx           → React entry
├── App.tsx            → UI component
├── api.ts             → Wallet + contract (TODO items)
└── styles.css         → Dark theme
.env                   → Contract address
LACE_SETUP.md          → Wallet guide
```

## Troubleshooting

**"Lace wallet not found"**
→ Install Lace extension and enable it

**Popup blocked**
→ Check browser popup settings for localhost:5173

**Connection failed**
→ Unlock Lace wallet and verify network

## Next Steps

1. ✅ Wallet connection implementation
2. ⏳ Import contract types from voting-contract
3. ⏳ Connect to Midnight network RPC
4. ⏳ Implement circuit calls (getContractState, openVoting, closeVoting, castVote)
5. ⏳ Test on Midnight Preview network

See `src/api.ts` for implementation TODOs.
=======
# voting
>>>>>>> 7768db6a7e540c5c9d6e8902e67cd2ebebff62ae
