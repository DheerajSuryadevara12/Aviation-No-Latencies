import { ChatMessage as ChatMessageType } from '@/types/aviation';
import { cn } from '@/lib/utils';
import { Bot, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isPilot = message.role === 'pilot';

  return (
    <div className={cn(
      'flex gap-3 animate-fade-in',
      isPilot ? 'flex-row-reverse' : 'flex-row'
    )}>
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isPilot ? 'bg-primary text-primary-foreground' : 'bg-info/20 text-info'
      )}>
        {isPilot ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Bubble */}
      <div className={cn(
        'flex-1 max-w-[80%]',
        isPilot ? 'text-right' : 'text-left'
      )}>
        <div className={cn(
          'inline-block px-4 py-2.5 rounded-2xl',
          isPilot 
            ? 'bg-primary text-primary-foreground rounded-br-md' 
            : 'bg-muted border border-border rounded-bl-md'
        )}>
          {message.isTyping ? (
            <div className="flex items-center gap-1.5 py-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-sm">Typing...</span>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}
        </div>
        <p className={cn(
          'text-[10px] text-muted-foreground mt-1 px-1',
          isPilot ? 'text-right' : 'text-left'
        )}>
          {format(message.timestamp, 'h:mm a')}
        </p>
      </div>
    </div>
  );
}
