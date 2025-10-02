"use client";

import React from 'react';

// Define the structure of a message
export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
}

interface ChatHistoryProps {
  messages: Message[];
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages }) => {
  return (
    <div className="flex-grow border rounded-md p-4 space-y-4 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="text-center text-muted-foreground">
          Start the conversation by typing a message below.
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`p-3 rounded-lg max-w-lg ${
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ChatHistory;
