import { useState } from "react";
import { useFbProfiles, useCreateFbProfile } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TimelineDrawer from "@/components/TimelineDrawer";
import { differenceInDays } from "date-fns";
import { motion } from "framer-motion";

const statusConfig: Record<string, { label: string; dotClass: string }> = {
  ativo: { label: "Ativo", dotClass: "status-active" },
  analise: { label: "Em Análise", dotClass: "status-analysis" },
  bloqueado: { label: "Bloqueado", dotClass: "status-blocked" },
};

const Profiles = () => {
  const { data: profiles, isLoading } = useFbProfiles();
  const createProfile = useCreateFbProfile();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [timeline, setTimeline] = useState<{ id: string; name: string } | null>(null);

  // Create form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newStatus, setNewStatus] = useState<string>("analise");
  const [newRole, setNewRole] = useState<string>("anunciante");
  const [newDateReceived, setNewDateReceived] = useState("");

  const filtered = profiles?.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  }) || [];

  const handleCreate = async () => {
    try {
      await createProfile.mutateAsync({
        name: newName,
        email_login: newEmail || null,
        profile_link: newLink || null,
        status: newStatus as any,
        role_in_bm: newRole as any,
        date_received: newDateReceived || null,
        date_blocked: null,
      });
      toast({ title: "Perfil criado!" });
      setShowCreate(false);
      setNewName(""); setNewEmail(""); setNewLink(""); setNewDateReceived("");
    } catch {
      toast({ title: "Erro ao criar perfil", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Perfis Facebook</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {profiles?.length || 0} perfis cadastrados
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Perfil
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar perfil..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="analise">Em Análise</SelectItem>
            <SelectItem value="bloqueado">Bloqueado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((profile, i) => {
            const cfg = statusConfig[profile.status] || { label: profile.status, dotClass: "" };
            const daysActive = profile.date_received
              ? differenceInDays(new Date(), new Date(profile.date_received))
              : null;
            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all"
                  onClick={() => setTimeline({ id: profile.id, name: profile.name })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{profile.name}</p>
                          <p className="text-xs text-muted-foreground">{profile.email_login || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`status-dot ${cfg.dotClass}`} />
                        <span className="text-xs text-muted-foreground">{cfg.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{profile.role_in_bm === "administrador" ? "Admin" : "Anunciante"}</span>
                      {daysActive !== null && <span>{daysActive} dias ativo</span>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do perfil" />
            </div>
            <div className="space-y-2">
              <Label>Email de Login</Label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Link do Perfil</Label>
              <Input value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="analise">Em Análise</SelectItem>
                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cargo na BM</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="anunciante">Anunciante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data de Recebimento</Label>
              <Input type="date" value={newDateReceived} onChange={(e) => setNewDateReceived(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!newName || createProfile.isPending}>
              {createProfile.isPending ? "Criando..." : "Criar Perfil"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {timeline && (
        <TimelineDrawer
          entityType="profile"
          entityId={timeline.id}
          entityName={timeline.name}
          onClose={() => setTimeline(null)}
        />
      )}
    </div>
  );
};

export default Profiles;
