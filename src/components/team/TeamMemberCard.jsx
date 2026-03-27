import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, Phone, MessageSquareText } from "lucide-react";

const roleLabels = {
  global_admin: "Global Admin",
  admin: "Administrator",
  user: "Technician",
};

const roleColors = {
  global_admin: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  user: "bg-emerald-100 text-emerald-700",
};

export default function TeamMemberCard({ member, onChat }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0 overflow-hidden">
            {member.profile_picture ? (
              <img src={member.profile_picture} alt={member.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-semibold text-amber-600">
                {member.full_name?.[0]?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold truncate">{member.full_name}</p>
              <Badge className={`${roleColors[member.role] || roleColors.user} text-xs font-medium border-0`}>
                {roleLabels[member.role] || member.role}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate mt-0.5">{member.email}</p>
            {member.specialization && (
              <p className="text-xs text-muted-foreground mt-1">{member.specialization}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-border">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onChat(member)}>
            <MessageCircle className="w-3.5 h-3.5" />
            Chat
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
            <a href={`mailto:${member.email}`}>
              <Mail className="w-3.5 h-3.5" />
              Email
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
            <a href={member.phone ? `sms:${member.phone}` : "#"} className={!member.phone ? "pointer-events-none opacity-40" : ""}>
              <MessageSquareText className="w-3.5 h-3.5" />
              Text
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
            <a href={member.phone ? `tel:${member.phone}` : "#"} className={!member.phone ? "pointer-events-none opacity-40" : ""}>
              <Phone className="w-3.5 h-3.5" />
              Call
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}