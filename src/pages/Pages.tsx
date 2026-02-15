import { useState, useMemo } from "react";
import { useShiftSelection } from "@/hooks/useShiftSelection";
import { usePages, useBms, useDeletePages, useBulkUpdatePages, useAdAccounts, useFbProfiles } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus, Search, Trash2, Edit, Filter, MoreVertical,
  CheckCircle2, History, XCircle, AlertCircle, Building2, User,
  Copy, Layout, ExternalLink, ChevronRight, CreditCard, Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import CreatePageModal from "@/components/CreatePageModal";
import BulkEditModal from "@/components/BulkEditModal";
import TimelineDrawer from "@/components/TimelineDrawer";
import AssetDetailModal from "@/components/AssetDetailModal";

import { cn } from "@/lib/utils";
import type { Page } from "@/hooks/useData";

const statusLabels: Record<string, string> = {
  disponivel: "Disponível",
  em_uso: "Em Uso",
  bloqueado: "Bloqueado",
  restrita: "Bloqueado",
  aquecimento: "Aquecimento",
};

const Pages = () => {
  const { data: pages, isLoading } = usePages();
  const { data: bms } = useBms();
  const { data: accounts } = useAdAccounts();
  const { data: fbProfiles } = useFbProfiles();
  const { user } = useAuth();
  const deletePages = useDeletePages();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [bmFilters, setBmFilters] = useState<string[]>([]);
  const [managerFilters, setManagerFilters] = useState<string[]>([]);

  const toggleStatusFilter = (val: string) => {
    setStatusFilters(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };
  const toggleBmFilter = (val: string) => {
    setBmFilters(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };
  const toggleManagerFilter = (val: string) => {
    setManagerFilters(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [timelineEntity, setTimelineEntity] = useState<{ type: string; id: string; name: string } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<{ id: string; type: any; name: string; status: string; details: string; created_at: string; originalData: any } | null>(null);

  const handleOpenAsset = (type: string, id: string) => {
    if (type === 'bm' && bms) {
      const bm = bms.find(b => b.id === id);
      if (bm) setSelectedAsset({ id: bm.id, type: 'bm' as const, name: bm.name, status: 'ativo', details: bm.bm_id_facebook || '', created_at: bm.created_at, originalData: bm });
    } else if (type === 'ad_account' && accounts) {
      const acc = accounts.find(a => a.id === id);
      if (acc) setSelectedAsset({ id: acc.id, type: 'conta' as const, name: acc.name, status: (acc as any).status || 'ativo', details: acc.bm?.name || '', created_at: acc.created_at, originalData: acc });
    } else if (type === 'fb_profile' && fbProfiles) {
      const prof = fbProfiles.find(p => p.id === id);
      if (prof) setSelectedAsset({ id: prof.id, type: 'perfil' as const, name: prof.name, status: prof.status, details: prof.email_login || '', created_at: prof.created_at, originalData: prof });
    } else if (type === 'page' && pages) {
      const p = pages.find(pg => pg.id === id);
      if (p) setSelectedAsset({ id: p.id, type: 'pagina' as const, name: p.name, status: p.status, details: p.origin_bm?.name || '', created_at: p.created_at, originalData: p });
    }
  };

  const unifiedAssets = useMemo(() => {
    const list: any[] = [];
    pages?.forEach(p => list.push({ id: p.id, type: 'pagina' as const, name: p.name, status: p.status, details: p.origin_bm?.name || '', created_at: p.created_at, originalData: p }));
    fbProfiles?.forEach(p => list.push({ id: p.id, type: 'perfil' as const, name: p.name, status: p.status, details: p.email_login || '', created_at: p.created_at, originalData: p }));
    bms?.forEach(b => list.push({ id: b.id, type: 'bm' as const, name: b.name, status: 'ativo', details: b.bm_id_facebook || '', created_at: b.created_at, originalData: b }));
    accounts?.forEach(a => list.push({ id: a.id, type: 'conta' as const, name: a.name, status: (a as any).status || 'ativo', details: a.bm?.name || '', created_at: a.created_at, originalData: a }));
    return list;
  }, [pages, fbProfiles, bms, accounts]);

  const currentSelectedAsset = useMemo(() => {
    if (!selectedAsset) return null;
    return unifiedAssets.find(a => a.id === selectedAsset.id && a.type === selectedAsset.type) || null;
  }, [unifiedAssets, selectedAsset]);

  const filtered = useMemo(() => {
    if (!pages) return [];
    return pages.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilters.length > 0 && !statusFilters.includes(p.status)) return false;
      if (bmFilters.length > 0 && !bmFilters.includes(p.origin_bm_id || "")) return false;
      if (managerFilters.includes("mine") && p.current_manager_id !== user?.id) return false;
      return true;
    });
  }, [pages, search, statusFilters, bmFilters, managerFilters, user]);

  const filteredIds = useMemo(() => filtered.map(p => p.id), [filtered]);

  const { handleToggleSelect } = useShiftSelection(
    filteredIds,
    selected,
    setSelected
  );

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };


  // Calculate counts for filters
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pages?.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return counts;
  }, [pages]);

  const bmCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pages?.forEach(p => {
      if (p.origin_bm_id) {
        counts[p.origin_bm_id] = (counts[p.origin_bm_id] || 0) + 1;
      }
    });
    return counts;
  }, [pages]);

  const managerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pages?.forEach(p => {
      if (p.current_manager_id) {
        counts[p.current_manager_id] = (counts[p.current_manager_id] || 0) + 1;
      }
    });
    return counts;
  }, [pages]);

  const statusOptions = [
    { label: "Disponível", value: "disponivel", icon: CheckCircle2 },
    { label: "Em Uso", value: "em_uso", icon: History },
    { label: "Restrita", value: "restrita", icon: AlertCircle },
  ];

  const bmOptions = useMemo(() => {
    return bms?.map(bm => ({
      label: bm.name,
      value: bm.id,
      icon: Building2
    })) || [];
  }, [bms]);

  const handleDelete = async () => {
    try {
      await deletePages.mutateAsync(Array.from(selected));
      setSelected(new Set());
      toast({ title: "Páginas excluídas com sucesso" });
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const handleDeleteSingle = async () => {
    if (!deleteConfirm) return;
    try {
      await deletePages.mutateAsync([deleteConfirm.id]);
      setDeleteConfirm(null);
      toast({ title: "Página excluída com sucesso" });
    } catch {
      toast({ title: "Erro ao excluir página", variant: "destructive" });
    }
  };

  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado para a área de transferência" });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isToday(date)) return "Hoje";
    if (isYesterday(date)) return "Ontem";
    return format(date, "dd/MM/yyyy");
  };

  return (
    <div className="p-8 space-y-10 bg-zinc-950 text-zinc-100 min-h-screen custom-scrollbar">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Páginas</h1>
          <p className="text-zinc-500 text-sm">
            Total de <span className="text-zinc-300 font-medium">{pages?.length || 0}</span> ativos de página registrados
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex">
                <Button
                  onClick={() => setShowCreate(true)}
                  disabled={!user?.teamId}
                  className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Página
                </Button>
              </div>
            </TooltipTrigger>
            {!user?.teamId && (
              <TooltipContent>
                Você precisa estar em um time para cadastrar páginas
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex flex-col gap-6">
        {/* Top bar with Search, Filter toggle and Bulk Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px] max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
            <Input
              placeholder="Buscar por nome ou ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-zinc-900/50 border-zinc-800 text-zinc-200 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={(statusFilters.length > 0 || bmFilters.length > 0 || managerFilters.length > 0) ? "secondary" : "outline"}
                  size="sm"
                  className={cn(
                    "h-10 px-4 gap-2 border-zinc-800",
                    (statusFilters.length > 0 || bmFilters.length > 0 || managerFilters.length > 0) ? "bg-zinc-800 text-zinc-100" : "bg-transparent text-zinc-400 font-medium hover:bg-zinc-900"
                  )}
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {(statusFilters.length > 0 || bmFilters.length > 0 || managerFilters.length > 0) && (
                    <Badge className="ml-1 h-5 w-5 p-0 justify-center bg-zinc-100 text-zinc-950 rounded-full text-[10px] font-bold">
                      {statusFilters.length + bmFilters.length + managerFilters.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-zinc-300">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="hover:bg-zinc-800 transition-colors cursor-pointer">
                    <History className="mr-2 h-4 w-4 text-zinc-500" />
                    <span>Status</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="p-0 border-zinc-800 bg-zinc-950">
                    <Command className="bg-transparent">
                      <CommandInput placeholder="Filtrar status..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>Nenhum status encontrado.</CommandEmpty>
                        <CommandGroup>
                          {statusOptions.map((opt) => (
                            <CommandItem
                              key={opt.value}
                              onSelect={() => toggleStatusFilter(opt.value)}
                              className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-zinc-800 transition-colors"
                            >
                              <div
                                className={cn(
                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-zinc-700",
                                  statusFilters.includes(opt.value) ? "bg-zinc-100 border-zinc-100" : "bg-transparent"
                                )}
                              >
                                {statusFilters.includes(opt.value) && (
                                  <Check className="h-3.5 w-3.5 text-zinc-950" />
                                )}
                              </div>
                              <span>{opt.label}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="hover:bg-zinc-800 transition-colors cursor-pointer">
                    <Building2 className="mr-2 h-4 w-4 text-zinc-500" />
                    <span>BM Matriz</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="p-0 border-zinc-800 bg-zinc-950">
                    <Command className="bg-transparent">
                      <CommandInput placeholder="Buscar BM..." className="h-9" />
                      <CommandList>
                        <ScrollArea className="h-[200px]">
                          <CommandEmpty>Nenhuma BM encontrada.</CommandEmpty>
                          <CommandGroup>
                            {bmOptions.map((opt) => (
                              <CommandItem
                                key={opt.value}
                                onSelect={() => toggleBmFilter(opt.value)}
                                className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-zinc-800 transition-colors"
                              >
                                <div
                                  className={cn(
                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-zinc-700",
                                    bmFilters.includes(opt.value) ? "bg-zinc-100 border-zinc-100" : "bg-transparent"
                                  )}
                                >
                                  {bmFilters.includes(opt.value) && (
                                    <Check className="h-3.5 w-3.5 text-zinc-950" />
                                  )}
                                </div>
                                <span>{opt.label}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </ScrollArea>
                      </CommandList>
                    </Command>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="hover:bg-zinc-800 transition-colors cursor-pointer">
                    <User className="mr-2 h-4 w-4 text-zinc-500" />
                    <span>Gestor</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="p-0 border-zinc-800 bg-zinc-950">
                    <Command className="bg-transparent">
                      <CommandInput placeholder="Filtrar gestor..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>Nenhum gestor encontrado.</CommandEmpty>
                        <CommandGroup>
                          {[
                            { label: "Minhas Páginas", value: "mine" },
                          ].map((opt) => (
                            <CommandItem
                              key={opt.value}
                              onSelect={() => toggleManagerFilter(opt.value)}
                              className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-zinc-800 transition-colors"
                            >
                              <div
                                className={cn(
                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-zinc-700",
                                  managerFilters.includes(opt.value) ? "bg-zinc-100 border-zinc-100" : "bg-transparent"
                                )}
                              >
                                {managerFilters.includes(opt.value) && (
                                  <Check className="h-3.5 w-3.5 text-zinc-950" />
                                )}
                              </div>
                              <span>{opt.label}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                  onClick={() => {
                    setStatusFilters([]);
                    setBmFilters([]);
                    setManagerFilters([]);
                  }}
                  className="text-zinc-500 hover:text-zinc-100 transition-colors cursor-pointer justify-center text-xs py-2"
                >
                  Redefinir Filtros
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AnimatePresence>
              {selected.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl"
                >
                  <Button size="sm" variant="ghost" className="h-8 gap-2 text-zinc-300 hover:bg-zinc-800" onClick={() => setShowBulkEdit(true)}>
                    <Edit className="h-3.5 w-3.5" />
                    Editar ({selected.size})
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2" onClick={() => setBulkDeleteConfirm(true)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                  </Button>
                  <div className="w-px h-4 bg-zinc-800 mx-1" />
                  <Button size="sm" variant="ghost" className="h-8 text-zinc-500 hover:text-zinc-300" onClick={() => setSelected(new Set())}>
                    Limpar
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Table */}
      <TooltipProvider>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 overflow-hidden shadow-2xl backdrop-blur-sm">
          <Table>
            <TableHeader className="bg-zinc-900/40">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onCheckedChange={toggleAll}
                    className="border-zinc-700 data-[state=checked]:bg-zinc-100 data-[state=checked]:text-zinc-950"
                  />
                </TableHead>
                <TableHead className="text-xs uppercase font-semibold text-zinc-500 tracking-wider">Nome</TableHead>
                <TableHead className="text-xs uppercase font-semibold text-zinc-500 tracking-wider">Status</TableHead>
                <TableHead className="text-xs uppercase font-semibold text-zinc-500 tracking-wider">Business Managers</TableHead>
                <TableHead className="text-xs uppercase font-semibold text-zinc-500 tracking-wider">Conta</TableHead>
                <TableHead className="text-xs uppercase font-semibold text-zinc-500 tracking-wider">Gestor</TableHead>
                <TableHead className="text-xs uppercase font-semibold text-zinc-500 tracking-wider">Data Uso</TableHead>
                <TableHead className="w-12 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20 text-zinc-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-6 w-6 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
                      <span className="text-sm">Sincronizando registros...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20 text-zinc-600">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 opacity-20" />
                      <p className="text-sm">Nenhuma página encontrada para esta filtragem.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((page, index) => {
                  const bmMatriz = (page.origin_bm as any)?.name;
                  const bmUso = (page.current_bm as any)?.name;
                  const isPageUsingSameBM = bmMatriz === bmUso;

                  const statusBadges: Record<string, string> = {
                    em_uso: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    disponivel: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    bloqueado: "bg-red-500/10 text-red-400 border-red-500/20",
                    restrita: "bg-red-500/10 text-red-400 border-red-500/20",
                    aquecimento: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                  };

                  return (
                    <TableRow
                      key={page.id}
                      className="border-zinc-800/50 hover:bg-zinc-900/50 transition-colors group/row cursor-pointer"
                      onClick={() => handleOpenAsset('page', page.id)}
                    >
                      <TableCell
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(page.id, index, e);
                        }}
                        className="py-4 cursor-pointer"
                      >
                        <Checkbox
                          checked={selected.has(page.id)}
                          onCheckedChange={() => { }}
                          className="mx-auto block border-zinc-700 data-[state=checked]:bg-zinc-100 data-[state=checked]:text-zinc-950 pointer-events-none"
                        />
                      </TableCell>

                      {/* Nome Column */}
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                            <Layout className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-zinc-100 truncate max-w-[200px]">{page.name}</span>
                            <div className="flex items-center gap-1.5 group/id mt-0.5">
                              {page.fb_page_id ? (
                                <>
                                  <span className="text-[10px] font-mono text-zinc-500 tabular-nums uppercase tracking-tight">{page.fb_page_id}</span>
                                  <button
                                    onClick={(e) => copyToClipboard(e, page.fb_page_id)}
                                    className="opacity-0 group-hover/id:opacity-100 hover:text-zinc-300 transition-all"
                                  >
                                    <Copy className="h-2.5 w-2.5" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-500/80 uppercase">Sem ID</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Status Column */}
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "font-bold text-[10px] py-0 h-5 px-2 uppercase tracking-wide transition-all",
                          statusBadges[page.status] || "bg-zinc-800 text-zinc-500 border-zinc-700"
                        )}>
                          {statusLabels[page.status] || page.status}
                        </Badge>
                      </TableCell>

                      {/* BM Column */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Building2 className="h-3 w-3 text-zinc-600 shrink-0" />
                            <span className={cn("text-sm font-medium truncate max-w-[150px]", bmUso ? "text-zinc-300" : "text-zinc-700")}>
                              {bmUso || "—"}
                            </span>
                          </div>
                          {!isPageUsingSameBM && bmMatriz && (
                            <span className="text-[10px] text-zinc-600 pl-4 font-medium italic">Matriz: {bmMatriz}</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Account / Profile Column */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <CreditCard className="h-3 w-3 text-zinc-600 shrink-0" />
                            <span className={cn("text-[11px] font-medium truncate max-w-[140px]", page.current_ad_account ? "text-zinc-300" : "text-zinc-700")}>
                              {(page.current_ad_account as any)?.name || "Nenhuma Conta"}
                            </span>
                          </div>

                        </div>
                      </TableCell>

                      {/* Manager Column */}
                      <TableCell>
                        <div className="flex justify-start">
                          {page.manager ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar className="h-8 w-8 border border-zinc-800 ring-2 ring-transparent group-hover/row:ring-zinc-800 transition-all">
                                  <AvatarImage src={(page.manager as any).avatar_url} />
                                  <AvatarFallback className="bg-zinc-900 text-[10px] font-bold text-zinc-500">
                                    {(page.manager as any).name?.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-zinc-800 text-zinc-100 border-zinc-700">
                                <p className="text-xs font-semibold">{(page.manager as any).name}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <div className="h-8 w-8 flex items-center justify-center opacity-20">—</div>
                          )}
                        </div>
                      </TableCell>

                      {/* Date Column */}
                      <TableCell>
                        <span className={cn(
                          "text-sm font-medium font-mono tabular-nums tracking-tighter shrink-0",
                          page.usage_date ? "text-zinc-400" : "text-zinc-700"
                        )}>
                          {formatDate(page.usage_date)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right py-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-300">
                            <DropdownMenuItem onClick={() => handleOpenAsset('page', page.id)} className="hover:bg-zinc-800 cursor-pointer">
                              <Edit className="h-4 w-4 mr-2" />
                              Detalhes/Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-400 focus:text-red-400 hover:bg-red-500/10 cursor-pointer"
                              onClick={() => setDeleteConfirm({ id: page.id, name: page.name })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>

      {showCreate && <CreatePageModal onClose={() => setShowCreate(false)} />}
      {showBulkEdit && (
        <BulkEditModal
          selectedIds={Array.from(selected)}
          onClose={() => { setShowBulkEdit(false); setSelected(new Set()); }}
        />
      )}
      {selectedAsset && (
        <AssetDetailModal
          asset={currentSelectedAsset || (selectedAsset as any)}
          onClose={() => setSelectedAsset(null)}
        />
      )}
      {timelineEntity && (
        <TimelineDrawer
          entityType={timelineEntity.type}
          entityId={timelineEntity.id}
          entityName={timelineEntity.name}
          onClose={() => setTimelineEntity(null)}
        />
      )}

      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a página <strong>{deleteConfirm?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSingle}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={bulkDeleteConfirm}
        onOpenChange={setBulkDeleteConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir as <strong>{selected.size}</strong> páginas selecionadas?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleDelete();
                setBulkDeleteConfirm(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Pages;
