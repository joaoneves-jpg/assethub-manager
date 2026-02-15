import { useState, useEffect, useMemo } from "react";
import { useFbProfiles, useCreateFbProfile, useBms } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, User, Edit2, Building2, Trash2, Clock, Calendar as CalendarIcon, Copy, Ban, ShieldAlert, CheckCircle2, LayoutGrid, List, MoreVertical, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import AssetDetailModal from "@/components/AssetDetailModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { FbProfile } from "@/hooks/useData";
import { FacetedFilter } from "@/components/FacetedFilter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusConfig: Record<string, { label: string; dotClass: string; icon: any; color: string; bgColor: string; borderColor: string }> = {
  ativo: {
    label: "Ativo",
    dotClass: "bg-emerald-500",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20"
  },
  analise: {
    label: "Em Análise",
    dotClass: "bg-amber-500",
    icon: ShieldAlert,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20"
  },
  bloqueado: {
    label: "Bloqueado",
    dotClass: "bg-rose-500",
    icon: Ban,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20"
  },
};

const Profiles = () => {
  const { data: profiles, isLoading } = useFbProfiles();
  const createProfile = useCreateFbProfile();
  const { data: bms } = useBms();
  const { toast } = useToast();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<FbProfile | null>(null);

  const currentSelectedProfile = useMemo(() => {
    if (!selectedProfile) return null;
    return profiles?.find(p => p.id === selectedProfile.id) || null;
  }, [profiles, selectedProfile]);

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
    const searchLower = search.toLowerCase();
    const nameMatch = p.name.toLowerCase().includes(searchLower);
    const emailMatch = p.email_login?.toLowerCase().includes(searchLower);
    if (search && !nameMatch && !emailMatch) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  }) || [];

  const stats = {
    total: profiles?.length || 0,
    analysis: profiles?.filter(p => p.status === "analise").length || 0,
    blocked: profiles?.filter(p => p.status === "bloqueado").length || 0,
  };

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast({ title: "Email copiado!" });
  };

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
    <div className="p-8 space-y-10 bg-zinc-950 min-h-screen text-zinc-100 uppercase-badges">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Perfis Facebook</h1>
          <p className="text-sm text-zinc-500">
            Gerencie identidades, logins e contas de aquecimento do seu time
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex">
                <Button
                  onClick={() => setShowCreate(true)}
                  disabled={!user?.teamId}
                  className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 shadow-xl shadow-white/5"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Perfil
                </Button>
              </div>
            </TooltipTrigger>
            {!user?.teamId && (
              <TooltipContent>
                Você precisa estar em um time para cadastrar perfis
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total de Perfis", value: stats.total, icon: User, color: "text-zinc-400", bg: "bg-zinc-900/40" },
          { label: "Em Análise", value: stats.analysis, icon: ShieldAlert, color: "text-amber-500", bg: "bg-amber-500/5" },
          { label: "Bloqueados", value: stats.blocked, icon: Ban, color: "text-rose-500", bg: "bg-rose-500/5" },
        ].map((stat, i) => (
          <Card key={i} className={cn("border-zinc-800/50 backdrop-blur-sm overflow-hidden relative group", stat.bg)}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 flex items-center gap-5 relative">
              <div className={cn("h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-transform group-hover:scale-110", stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tighter tabular-nums">{stat.value}</p>
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-zinc-200"
            />
          </div>
          <FacetedFilter
            title="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "Ativo", value: "ativo", icon: CheckCircle2 },
              { label: "Em Análise", value: "analise", icon: ShieldAlert },
              { label: "Bloqueado", value: "bloqueado", icon: Ban },
            ]}
            counts={{
              ativo: profiles?.filter(p => p.status === "ativo").length || 0,
              analise: stats.analysis,
              bloqueado: stats.blocked,
            }}
          />
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-8 px-3 gap-2", viewMode === "grid" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500")}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Grid</span>
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-8 px-3 gap-2", viewMode === "list" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500")}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Lista</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-56 rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800/50" />)}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((profile, i) => {
              const cfg = statusConfig[profile.status] || statusConfig.analise;
              const daysActive = profile.date_received
                ? differenceInDays(new Date(), new Date(profile.date_received))
                : 0;

              return (
                <motion.div
                  key={profile.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                >
                  <Card
                    className="group relative overflow-hidden bg-zinc-900 border-zinc-800/80 hover:border-zinc-700 transition-all duration-300 cursor-pointer shadow-2xl hover:shadow-primary/5 rounded-2xl border-t-2 border-t-zinc-800"
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <div className="absolute top-0 right-0 p-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className={cn(
                              "h-6 px-2.5 capitalize font-black text-[9px] tracking-widest border shadow-xl backdrop-blur-md",
                              cfg.bgColor, cfg.color, cfg.borderColor
                            )}>
                              <cfg.icon className="h-3 w-3 mr-1.5" />
                              {cfg.label}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                            {profile.status === "bloqueado" && profile.date_blocked
                              ? `Bloqueado em ${format(new Date(profile.date_blocked), "dd/MM/yyyy")}`
                              : `Perfil ativo em estado de ${cfg.label.toLowerCase()}`}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <CardContent className="p-0">
                      {/* Identity Header */}
                      <div className="p-6 pb-4 flex items-center gap-5">
                        <div className="relative group/avatar">
                          <Avatar className="h-16 w-16 ring-4 ring-zinc-950 border border-zinc-800 group-hover:border-zinc-700 transition-all shadow-2xl">
                            <AvatarFallback className="bg-zinc-800 text-zinc-500 font-black text-xl tracking-tighter">
                              {profile.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute bottom-0 right-0 h-4 w-4 rounded-full border-[3px] border-zinc-900 shadow-lg",
                            cfg.dotClass
                          )} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-bold text-zinc-100 truncate group-hover:text-zinc-50 transition-colors tracking-tight">
                            {profile.name}
                          </h3>
                          {profile.email_login && (
                            <div className="flex items-center gap-2 group/email mt-1">
                              <p className="text-[11px] text-zinc-500 font-mono truncate max-w-[150px]">{profile.email_login}</p>
                              <button
                                onClick={(e) => copyToClipboard(profile.email_login!, e)}
                                className="opacity-0 group-hover/email:opacity-100 p-1 hover:bg-zinc-800 rounded-md transition-all text-zinc-500 hover:text-zinc-300"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-6 py-4 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Tempo de uso</p>
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Clock className="h-3.5 w-3.5 text-zinc-500" />
                            <span className="text-xs font-bold font-mono">{daysActive} Dias</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">BMs Vinculadas</p>
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                            <span className="text-xs font-bold font-mono">{(profile as any).bm_links?.length || 0} Ativos</span>
                          </div>
                        </div>
                      </div>

                      <div className="mx-6 border-t border-zinc-800/50" />

                      {/* Card Footer Actions */}
                      <div className="p-4 px-6 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 grayscale shrink-0 opacity-50">
                          <CalendarIcon className="h-3 w-3 text-zinc-400" />
                          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-tighter">
                            {profile.date_received ? format(new Date(profile.date_received), "dd MMM, yy", { locale: ptBR }) : "—"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {profile.profile_link && (
                            <a
                              href={profile.profile_link}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 flex items-center justify-center text-zinc-500 hover:text-blue-400 hover:bg-blue-400/5 rounded-lg transition-all border border-transparent hover:border-blue-400/20"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 border border-transparent hover:border-zinc-700/50 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProfile(profile);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
          <Table>
            <TableHeader className="bg-zinc-900/40">
              <TableRow className="hover:bg-transparent border-zinc-800/50">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Perfil</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Data Recebimento</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Uso</TableHead>
                <TableHead className="text-right w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((profile) => {
                const cfg = statusConfig[profile.status] || statusConfig.analise;
                const daysActive = profile.date_received
                  ? differenceInDays(new Date(), new Date(profile.date_received))
                  : 0;

                return (
                  <TableRow
                    key={profile.id}
                    className="border-zinc-800/50 hover:bg-zinc-900/40 cursor-pointer group/row transition-colors"
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-10 w-10 border border-zinc-800 ring-2 ring-transparent group-hover/row:ring-zinc-800 transition-all">
                            <AvatarFallback className="bg-zinc-900 text-[10px] font-black">{profile.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950", cfg.dotClass)} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-zinc-100">{profile.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px]">{profile.email_login}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-black text-[9px] h-5 px-2 uppercase tracking-widest border shadow-sm", cfg.bgColor, cfg.color, cfg.borderColor)}>
                        <cfg.icon className="h-2.5 w-2.5 mr-1" />
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-zinc-500 tabular-nums">
                      {profile.date_received ? format(new Date(profile.date_received), "dd MMM, yyyy", { locale: ptBR }) : "—"}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-zinc-400 tabular-nums font-mono">
                      {daysActive}D
                    </TableCell>
                    <TableCell className="text-right py-4" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 opacity-0 group-hover/row:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProfile(profile);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create modal */}
      <Dialog open={showCreate} onOpenChange={(v) => { setShowCreate(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Novo Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Nome da Identidade</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: João Neves (Perfil 01)" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Email de Login</Label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Link do Perfil</Label>
              <Input value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="https://facebook.com/..." className="bg-zinc-900 border-zinc-800" />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Status Inicial</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="analise">Em Análise</SelectItem>
                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Recebido em</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal h-9 bg-zinc-900 border-zinc-800",
                        !newDateReceived && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newDateReceived ? format(new Date(newDateReceived), "dd/MM/yyyy") : <span>Selecione</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800" align="start">
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
                  <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Bloqueado em</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-9 bg-zinc-900 border-zinc-800",
                          !newDateBlocked && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newDateBlocked ? format(new Date(newDateBlocked), "dd/MM/yyyy") : <span>Selecione</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800" align="start">
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
                <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Vínculo com BMs</Label>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-zinc-400 hover:text-zinc-100" onClick={addBmLink}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add BM
                </Button>
              </div>

              {bmLinks.map((link, index) => (
                <div key={index} className="flex gap-2 items-end bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800">
                  <div className="flex-1 space-y-1">
                    <Select value={link.bm_id} onValueChange={(v) => updateBmLink(index, "bm_id", v)}>
                      <SelectTrigger className="h-8 border-zinc-800 bg-zinc-950"><SelectValue placeholder="BM..." /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {bms?.map((bm: any) => (
                          <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1">
                    <Select value={link.role_in_bm} onValueChange={(v) => updateBmLink(index, "role_in_bm", v)}>
                      <SelectTrigger className="h-8 border-zinc-800 bg-zinc-950"><SelectValue placeholder="Cargo..." /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="administrador">Admin</SelectItem>
                        <SelectItem value="anunciante">Anunciante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => removeBmLink(index)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <Button className="w-full h-11 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 mt-6" onClick={handleCreate} disabled={!newName || createProfile.isPending}>
              {createProfile.isPending ? "Processando..." : "Finalizar Cadastro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedProfile && (
        <AssetDetailModal
          asset={{
            id: (currentSelectedProfile || selectedProfile).id,
            name: (currentSelectedProfile || selectedProfile).name,
            type: "perfil",
            status: (currentSelectedProfile || selectedProfile).status,
            details: (currentSelectedProfile || selectedProfile).email_login || "—",
            originalData: currentSelectedProfile || selectedProfile,
            created_at: (currentSelectedProfile || selectedProfile).created_at
          }}
          onClose={() => setSelectedProfile(null)}
        />
      )}

      {/* Modal EditFbProfileModal removed in favor of inline editing in AssetDetailModal */}
    </div>
  );
};

export default Profiles;
