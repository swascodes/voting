import React, { useEffect, useState, useCallback } from 'react'
import {
  getContractState,
  openVoting,
  closeVoting,
  castVote,
  connectWallet,
  getConnectedWalletAddress,
  CONTRACT_ADDRESS,
} from './api'

export default function App() {
  const [connected, setConnected] = useState(false)
  const [userWallet, setUserWallet] = useState<string | null>(null)
  const [status, setStatus] = useState<'unknown' | 'open' | 'closed'>('unknown')
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [candidate, setCandidate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')


  useEffect(() => {
    // Check if wallet was previously connected
    const savedWallet = localStorage.getItem('connectedWallet')
    if (savedWallet) {
      setConnected(true)
      setUserWallet(savedWallet)
    }
    refresh()
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const s = await getContractState()
      setStatus(s)
      const currentVotes = (window as any).__VOTES_CACHE || {}
      setVotes(currentVotes)
    } catch (e) {
      setError(String(e))
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleConnect = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      console.log('handleConnect called')
      const ok = await connectWallet()
      if (ok) {
        setConnected(true)
        const wallet = getConnectedWalletAddress()
        setUserWallet(wallet)
        console.log('Wallet connected successfully')
      } else {
        setError('Failed to connect wallet')
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      setError(errorMsg)
      console.error('Connection error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleOpen = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      await openVoting()
      await refresh()
    } catch (e) {
      setError(String(e))
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [refresh])

  const handleClose = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      await closeVoting()
      await refresh()
    } catch (e) {
      setError(String(e))
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [refresh])

  const handleCast = useCallback(async () => {
    if (!candidate.trim()) {
      setError('Please enter a candidate name')
      return
    }
    setLoading(true)
    setError('')
    try {
      await castVote(candidate)
      const cache = (window as any).__VOTES_CACHE || {}
      cache[candidate] = (cache[candidate] || 0) + 1
      ;(window as any).__VOTES_CACHE = cache
      setCandidate('')
      await refresh()
    } catch (e) {
      setError(String(e))
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [candidate, refresh])

  return (
    <div className="container">
      <h1>Voting DApp</h1>

      <div className="info">
        <div><strong>Contract:</strong> <code>{CONTRACT_ADDRESS.slice(0, 16)}...</code></div>
        {connected && userWallet && (
          <div><strong>Your Wallet:</strong> <code>{userWallet.slice(0, 16)}...</code></div>
        )}
        <div><strong>Network:</strong> undeployed (local)</div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="controls">
        <button onClick={handleConnect} disabled={loading || connected}>
          {connected ? '✓ Lace Connected' : loading ? 'Connecting...' : 'Connect Lace Wallet'}
        </button>
        <button onClick={handleOpen} disabled={loading || status === 'open'}>
          Open Voting
        </button>
        <button onClick={handleClose} disabled={loading || status === 'closed'}>
          Close Voting
        </button>
      </div>

      <div className="status">
        <h3>Voting Status: <em>{loading ? 'loading...' : status || 'unknown'}</em></h3>
      </div>

      <div className="cast">
        <div>
          <input
            type="text"
            placeholder="Candidate name"
            value={candidate}
            onChange={(e) => setCandidate(e.target.value)}
            disabled={loading || status !== 'open'}
          />
          <button onClick={handleCast} disabled={loading || status !== 'open' || !candidate.trim()}>
            Cast Vote
          </button>
        </div>
      </div>

      <div className="results">
        <h3>Vote Results</h3>
        {Object.keys(votes).length === 0 ? (
          <p className="empty">No votes cast yet</p>
        ) : (
          <div className="votes-list">
            {Object.entries(votes).map(([name, count]) => (
              <div key={name} className="vote-item">
                <span className="name">{name}</span>
                <span className="count">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="notes">
        <p>
          {connected ? (
            <>✓ Wallet connected and ready to vote</>
          ) : (
            <>Connect your wallet to participate in voting</>
          )}
        </p>
        <p>Integration points: <strong>src/api.ts</strong></p>
      </div>
    </div>
  )
}
