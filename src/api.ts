// Minimal integration layer. Replace the stubs with real contract calls.

// Lace wallet type definitions for CIP-30
interface CIP30Wallet {
  enable(): Promise<{
    getUsedAddresses(): Promise<string[]>
    getUnusedAddresses(): Promise<string[]>
    getChangeAddress(): Promise<string>
    signData(data: unknown): Promise<unknown>
    submitTx(tx: unknown): Promise<string>
  }>
  getNetworkId(): Promise<number>
}

// Unshielded wallet API (direct access)
interface UnshieldedWallet {
  getUsedAddresses(): Promise<string[]>
  getUnusedAddresses(): Promise<string[]>
  getChangeAddress(): Promise<string>
  signData?(data: unknown): Promise<unknown>
  submitTx?(tx: unknown): Promise<string>
}

type LaceWallet = CIP30Wallet | UnshieldedWallet | any

declare global {
  interface Window {
    cardano?: {
      lace?: LaceWallet
      nami?: LaceWallet
      eternl?: LaceWallet
    }
  }
}

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDR || '50f56237b4ede39ecb6623f236c5555bdc2a7775018c5a670277d4151047a626'

let connectedWalletAddress: string | null = null
let enabledWallet: any = null

export function getConnectedWalletAddress(): string | null {
  return connectedWalletAddress
}

export function setConnectedWalletAddress(address: string | null): void {
  connectedWalletAddress = address
  if (address) {
    localStorage.setItem('connectedWallet', address)
  } else {
    localStorage.removeItem('connectedWallet')
  }
}

export async function connectWallet(): Promise<boolean> {
  try {
    console.log('Starting wallet connection...')
    console.log('Checking for window.cardano:', !!window.cardano)
    console.log('Checking for window.cardano.lace:', !!window.cardano?.lace)

    // Direct check for Lace wallet
    const laceWallet = window.cardano?.lace

    if (!laceWallet) {
      console.error('Lace wallet not found in window.cardano')
      console.log('Available in window.cardano:', Object.keys(window.cardano || {}))
      throw new Error(
        'Lace Preview wallet not found.\n\n' +
        'Steps to fix:\n' +
        '1. Install: https://chromewebstore.google.com/detail/lace/gafhdigitgjmp7g7\n' +
        '2. Click extension in toolbar\n' +
        '3. Create/Import wallet on PREVIEW network\n' +
        '4. Keep wallet UNLOCKED\n' +
        '5. Refresh this page and try again'
      )
    }

    console.log('Lace wallet found, attempting to get addresses...')
    
    // Try direct unshielded mode first
    if (typeof laceWallet.getUsedAddresses === 'function') {
      try {
        console.log('Calling getUsedAddresses()...')
        const addresses = await Promise.race([
          laceWallet.getUsedAddresses() as Promise<string[]>,
          new Promise<string[]>((_, reject) => 
            setTimeout(() => reject(new Error('Wallet call timeout')), 5000)
          )
        ])

        console.log('Got addresses:', addresses?.length || 0)
        
        if (addresses && addresses.length > 0) {
          const walletAddress = addresses[0]
          console.log('Setting connected address:', walletAddress.substring(0, 20) + '...')
          setConnectedWalletAddress(walletAddress)
          enabledWallet = laceWallet
          console.info('✓ Connected to Lace wallet:', walletAddress.substring(0, 20) + '...')
          return true
        }
      } catch (directError) {
        console.warn('Direct mode failed:', directError)
      }
    }

    // Try CIP-30 enable() method
    if (typeof laceWallet.enable === 'function') {
      try {
        console.log('Trying CIP-30 enable()...')
        const enabled = await Promise.race([
          laceWallet.enable() as Promise<any>,
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Enable timeout')), 5000)
          )
        ])

        if (enabled && typeof enabled.getUsedAddresses === 'function') {
          const addresses = await enabled.getUsedAddresses()
          if (addresses && addresses.length > 0) {
            const walletAddress = addresses[0]
            setConnectedWalletAddress(walletAddress)
            enabledWallet = enabled
            console.info('✓ Connected via CIP-30:', walletAddress.substring(0, 20) + '...')
            return true
          }
        }
      } catch (cipError) {
        console.warn('CIP-30 enable() failed:', cipError)
      }
    }

    throw new Error('Lace wallet found but could not retrieve addresses. Make sure wallet is unlocked.')
  } catch (error) {
    console.error('✗ Wallet connection failed:', error)
    throw error
  }
}

// Contract state tracking (in-memory for this demo)
const contractState = {
  isOpen: false,
  yesVotes: 0n,
  noVotes: 0n,
  voters: new Set<string>(),
}

export async function getContractState(): Promise<'open' | 'closed' | 'unknown'> {
  try {
    // TODO: Query the actual contract via RPC/indexer to get the voting state
    // For now, return the in-memory state
    if (!enabledWallet || !connectedWalletAddress) {
      return 'unknown'
    }

    // In a real implementation, you would:
    // 1. Connect to the Midnight network
    // 2. Query the contract's ledger state
    // 3. Return the is_open field value
    
    return contractState.isOpen ? 'open' : 'closed'
  } catch (error) {
    console.error('Failed to get contract state:', error)
    return 'unknown'
  }
}

export async function openVoting(): Promise<void> {
  try {
    if (!enabledWallet || !connectedWalletAddress) {
      throw new Error('Wallet not connected. Please connect your wallet first.')
    }

    // TODO: Call the contract's open_voting circuit
    // This would involve:
    // 1. Creating a circuit call with proper context
    // 2. Signing it with the wallet
    // 3. Submitting the transaction to the network
    
    // For demo purposes, update the local state
    contractState.isOpen = true
    ;(window as any).__VOTING_STATE = 'open'
    console.info('openVoting called - contract state updated')
  } catch (error) {
    console.error('Failed to open voting:', error)
    throw error
  }
}

export async function closeVoting(): Promise<void> {
  try {
    if (!enabledWallet || !connectedWalletAddress) {
      throw new Error('Wallet not connected. Please connect your wallet first.')
    }

    // TODO: Call the contract's close_voting circuit
    // Similar to openVoting above
    
    // For demo purposes, update the local state
    contractState.isOpen = false
    ;(window as any).__VOTING_STATE = 'closed'
    console.info('closeVoting called - contract state updated')
  } catch (error) {
    console.error('Failed to close voting:', error)
    throw error
  }
}

export async function castVote(candidate: string, choice: boolean = true): Promise<void> {
  try {
    if (!enabledWallet || !connectedWalletAddress) {
      throw new Error('Wallet not connected. Please connect your wallet first.')
    }

    if (!contractState.isOpen) {
      throw new Error('Voting is not open. Please ask an admin to open voting.')
    }

    if (contractState.voters.has(connectedWalletAddress)) {
      throw new Error('You have already voted in this round.')
    }

    // TODO: Call the contract's vote circuit with parameters:
    // - voter_id_0: Uint8Array from wallet address
    // - choice_0: boolean (true for yes, false for no)
    // This would involve:
    // 1. Creating a circuit call with proper context
    // 2. Including the voter ID and choice
    // 3. Signing it with the wallet
    // 4. Submitting the transaction to the network
    
    // For demo purposes, update the local state
    if (choice) {
      contractState.yesVotes += 1n
    } else {
      contractState.noVotes += 1n
    }
    contractState.voters.add(connectedWalletAddress)

    // Update the cache for UI
    const cache = (window as any).__VOTES_CACHE || {}
    cache[candidate] = (cache[candidate] || 0) + 1
    ;(window as any).__VOTES_CACHE = cache

    console.info(`castVote called - voted for ${candidate} (choice: ${choice})`)
  } catch (error) {
    console.error('Failed to cast vote:', error)
    throw error
  }
}
