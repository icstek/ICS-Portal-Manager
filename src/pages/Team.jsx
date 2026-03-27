import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import TeamMemberCard from "@/components/team/TeamMemberCard";
import TeamChat from "@/components/team/TeamChat";

export default function Team() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [chatMember, setChatMember] = useState(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getTeamMembers", {});
      return res.data.team;
    },
  });

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-inter tracking-tight">Team</h1>
          <p className="text-muted-foreground text-sm mt-1">{members.length} members</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mb-3" />
          <p>{search ? "No matching team members" : "No team members yet"}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <TeamMemberCard
              key={m.id}
              member={m}
              onChat={(member) => setChatMember(member)}
            />
          ))}
        </div>
      )}

      {/* Chat Drawer */}
      {chatMember && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-card border-l border-border shadow-xl z-50 flex flex-col">
          <TeamChat member={chatMember} onClose={() => setChatMember(null)} />
        </div>
      )}
    </div>
  );
}