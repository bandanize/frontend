import React, { useState, useRef, useEffect } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function ProjectChat() {
  const { currentProject, sendMessage } = useProjects();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentProject?.chat]);

  // Mention logic
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const mentionFilteredMembers = currentProject?.members.filter(member => 
    member.name.toLowerCase().includes(mentionQuery.toLowerCase()) && member.id !== user?.id
  ) || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Simple mention detection: if last word starts with @
    const lastWord = value.split(' ').pop();
    if (lastWord && lastWord.startsWith('@')) {
        setShowMentions(true);
        setMentionQuery(lastWord.slice(1));
    } else {
        setShowMentions(false);
    }
  };

  const handleSelectMention = (name: string) => {
      const words = message.split(' ');
      words.pop(); // Remove partial mention
      const newMessage = [...words, `@${name} `].join(' ');
      setMessage(newMessage);
      setShowMentions(false);
      inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault(); 
        // Could implement navigation here
    }
    if (showMentions && e.key === 'Enter') {
        e.preventDefault();
        if (mentionFilteredMembers.length > 0) {
            handleSelectMention(mentionFilteredMembers[0].name);
        }
    }
    // Allow Escape to close mentions
    if (showMentions && e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && currentProject) {
      sendMessage(currentProject.id, message);
      setMessage('');
    }
  };

  const highlightMentions = (text: string, isOwnMessage: boolean) => {
    if (!text) return null;
    
    const memberNames = currentProject?.members
      .map(m => m.name)
      .sort((a, b) => b.length - a.length) || [];

    if (memberNames.length === 0) return text;

    const escapeRegex = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Match valid member names
    const patternString = `(@(?:${memberNames.map(escapeRegex).join('|')}))`;
    const regex = new RegExp(patternString, 'g');
    
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (part.startsWith('@') && memberNames.includes(part.slice(1))) {
        return (
          <span 
            key={index} 
            className={`font-bold ${isOwnMessage ? 'text-yellow-300' : 'text-blue-600'}`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (!currentProject) return null;

  return (
    <Card className="h-[calc(100vh-16rem)]">
      <CardHeader>
        <CardTitle>Chat del proyecto</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-5rem)]">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {currentProject.chat.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No hay mensajes aún</p>
              <p className="text-sm">Sé el primero en enviar un mensaje</p>
            </div>
          ) : (
            currentProject.chat.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${
                    msg.userId === user?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  {msg.userId !== user?.id && (
                    <p className="text-xs font-bold mb-1 text-gray-600">
                      {msg.userName}
                    </p>
                  )}
                  <p className="break-words">{highlightMentions(msg.message, msg.userId === user?.id)}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.userId === user?.id ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {(() => {
                      try {
                        const date = new Date(msg.timestamp);
                        return isNaN(date.getTime()) 
                          ? 'Hace un momento' 
                          : formatDistanceToNow(date, { addSuffix: true, locale: es });
                      } catch (e) {
                        return 'Hace un momento';
                      }
                    })()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="relative">
             {showMentions && (
                <div className="absolute bottom-full mb-2 left-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden z-10">
                  {mentionFilteredMembers.length > 0 ? (
                    mentionFilteredMembers.map(member => (
                      <button
                        key={member.id}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"
                        onClick={() => handleSelectMention(member.name)}
                      >
                         <div className="size-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">
                            {member.name.charAt(0)}
                         </div>
                         {member.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">No se encontraron miembros</div>
                  )}
                </div>
             )}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje..."
                className="flex-1"
                ref={inputRef}
              />
              <Button type="submit" disabled={!message.trim()}>
                <Send className="size-4" />
              </Button>
            </form>
        </div>
      </CardContent>
    </Card>
  );
}
