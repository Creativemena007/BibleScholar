import React from 'react'
import './App.css'
import Chat from './components/Chat'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>LogosAI</h1>
        <p>AI-Powered Bible Study Assistant</p>
      </header>
      <main className="app-main">
        <Chat />
      </main>
    </div>
  )
}

export default App
