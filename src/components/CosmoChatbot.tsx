import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const SYSTEM_PROMPT =
  'You are Cosmo Agents, an expert assistant. Only answer questions about Sybase, Oracle, or general database topics. If the question is not about these, politely say you can only answer database-related queries. Keep your answers short, precise, and accurate.';

const CosmoChatbot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'assistant', content: 'Hi! I am Cosmo Agents. Ask me anything about Sybase, Oracle, or databases.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('/.netlify/functions/ai-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: '',
          prompt: `${SYSTEM_PROMPT}\n\n${input}`,
        }),
      });
      const data = await response.json();
      setMessages((msgs) => [
        ...msgs,
        { role: 'assistant', content: data.rewrittenCode || data.answer || data.error || 'Sorry, I could not answer that.' },
      ]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { role: 'assistant', content: 'Sorry, there was an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Floating Chat Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary text-white rounded-full shadow-lg p-4 hover:bg-primary/90 focus:outline-none"
          aria-label="Open Cosmo Agents Chatbot"
        >
          💬
        </button>
      )}
      {/* Chat Widget */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 max-w-[95vw] bg-white border border-gray-300 rounded-xl shadow-2xl flex flex-col h-[450px]">
          <div className="flex items-center justify-between p-3 border-b bg-primary text-white rounded-t-xl">
            <span className="font-bold">Cosmo Agents</span>
            <button onClick={() => setOpen(false)} className="text-white hover:text-gray-200 text-lg font-bold">×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
            {messages.slice(1).map((msg, idx) => (
              <div key={idx} className={`mb-2 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-900'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t bg-white flex gap-2">
            <input
              type="text"
              className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring"
              placeholder="Ask about Sybase, Oracle, DB..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
              disabled={loading}
            />
            <Button size="sm" onClick={sendMessage} disabled={loading || !input.trim()}>
              {loading ? '...' : 'Send'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CosmoChatbot; 