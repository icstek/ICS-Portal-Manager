import { format } from "date-fns";

export default function NoteItem({ note }) {
  const date = note.created_date
    ? format(new Date(note.created_date), "MMM d, yyyy · h:mm a")
    : "";

  return (
    <div className="border rounded-lg p-3 bg-muted/30">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">{note.author_name || "Unknown"}</span>
        <span className="text-[11px] text-muted-foreground">{date}</span>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap">{note.message}</p>
    </div>
  );
}