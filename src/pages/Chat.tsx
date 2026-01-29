import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Send, Sparkles, Bot, User, RefreshCw, AlertCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { useBiblicalChat } from "@/hooks/useBiblicalChat";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { ChatHistory } from "@/components/chat/ChatHistory";

const suggestedQuestions = [
  "O que significa João 3:16?",
  "Como posso crescer na fé?",
  "O que a Bíblia diz sobre ansiedade?",
  "Explique o Salmo 23",
  "Quem foi o apóstolo Paulo?",
  "O que é o fruto do Espírito?",
];

export default function Chat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, isLoading, error, sendMessage, clearMessages, setMessages } = useBiblicalChat();
  const [input, setInput] = useState("");

  const handleLoadHistory = (historyMessages: { role: "user" | "assistant"; content: string }[]) => {
    setMessages(historyMessages);
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  const handleSuggestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 glass safe-area-inset-top">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-sm leading-none">Zoe AI</h1>
                <p className="text-xs text-muted-foreground">Assistente Bíblico</p>
              </div>
            </div>
          </div>
          <ChatHistory 
            onSelectHistory={handleLoadHistory} 
            currentMessages={messages} 
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9"
            onClick={clearMessages}
            title="Nova conversa"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-col h-[calc(100vh-56px-80px)] max-w-lg mx-auto">
        {/* Login Notice */}
        {!user && (
          <div className="px-4 pt-3">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <button 
                  onClick={() => navigate("/auth")}
                  className="text-primary font-medium hover:underline"
                >
                  Faça login
                </button>
                {" "}para ter acesso completo ao assistente bíblico.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((message, index) => {
            const isStreamingPlaceholder =
              isLoading &&
              index === messages.length - 1 &&
              message.role === "assistant" &&
              message.content.trim() === "";

            // Evita renderizar um balão vazio enquanto o streaming está começando
            if (isStreamingPlaceholder) return null;

            return (
              <div
                key={index}
                className={cn(
                  "flex gap-3 animate-fade-in",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                message.role === "assistant" 
                  ? "bg-gradient-to-br from-primary to-secondary" 
                  : "bg-muted"
              )}>
                {message.role === "assistant" ? (
                  <Bot className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              
              <div className={cn(
                "max-w-[80%] p-3 rounded-2xl",
                message.role === "assistant" 
                  ? "bg-muted rounded-tl-sm" 
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              )}>
                {message.role === "assistant" ? (
                  <MarkdownRenderer content={message.content} className="text-sm" />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
              </div>
            );
          })}

          {isLoading && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content.trim() === "" && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="bg-muted p-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-pulse" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-pulse" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="px-4 pb-3">
            <p className="text-xs text-muted-foreground mb-2">Sugestões:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSuggestion(question)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 glass border-t border-border">
          <div className="flex gap-2 max-w-lg mx-auto">
            <Input
              placeholder="Digite sua pergunta bíblica..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                if (e.shiftKey) return;
                if (e.repeat) return;
                e.preventDefault();
                e.stopPropagation();
                handleSend();
              }}
              className="flex-1 bg-muted/50 border-0"
              disabled={isLoading}
            />
            <Button 
              size="icon" 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </>
  );
}
