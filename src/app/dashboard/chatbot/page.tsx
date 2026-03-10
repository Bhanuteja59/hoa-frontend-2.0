"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { apiPostJson, apiPostMultipart } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Upload, Bot, User, Loader2, Paperclip, Minimize2, PanelLeft } from "lucide-react";
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
    const [uploading, setUploading] = useState(false);
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

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);
            return apiPostMultipart("/chatbot/upload", formData);
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Document uploaded to knowledge base." });
            setUploading(false);
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to upload document.", variant: "destructive" });
            setUploading(false);
        }
    });

    const handleSend = () => {
        if (!input.trim()) return;
        const msg = input;
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: msg }]);
        chatMutation.mutate(msg);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setUploading(true);
            uploadMutation.mutate(e.target.files[0]);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4 gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">AI Assistant</h2>
                    <p className="text-muted-foreground">Ask questions about your community.</p>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" disabled={uploading} className="relative overflow-hidden">
                            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            {uploading ? "Uploading..." : "Upload Knowledge"}
                            <Input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                accept=".pdf,.txt"
                            />
                        </Button>
                    </div>
                )}
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden bg-muted/20">
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border shadow-sm'}`}>
                                    {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                                </div>
                                <div className={`p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border shadow-sm'}`}>
                                    {m.content}
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
