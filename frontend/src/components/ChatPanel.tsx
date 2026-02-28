import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { sendChatMessage } from "../lib/api";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";
import ReactMarkdown from 'react-markdown';

const QUICK_PROMPTS = [
    "Time in meetings",
    "Time in fitness",
    "Reduce meetings",
    "Protect mornings"
];

export function ChatPanel() {
    const [messages, setMessages] = useState<ChatMessage[]>([{
        id: "welcome",
        role: "assistant",
        content: "Hi! I'm Cora, your Co-Calendar assistant. Ask me about your week or how to optimize your schedule."
    }]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
            const reply = await sendChatMessage(text);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: reply
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
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold text-gray-800 tracking-tight">Cora</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map(msg => (
                    <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            msg.role === "user" ? "bg-gray-800 text-white" : "bg-purple-100 text-purple-700"
                        )}>
                            {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                        </div>
                        <div className={cn(
                            "px-4 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-sm",
                            msg.role === "user"
                                ? "bg-gray-800 text-white rounded-tr-none"
                                : "bg-white border border-gray-200 text-gray-700 rounded-tl-none prose prose-sm prose-p:my-1 prose-ul:my-1"
                        )}>
                            {msg.role === "assistant" ? (
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            ) : (
                                msg.content
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-50 to-white border border-purple-100 rounded-tl-none flex flex-col gap-2 shadow-sm">
                            <div className="h-2 w-24 bg-purple-200/60 rounded"></div>
                            <div className="h-2 w-16 bg-purple-200/60 rounded delay-75"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                <div className="flex flex-wrap gap-2 mb-3">
                    {QUICK_PROMPTS.map(p => (
                        <button
                            key={p}
                            onClick={() => handleSend(p)}
                            className="text-xs font-medium px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-full hover:bg-gray-100 transition-colors whitespace-nowrap"
                        >
                            {p}
                        </button>
                    ))}
                </div>

                <form
                    className="relative flex items-center"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend(input);
                    }}
                >
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask about your week..."
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium placeholder:text-gray-400"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
