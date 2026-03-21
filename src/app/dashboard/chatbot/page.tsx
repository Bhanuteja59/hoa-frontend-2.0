"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiPostJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Bot, User, Paperclip, Minimize2, PanelLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Message = {
    role: "user" | "assistant";
    content: string;
};

export default function ChatbotPage() {
    const { data: session }: any = useSession();
    const isAdmin = session?.roles?.includes("ADMIN");
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! I am your community AI assistant. Ask me about the documents." }
    ]);
    const [input, setInput] = useState("");

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const chatMutation = useMutation({
        mutationFn: async (message: string) => {
            return apiPostJson<any>("/chatbot/chat", { message });
        },
        onSuccess: (data) => {
            setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        },
        onError: () => {
            setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting right now." }]);
        }
    });


    const handleSend = () => {
        if (!input.trim()) return;
        const msg = input;
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: msg }]);
        chatMutation.mutate(msg);
    };


    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4 gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">AI Assistant</h2>
                    <p className="text-muted-foreground">Ask questions about your community.</p>
                </div>

            </div>

            <Card className="flex-1 flex flex-col overflow-hidden bg-muted/20">
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border shadow-sm'}`}>
                                    {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                                </div>
                                <div className={`p-3 rounded-lg text-sm overflow-hidden ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border shadow-sm'}`}>
                                    {m.role === "user" ? (
                                        m.content
                                    ) : (
                                        <div className="text-sm break-words [&>p]:mb-2 [&>p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_li]:mb-1 [&_strong]:font-bold [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mb-1 [&_table]:w-full [&_table]:border-collapse [&_table]:mb-3 [&_th]:border [&_th]:p-2 [&_th]:bg-muted/50 [&_td]:border [&_td]:p-2 [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_code]:font-mono [&_code]:text-xs [&_a]:text-blue-500 [&_a]:underline">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {m.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {chatMutation.isPending && (
                        <div className="flex justify-start">
                            <div className="flex gap-3 max-w-[80%]">
                                <div className="h-8 w-8 rounded-full bg-background border shadow-sm flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4 text-primary" />
                                </div>
                                <div className="bg-background border shadow-sm p-3 rounded-lg text-sm flex items-center">
                                    <span className="animate-pulse">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>
                <div className="p-4 bg-background border-t">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex gap-2"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            disabled={chatMutation.isPending}
                        />
                        <Button type="submit" disabled={chatMutation.isPending || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}
