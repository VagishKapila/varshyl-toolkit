import type { SorenChatMessage } from '../types.js';

export interface SorenChatProps {
  messages: SorenChatMessage[];
  userInitial: string;
}

export function SorenChat({ messages, userInitial }: SorenChatProps) {
  if (messages.length === 0) return null;

  return (
    <div className="soren-chat" data-testid="soren-chat">
      {messages.map((msg) => (
        <div key={msg.id} className={`soren-msg${msg.role === 'user' ? ' user' : ''}`}>
          <div className={`soren-msg-av${msg.role === 'user' ? ' user-av' : ''}`}>
            {msg.role === 'user' ? userInitial : 'S'}
          </div>
          <div className="soren-msg-bub">{msg.content}</div>
        </div>
      ))}
    </div>
  );
}
