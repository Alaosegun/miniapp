import { useState, useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import './Game.css'

const CHOICES = ['rock', 'paper', 'scissors']
const ENTRY_FEE = '0.000001' // 0.000001 Base ETH
const TREASURY_ADDRESS = '0x0000000000000000000000000000000000000000' // Replace with your treasury address

const Game = () => {
  const [gameState, setGameState] = useState('initial') // initial, playing, result
  const [playerChoice, setPlayerChoice] = useState(null)
  const [computerChoice, setComputerChoice] = useState(null)
  const [result, setResult] = useState(null)
  const [walletAddress, setWalletAddress] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isPaying, setIsPaying] = useState(false)

  useEffect(() => {
    // Get wallet address from context
    const getWalletAddress = async () => {
      try {
        const provider = await sdk.wallet.getEthereumProvider()
        const accounts = await provider.request({ method: 'eth_accounts' })
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0])
        }
      } catch (error) {
        console.error('Error getting wallet address:', error)
      }
    }
    getWalletAddress()
  }, [])

  const getComputerChoice = () => {
    const randomIndex = Math.floor(Math.random() * CHOICES.length)
    return CHOICES[randomIndex]
  }

  const determineWinner = (player, computer) => {
    if (player === computer) return 'draw'
    
    if (
      (player === 'rock' && computer === 'scissors') ||
      (player === 'paper' && computer === 'rock') ||
      (player === 'scissors' && computer === 'paper')
    ) {
      return 'win'
    }
    
    return 'lose'
  }

  const connectWallet = async () => {
    setIsConnecting(true)
    try {
      // Check if SDK is ready
      if (!sdk.wallet) {
        throw new Error('Wallet SDK not available')
      }
      
      const provider = await sdk.wallet.getEthereumProvider()
      
      if (!provider) {
        throw new Error('Ethereum provider not available')
      }
      
      const accounts = await provider.request({ method: 'eth_requestAccounts' })
      
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0])
      } else {
        throw new Error('No accounts found')
      }
    } catch (error) {
      console.error('Wallet connection failed:', error)
      const errorMessage = error.message || 'Failed to connect wallet'
      alert(`Connection Error: ${errorMessage}. Make sure you're using this app within Farcaster.`)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setWalletAddress(null)
    setGameState('initial')
    setPlayerChoice(null)
    setComputerChoice(null)
    setResult(null)
  }

  const handlePayment = async () => {
    if (!walletAddress) {
      await connectWallet()
      return
    }

    setIsPaying(true)
    try {
      const provider = await sdk.wallet.getEthereumProvider()
      
      // Convert ETH to wei (0.000001 ETH = 1000000000000 wei)
      const valueInWei = '0x' + (1000000000000).toString(16)
      
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: TREASURY_ADDRESS,
          value: valueInWei,
        }]
      })
      
      console.log('Transaction sent:', txHash)
      // Start game after payment
      setGameState('playing')
    } catch (error) {
      console.error('Payment failed:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setIsPaying(false)
    }
  }

  const handleChoice = async (choice) => {
    setPlayerChoice(choice)
    
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const computer = getComputerChoice()
    setComputerChoice(computer)
    
    const gameResult = determineWinner(choice, computer)
    setResult(gameResult)
    setGameState('result')
  }

  const resetGame = () => {
    setGameState('initial')
    setPlayerChoice(null)
    setComputerChoice(null)
    setResult(null)
  }

  const renderChoice = (choice) => {
    const emojis = {
      rock: '🪨',
      paper: '📄',
      scissors: '✂️'
    }
    return (
      <div className="choice-display">
        <span className="choice-emoji">{emojis[choice]}</span>
        <span className="choice-text">{choice}</span>
      </div>
    )
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>🎮 Rock Paper Scissors</h1>
        <p className="subtitle">Play against the computer!</p>
      </div>

      {gameState === 'initial' && (
        <div className="initial-screen">
          <div className="entry-fee-card">
            <h2>Ready to Play?</h2>
            <div className="fee-info">
              <span className="fee-label">Entry Fee</span>
              <span className="fee-amount">{ENTRY_FEE} ETH</span>
              <span className="fee-network">on Base</span>
            </div>
            
            {!walletAddress ? (
              <button 
                className="pay-button"
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <span className="button-spinner"></span>
                    Connecting...
                  </>
                ) : (
                  '🔗 Connect Wallet'
                )}
              </button>
            ) : (
              <button 
                className="pay-button"
                onClick={handlePayment}
                disabled={isPaying}
              >
                {isPaying ? (
                  <>
                    <span className="button-spinner"></span>
                    Processing...
                  </>
                ) : (
                  '💰 Pay & Play'
                )}
              </button>
            )}
            
            {walletAddress && (
              <div className="wallet-info">
                <p className="wallet-address">
                  Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
                <button 
                  className="disconnect-button"
                  onClick={disconnectWallet}
                >
                  🔌 Disconnect
                </button>
              </div>
            )}
          </div>
          
          <div className="game-rules">
            <h3>How to Play</h3>
            <ul>
              <li>🪨 Rock beats Scissors</li>
              <li>📄 Paper beats Rock</li>
              <li>✂️ Scissors beats Paper</li>
            </ul>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="playing-screen">
          <h2>Make Your Choice</h2>
          <div className="choices">
            {CHOICES.map((choice) => (
              <button
                key={choice}
                className="choice-button"
                onClick={() => handleChoice(choice)}
              >
                {renderChoice(choice)}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'result' && (
        <div className="result-screen">
          <h2 className={`result-title ${result}`}>
            {result === 'win' && '🎉 You Win!'}
            {result === 'lose' && '😔 You Lose!'}
            {result === 'draw' && '🤝 Draw!'}
          </h2>
          
          <div className="choices-result">
            <div className="player-result">
              <h3>You</h3>
              {renderChoice(playerChoice)}
            </div>
            
            <div className="vs">VS</div>
            
            <div className="computer-result">
              <h3>Computer</h3>
              {renderChoice(computerChoice)}
            </div>
          </div>

          <div className="result-actions">
            <button className="play-again-button" onClick={resetGame}>
              🔄 Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game
