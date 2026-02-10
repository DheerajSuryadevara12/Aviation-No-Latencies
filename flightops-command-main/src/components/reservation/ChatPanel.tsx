import { useState, useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '@/types/aviation';
import { ChatMessage } from './ChatMessage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Phone, MessageSquare } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessageType[];
  onSendMessage?: (message: string) => void;
  isAgentTyping?: boolean;
}

export function ChatPanel({ messages, onSendMessage, isAgentTyping }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAgentTyping]);

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-card rounded-full" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Reservation Agent</h3>
            <p className="text-xs text-success">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Phone className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isAgentTyping && (
          <ChatMessage 
            message={{
              id: 'typing',
              role: 'agent',
              content: '',
              timestamp: new Date(),
              isTyping: true
            }}
          />
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-card border-border"
          />
          <Button 
            onClick={handleSend}
            disabled={!inputValue.trim()}
            size="icon"
            className="flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
