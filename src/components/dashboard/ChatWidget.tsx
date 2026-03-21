"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiPostJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Send,
  Bot,
  User,
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
                  className={`p-2.5 rounded-lg text-sm shadow-sm overflow-hidden ${m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted/50 border rounded-tl-none"}`}
                >
                  {m.role === "user" ? (
                    m.content
                  ) : (
                    <div className="text-sm break-words [&>p]:mb-2 [&>p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_li]:mb-1 [&_strong]:font-bold [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mb-1 [&_table]:w-full [&_table]:border-collapse [&_table]:mb-3 [&_th]:border [&_th]:border-border/50 [&_th]:p-1.5 [&_th]:bg-muted/50 [&_td]:border [&_td]:border-border/50 [&_td]:p-1.5 [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_code]:font-mono [&_code]:text-xs [&_a]:text-blue-500 [&_a]:underline">
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
