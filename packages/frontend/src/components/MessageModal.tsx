import React, { useState, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Profile } from '../types';

// Interface adaptada para coincidir com o modelo relacional de banco local
interface DBMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}



interface MessageModalProps {
  recipient: Profile;
  onClose: () => void;
  isPremiumUser: boolean;
  navigateTo: (page: string) => void;
  currentUserType: 'Baby' | 'Daddy' | 'Mommy';
  currentUserId: string; // Adicionado ID do usuário atual logado na sessão
}

const EMOJIS = ['😊', '😂', '❤️', '😍', '👍', '🙏', '😘', '🥰', '🎉', '🔥', '🤔', '😎', '💖', '😉', '😜', '💋', '👋', '🌹', '✨', '👀'];

const EmojiPicker: React.FC<{ onSelect: (emoji: string) => void }> = ({ onSelect }) => (
  <div className="absolute bottom-full mb-2 bg-white shadow-lg rounded-lg p-2 grid grid-cols-5 gap-2 w-48 border border-gray-200 z-10 animate-fade-in">
    {EMOJIS.map(emoji => (
      <button key={emoji} onClick={() => onSelect(emoji)} className="text-2xl hover:bg-gray-200 rounded-md transition-colors">
        {emoji}
      </button>
    ))}
  </div>
);

const MessageBubble: React.FC<{ message: DBMessage; currentUserId: string }> = ({ message, currentUserId }) => {
    const isSentByMe = message.sender_id === currentUserId;
    const timeFormatted = new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return (
        <div className={`flex w-full ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-sm ${isSentByMe ? 'bg-gradient-to-r from-gradient-pink to-gradient-orange text-white rounded-br-none' : 'bg-gray-200 text-dark-gray rounded-bl-none'}`}>
                <p className="text-sm break-words">{message.content}</p>
                <p className={`text-xs mt-1 ${isSentByMe ? 'text-gray-200' : 'text-gray-500'} text-right`}>{timeFormatted}</p>
            </div>
        </div>
    );
};

const UpgradePrompt: React.FC<{ onUpgrade: () => void }> = ({ onUpgrade }) => (
    <div className="p-4 bg-amber-50 border-t border-amber-200 text-amber-800">
        <div className='flex items-center justify-between gap-4'>
            <div>
                <p className="font-bold">Recurso Premium</p>
                <p className="text-sm">Assine um plano para enviar mensagens ilimitadas.</p>
            </div>
            <button onClick={onUpgrade} className="bg-amber-400 text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-amber-500 transition-colors flex-shrink-0">
                Ver Planos
            </button>
        </div>
    </div>
);

const MessageModal: React.FC<MessageModalProps> = ({ recipient, onClose, isPremiumUser, navigateTo, currentUserType, currentUserId }) => {
    const [messages, setMessages] = useState<DBMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState<{ message: string; showUpgrade: boolean } | null>(null);
    const [showEmojis, setShowEmojis] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const API_URL = 'http://localhost:4000';

    // 1. CARREGAR HISTÓRICO PERSISTENTE DO BANCO DE DADOS LOCAL
    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem('sweet_token');
            if (!token) return;

            try {
                const response = await fetch(`${API_URL}/messages/history/${recipient.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setMessages(data);
                }
            } catch (err) {
                console.error('Erro ao buscar histórico de mensagens:', err);
            }
        };

        fetchHistory();
    }, [recipient.id]);

    // 2. ACIONAMENTO DA CONEXÃO WEBSOCKET EM TEMPO REAL VIA SOCKET.IO
    useEffect(() => {
        socketRef.current = io(API_URL);

        // Comunica ao servidor quem está logando neste canal
        socketRef.current.emit('register_user', currentUserId);

        // Escuta novas mensagens direcionadas ao usuário atual em tempo real
        socketRef.current.on('receive_message', (message: DBMessage) => {
            if (message.sender_id === recipient.id) {
                setMessages(prev => [...prev, message]);
            }
        });

        // Escuta confirmação de entrega segura da mensagem enviada
        socketRef.current.on('message_sent_confirm', (message: DBMessage) => {
            setMessages(prev => [...prev, message]);
        });

        socketRef.current.on('message_error', (err: { error: string }) => {
            setError({ message: err.error, showUpgrade: false });
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [currentUserId, recipient.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojis(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !isPremiumUser || !socketRef.current) return;
        
        // Envia os dados estruturados pelo barramento de WebSockets do Socket.IO
        socketRef.current.emit('send_message', {
            sender_id: currentUserId,
            receiver_id: recipient.id,
            content: newMessage.trim()
        });

        setNewMessage('');
        setError(null);
        setShowEmojis(false);
    };

    const handleUpgradeClick = () => {
        onClose();
        navigateTo('plans');
    };

    const handleEmojiSelect = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
    };
    
    const preventAction = (e: React.ClipboardEvent | React.DragEvent) => {
        e.preventDefault();
    };

    // Fallback de imagem idêntico ao do ProfileCard
    const recipientImage = recipient.primary_photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div 
                ref={modalRef}
                className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:max-w-lg sm:h-[90vh] flex flex-col transform transition-all overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <img src={recipientImage} alt={recipient.display_name} className="w-12 h-12 rounded-full object-cover" />
                        <div>
                            <h3 className="font-bold text-lg">{recipient.display_name}</h3>
                            <p className="text-sm text-green-500 flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Online
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-grow p-4 overflow-y-auto bg-gray-50 relative">
                    <div className="space-y-4 flex flex-col relative z-[1]">
                        {messages.map(msg => <MessageBubble key={msg.id} message={msg} currentUserId={currentUserId} />)}
                    </div>
                    <div ref={messagesEndRef} />
                </div>

                {/* Footer / Input */}
                <div className="flex-shrink-0">
                    {!isPremiumUser ? (
                        <UpgradePrompt onUpgrade={handleUpgradeClick} />
                    ) : (
                        <div className="p-4 bg-white border-t border-gray-200">
                            {error && (
                                <div className="text-center mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-600 text-sm font-medium">{error.message}</p>
                                    {error.showUpgrade && (
                                        <button onClick={handleUpgradeClick} className="mt-2 text-sm font-bold text-white bg-gradient-to-r from-gradient-pink to-gradient-orange px-4 py-1.5 rounded-full shadow-md hover:opacity-90 transition-opacity">
                                            Ver Planos
                                        </button>
                                    )}
                                </div>
                            )}
                            <div className="relative flex items-center gap-2" ref={emojiPickerRef}>
                                {showEmojis && <EmojiPicker onSelect={handleEmojiSelect} />}
                                <button onClick={() => setShowEmojis(!showEmojis)} className="p-2 text-gray-500 hover:text-gradient-pink transition-colors" aria-label="Adicionar emoji">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.ctrlKey && (e.key === 'c' || e.key === 'x')) {
                                            e.preventDefault();
                                        }
                                        if (e.key === 'Enter' && !e.shiftKey) { 
                                            e.preventDefault(); 
                                            handleSendMessage(); 
                                        }
                                    }}
                                    onCopy={preventAction}
                                    onCut={preventAction}
                                    onPaste={preventAction}
                                    onDrop={preventAction}
                                    placeholder="Digite sua mensagem..."
                                    className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gradient-pink resize-none bg-gray-100 text-gray-900 placeholder-gray-500"
                                    rows={1}
                                />
                                <button onClick={handleSendMessage} disabled={!newMessage.trim()} className="p-3 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Enviar mensagem">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageModal;