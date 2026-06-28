import React, { useState, useRef, useEffect } from 'react';
import type { Profile, Message } from '../types';

// Phone number detection logic, rewritten for robustness.
const containsPhoneNumber = (context: string, currentMessage: string): boolean => {
    // Extensive map of number words to digits.
    const numberMap: { [key: string]: string } = {
        'zero': '0', 'um': '1', 'hum': '1', 'uma': '1', 'dois': '2', 'tres': '3',
        'quatro': '4', 'cinco': '5', 'seis': '6', 'meia': '6', 'sete': '7',
        'oito': '8', 'nove': '9', 'nono': '9', 'dez': '10'
    };

    const normalizeText = (str: string) => str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const numberWordsRegex = new RegExp(Object.keys(numberMap).join('|'), 'g');
    
    const convertToDigits = (str: string) => normalizeText(str).replace(numberWordsRegex, match => numberMap[match]);

    // RULE 1: AGGRESSIVE IMMEDIATE CHECK on the current message.
    // This blocks short, number-heavy messages like "2", "36", "nove".
    const currentMsgWithDigits = convertToDigits(currentMessage);
    const currentMsgDigitsOnly = currentMsgWithDigits.replace(/\D/g, '');
    const currentMsgNonNumericChars = convertToDigits(currentMessage).replace(/[\d\s]/g, '');

    // Heuristic: If the message has numbers, has very few other letters, and is short, it's suspicious.
    if (currentMsgDigitsOnly.length > 0 && currentMsgNonNumericChars.length < 4 && currentMessage.length < 30) {
        return true;
    }

    // RULE 2: CONTEXT CHECK on the conversation history.
    // This catches numbers built up over several messages.
    const textWithDigits = convertToDigits(context);
    const fullDigitString = textWithDigits.replace(/\D/g, '');
    const PHONE_NUMBER_LENGTH_THRESHOLD = 8;
    const phoneNumberRegex = new RegExp(`\\d{${PHONE_NUMBER_LENGTH_THRESHOLD},}`);
    if (phoneNumberRegex.test(fullDigitString)) {
        return true;
    }

    return false;
};


// Component props
interface MessageModalProps {
  recipient: Profile;
  onClose: () => void;
  isPremiumUser: boolean;
  navigateTo: (page: string) => void;
  currentUserType: 'Baby' | 'Daddy' | 'Mommy';
}

const EMOJIS = ['😊', '😂', '❤️', '😍', '👍', '🙏', '😘', '🥰', '🎉', '🔥', '🤔', '😎', '💖', '😉', '😜', '💋', '👋', '🌹', '✨', '👀'];

const EmojiPicker: React.FC<{ onSelect: (emoji: string) => void }> = ({ onSelect }) => (
  <div className="absolute bottom-full mb-2 bg-white shadow-lg rounded-lg p-2 grid grid-cols-5 gap-2 w-48 border border-gray-200 animate-fade-in-up-fast z-10">
    {EMOJIS.map(emoji => (
      <button key={emoji} onClick={() => onSelect(emoji)} className="text-2xl hover:bg-gray-200 rounded-md transition-colors">
        {emoji}
      </button>
    ))}
  </div>
);

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const isSentByMe = message.sender === 'me';
    return (
        <div className={`flex w-full ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-sm ${isSentByMe ? 'bg-gradient-to-r from-gradient-pink to-gradient-orange text-white rounded-br-none' : 'bg-gray-200 text-dark-gray rounded-bl-none'}`}>
                <p className="text-sm break-words">{message.text}</p>
                <p className={`text-xs mt-1 ${isSentByMe ? 'text-gray-200' : 'text-gray-500'} text-right`}>{message.timestamp}</p>
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

// Main Component
const MessageModal: React.FC<MessageModalProps> = ({ recipient, onClose, isPremiumUser, navigateTo, currentUserType }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState<{ message: string; showUpgrade: boolean } | null>(null);
    const [showEmojis, setShowEmojis] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojis(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const preventDefault = (e: Event) => e.preventDefault();
        const modalEl = modalRef.current;

        if (modalEl) {
            modalEl.addEventListener('contextmenu', preventDefault);
        }

        return () => {
            if (modalEl) {
                modalEl.removeEventListener('contextmenu', preventDefault);
            }
        }
    }, []);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !isPremiumUser) return;
        
        const recentMyMessages = messages
            .filter(m => m.sender === 'me')
            .slice(-10) 
            .map(m => m.text)
            .join(' ');
        
        const contextToCheck = `${recentMyMessages} ${newMessage}`;

        if (containsPhoneNumber(contextToCheck, newMessage)) {
             if (currentUserType === 'Baby') {
                setError({
                    message: 'O envio de contatos é um recurso exclusivo para assinantes. Faça um upgrade para poder enviar.',
                    showUpgrade: true,
                });
                return;
             }
             setError({
                 message: 'Para a segurança de todos, o compartilhamento de informações de contato não é permitido.',
                 showUpgrade: false,
             });
             return;
        }

        const messageToSend: Message = {
            id: Date.now(),
            text: newMessage,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            sender: 'me',
        };
        setMessages([...messages, messageToSend]);
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div 
                ref={modalRef}
                className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:max-w-lg sm:h-[90vh] flex flex-col transform transition-all animate-fade-in-down overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <img src={recipient.imageUrls[0]} alt={recipient.name} className="w-12 h-12 rounded-full object-cover" />
                        <div>
                            <h3 className="font-bold text-lg">{recipient.name}</h3>
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
                        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
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