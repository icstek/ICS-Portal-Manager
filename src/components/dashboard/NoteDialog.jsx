import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function NoteDialog({ open, onOpenChange, user, onSuccess }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({ title: "Please write a note before submitting", variant: "destructive" });
      return;
    }

    setSending(true);
    const authorName = user?.full_name || user?.email || "Unknown";

    // Save the note
    await base44.entities.TechNote.create({
      author_name: authorName,
      author_email: user?.email || "",
      message: message.trim(),
    });

    // Email the note
    await base44.functions.invoke("sendTechNote", {
      message: message.trim(),
      authorName,
    });

    setSending(false);
    toast({ title: "Note submitted and emailed" });
    setMessage("");
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Note to Admin</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            From: <span className="font-medium text-foreground">{user?.full_name || user?.email || "—"}</span>
          </p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your note here..."
            className="min-h-[120px]"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={sending} className="gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}