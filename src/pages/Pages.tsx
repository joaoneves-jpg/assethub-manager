import { useState, useMemo } from "react";
import { usePages, useBms, useDeletePages, useBulkUpdatePages } from "@/hooks/useData";
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Plus, Search, Trash2, Edit, Filter, MoreVertical,
  CheckCircle2, History, XCircle, AlertCircle, Building2, User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import CreatePageModal from "@/components/CreatePageModal";
import EditPageModal from "@/components/EditPageModal";
import BulkEditModal from "@/components/BulkEditModal";
import TimelineDrawer from "@/components/TimelineDrawer";
import PageDetailModal from "@/components/PageDetailModal";
import { FacetedFilter } from "@/components/FacetedFilter";
import type { Page } from "@/hooks/useData";

const statusMap: Record<string, { label: string; className: string }> = {
  disponivel: { label: "Disponível", className: "status-available" },
  em_uso: { label: "Em Uso", className: "status-in-use" },
  caiu: { label: "Caiu", className: "status-down" },
  restrita: { label: "Restrita", className: "status-restricted" },
};

const Pages = () => {
  const { data: pages, isLoading } = usePages();
  const { data: bms } = useBms();
  const { user } = useAuth();
  const deletePages = useDeletePages();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bmFilter, setBmFilter] = useState<string>("all");
  const [managerFilter, setManagerFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [editPage, setEditPage] = useState<Page | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [timelineEntity, setTimelineEntity] = useState<{ type: string; id: string; name: string } | null>(null);

  const filtered = useMemo(() => {
    if (!pages) return [];
    return pages.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (bmFilter !== "all" && p.origin_bm_id !== bmFilter) return false;
      if (managerFilter === "mine" && p.current_manager_id !== user?.id) return false;
      return true;
    });
  }, [pages, search, statusFilter, bmFilter, managerFilter, user]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const [showFilters, setShowFilters] = useState(false);

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
    { label: "Caiu", value: "caiu", icon: XCircle },
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Páginas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pages?.length || 0} páginas no total
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Página
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Top bar with Search, Filter toggle and Bulk Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar página..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              className="h-9 gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {(statusFilter !== "all" || bmFilter !== "all" || managerFilter !== "all") && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center rounded-full text-[10px]">
                  {[statusFilter, bmFilter, managerFilter].filter(f => f !== "all").length}
                </Badge>
              )}
            </Button>

            <AnimatePresence>
              {selected.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-2 pl-2 border-l"
                >
                  <Button size="sm" variant="secondary" className="h-9 gap-2" onClick={() => setShowBulkEdit(true)}>
                    <Edit className="h-3.5 w-3.5" />
                    Editar ({selected.size})
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9 text-destructive hover:text-destructive gap-2" onClick={() => setBulkDeleteConfirm(true)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9 text-muted-foreground" onClick={() => setSelected(new Set())}>
                    Limpar
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Expandable filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-3 pb-2 pt-1">
                <FacetedFilter
                  title="Status"
                  options={statusOptions}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  counts={statusCounts}
                />
                <FacetedFilter
                  title="BM Matriz"
                  options={bmOptions}
                  value={bmFilter}
                  onChange={setBmFilter}
                  counts={bmCounts}
                />
                <FacetedFilter
                  title="Gestor"
                  options={[
                    { label: "Minhas Páginas", value: "mine", icon: User },
                  ]}
                  value={managerFilter}
                  onChange={setManagerFilter}
                  counts={managerCounts}
                />
                <Button variant="ghost" size="sm" onClick={() => {
                  setStatusFilter("all");
                  setBmFilter("all");
                  setManagerFilter("all");
                }} className="h-9 text-xs">
                  Redefinir Filtros
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>BM Matriz</TableHead>
              <TableHead>BM em Uso</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Gestor</TableHead>
              <TableHead>Data Uso</TableHead>
              <TableHead className="w-10 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  Nenhuma página encontrada
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((page) => {
                const st = statusMap[page.status] || { label: page.status, className: "" };
                return (
                  <TableRow
                    key={page.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedPage(page)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.has(page.id)}
                        onCheckedChange={() => toggleSelect(page.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{page.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{page.fb_page_id || "Sem ID"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`status-dot ${st.className}`} />
                        <span className="text-sm">{st.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(page.origin_bm as any)?.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(page.current_bm as any)?.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(page.current_ad_account as any)?.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {page.fb_profile?.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(page.manager as any)?.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {page.usage_date || "—"}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditPage(page)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
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

      {showCreate && <CreatePageModal onClose={() => setShowCreate(false)} />}
      {showBulkEdit && (
        <BulkEditModal
          selectedIds={Array.from(selected)}
          onClose={() => { setShowBulkEdit(false); setSelected(new Set()); }}
        />
      )}
      {selectedPage && (
        <PageDetailModal
          page={selectedPage}
          onClose={() => setSelectedPage(null)}
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

      {editPage && (
        <EditPageModal
          page={editPage}
          onClose={() => setEditPage(null)}
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
