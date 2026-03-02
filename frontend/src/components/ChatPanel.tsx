import { useState, useRef, useEffect } from "react";
import { UserContext, ChatMessage } from "../types";
import { Send, User, Sparkles, Copy, Mic } from "lucide-react";
import { cn } from "../lib/utils";
import ReactMarkdown from 'react-markdown';
import { useSpeechRecognition } from "../lib/hooks/useSpeechRecognition";

const QUICK_PROMPTS = [
    {
        label: "Draft a reminder",
        value: "Write me a reminder email for an upcoming meeting."
    },
    {
        label: "Time spent in meetings?",
        value: "How much of my time am I spending in meetings? How can I reduce that?"
    },
    {
        label: "Give me a quick brief of my day",
        value: "Give me a quick brief of my day and highlight anything important."
    }
];

interface ChatPanelProps {
    user: UserContext | null;
    onEventCreated?: () => void;
    onDraftEventReady?: (data: any) => void;
}

export function ChatPanel({ user, onEventCreated, onDraftEventReady }: ChatPanelProps) {
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
            const { sendChatMessage } = await import("../lib/api");
            const data = await sendChatMessage(text);
            const assistantMsg = {
                id: (Date.now() + 1).toString(),
                role: "assistant" as const,
                content: data.reply || data.assistant_message || "Done.",
                ...data
            };

            setMessages(prev => [...prev, assistantMsg]);

            if (assistantMsg.ui_actions?.open_create_event_modal && onDraftEventReady) {
                onDraftEventReady(assistantMsg.draft_event);
            }
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
        <div className="flex flex-col h-full relative bg-black/95 backdrop-blur-xl border-l border-white/10">
            <div className="flex items-center gap-3 p-4 border-b border-white/10 shrink-0 bg-white/5 backdrop-blur-lg shadow-sm">
                <img src="https://img.freepik.com/premium-psd/png-creative-animal-outlines-captivating-artwork-celebrating-natures-diverse-wildlife_1020495-452671.jpg?semt=ais_hybrid&w=740&q=80" alt="Koala" className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-md" />
                <h2 className="text-lg font-semibold text-white tracking-tight">Koala</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 mt-[-10%]">
                        <div className="w-40 h-40 md:w-48 md:h-48 rounded-full flex items-center justify-center mb-8 shadow-2xl border-2 border-white/20 bg-white/10 overflow-hidden backdrop-blur-md">
                            <img src="https://img.freepik.com/premium-psd/png-creative-animal-outlines-captivating-artwork-celebrating-natures-diverse-wildlife_1020495-452671.jpg?semt=ais_hybrid&w=740&q=80" alt="Koala" className="w-full h-full object-cover scale-110" />
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">
                            Hello{defaultName ? `, ${defaultName}` : ''}
                        </h1>
                        <p className="text-gray-400 font-medium text-sm">
                            I'm Koala, a smart assistant for the lazy.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 mx-auto w-full max-w-[280px]">
                            {QUICK_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt.label}
                                    onClick={() => {
                                        if (!input.trim()) {
                                            setInput(prompt.value);
                                        } else {
                                            setInput(prev => prev + " " + prompt.value);
                                        }
                                    }}
                                    className="text-sm px-4 py-3 text-left rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 text-gray-300 transition-all cursor-pointer shadow-sm backdrop-blur-md font-medium"
                                >
                                    {prompt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map(msg => (
                            <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden",
                                    msg.role === "user" ? "bg-white/10 text-white shadow-sm" : "bg-black shadow-lg border border-white/20 backdrop-blur-sm"
                                )}>
                                    {msg.role === "user" ? <User className="w-5 h-5" /> : <img src="https://img.freepik.com/premium-psd/png-creative-animal-outlines-captivating-artwork-celebrating-natures-diverse-wildlife_1020495-452671.jpg?semt=ais_hybrid&w=740&q=80" alt="Koala" className="w-full h-full object-cover scale-110" />}
                                </div>
                                <div className={cn(
                                    "px-4 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-sm backdrop-blur-md border",
                                    msg.role === "user"
                                        ? "bg-white/10 border-white/20 text-white rounded-tr-none"
                                        : "bg-black/60 border-white/10 text-gray-200 rounded-tl-none prose-invert prose prose-sm prose-p:my-1 prose-ul:my-1"
                                )}>
                                    {msg.role === "assistant" ? (
                                        <div className="flex flex-col gap-2">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>

                                            {msg.recommendations && msg.recommendations.length > 0 && (
                                                <div className="mt-3 bg-white/5 rounded-xl p-3 border border-white/10">
                                                    <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Recommendations</div>
                                                    <ul className="list-disc pl-4 space-y-1.5 text-sm text-gray-300 font-medium">
                                                        {msg.recommendations.map((rec, i) => (
                                                            <li key={i}>{rec}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {msg.hint && (
                                                <div className="text-[11px] text-gray-500 mt-1 italic font-mono bg-gray-100 p-1.5 rounded-md inline-block">
                                                    {msg.hint}
                                                </div>
                                            )}

                                            {msg.email_drafts && msg.email_drafts.length > 0 && (
                                                <div className="mt-3 flex flex-col gap-3">
                                                    {msg.email_drafts.map((draft, idx) => (
                                                        <div key={idx} className="border border-white/10 rounded-xl p-3 bg-white/5 relative group shadow-sm text-left">
                                                            <div className="text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Draft to {draft.to_name}</div>
                                                            <div className="text-sm font-semibold border-b border-white/10 pb-1.5 mb-2 text-white">Subject: {draft.subject}</div>
                                                            <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-serif">{draft.body}</div>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
                                                                    showToast("Copied to clipboard!");
                                                                }}
                                                                className="absolute top-2 right-2 p-1.5 bg-white/10 border border-white/20 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 text-white"
                                                                title="Copy draft"
                                                            >
                                                                <Copy className="w-3.5 h-3.5" />
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
                                <div className="w-10 h-10 rounded-full bg-white/10 text-gray-400 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 rounded-tl-none flex flex-col gap-2 shadow-sm">
                                    <div className="h-2 w-24 bg-white/20 rounded"></div>
                                    <div className="h-2 w-16 bg-white/20 rounded delay-75"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="p-4 bg-white/5 backdrop-blur-lg border-t border-white/10 shrink-0 relative">
                {/* Toast Overlay */}
                {toastMsg && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2">
                        {toastMsg}
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
                            "w-full pl-4 pr-24 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all font-medium shadow-sm placeholder:text-gray-400",
                            isListening && "placeholder:text-red-400"
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
                                    ? "text-red-400 bg-red-500/20 hover:bg-red-500/30"
                                    : "text-gray-400 hover:text-white hover:bg-white/10"
                            )}
                            title="Voice input"
                        >
                            <Mic className="w-4 h-4" fill={isListening ? "currentColor" : "none"} />
                            {isListening && (
                                <span className="absolute inset-0 rounded-lg ring-2 ring-red-500/50 animate-pulse"></span>
                            )}
                        </button>
                        <button
                            type="submit"
                            disabled={!displayInput.trim() || isLoading}
                            className="p-1.5 bg-white text-black rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

