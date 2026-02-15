# Contract Integration Checklist

This checklist guides you through implementing proper contract interaction in the voting frontend.

## Prerequisites ✅

- [x] Lace wallet connected (working popup)
- [x] Wallet address retrieval working
- [x] Dark theme UI complete
- [x] Error handling in place

## Phase 1: Setup Midnight SDK ⏳

### Install Required Packages
```bash
npm install @midnight-ntwrk/midnight-js-types \
            @midnight-ntwrk/compact-js \
            @midnight-ntwrk/midnight-js-contracts \
            @midnight-ntwrk/midnight-js-http-client-proof-provider \
            @midnight-ntwrk/midnight-js-indexer-public-data-provider
```

### Import Contract Types
In `src/api.ts`:
```typescript
import { Contract, ledger as votingLedger } from '../path-to-voting-contract'
import type { MidnightProvider } from '@midnight-ntwrk/midnight-js-types'
```

## Phase 2: Network Configuration ⏳

### Update Network Endpoints
```typescript
const INDEXER = 'http://127.0.0.1:8088/api/v3/graphql'
const INDEXER_WS = 'ws://127.0.0.1:8088/api/v3/graphql/ws'
const NODE_RPC = 'http://127.0.0.1:9944'
const PROOF_SERVER = 'http://127.0.0.1:6300'
const NETWORK_ID = 'undeployed'
```

### Create Provider Instance
```typescript
let midnightProvider: MidnightProvider | null = null

async function initializeNetwork() {
  // Initialize providers:
  // - HTTP client proof provider
  // - Indexer public data provider
  // - Node connection
  midnightProvider = // ... create provider with endpoints
}
```

## Phase 3: Implement getContractState() ⏳

### Steps
1. Query contract ledger via indexer
2. Access `is_open` field
3. Return status

### Pseudocode
```typescript
export async function getContractState(): Promise<'open' | 'closed' | 'unknown'> {
  try {
    if (!midnightProvider) await initializeNetwork()
    
    // Query contract ledger
    const ledger = await midnightProvider.queryLedger(CONTRACT_ADDRESS)
    const votingLedger = ledger // cast to voting ledger type
    
    return votingLedger.is_open ? 'open' : 'closed'
  } catch (error) {
    console.error('Failed to get contract state:', error)
    return 'unknown'
  }
}
```

## Phase 4: Implement openVoting() ⏳

### Checks
- [ ] Wallet is connected
- [ ] Wallet address is valid
- [ ] User has admin privileges (optional)

### Steps
1. Create circuit context
2. Call `open_voting()` circuit
3. Sign with wallet
4. Submit transaction
5. Wait for confirmation

### Pseudocode
```typescript
export async function openVoting(): Promise<void> {
  try {
    if (!enabledWallet || !connectedWalletAddress) {
      throw new Error('Wallet not connected')
    }
    
    // Create circuit context with private state
    const context: CircuitContext<VotingPrivateState> = {
      privateStateValues: {},
      // ... other context fields
    }
    
    // Call circuit
    const result = await contract.impureCircuits.open_voting(context)
    
    // Sign with wallet
    const signedTx = await enabledWallet.signTx(result)
    
    // Submit
    const txHash = await midnightProvider.submitTx(signedTx)
    
    // Update local state
    contractState.isOpen = true
    console.info('Voting opened. TX:', txHash)
  } catch (error) {
    console.error('Failed to open voting:', error)
    throw error
  }
}
```

## Phase 5: Implement closeVoting() ⏳

Similar to `openVoting()` but calls `close_voting()` circuit:

```typescript
export async function closeVoting(): Promise<void> {
  try {
    // ... same checks as openVoting()
    
    const context: CircuitContext<VotingPrivateState> = { /* ... */ }
    const result = await contract.impureCircuits.close_voting(context)
    const signedTx = await enabledWallet.signTx(result)
    const txHash = await midnightProvider.submitTx(signedTx)
    
    contractState.isOpen = false
    console.info('Voting closed. TX:', txHash)
  } catch (error) {
    console.error('Failed to close voting:', error)
    throw error
  }
}
```

## Phase 6: Implement castVote() ⏳

### Checks
- [ ] Wallet connected
- [ ] Voting is open
- [ ] User hasn't voted yet
- [ ] Candidate name is valid

### Key Steps
1. Convert wallet address to Uint8Array
2. Determine choice (boolean)
3. Check voter registry
4. Call vote circuit
5. Sign and submit

### Pseudocode
```typescript
export async function castVote(candidate: string, choice: boolean = true): Promise<void> {
  try {
    if (!enabledWallet || !connectedWalletAddress) {
      throw new Error('Wallet not connected')
    }
    
    if (!contractState.isOpen) {
      throw new Error('Voting is not open')
    }
    
    if (contractState.voters.has(connectedWalletAddress)) {
      throw new Error('You have already voted')
    }
    
    // Convert address to bytes
    const voterId = addressToBytes(connectedWalletAddress)
    
    // Create context
    const context: CircuitContext<VotingPrivateState> = { /* ... */ }
    
    // Call vote circuit with voter_id_0 and choice_0 parameters
    const result = await contract.impureCircuits.vote(
      context,
      voterId,
      choice
    )
    
    // Sign and submit
    const signedTx = await enabledWallet.signTx(result)
    const txHash = await midnightProvider.submitTx(signedTx)
    
    // Update local tracking
    contractState.voters.add(connectedWalletAddress)
    if (choice) {
      contractState.yesVotes += 1n
    } else {
      contractState.noVotes += 1n
    }
    
    console.info(`Voted for ${candidate}. TX: ${txHash}`)
  } catch (error) {
    console.error('Failed to cast vote:', error)
    throw error
  }
}

function addressToBytes(address: string): Uint8Array {
  // Implement address-to-bytes conversion
  // This depends on the wallet address format
  // (likely hex string -> buffer)
}
```

## Testing Checklist

After each implementation:

- [ ] No TypeScript errors
- [ ] Wallet still connects properly
- [ ] Error messages are clear
- [ ] Console logs show proper flow
- [ ] Functions don't crash on edge cases

## Deployment Testing

Once implemented:

1. Start local Midnight network (if available)
2. Deploy contract to local network
3. Update `CONTRACT_ADDRESS` in `.env`
4. Test in frontend:
   - [ ] Connect wallet
   - [ ] Open voting (admin)
   - [ ] Cast vote
   - [ ] Close voting (admin)
   - [ ] Check double-vote prevention

## Reference Files

**Contract Definition:**
- `voting-contract/src/managed/voting/contract/index.d.ts`

**Deploy Script Example:**
- `voting-contract/src/deploy.ts`

**Contract Runtime Types:**
- `@midnight-ntwrk/compact-runtime`

**Wallet Integration:**
- [CIP-30 Standard](https://cips.cardano.org/cips/cip30/) (what Lace implements)

## Next Actions

1. [ ] Install Midnight SDK packages
2. [ ] Import contract types in api.ts
3. [ ] Initialize network connection
4. [ ] Implement getContractState()
5. [ ] Implement openVoting()
6. [ ] Implement closeVoting()
7. [ ] Implement castVote()
8. [ ] Test on local network
9. [ ] Deploy to Preview network

---

**Status:** Lace wallet integration ✅ | Contract calls ⏳
