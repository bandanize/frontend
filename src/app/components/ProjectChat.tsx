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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && currentProject) {
      sendMessage(currentProject.id, message);
      setMessage('');
    }
  };

  const highlightMentions = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-blue-600 font-medium">
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
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.userId === user?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.userId !== user?.id && (
                    <p className="text-xs font-medium mb-1 opacity-70">
                      {msg.userName}
                    </p>
                  )}
                  <p className="break-words">{highlightMentions(msg.message)}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.userId === user?.id ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatDistanceToNow(new Date(msg.timestamp), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje... (usa @ para mencionar)"
            className="flex-1"
          />
          <Button type="submit" disabled={!message.trim()}>
            <Send className="size-4" />
          </Button>
        </form>

        <div className="mt-2 text-xs text-gray-500">
          <p>Tip: Menciona a alguien escribiendo @nombre</p>
        </div>
      </CardContent>
    </Card>
  );
}
