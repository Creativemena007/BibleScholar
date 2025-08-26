import { useState } from 'react';
import './Search.css';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [embeddingsReady, setEmbeddingsReady] = useState(false);
  const [initializing, setInitializing] = useState(false);

  const checkEmbeddingsStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/embeddings-status');
      const data = await response.json();
      setEmbeddingsReady(data.ready);
      return data.ready;
    } catch (error) {
      console.error('Error checking embeddings status:', error);
      return false;
    }
  };

  const initializeEmbeddings = async () => {
    setInitializing(true);
    try {
      const response = await fetch('http://localhost:5000/api/init-embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize embeddings');
      }

      const data = await response.json();
      console.log('Embeddings initialized:', data);
      setEmbeddingsReady(true);
    } catch (error) {
      console.error('Error initializing embeddings:', error);
      alert('Failed to initialize embeddings. Make sure your OpenAI API key is set.');
    } finally {
      setInitializing(false);
    }
  };

  const performSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);

    try {
      const response = await fetch('http://localhost:5000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, limit: 10 }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  // Check embeddings status on component mount
  React.useEffect(() => {
    checkEmbeddingsStatus();
  }, []);

  return (
    <div className="search-container">
      <div className="search-header">
        <h2>Semantic Bible Search</h2>
        <p>Search by meaning, not just keywords</p>
      </div>

      {!embeddingsReady && (
        <div className="embeddings-setup">
          <div className="setup-message">
            <h3>First-time Setup</h3>
            <p>Initialize verse embeddings to enable semantic search</p>
            <button 
              onClick={initializeEmbeddings} 
              disabled={initializing}
              className="init-button"
            >
              {initializing ? 'Initializing...' : 'Initialize Embeddings'}
            </button>
            <small>This will take a minute and requires an OpenAI API key</small>
          </div>
        </div>
      )}

      {embeddingsReady && (
        <>
          <div className="search-input">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Try: 'God's love for humanity' or 'Messianic prophecies'"
              disabled={loading}
            />
            <button onClick={performSearch} disabled={loading || !query.trim()}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="sample-queries">
            <p><strong>Example searches:</strong></p>
            <div className="query-buttons">
              {[
                'God\'s faithfulness in trials',
                'Messianic prophecies',
                'Love your enemies',
                'Eternal life through Christ',
                'Wisdom and understanding'
              ].map((sampleQuery) => (
                <button
                  key={sampleQuery}
                  className="sample-query-btn"
                  onClick={() => {
                    setQuery(sampleQuery);
                    performSearch();
                  }}
                  disabled={loading}
                >
                  {sampleQuery}
                </button>
              ))}
            </div>
          </div>

          <div className="search-results">
            {results.length > 0 && (
              <h3>Found {results.length} verses</h3>
            )}
            
            {results.map((result, index) => (
              <div key={index} className="result-item">
                <div className="result-header">
                  <span className="result-reference">{result.metadata?.reference || 'Unknown'}</span>
                  <span className="result-similarity">
                    {(result.similarity * 100).toFixed(1)}% match
                  </span>
                </div>
                <div className="result-text">
                  {result.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="search-loading">
                <div className="loading-spinner"></div>
                <p>Searching for semantically similar verses...</p>
              </div>
            )}

            {!loading && results.length === 0 && query && (
              <div className="no-results">
                <p>No similar verses found for "{query}"</p>
                <p>Try a different search term or phrase</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Search;