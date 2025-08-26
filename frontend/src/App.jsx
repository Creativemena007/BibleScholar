import React, { useState } from 'react'
import './App.css'
import Chat from './components/Chat'
import Search from './components/Search'

function App() {
  const [activeTab, setActiveTab] = useState('chat')

  return (
    <div className="app">
      <header className="app-header">
        <h1>LogosAI</h1>
        <p>AI-Powered Bible Study Assistant</p>
        
        <nav className="app-nav">
          <button 
            className={activeTab === 'chat' ? 'active' : ''} 
            onClick={() => setActiveTab('chat')}
          >
            AI Assistant
          </button>
          <button 
            className={activeTab === 'search' ? 'active' : ''} 
            onClick={() => setActiveTab('search')}
          >
            Semantic Search
          </button>
        </nav>
      </header>
      
      <main className="app-main">
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'search' && <Search />}
      </main>
    </div>
  )
}

export default App
