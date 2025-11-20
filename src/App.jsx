import { useState, useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import './App.css'
import Game from './components/Game'

function App() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize the Farcaster Mini App SDK
        await sdk.actions.ready()
        setIsReady(true)
      } catch (error) {
        console.error('Error initializing Mini App SDK:', error)
        // Still show the app even if SDK fails (for development)
        setIsReady(true)
      }
    }

    initializeApp()
  }, [])

  if (!isReady) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <Game />
    </div>
  )
}

export default App
