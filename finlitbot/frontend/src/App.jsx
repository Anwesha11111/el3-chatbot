import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setLoading(true)
    setInput('')

    try {
      const response = await axios.post('/api/chat', { message: input })
      setMessages(prev => [...prev, { role: 'bot', content: response.data.response }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: 'Error: AI service unavailable. Check backend/AI server.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="chat-header">
        <h1>🤖 Flan-T5 Chatbot</h1>
        <p>Ask about financial literacy, investing, or anything!</p>
      </div>
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <strong>{message.role === 'user' ? 'You' : 'Bot'}:</strong> {message.content}
          </div>
        ))}
        {loading && <div className="message bot">Bot is typing...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? '⏳' : 'Send'}
        </button>
      </div>
    </div>
  )
}

export default App
