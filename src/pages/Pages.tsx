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
import { Plus, Search, Trash2, Edit, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreatePageModal from "@/components/CreatePageModal";
import BulkEditModal from "@/components/BulkEditModal";
import TimelineDrawer from "@/components/TimelineDrawer";
import { motion } from "framer-motion";

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

  const handleDelete = async () => {
    try {
      await deletePages.mutateAsync(Array.from(selected));
      setSelected(new Set());
      toast({ title: "Páginas excluídas com sucesso" });
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar página..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-3.5 w-3.5 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="disponivel">Disponível</SelectItem>
            <SelectItem value="em_uso">Em Uso</SelectItem>
            <SelectItem value="caiu">Caiu</SelectItem>
            <SelectItem value="restrita">Restrita</SelectItem>
          </SelectContent>
        </Select>
        <Select value={bmFilter} onValueChange={setBmFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="BM Matriz" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as BMs</SelectItem>
            {bms?.map((bm) => (
              <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={managerFilter} onValueChange={setManagerFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Gestor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="mine">Minhas Páginas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20"
        >
          <span className="text-sm font-medium">{selected.size} selecionada(s)</span>
          <Button size="sm" variant="outline" onClick={() => setShowBulkEdit(true)}>
            <Edit className="h-3.5 w-3.5 mr-1" />
            Editar
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Excluir
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Limpar
          </Button>
        </motion.div>
      )}

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
              <TableHead>Gestor</TableHead>
              <TableHead>Data Uso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
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
                    onClick={() => setTimelineEntity({ type: "page", id: page.id, name: page.name })}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.has(page.id)}
                        onCheckedChange={() => toggleSelect(page.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{page.name}</TableCell>
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
                    <TableCell className="text-sm text-muted-foreground">—</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {page.usage_date || "—"}
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
      {timelineEntity && (
        <TimelineDrawer
          entityType={timelineEntity.type}
          entityId={timelineEntity.id}
          entityName={timelineEntity.name}
          onClose={() => setTimelineEntity(null)}
        />
      )}
    </div>
  );
};

export default Pages;
