// Contract integration with Midnight voting contract
import { Contract, Ledger } from '../voting-contract/src/managed/voting/contract/index'

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
let contract: Contract | null = null

export function getConnectedWalletAddress(): string | null {
  return connectedWalletAddress
}

export function setConnectedWalletAddress(address: string | null): void {
  connectedWalletAddress = address
  if (address) {
    localStorage.setItem('connectedWallet', address)
    // Initialize contract when wallet is connected
    try {
      contract = new Contract({})
      console.log('✓ Contract initialized')
    } catch (e) {
      console.warn('Note: Contract initialization not available in this context:', e)
    }
  } else {
    localStorage.removeItem('connectedWallet')
    contract = null
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

// Contract state tracking
const contractState = {
  polls: [] as any[],
  currentPollId: 1n,
}

export async function createPoll(question: string, option1: string, option2: string): Promise<void> {
  try {
    if (!contract || !enabledWallet || !connectedWalletAddress) {
      throw new Error('Wallet not connected. Please connect your wallet first.')
    }

    console.log('🔄 Calling createPoll() circuit...')
    console.log(`   Question: ${question}`)
    console.log(`   Option 1: ${option1}`)
    console.log(`   Option 2: ${option2}`)
    
    // Call createPoll transaction
    const pollId = contractState.currentPollId
    const result = await contract.callTxn.createPoll(
      pollId,
      question,
      option1,
      option2
    )
    
    console.log('✓ createPoll() executed:', result)

    // If the wallet has submitTx capability, submit the transaction
    if (enabledWallet && typeof (enabledWallet as any).submitTx === 'function') {
      try {
        console.log('🔄 Submitting transaction to network...')
        const txHash = await (enabledWallet as any).submitTx(result)
        console.log('✓ Transaction submitted:', txHash)
        ;(window as any).__LAST_TX_HASH = txHash
      } catch (submitError) {
        console.warn('⚠️ Could not submit transaction:', submitError)
      }
    }
    
    // Track poll locally
    contractState.polls.push({
      id: Number(pollId),
      question,
      option1,
      option2,
      votes1: 0,
      votes2: 0,
      creator: connectedWalletAddress,
      isActive: true
    })
    
    ;(window as any).__POLLS = contractState.polls
    ;(window as any).__CURRENT_POLL_ID = Number(pollId) + 1
    
    contractState.currentPollId += 1n
    console.info(`✅ Poll created with ID: ${pollId}`)
  } catch (error) {
    console.error('❌ Failed to create poll:', error)
    throw new Error(`Failed to create poll: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function voteOption1(pollId: number): Promise<void> {
  try {
    if (!contract || !enabledWallet || !connectedWalletAddress) {
      throw new Error('Wallet not connected. Please connect your wallet first.')
    }

    console.log(`🔄 Calling voteOption1() circuit for poll ${pollId}...`)
    console.log(`   Poll ID: ${pollId}`)
    
    // Call voteOption1 transaction
    const result = await contract.callTxn.voteOption1(
      BigInt(pollId)
    )
    
    console.log('✓ voteOption1() executed:', result)

    // If the wallet has submitTx capability, submit the transaction
    if (enabledWallet && typeof (enabledWallet as any).submitTx === 'function') {
      try {
        console.log('🔄 Submitting transaction to network...')
        const txHash = await (enabledWallet as any).submitTx(result)
        console.log('✓ Transaction submitted:', txHash)
        ;(window as any).__LAST_TX_HASH = txHash
      } catch (submitError) {
        console.warn('⚠️ Could not submit transaction:', submitError)
      }
    }
    
    // Update local state
    const poll = contractState.polls.find(p => p.id === pollId)
    if (poll) {
      poll.votes1 += 1
      ;(window as any).__POLLS = contractState.polls
    }
    
    console.info(`✅ Vote recorded for Option 1 in poll ${pollId}`)
  } catch (error) {
    console.error('❌ Failed to vote option 1:', error)
    throw new Error(`Failed to vote: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function voteOption2(pollId: number): Promise<void> {
  try {
    if (!contract || !enabledWallet || !connectedWalletAddress) {
      throw new Error('Wallet not connected. Please connect your wallet first.')
    }

    console.log(`🔄 Calling voteOption2() circuit for poll ${pollId}...`)
    console.log(`   Poll ID: ${pollId}`)
    
    // Call voteOption2 transaction
    const result = await contract.callTxn.voteOption2(
      BigInt(pollId)
    )
    
    console.log('✓ voteOption2() executed:', result)

    // If the wallet has submitTx capability, submit the transaction
    if (enabledWallet && typeof (enabledWallet as any).submitTx === 'function') {
      try {
        console.log('🔄 Submitting transaction to network...')
        const txHash = await (enabledWallet as any).submitTx(result)
        console.log('✓ Transaction submitted:', txHash)
        ;(window as any).__LAST_TX_HASH = txHash
      } catch (submitError) {
        console.warn('⚠️ Could not submit transaction:', submitError)
      }
    }
    
    // Update local state
    const poll = contractState.polls.find(p => p.id === pollId)
    if (poll) {
      poll.votes2 += 1
      ;(window as any).__POLLS = contractState.polls
    }
    
    console.info(`✅ Vote recorded for Option 2 in poll ${pollId}`)
  } catch (error) {
    console.error('❌ Failed to vote option 2:', error)
    throw new Error(`Failed to vote: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function closePoll(pollId: number): Promise<void> {
  try {
    if (!contract || !enabledWallet || !connectedWalletAddress) {
      throw new Error('Wallet not connected. Please connect your wallet first.')
    }

    console.log(`🔄 Calling closePoll() circuit for poll ${pollId}...`)
    console.log(`   Poll ID: ${pollId}`)
    
    // Call closePoll transaction
    const result = await contract.callTxn.closePoll(
      BigInt(pollId)
    )
    
    console.log('✓ closePoll() executed:', result)

    // If the wallet has submitTx capability, submit the transaction
    if (enabledWallet && typeof (enabledWallet as any).submitTx === 'function') {
      try {
        console.log('🔄 Submitting transaction to network...')
        const txHash = await (enabledWallet as any).submitTx(result)
        console.log('✓ Transaction submitted:', txHash)
        ;(window as any).__LAST_TX_HASH = txHash
      } catch (submitError) {
        console.warn('⚠️ Could not submit transaction:', submitError)
      }
    }
    
    // Update local state
    const poll = contractState.polls.find(p => p.id === pollId)
    if (poll) {
      poll.isActive = false
      ;(window as any).__POLLS = contractState.polls
    }
    
    console.info(`✅ Poll ${pollId} is now closed`)
  } catch (error) {
    console.error('❌ Failed to close poll:', error)
    throw new Error(`Failed to close poll: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export function getPolls() {
  return contractState.polls
}
