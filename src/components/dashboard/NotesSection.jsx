import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StickyNote, Plus } from "lucide-react";
import NoteDialog from "./NoteDialog";
import NoteItem from "./NoteItem";

export default function NotesSection({ user }) {
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: notes = [] } = useQuery({
    queryKey: ["techNotes"],
    queryFn: () => base44.entities.TechNote.list("-created_date", 50),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-amber-500" /> Notes
        </CardTitle>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowDialog(true)}>
          <Plus className="w-3.5 h-3.5" /> New Note
        </Button>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No notes yet.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {notes.map((note) => (
              <NoteItem key={note.id} note={note} />
            ))}
          </div>
        )}
      </CardContent>

      <NoteDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        user={user}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["techNotes"] })}
      />
    </Card>
  );
}