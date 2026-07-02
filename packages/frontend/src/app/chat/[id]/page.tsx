'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, Send } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Message {
  id?: string;
  senderId: string;
  content: string;
  createdAt: string;
  status?: 'sent' | 'delivered' | 'read';
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    if (!token) {
      router.replace('/');
      return;
    }

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Entra na sala do chat com o outro usuário
    socket.emit('join_room', { withUserId: params.id });

    // Carrega histórico
    socket.on('message_history', (history: Message[]) => {
      setMessages(history);
    });

    // Nova mensagem recebida em tempo real
    socket.on('new_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [params.id, token, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      toUserId: params.id,
      content: text.trim(),
    });

    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="font-semibold text-gray-800">Conversa</h1>
          <p className={`text-xs ${connected ? 'text-green-500' : 'text-gray-400'}`}>
            {connected ? 'Conectado' : 'Reconectando...'}
          </p>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-10">
            Nenhuma mensagem ainda. Diga olá! 👋
          </p>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.senderId === userId;
          return (
            <div key={msg.id ?? i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  isMine
                    ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none'
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${isMine ? 'text-pink-100' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-3 flex gap-3 items-end sticky bottom-0">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma mensagem..."
          rows={1}
          className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 max-h-32 overflow-y-auto"
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="bg-gradient-to-br from-pink-500 to-rose-600 text-white p-3 rounded-full disabled:opacity-40 hover:shadow-md transition"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
