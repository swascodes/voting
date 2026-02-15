import React, { useEffect, useState, useCallback } from 'react'
import {
  createPoll,
  voteOption1,
  voteOption2,
  closePoll,
  connectWallet,
  getConnectedWalletAddress,
  getPolls,
  CONTRACT_ADDRESS,
} from './api'

export default function App() {
  const [connected, setConnected] = useState(false)
  const [userWallet, setUserWallet] = useState<string | null>(null)
  const [polls, setPolls] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form state for creating new poll
  const [newPollQuestion, setNewPollQuestion] = useState('')
  const [newPollOption1, setNewPollOption1] = useState('')
  const [newPollOption2, setNewPollOption2] = useState('')
  
  // Current poll selection
  const [selectedPollId, setSelectedPollId] = useState<number | null>(null)


  useEffect(() => {
    // Check if wallet was previously connected
    const savedWallet = localStorage.getItem('connectedWallet')
    if (savedWallet) {
      setConnected(true)
      setUserWallet(savedWallet)
    }
    refreshPolls()
  }, [])

  const refreshPolls = useCallback(async () => {
    console.log('🔄 Refreshing polls...')
    try {
      const allPolls = getPolls()
      setPolls(allPolls)
      console.log('✓ Polls refreshed:', allPolls)
    } catch (e) {
      console.error('❌ Failed to refresh polls:', e)
    }
  }, [])

  const handleConnect = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      console.log('🔄 Connecting wallet...')
      const ok = await connectWallet()
      if (ok) {
        setConnected(true)
        const wallet = getConnectedWalletAddress()
        setUserWallet(wallet)
        console.log('✅ Wallet connected successfully')
      } else {
        setError('Failed to connect wallet')
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      setError(errorMsg)
      console.error('❌ Connection error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCreatePoll = useCallback(async () => {
    if (!newPollQuestion.trim() || !newPollOption1.trim() || !newPollOption2.trim()) {
      setError('Please fill in all poll fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      console.log('🔄 Creating poll...')
      await createPoll(newPollQuestion, newPollOption1, newPollOption2)
      setNewPollQuestion('')
      setNewPollOption1('')
      setNewPollOption2('')
      console.log('✅ Poll created')
      setTimeout(() => refreshPolls(), 500)
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      setError(errorMsg)
      console.error('❌ Creation error:', e)
    } finally {
      setLoading(false)
    }
  }, [newPollQuestion, newPollOption1, newPollOption2, refreshPolls])

  const handleVoteOption1 = useCallback(async () => {
    if (selectedPollId === null) {
      setError('Please select a poll')
      return
    }
    setLoading(true)
    setError('')
    try {
      console.log(`🔄 Voting option 1 for poll ${selectedPollId}...`)
      await voteOption1(selectedPollId)
      console.log('✅ Vote recorded')
      setTimeout(() => refreshPolls(), 500)
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      setError(errorMsg)
      console.error('❌ Vote error:', e)
    } finally {
      setLoading(false)
    }
  }, [selectedPollId, refreshPolls])

  const handleVoteOption2 = useCallback(async () => {
    if (selectedPollId === null) {
      setError('Please select a poll')
      return
    }
    setLoading(true)
    setError('')
    try {
      console.log(`🔄 Voting option 2 for poll ${selectedPollId}...`)
      await voteOption2(selectedPollId)
      console.log('✅ Vote recorded')
      setTimeout(() => refreshPolls(), 500)
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      setError(errorMsg)
      console.error('❌ Vote error:', e)
    } finally {
      setLoading(false)
    }
  }, [selectedPollId, refreshPolls])

  const handleClosePoll = useCallback(async () => {
    if (selectedPollId === null) {
      setError('Please select a poll')
      return
    }
    setLoading(true)
    setError('')
    try {
      console.log(`🔄 Closing poll ${selectedPollId}...`)
      await closePoll(selectedPollId)
      console.log('✅ Poll closed')
      setSelectedPollId(null)
      setTimeout(() => refreshPolls(), 500)
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      setError(errorMsg)
      console.error('❌ Close error:', e)
    } finally {
      setLoading(false)
    }
  }, [selectedPollId, refreshPolls])

  return (
    <div className="container">
      <h1>Polling DApp</h1>

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
      </div>

      {connected && (
        <>
          {/* Create Poll Section */}
          <div className="section create-poll">
            <h3>📝 Create New Poll</h3>
            <div className="form">
              <input
                type="text"
                placeholder="Poll question"
                value={newPollQuestion}
                onChange={(e) => setNewPollQuestion(e.target.value)}
                disabled={loading}
              />
              <input
                type="text"
                placeholder="Option 1"
                value={newPollOption1}
                onChange={(e) => setNewPollOption1(e.target.value)}
                disabled={loading}
              />
              <input
                type="text"
                placeholder="Option 2"
                value={newPollOption2}
                onChange={(e) => setNewPollOption2(e.target.value)}
                disabled={loading}
              />
              <button 
                onClick={handleCreatePoll}
                disabled={loading}
              >
                {loading ? '⏳ Creating...' : '➕ Create Poll'}
              </button>
            </div>
          </div>

          {/* Polls List and Voting Section */}
          {polls.length > 0 && (
            <div className="section polls-list">
              <h3>🗳️ Active Polls</h3>
              {polls.map((poll) => (
                <div 
                  key={poll.id} 
                  className={`poll-card ${selectedPollId === poll.id ? 'selected' : ''} ${!poll.isActive ? 'closed' : ''}`}
                >
                  <div className="poll-header" onClick={() => setSelectedPollId(poll.id)}>
                    <div className="poll-title">
                      <strong>Poll #{poll.id}</strong>
                      <span className="status">{poll.isActive ? '🟢 Active' : '🔴 Closed'}</span>
                    </div>
                    <div className="poll-question">{poll.question}</div>
                  </div>

                  {selectedPollId === poll.id && poll.isActive && (
                    <div className="poll-voting">
                      <div className="voting-buttons">
                        <button
                          onClick={handleVoteOption1}
                          disabled={loading}
                          className="option-1"
                        >
                          {loading ? '⏳' : '👍'} {poll.option1}
                          <span className="vote-count">{poll.votes1}</span>
                        </button>
                        <button
                          onClick={handleVoteOption2}
                          disabled={loading}
                          className="option-2"
                        >
                          {loading ? '⏳' : '👎'} {poll.option2}
                          <span className="vote-count">{poll.votes2}</span>
                        </button>
                      </div>
                      <button 
                        onClick={handleClosePoll}
                        className="close-poll-btn"
                        disabled={loading}
                      >
                        🔒 Close Poll
                      </button>
                    </div>
                  )}

                  {selectedPollId === poll.id && !poll.isActive && (
                    <div className="poll-closed">
                      <div className="final-results">
                        <div className="result">
                          <span>{poll.option1}</span>
                          <strong>{poll.votes1}</strong>
                        </div>
                        <div className="result">
                          <span>{poll.option2}</span>
                          <strong>{poll.votes2}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {polls.length === 0 && (
            <div className="empty-state">
              <p>📭 No polls yet. Create one to get started!</p>
            </div>
          )}
        </>
      )}

      <div className="notes">
        <p>
          {connected ? (
            <>✓ Wallet connected - Start creating polls</>
          ) : (
            <>Connect your wallet to create and vote on polls</>
          )}
        </p>
        <p><strong>Contract Circuits Called:</strong></p>
        <ul>
          <li><code>createPoll()</code> - Create a new poll</li>
          <li><code>voteOption1()</code> - Vote for option 1</li>
          <li><code>voteOption2()</code> - Vote for option 2</li>
          <li><code>closePoll()</code> - Close a poll (creator only)</li>
        </ul>
        <p style={{fontSize: '12px', color: '#a0a0a0'}}>View contract calls in browser DevTools Console (F12)</p>
      </div>
    </div>
  )
}
