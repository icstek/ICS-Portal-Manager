import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare } from "lucide-react";
import { format } from "date-fns";

const GENERAL_CHAT_KEY = "__general__";

export default function GeneralChat() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["general-chat"],
    queryFn: () => base44.entities.TeamMessage.filter({ chat_key: GENERAL_CHAT_KEY }, "-created_date", 100),
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (text) =>
      base44.entities.TeamMessage.create({
        chat_key: GENERAL_CHAT_KEY,
        sender_email: user.email,
        sender_name: user.full_name,
        recipient_email: GENERAL_CHAT_KEY,
        text,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["general-chat"] });
      setMessage("");
    },
  });

  const sortedMessages = [...messages].reverse();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages.length]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  };

  return (
    <div className="border border-border rounded-xl bg-card flex flex-col h-[400px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <MessageSquare className="w-4 h-4 text-primary" />
        <p className="font-semibold text-sm">General Chat</p>
        <span className="text-xs text-muted-foreground ml-1">Everyone</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedMessages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          sortedMessages.map((msg) => {
            const isMe = msg.sender_email === user?.email;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${isMe ? "" : ""}`}>
                  {!isMe && (
                    <p className="text-[11px] font-medium text-muted-foreground mb-0.5 ml-1">
                      {msg.sender_name}
                    </p>
                  )}
                  <div
                    className={`rounded-2xl px-3.5 py-2 ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {format(new Date(msg.created_date), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Message the team..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!message.trim() || sendMutation.isPending}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}