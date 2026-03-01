import { useState, useRef, useEffect } from "react";
import { UserContext, ChatMessage } from "../types";
import { sendChatMessage } from "../lib/api";
import { Send, Bot, User, Sparkles, Copy, Mic } from "lucide-react";
import { cn } from "../lib/utils";
import ReactMarkdown from 'react-markdown';
import { useSpeechRecognition } from "../lib/hooks/useSpeechRecognition";

interface ChatPanelProps {
    user: UserContext | null;
}

export function ChatPanel({ user }: ChatPanelProps) {
    const defaultName = user?.authenticated && user?.name
        ? user.name.split(' ')[0]
        : "";

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        isSupported,
        isListening,
        interimTranscript,
        finalTranscript,
        start,
        stop,
        reset,
        error
    } = useSpeechRecognition();

    useEffect(() => {
        if (error) {
            showToast(error);
        }
    }, [error]);

    useEffect(() => {
        // Automatically dump transcript to input when stopped naturally
        if (!isListening && (finalTranscript || interimTranscript)) {
            setInput(prev => prev + (prev ? ' ' : '') + finalTranscript + interimTranscript);
            reset();
        }
    }, [isListening, finalTranscript, interimTranscript, reset]);

    const displayInput = input + (isListening && (finalTranscript || interimTranscript) ? (input ? ' ' : '') + finalTranscript + interimTranscript : '');

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 2000);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text: string) => {
        if (!text.trim() || isLoading) return;

        setInput("");
        const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const data = await sendChatMessage(text);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.reply || data.assistant_message || "Done.",
                ...data
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Oops, I had trouble connecting to the backend. Is it running?"
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="flex items-center gap-2 p-4 border-b border-gray-100 shrink-0">
                <span className="text-xl">🐨</span>
                <h2 className="font-semibold text-gray-800 tracking-tight">Koala</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 mt-[-10%]">
                        <div className="w-16 h-16 bg-gradient-to-tr from-gray-100 to-gray-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-200">
                            <span className="text-3xl">🐨</span>
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-gray-800 mb-2">
                            Hello{defaultName ? `, ${defaultName}` : ''}
                        </h1>
                        <p className="text-gray-500 font-medium text-sm">
                            I'm Koala, a smart assistant for the lazy.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map(msg => (
                            <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    msg.role === "user" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-800"
                                )}>
                                    {msg.role === "user" ? <User className="w-4 h-4" /> : <span className="text-lg leading-none">🐨</span>}
                                </div>
                                <div className={cn(
                                    "px-4 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-sm",
                                    msg.role === "user"
                                        ? "bg-gray-800 text-white rounded-tr-none"
                                        : "bg-white border border-gray-200 text-gray-700 rounded-tl-none prose prose-sm prose-p:my-1 prose-ul:my-1"
                                )}>
                                    {msg.role === "assistant" ? (
                                        <div className="flex flex-col gap-2">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>

                                            {msg.hint && (
                                                <div className="text-[11px] text-gray-500 mt-1 italic font-mono bg-gray-100 p-1.5 rounded-md inline-block">
                                                    {msg.hint}
                                                </div>
                                            )}

                                            {msg.email_drafts && msg.email_drafts.length > 0 && (
                                                <div className="mt-3 flex flex-col gap-3">
                                                    {msg.email_drafts.map((draft, idx) => (
                                                        <div key={idx} className="border border-gray-200 rounded-xl p-3 bg-gray-50 relative group shadow-sm text-left">
                                                            <div className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Draft to {draft.to_name}</div>
                                                            <div className="text-sm font-semibold border-b border-gray-200 pb-1.5 mb-2 text-gray-800">Subject: {draft.subject}</div>
                                                            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-serif">{draft.body}</div>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
                                                                    showToast("Copied to clipboard!");
                                                                }}
                                                                className="absolute top-2 right-2 p-1.5 bg-white border border-gray-200 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                                                                title="Copy draft"
                                                            >
                                                                <Copy className="w-3.5 h-3.5 text-gray-600" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3 animate-pulse">
                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div className="px-4 py-3 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-tl-none flex flex-col gap-2 shadow-sm">
                                    <div className="h-2 w-24 bg-gray-200/60 rounded"></div>
                                    <div className="h-2 w-16 bg-gray-200/60 rounded delay-75"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="p-4 bg-white border-t border-gray-100 shrink-0 relative">
                {/* Toast Overlay */}
                {toastMsg && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2">
                        {toastMsg}
                    </div>
                )}

                {/* Quick Prompts */}
                {messages.length === 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                        {["Draft scheduling email", "Draft reminder", "Draft follow-up"].map((prompt) => (
                            <button
                                key={prompt}
                                onClick={() => setInput(prompt)}
                                className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors whitespace-nowrap"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}

                <form
                    className="relative flex items-center"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const textToSend = displayInput;
                        if (isListening) {
                            stop();
                            reset();
                        }
                        handleSend(textToSend);
                    }}
                >
                    <input
                        type="text"
                        value={displayInput}
                        onChange={e => {
                            setInput(e.target.value);
                            if (isListening) {
                                stop();
                                reset();
                            }
                        }}
                        placeholder={isListening ? "Listening..." : "Ask about your week..."}
                        className={cn(
                            "w-full pl-4 pr-24 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 transition-all font-medium",
                            isListening ? "placeholder:text-red-400" : "placeholder:text-gray-400"
                        )}
                        disabled={isLoading}
                    />
                    <div className="absolute right-2 flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => {
                                if (!isSupported) {
                                    showToast("Voice input isn't supported in this browser. Try Chrome.");
                                    return;
                                }
                                if (isListening) {
                                    stop();
                                } else {
                                    start();
                                }
                            }}
                            className={cn(
                                "p-2 rounded-lg transition-all relative",
                                isListening
                                    ? "text-red-500 bg-red-50 hover:bg-red-100"
                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                            )}
                            title="Voice input"
                        >
                            <Mic className="w-4 h-4" fill={isListening ? "currentColor" : "none"} />
                            {isListening && (
                                <span className="absolute inset-0 rounded-lg ring-2 ring-red-500/30 animate-pulse"></span>
                            )}
                        </button>
                        <button
                            type="submit"
                            disabled={!displayInput.trim() || isLoading}
                            className="p-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-gray-900 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
