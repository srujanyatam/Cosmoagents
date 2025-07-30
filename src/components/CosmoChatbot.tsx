import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X, 
  Send, 
  RefreshCw,
  Plus,
  Bot, 
  User,
  Sparkles,
  Clock,
  Star,
  Zap,
  Minimize2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const CosmoChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isButtonAnimating, setIsButtonAnimating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('cosmo-chatbot-history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setMessages(parsedHistory);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('cosmo-chatbot-history', JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you're asking about "${userMessage.content}". I'm here to help with your code migration and technical questions. How can I assist you further?`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    localStorage.removeItem('cosmo-chatbot-history');
    toast({
      title: 'New Chat Started',
      description: 'A fresh conversation has begun.',
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const handleButtonClick = () => {
    setIsButtonAnimating(true);
    setTimeout(() => {
      setIsOpen(!isOpen);
      setIsButtonAnimating(false);
    }, 200);
  };

  // Add a function to clear chat history (refresh)
  const refreshChat = () => {
    setMessages([]);
    localStorage.removeItem('cosmo-chatbot-history');
    toast({
      title: 'Chat Refreshed',
      description: 'Chat history has been cleared.',
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Add a function to start a new migration
  const startNewMigration = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Migration started! Please provide details about your new migration task.',
        timestamp: new Date(),
      },
    ]);
    localStorage.removeItem('cosmo-chatbot-history');
    toast({
      title: 'New Migration',
      description: 'A new migration session has started.',
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Animated Chat Toggle Button */}
      <div className="pointer-events-auto">
        <Button
          onClick={handleButtonClick}
          size="lg"
          className={`rounded-full w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shadow-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white border-4 border-white/30 transition-all duration-500 transform ${
            isButtonAnimating ? 'scale-110 rotate-12' : 'scale-100 rotate-0'
          } ${isOpen ? 'animate-pulse' : 'hover:scale-105'}`}
          style={{
            animationDuration: isOpen ? '2s' : '0.5s'
          }}
        >
          {isOpen ? (
            <X className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 transition-transform duration-300" />
          ) : (
            <div className="relative">
              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 transition-transform duration-300" />
              <Sparkles className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
            </div>
          )}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto mt-2 w-[95vw] max-w-[380px] sm:max-w-[420px] md:max-w-[450px] lg:max-w-[480px] xl:max-w-[500px] rounded-2xl border-2 border-blue-700 shadow-2xl bg-white overflow-hidden flex flex-col" style={{minHeight: '480px', maxHeight: '80vh'}}>
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 border-b-2 border-blue-700 shadow-md">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bot className="h-6 w-6 text-white" />
                  <Sparkles className="h-2 w-2 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold tracking-wide text-white">Cosmo AI Assistant</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-100 font-medium">Online & Ready</span>
                  </div>
                </div>
              </div>
              {/* Header Actions */}
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={refreshChat}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                  title="Refresh Chat"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleButtonClick}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                  title={isOpen ? "Minimize" : "Expand"}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={closeChat}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-700 opacity-60"></div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 h-[250px] sm:h-[320px] md:h-[360px] lg:h-[380px] xl:h-[400px] overflow-y-auto p-2 sm:p-3 md:p-4 bg-white">
            {/* Quick Actions */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <Button
                  onClick={startNewChat}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100 h-6 px-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New Chat
                </Button>
                <Button
                  onClick={startNewMigration}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-green-600 hover:text-green-700 hover:bg-green-100 h-6 px-2"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Start New Migration
                </Button>
              </div>
              <div className="text-xs text-gray-500">
                {messages.length} messages
              </div>
            </div>
            {messages.length === 0 ? (
              // Enhanced Welcome Message
              <div className="text-center py-6 sm:py-8">
                <div className="relative mb-6">
                  <div className="relative">
                    <Bot className="h-16 w-16 sm:h-20 sm:w-20 mx-auto text-blue-600 mb-4" />
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 absolute top-2 right-1/3 text-yellow-500 animate-pulse" />
                    <Zap className="h-2 w-2 sm:h-3 sm:w-3 absolute bottom-2 left-1/3 text-blue-500 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Welcome to Cosmo Agents</h3>
                <p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto">
                  Cosmo Agents is your AI assistant for database migration, SQL, Oracle, Sybase, and more!<br />
                  Ask questions, get migration help, and start new migration sessions directly in chat.
                </p>
                {/* Feature Cards */}
                <div className="grid grid-cols-1 gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-4 md:mb-6">
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Oracle Database & PL/SQL</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">SQL Queries & Optimization</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-blue-700 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Sybase Database Migration</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-blue-800 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Supabase Backend Services</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-blue-900 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Git & GitHub Workflows</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="hidden sm:inline">Always Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    <span className="hidden sm:inline">Expert Knowledge</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                          : 'bg-white text-gray-800 border-2 border-blue-200 shadow-sm'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 bg-white text-gray-800 border-2 border-blue-200 shadow-sm">
                      <p>Thinking...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-2 sm:p-3 md:p-4 bg-white border-t-2 border-blue-700">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 p-0 text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-100"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CosmoChatbot;