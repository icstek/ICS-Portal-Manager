import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function NoteItem({ note, userRole, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const date = note.created_date
    ? format(new Date(note.created_date), "MMM d, yyyy \u00b7 h:mm:ss a")
    : "";

  const handleDelete = async () => {
    setDeleting(true);
    await base44.entities.TechNote.delete(note.id);
    toast.success("Note deleted");
    onDelete?.();
  };

  return (
    <div className="border rounded-lg p-3 bg-muted/30">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">{note.author_name || "Unknown"}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">{date}</span>
          {userRole === "global_admin" && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" disabled={deleting} onClick={handleDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap">{note.message}</p>
    </div>
  );
}