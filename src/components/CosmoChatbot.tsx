import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const SYSTEM_PROMPT =
  'You are Cosmo Agents, an expert assistant. Only answer questions about SQL, GitHub, Sybase, Oracle, Supabase, or this website\'s navigation and features. If the question is not about these, politely say you can only answer those topics. Do not answer questions about security or API internals. Keep your answers short, precise, and accurate.';

const BOT_AVATAR =
  'https://cdn-icons-png.flaticon.com/512/4712/4712035.png'; // A modern, friendly bot icon (can be replaced with a custom Cosmo Agents logo)

const CosmoChatbot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'assistant', content: 'Hi! I am Cosmo Agents. Ask me anything about Sybase, Oracle, SQL, GitHub, Supabase, or how to use this website.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setError(null);
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
      if (response.ok) {
        setMessages((msgs) => [
          ...msgs,
          { role: 'assistant', content: data.rewrittenCode || data.answer || 'Sorry, I could not answer that.' },
        ]);
      } else {
        setMessages((msgs) => [
          ...msgs,
          { role: 'assistant', content: data.error || 'Sorry, there was an error. Please try again.' },
        ]);
        setError(data.error || 'Sorry, there was an error. Please try again.');
        console.error('Chatbot backend error:', data.error);
      }
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { role: 'assistant', content: 'Sorry, there was a network error. Please try again.' },
      ]);
      setError('Sorry, there was a network error. Please try again.');
      console.error('Chatbot network error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setMessages([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'assistant', content: 'Hi! I am Cosmo Agents. Ask me anything about Sybase, Oracle, SQL, GitHub, Supabase, or how to use this website.' },
    ]);
    setInput('');
    setError(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      setMessages((msgs) => [
        ...msgs,
        { role: 'user', content: '[Image uploaded]' },
        { role: 'assistant', content: 'Image received! Our team will review it and get back to you if needed.' },
      ]);
    } else {
      setMessages((msgs) => [
        ...msgs,
        { role: 'assistant', content: 'Please upload a PNG or JPEG image only.' },
      ]);
    }
    // Reset file input
    e.target.value = '';
  };

  // Error boundary to prevent page crash
  try {
    return (
      <div>
        {/* Floating Chat Button */}
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 bg-primary text-white rounded-full shadow-lg p-4 hover:bg-primary/90 focus:outline-none"
            aria-label="Open Cosmo Agents Chatbot"
          >
            <img src={BOT_AVATAR} alt="Cosmo Agents Bot" className="w-7 h-7" />
          </button>
        )}
        {/* Chat Widget */}
        {open && (
          <div className="fixed bottom-6 right-6 z-50 w-80 max-w-[95vw] bg-white border border-gray-300 rounded-xl shadow-2xl flex flex-col h-[500px]">
            <div className="flex items-center justify-between p-3 border-b bg-primary text-white rounded-t-xl">
              <span className="flex items-center gap-2 font-bold">
                <img src={BOT_AVATAR} alt="Bot" className="w-6 h-6 rounded-full border border-white" />
                Cosmo Agents
              </span>
              <div className="flex gap-2 items-center">
                <button onClick={handleRestart} className="text-white hover:text-gray-200 text-lg font-bold" title="Restart Bot">⟳</button>
                <button onClick={() => setOpen(false)} className="text-white hover:text-gray-200 text-lg font-bold" title="Close">×</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
              {messages.slice(1).map((msg, idx) => (
                <div key={idx} className={`mb-2 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <img src={BOT_AVATAR} alt="Bot" className="w-5 h-5 rounded-full mr-2 self-end" />
                  )}
                  <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-900'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t bg-white flex gap-2 items-center">
              <label className="cursor-pointer flex items-center">
                <span className="text-xl mr-2" title="Upload Image">+</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={loading}
                />
              </label>
              <input
                type="text"
                className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring"
                placeholder="Ask about SQL, GitHub, Sybase, Oracle, Supabase, or this website..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                disabled={loading}
              />
              <Button size="sm" onClick={sendMessage} disabled={loading || !input.trim()}>
                {loading ? <span className="animate-spin mr-1">⏳</span> : null}
                {loading ? 'Sending...' : 'Send'}
              </Button>
            </div>
            {error && <div className="text-red-600 text-xs p-2">{error}</div>}
          </div>
        )}
      </div>
    );
  } catch (err) {
    return <div className="fixed bottom-6 right-6 z-50 bg-red-100 text-red-700 p-4 rounded shadow">Chatbot error. Please refresh the page.</div>;
  }
};

export default CosmoChatbot; 