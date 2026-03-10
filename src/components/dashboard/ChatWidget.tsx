"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { apiPostJson, apiPostMultipart } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Send,
  Upload,
  Bot,
  User,
  Loader2,
  MessageCircle,
  X,
  Minimize2,
  Paperclip,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatWidget() {
  const { data: session }: any = useSession();
  const isAdmin = session?.roles?.includes("ADMIN");
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your community AI assistant. Ask me about the documents.",
    },
  ]);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const chatMutation = useMutation({
    mutationFn: async (payload: { message: string; history: Message[] }) => {
      const { message, history } = payload;
      // Filter out empty or system messages if needed, keeping last 6
      const historyToSend = history.slice(-6);
      return apiPostJson<any>("/chatbot/chat", { message, history: historyToSend });
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now.",
        },
      ]);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiPostMultipart("/chatbot/upload", formData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document uploaded to knowledge base.",
      });
      setUploading(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload document.",
        variant: "destructive",
      });
      setUploading(false);
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;
    const msg = input;
    setInput("");
    const newHistory = [...messages, { role: "user", content: msg } as const];
    setMessages(newHistory);
    // Send history excluding the just-added message? No, backend usually wants context up to Now.
    // Actually, usually "history" excludes the *current* question.
    // So we pass 'messages' (current state before update) as history.
    chatMutation.mutate({ message: msg, history: messages });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setUploading(true);
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-110"
          size="icon"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] h-[500px] p-0 mr-6 mb-2 flex flex-col shadow-2xl border-border/50 rounded-xl overflow-hidden"
        side="top"
        align="end"
      >
        <div className="flex items-center justify-between p-4 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              <p className="text-[10px] text-muted-foreground">
                Ask me anything
              </p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={uploading}
                className="h-8 w-8 relative"
                title="Upload Knowledge"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
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

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex gap-2 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border"}`}
                >
                  {m.role === "user" ? (
                    <User className="h-3 w-3" />
                  ) : (
                    <Bot className="h-3 w-3" />
                  )}
                </div>
                <div
                  className={`p-2.5 rounded-lg text-sm shadow-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted/50 border rounded-tl-none"}`}
                >
                  {m.content}
                </div>
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="flex gap-2 max-w-[85%]">
                <div className="h-6 w-6 rounded-full bg-muted border flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-3 w-3" />
                </div>
                <div className="bg-muted/50 border p-2.5 rounded-lg text-sm rounded-tl-none flex items-center">
                  <div className="flex gap-1 items-center h-4">
                    <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t bg-muted/20">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={chatMutation.isPending}
              className="h-10 text-sm"
              autoFocus
            />
            <Button
              type="submit"
              size="icon"
              disabled={chatMutation.isPending || !input.trim()}
              className="h-10 w-10 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}
