import { useState, useEffect } from "react";
import { useFbProfiles, useCreateFbProfile, useBms } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, User, Edit2, Building2, Trash2, Clock, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";
import { motion } from "framer-motion";
import EditFbProfileModal from "@/components/EditFbProfileModal";
import AssetDetailModal from "@/components/AssetDetailModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { FbProfile } from "@/hooks/useData";

const statusConfig: Record<string, { label: string; dotClass: string }> = {
  ativo: { label: "Ativo", dotClass: "status-active" },
  analise: { label: "Em Análise", dotClass: "status-analysis" },
  bloqueado: { label: "Bloqueado", dotClass: "status-blocked" },
};

const Profiles = () => {
  const { data: profiles, isLoading } = useFbProfiles();
  const createProfile = useCreateFbProfile();
  const { data: bms } = useBms();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<FbProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<FbProfile | null>(null);

  // Create form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newStatus, setNewStatus] = useState<string>("analise");
  const [newDateReceived, setNewDateReceived] = useState("");
  const [newDateBlocked, setNewDateBlocked] = useState("");
  const [bmLinks, setBmLinks] = useState<{ bm_id: string; role_in_bm: string }[]>([]);

  useEffect(() => {
    if (newStatus === "bloqueado" && !newDateBlocked) {
      setNewDateBlocked(new Date().toISOString().split("T")[0]);
    }
  }, [newStatus]);

  const filtered = profiles?.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  }) || [];

  const handleCreate = async () => {
    try {
      if (bmLinks.some(l => !l.bm_id)) {
        toast({ title: "Selecione a BM em todos os vínculos", variant: "destructive" });
        return;
      }

      await createProfile.mutateAsync({
        profile: {
          name: newName,
          email_login: newEmail || null,
          profile_link: newLink || null,
          status: newStatus as any,
          date_received: newDateReceived || null,
          date_blocked: newStatus === "bloqueado" ? newDateBlocked || null : null,
        },
        bmLinks: bmLinks.length > 0 ? bmLinks : undefined,
      });
      toast({ title: "Perfil criado!" });
      setShowCreate(false);
      resetForm();
    } catch {
      toast({ title: "Erro ao criar perfil", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setNewName("");
    setNewEmail("");
    setNewLink("");
    setNewStatus("analise");
    setNewDateReceived("");
    setNewDateBlocked("");
    setBmLinks([]);
  };

  const addBmLink = () => {
    setBmLinks([...bmLinks, { bm_id: "", role_in_bm: "anunciante" }]);
  };

  const removeBmLink = (index: number) => {
    setBmLinks(bmLinks.filter((_, i) => i !== index));
  };

  const updateBmLink = (index: number, field: "bm_id" | "role_in_bm", value: string) => {
    const next = [...bmLinks];
    next[index] = { ...next[index], [field]: value };
    setBmLinks(next);
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
                  className="cursor-pointer group hover:ring-1 hover:ring-primary/30 transition-all shadow-sm hover:shadow-md"
                  onClick={() => setSelectedProfile(profile)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm leading-tight">{profile.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[140px]">{profile.email_login || "—"}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div
                          className="p-1 hover:bg-muted rounded-md transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProfile(profile);
                          }}
                        >
                          <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-full">
                          <span className={`status-dot ${cfg.dotClass}`} />
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">{cfg.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-muted/50">
                      {daysActive !== null && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{daysActive} dias</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Dialog open={showCreate} onOpenChange={(v) => { setShowCreate(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label>Status Geral</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="analise">Em Análise</SelectItem>
                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data de Recebimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal h-9",
                        !newDateReceived && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newDateReceived ? format(new Date(newDateReceived), "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newDateReceived ? new Date(newDateReceived) : undefined}
                      onSelect={(date) => setNewDateReceived(date ? date.toISOString().split('T')[0] : "")}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {newStatus === "bloqueado" && (
                <div className="space-y-2">
                  <Label>Data de Bloqueio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-9",
                          !newDateBlocked && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newDateBlocked ? format(new Date(newDateBlocked), "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newDateBlocked ? new Date(newDateBlocked) : undefined}
                        onSelect={(date) => setNewDateBlocked(date ? date.toISOString().split('T')[0] : "")}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Vínculo com BMs (opcional)</Label>
                <Button type="button" variant="ghost" size="sm" className="h-8 text-primary" onClick={addBmLink}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add BM
                </Button>
              </div>

              {bmLinks.map((link, index) => (
                <div key={index} className="flex gap-2 items-end bg-muted/40 p-2 rounded-md border text-xs">
                  <div className="flex-1 space-y-1">
                    <Select value={link.bm_id} onValueChange={(v) => updateBmLink(index, "bm_id", v)}>
                      <SelectTrigger className="h-8 py-0"><SelectValue placeholder="BM..." /></SelectTrigger>
                      <SelectContent>
                        {bms?.map((bm: any) => (
                          <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1">
                    <Select value={link.role_in_bm} onValueChange={(v) => updateBmLink(index, "role_in_bm", v)}>
                      <SelectTrigger className="h-8 py-0"><SelectValue placeholder="Cargo..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="administrador">Admin</SelectItem>
                        <SelectItem value="anunciante">Anunciante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeBmLink(index)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <Button className="w-full" onClick={handleCreate} disabled={!newName || createProfile.isPending}>
              {createProfile.isPending ? "Criando..." : "Criar Perfil"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedProfile && (
        <AssetDetailModal
          asset={{
            id: selectedProfile.id,
            name: selectedProfile.name,
            type: "perfil",
            status: selectedProfile.status,
            details: selectedProfile.email_login || "—",
            originalData: selectedProfile,
            created_at: selectedProfile.created_at
          }}
          onClose={() => setSelectedProfile(null)}
        />
      )}

      {editingProfile && (
        <EditFbProfileModal
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
        />
      )}
    </div>
  );
};

export default Profiles;
