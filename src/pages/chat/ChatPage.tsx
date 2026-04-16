// src/pages/chat/ChatPage.tsx
// ─── Full-featured Chat Page with Sidebar + Chat Window ───────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Message01Icon, Search01Icon, ArrowLeft01Icon, SentIcon,
    MoreVerticalIcon, Copy01Icon, Delete01Icon, PencilEdit02Icon,
    Flag01Icon, Cancel01Icon, Tick01Icon, TranslationIcon,
    UserIcon, Cancel02Icon,
} from 'hugeicons-react';
import api from '@/lib/axios';
import { useAuth } from '@/lib/auth';
import { getEcho } from '@/lib/echo';
import { normalizeLocale } from '@/i18n/config';
import { detectBadWords } from '@/lib/profanity';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Participant {
    id: number;
    name: string;
    avatar_url: string | null;
    role: string;
}

interface MessageData {
    id: number;
    conversation_id: number;
    sender_id: number;
    body: string;
    is_read: boolean;
    is_edited: boolean;
    created_at: string;
    updated_at: string;
    sender?: Participant;
}

interface ConversationItem {
    id: number;
    other_participant: Participant | null;
    latest_message: {
        id: number;
        body: string;
        sender_id: number;
        created_at: string;
        is_read: boolean;
    } | null;
    unread_count: number;
    is_blocked: boolean;
    blocked_by_me: boolean;
    last_message_at: string | null;
}

// ─── Main ChatPage ───────────────────────────────────────────────────────────

export default function ChatPage() {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const routeLocale = normalizeLocale(
        location.pathname.split('/').filter(Boolean)[0] || 'fr'
    );
    const isFr = routeLocale === 'fr';
    const activeConversationId = conversationId ? Number(conversationId) : null;

    // ── Conversation list state ──
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // ── Messages state ──
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);

    // ── Input state ──
    const [messageInput, setMessageInput] = useState('');
    const [inputError, setInputError] = useState('');
    const [sending, setSending] = useState(false);
    const [editingMessage, setEditingMessage] = useState<MessageData | null>(null);

    // ── Context menu state ──
    const [contextMenu, setContextMenu] = useState<{
        x: number; y: number; message: MessageData;
    } | null>(null);

    // ── Typing & block state ──
    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockedByMe, setBlockedByMe] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTypingEmitRef = useRef<number>(0);

    // ── Translation ──
    const [translatedMessages, setTranslatedMessages] = useState<Record<number, string>>({});
    const [translatingId, setTranslatingId] = useState<number | null>(null);

    // ── Refs ──
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // ── Fetch conversations ──
    const fetchConversations = useCallback(async () => {
        try {
            const res = await api.get('/conversations');
            setConversations(res.data.data ?? res.data);
        } catch (e) {
            console.error('Failed to fetch conversations', e);
        } finally {
            setLoadingConversations(false);
        }
    }, []);

    useEffect(() => {
        void fetchConversations();
    }, [fetchConversations]);

    // ── Fetch messages for active conversation ──
    const fetchMessages = useCallback(async (convId: number) => {
        setLoadingMessages(true);
        try {
            const res = await api.get(`/conversations/${convId}/messages`);
            const rawData = res.data.data ?? res.data;
            setMessages(Array.isArray(rawData) ? rawData : []);
            setNextCursor(res.data.next_cursor ?? null);

            // Mark as read
            void api.post(`/conversations/${convId}/read`);
        } catch (e) {
            console.error('Failed to fetch messages', e);
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    // ── Load more (infinite scroll) ──
    const loadMore = useCallback(async () => {
        if (!activeConversationId || !nextCursor || loadingMore) return;
        setLoadingMore(true);
        try {
            const res = await api.get(`/conversations/${activeConversationId}/messages`, {
                params: { cursor: nextCursor },
            });
            const rawData = res.data.data ?? res.data;
            setMessages(prev => [...prev, ...(Array.isArray(rawData) ? rawData : [])]);
            setNextCursor(res.data.next_cursor ?? null);
        } catch (e) {
            console.error('Failed to load more', e);
        } finally {
            setLoadingMore(false);
        }
    }, [activeConversationId, nextCursor, loadingMore]);

    // Scroll detection for infinite scroll
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        // Messages are displayed in reverse (newest at bottom)
        // Scrolling up (toward top) loads older messages
        if (container.scrollTop < 80 && nextCursor && !loadingMore) {
            void loadMore();
        }
    }, [nextCursor, loadingMore, loadMore]);

    // ── When active conversation changes ──
    useEffect(() => {
        if (!activeConversationId) {
            setMessages([]);
            setActiveConversation(null);
            return;
        }
        void fetchMessages(activeConversationId);
        const conv = conversations.find(c => c.id === activeConversationId) ?? null;
        setActiveConversation(conv);
        setIsBlocked(conv?.is_blocked ?? false);
        setBlockedByMe(conv?.blocked_by_me ?? false);
        setEditingMessage(null);
        setMessageInput('');
    }, [activeConversationId, fetchMessages, conversations]);

    // ── Presence heartbeat for conditional message notifications ──
    useEffect(() => {
        if (!activeConversationId) {
            return;
        }

        let isStopped = false;

        const pushPresence = async (isActive: boolean) => {
            if (isStopped) {
                return;
            }

            try {
                await api.post('/notifications/chat-presence', {
                    conversation_id: activeConversationId,
                    is_active: isActive,
                });
            } catch {
                // Presence heartbeat should never block chat UX.
            }
        };

        void pushPresence(true);

        const interval = window.setInterval(() => {
            void pushPresence(document.visibilityState === 'visible');
        }, 20000);

        const onVisibilityChange = () => {
            void pushPresence(document.visibilityState === 'visible');
        };

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            isStopped = true;
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            void api.post('/notifications/chat-presence', {
                conversation_id: activeConversationId,
                is_active: false,
            }).catch(() => {
                // Ignore cleanup heartbeat errors.
            });
        };
    }, [activeConversationId]);

    // ── Scroll to bottom on new message ──
    useEffect(() => {
        if (messages.length > 0 && !loadingMore) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, loadingMore]);

    // ── Real-time Echo listener ──
    useEffect(() => {
        if (!activeConversationId) return;

        const echo = getEcho();
        const channel = echo.private(`conversation.${activeConversationId}`);

        channel.listen('.message.sent', (e: { message: MessageData }) => {
            setMessages(prev => {
                if (prev.find(m => m.id === e.message.id)) return prev;
                return [e.message, ...prev];
            });
            // Update conversation list
            setConversations(prev => prev.map(c =>
                c.id === activeConversationId
                    ? { ...c, latest_message: { id: e.message.id, body: e.message.body, sender_id: e.message.sender_id, created_at: e.message.created_at, is_read: false }, last_message_at: e.message.created_at }
                    : c
            ));
            // Auto-mark as read since we're viewing
            void api.post(`/conversations/${activeConversationId}/read`);
        });

        channel.listen('.message.updated', (e: { message: Partial<MessageData> }) => {
            setMessages(prev => prev.map(m =>
                m.id === e.message.id ? { ...m, ...e.message } : m
            ));
        });

        channel.listen('.message.deleted', (e: { message_id: number }) => {
            setMessages(prev => prev.filter(m => m.id !== e.message_id));
        });

        channel.listen('.messages.read', (e: { reader_id: number }) => {
            if (e.reader_id !== user?.id) {
                setMessages(prev => prev.map(m =>
                    m.sender_id === user?.id ? { ...m, is_read: true } : m
                ));
            }
        });

        channel.listen('.user.blocked', (e: { blocker_id: number; is_blocked: boolean }) => {
            setIsBlocked(e.is_blocked);
            if (e.blocker_id !== user?.id) {
                setBlockedByMe(false);
            }
        });

        // Typing whisper
        channel.listenForWhisper('typing', (e: { user_id: number }) => {
            if (e.user_id !== user?.id) {
                setIsOtherTyping(true);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
            }
        });

        return () => {
            echo.leave(`conversation.${activeConversationId}`);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [activeConversationId, user?.id]);

    // ── Send typing whisper ──
    const emitTyping = useCallback(() => {
        if (!activeConversationId) return;
        const now = Date.now();
        if (now - lastTypingEmitRef.current < 2000) return;
        lastTypingEmitRef.current = now;

        try {
            const echo = getEcho();
            (echo.private(`conversation.${activeConversationId}`) as unknown as { whisper: (event: string, data: unknown) => void })
                .whisper('typing', { user_id: user?.id });
        } catch { /* ignore */ }
    }, [activeConversationId, user?.id]);

    // ── Send message ──
    const handleSend = async () => {
        const trimmedMessage = messageInput.trim();
        if (!trimmedMessage || !activeConversationId || sending) return;

        const profanityResult = detectBadWords(trimmedMessage);
        if (profanityResult.hasBadWord) {
            setInputError(isFr ? 'Veuillez retirer les mots injurieux de votre message.' : 'Please remove offensive words from your message.');
            return;
        }

        setInputError('');
        setSending(true);

        try {
            if (editingMessage) {
                // Edit mode
                const res = await api.put(`/messages/${editingMessage.id}`, { body: trimmedMessage });
                const updatedMsg = res.data.message;
                setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
                setEditingMessage(null);
            } else {
                // New message
                const res = await api.post(`/conversations/${activeConversationId}/messages`, {
                    body: trimmedMessage,
                });
                const newMsg = res.data.message;
                setMessages(prev => {
                    if (prev.find(m => m.id === newMsg.id)) return prev;
                    return [newMsg, ...prev];
                });
                // Update sidebar
                setConversations(prev => prev.map(c =>
                    c.id === activeConversationId
                        ? { ...c, latest_message: { id: newMsg.id, body: newMsg.body, sender_id: newMsg.sender_id, created_at: newMsg.created_at, is_read: false }, last_message_at: newMsg.created_at, unread_count: 0 }
                        : c
                ));
            }
            setMessageInput('');
        } catch (e) {
            console.error('Failed to send message', e);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    // ── Context menu actions ──
    const handleCopy = (text: string) => {
        void navigator.clipboard.writeText(text);
        setContextMenu(null);
    };

    const handleDelete = async (messageId: number) => {
        setContextMenu(null);
        try {
            await api.delete(`/messages/${messageId}`);
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (e) { console.error(e); }
    };

    const handleEdit = (msg: MessageData) => {
        setContextMenu(null);
        setEditingMessage(msg);
        setMessageInput(msg.body);
        inputRef.current?.focus();
    };

    const handleReport = async (messageId: number) => {
        setContextMenu(null);
        try {
            await api.post(`/messages/${messageId}/report`, { reason: 'Inappropriate content' });
        } catch (e) { console.error(e); }
    };

    const handleTranslate = async (msg: MessageData) => {
        setContextMenu(null);
        setTranslatingId(msg.id);
        try {
            const res = await api.post(`/messages/${msg.id}/translate`, { locale: routeLocale });
            setTranslatedMessages(prev => ({ ...prev, [msg.id]: res.data.translated }));
        } catch (e) { console.error(e); }
        finally { setTranslatingId(null); }
    };

    const handleBlock = async () => {
        if (!activeConversationId) return;
        try {
            if (blockedByMe) {
                await api.delete(`/conversations/${activeConversationId}/block`);
                setBlockedByMe(false);
                setIsBlocked(false);
            } else {
                await api.post(`/conversations/${activeConversationId}/block`);
                setBlockedByMe(true);
                setIsBlocked(true);
            }
        } catch (e) { console.error(e); }
    };

    // Check if message is the last one sent by user (for edit)
    const isLastMessageByUser = (msg: MessageData): boolean => {
        const myMessages = messages.filter(m => m.sender_id === user?.id);
        return myMessages.length > 0 && myMessages[0].id === msg.id;
    };

    // ── Context menu items builder ──
    const getContextMenuItems = (msg: MessageData) => {
        const items: Array<{ label: string; icon: typeof Copy01Icon; action: () => void; danger?: boolean }> = [
            { label: isFr ? 'Copier' : 'Copy', icon: Copy01Icon, action: () => handleCopy(msg.body) },
            { label: isFr ? 'Traduire' : 'Translate', icon: TranslationIcon, action: () => void handleTranslate(msg) },
        ];
        if (msg.sender_id === user?.id) {
            if (isLastMessageByUser(msg)) {
                items.push({ label: isFr ? 'Modifier' : 'Edit', icon: PencilEdit02Icon, action: () => handleEdit(msg) });
            }
            items.push({ label: isFr ? 'Supprimer' : 'Remove', icon: Delete01Icon, action: () => void handleDelete(msg.id), danger: true });
        } else {
            items.push({ label: isFr ? 'Signaler' : 'Report', icon: Flag01Icon, action: () => void handleReport(msg.id), danger: true });
        }
        return items;
    };

    // Close context menu on outside click
    useEffect(() => {
        const close = () => setContextMenu(null);
        if (contextMenu) {
            document.addEventListener('click', close);
            return () => document.removeEventListener('click', close);
        }
    }, [contextMenu]);

    // Format time
    const formatTime = (date: string) => {
        const d = new Date(date);
        return d.toLocaleTimeString(routeLocale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
        if (diffDays === 0) return isFr ? "Aujourd'hui" : 'Today';
        if (diffDays === 1) return isFr ? 'Hier' : 'Yesterday';
        return d.toLocaleDateString(routeLocale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' });
    };

    const filteredConversations = conversations.filter(c =>
        !searchQuery || c.other_participant?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Messages sorted oldest first for display
    const sortedMessages = [...messages].reverse();

    // ─── RENDER ──────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[#09090b] text-white pt-[72px]">
            <div className="h-[calc(100vh-72px)] flex">
                {/* ── Sidebar ─────────────────────────────────── */}
                <aside className={`${activeConversationId ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[380px] border-r border-white/5 bg-[#09090b]`}>
                    {/* Sidebar header */}
                    <div className="p-5 border-b border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-black italic uppercase tracking-tight">
                                {isFr ? 'Messages' : 'Messages'}
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">
                                    {isFr ? 'En ligne' : 'Online'}
                                </span>
                            </div>
                        </div>
                        <div className="relative group">
                            <Search01Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                placeholder={isFr ? 'Rechercher une conversation...' : 'Search conversations...'}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/5 rounded-2xl text-[13px] placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Conversation list */}
                    <div className="flex-1 overflow-y-auto">
                        {loadingConversations ? (
                            <div className="flex justify-center py-20">
                                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 px-6">
                                <Message01Icon size={40} className="text-white/10 mb-4" />
                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600 text-center">
                                    {isFr ? 'Aucune conversation' : 'No conversations'}
                                </p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => {
                                const isActive = conv.id === activeConversationId;
                                const other = conv.other_participant;
                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => navigate(`/${routeLocale}/messages/${conv.id}`)}
                                        className={`w-full px-5 py-4 flex items-center gap-4 transition-all border-b border-white/[0.03] text-left ${isActive
                                            ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500'
                                            : 'hover:bg-white/[0.02]'
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                            {other?.avatar_url ? (
                                                <img src={other.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon size={22} className="text-slate-600" />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[13px] font-black truncate">{other?.name || '?'}</h4>
                                                {conv.latest_message && (
                                                    <span className="text-[9px] text-slate-500 font-bold shrink-0 ml-2">
                                                        {formatDate(conv.latest_message.created_at)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-[11px] text-slate-500 truncate">
                                                    {conv.latest_message?.body || (isFr ? 'Démarrer la conversation' : 'Start the conversation')}
                                                </p>
                                                {conv.unread_count > 0 && (
                                                    <span className="ml-2 min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                                                        {conv.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </aside>

                {/* ── Chat Window ──────────────────────────────── */}
                <main className={`${!activeConversationId ? 'hidden lg:flex' : 'flex'} flex-col flex-1 bg-[#0a0a0c]`}>
                    {!activeConversationId ? (
                        // Empty state
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 rounded-[28px] bg-white/[0.03] border border-white/5 flex items-center justify-center mb-6">
                                <Message01Icon size={36} className="text-white/10" />
                            </div>
                            <h3 className="text-xl font-black italic uppercase tracking-tight text-white/30">{isFr ? 'Vos messages' : 'Your messages'}</h3>
                            <p className="text-[11px] text-slate-600 font-bold uppercase tracking-widest mt-2">
                                {isFr ? 'Sélectionnez une conversation pour commencer' : 'Select a conversation to start'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Chat header */}
                            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-4 bg-[#09090b]/80 backdrop-blur-xl">
                                <button
                                    onClick={() => navigate(`/${routeLocale}/messages`)}
                                    className="lg:hidden h-10 w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
                                >
                                    <ArrowLeft01Icon size={18} />
                                </button>

                                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                    {activeConversation?.other_participant?.avatar_url ? (
                                        <img src={activeConversation.other_participant.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon size={20} className="text-slate-600" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-[14px] font-black truncate">{activeConversation?.other_participant?.name ?? ''}</h3>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">
                                        {activeConversation?.other_participant?.role === 'enterprise' ? (isFr ? 'Entreprise' : 'Enterprise') : (isFr ? 'Étudiant' : 'Student')}
                                    </p>
                                </div>

                                {/* Block button */}
                                <button
                                    onClick={() => void handleBlock()}
                                    className={`h-9 px-3 rounded-xl border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${blockedByMe
                                        ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-red-400 hover:border-red-500/30'
                                        }`}
                                >
                                    <Cancel02Icon size={13} />
                                    {blockedByMe ? (isFr ? 'Débloquer' : 'Unblock') : (isFr ? 'Bloquer' : 'Block')}
                                </button>
                            </div>

                            {/* Block banner */}
                            <AnimatePresence>
                                {isBlocked && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-b border-red-500/20 bg-red-500/5 overflow-hidden"
                                    >
                                        <div className="flex items-center justify-center gap-3 py-3 px-5">
                                            <Cancel02Icon size={14} className="text-red-400" />
                                            <span className="text-[11px] font-bold text-red-300">
                                                {blockedByMe
                                                    ? (isFr ? 'Vous avez bloqué cette conversation' : 'You blocked this conversation')
                                                    : (isFr ? 'Vous ne pouvez pas répondre à cette conversation' : 'You cannot reply to this conversation')}
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Messages area */}
                            <div
                                ref={messagesContainerRef}
                                onScroll={handleScroll}
                                className="flex-1 overflow-y-auto px-5 py-4 space-y-1"
                            >
                                {/* Load more indicator */}
                                {loadingMore && (
                                    <div className="flex justify-center py-3">
                                        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                                {nextCursor && !loadingMore && (
                                    <button onClick={() => void loadMore()} className="w-full py-2 text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors">
                                        {isFr ? 'Charger les messages précédents' : 'Load earlier messages'}
                                    </button>
                                )}

                                {loadingMessages ? (
                                    <div className="flex justify-center py-20">
                                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : sortedMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <Message01Icon size={32} className="text-white/10 mb-3" />
                                        <p className="text-[11px] text-slate-600 font-bold uppercase tracking-widest">
                                            {isFr ? 'Aucun message, dites bonjour !' : 'No messages yet, say hello!'}
                                        </p>
                                    </div>
                                ) : (
                                    sortedMessages.map((msg, i) => {
                                        const isMine = msg.sender_id === user?.id;
                                        const showDateSep = i === 0 || formatDate(sortedMessages[i - 1].created_at) !== formatDate(msg.created_at);
                                        return (
                                            <div key={msg.id}>
                                                {showDateSep && (
                                                    <div className="flex items-center gap-3 py-3">
                                                        <div className="flex-1 h-px bg-white/5" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{formatDate(msg.created_at)}</span>
                                                        <div className="flex-1 h-px bg-white/5" />
                                                    </div>
                                                )}
                                                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} group mb-1`}>
                                                    <div
                                                        onContextMenu={(e) => {
                                                            e.preventDefault();
                                                            setContextMenu({ x: e.clientX, y: e.clientY, message: msg });
                                                        }}
                                                        className={`relative max-w-[70%] px-4 py-3 rounded-2xl ${isMine
                                                            ? 'bg-emerald-600 text-white rounded-br-md'
                                                            : 'bg-white/[0.05] text-slate-200 rounded-bl-md border border-white/5'
                                                            }`}
                                                    >
                                                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>

                                                        {/* Translation */}
                                                        {translatedMessages[msg.id] && (
                                                            <div className={`mt-2 pt-2 border-t ${isMine ? 'border-white/20' : 'border-white/10'}`}>
                                                                <p className="text-[10px] font-bold uppercase text-slate-300 mb-1">
                                                                    <TranslationIcon size={10} className="inline mr-1" />
                                                                    {isFr ? 'Traduction' : 'Translation'}
                                                                </p>
                                                                <p className="text-[12px] italic opacity-80">{translatedMessages[msg.id]}</p>
                                                            </div>
                                                        )}
                                                        {translatingId === msg.id && (
                                                            <div className="mt-1">
                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            </div>
                                                        )}

                                                        {/* Metadata */}
                                                        <div className={`flex items-center gap-2 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                            <span className={`text-[9px] font-bold ${isMine ? 'text-white/50' : 'text-slate-600'}`}>{formatTime(msg.created_at)}</span>
                                                            {msg.is_edited && <span className={`text-[8px] italic ${isMine ? 'text-white/40' : 'text-slate-500'}`}>{isFr ? 'modifié' : 'edited'}</span>}
                                                            {isMine && (
                                                                <span className={`text-[9px] ${msg.is_read ? 'text-emerald-300' : 'text-white/40'}`}>
                                                                    {msg.is_read ? <Tick01Icon size={12} /> : '•'}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Dropdown trigger */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const rect = (e.target as HTMLElement).getBoundingClientRect();
                                                                setContextMenu({ x: rect.left, y: rect.bottom + 4, message: msg });
                                                            }}
                                                            className={`absolute top-2 ${isMine ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center transition-opacity ${isMine ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 hover:bg-white/10'}`}
                                                        >
                                                            <MoreVerticalIcon size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                {/* Typing indicator */}
                                <AnimatePresence>
                                    {isOtherTyping && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="flex items-center gap-2 py-2"
                                        >
                                            <div className="flex items-center gap-1 px-4 py-3 bg-white/[0.05] border border-white/5 rounded-2xl rounded-bl-md">
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div ref={messagesEndRef} />
                            </div>

                            {/* ── Input area ─────────────────────── */}
                            {!isBlocked ? (
                                <div className="p-4 border-t border-white/5 bg-[#09090b]/80 backdrop-blur-xl">
                                    {/* Editing indicator */}
                                    <AnimatePresence>
                                        {editingMessage && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="mb-2 flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <PencilEdit02Icon size={13} className="text-emerald-500 shrink-0" />
                                                    <span className="text-[11px] text-emerald-300 font-bold truncate">{editingMessage.body}</span>
                                                </div>
                                                <button onClick={() => { setEditingMessage(null); setMessageInput(''); }} className="text-slate-400 hover:text-white ml-2 shrink-0">
                                                    <Cancel01Icon size={14} />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {!!inputError && (
                                        <p className="mb-2 px-1 text-[11px] font-semibold text-red-400">{inputError}</p>
                                    )}

                                    <div className="flex items-end gap-3">
                                        <textarea
                                            ref={inputRef}
                                            value={messageInput}
                                            onChange={e => {
                                                setMessageInput(e.target.value);
                                                if (inputError) setInputError('');
                                                emitTyping();
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    void handleSend();
                                                }
                                            }}
                                            placeholder={isFr ? 'Écrivez un message...' : 'Type a message...'}
                                            rows={1}
                                            className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-[13px] placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none max-h-32 transition-all"
                                        />
                                        <button
                                            onClick={() => void handleSend()}
                                            disabled={!messageInput.trim() || sending}
                                            className="h-12 w-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 flex items-center justify-center transition-all shrink-0"
                                        >
                                            <SentIcon size={18} />
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </>
                    )}
                </main>
            </div>

            {/* ── Context Menu ──────────────────────────────── */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="fixed z-[9999] w-48 rounded-2xl border border-white/10 bg-[#0f1014] shadow-2xl overflow-hidden py-1.5"
                        style={{ left: Math.min(contextMenu.x, window.innerWidth - 200), top: Math.min(contextMenu.y, window.innerHeight - 200) }}
                    >
                        {getContextMenuItems(contextMenu.message).map((item, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); item.action(); }}
                                className={`w-full px-4 py-2.5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest transition-all ${item.danger
                                    ? 'text-red-400 hover:bg-red-500/10'
                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon size={14} />
                                {item.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
