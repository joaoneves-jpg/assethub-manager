import { useState, useMemo } from "react";
import { useFbProfiles, useBms, useAdAccounts, useCreateFbProfile, useCreateBm, useCreateAdAccount } from "@/hooks/useData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Search,
    Users,
    Building2,
    CreditCard,
    Filter,
    MoreVertical,
    History,
    LayoutGrid,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ArrowRight
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import AssetDetailModal from "@/components/AssetDetailModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FacetedFilter } from "@/components/FacetedFilter";
import { cn } from "@/lib/utils";
import { Trash2, Edit, Tags, ChevronRight, User } from "lucide-react";
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
import BulkEditAssetsModal from "@/components/BulkEditAssetsModal";
import { useDeleteProfiles, useDeleteBms, useDeleteAdAccounts } from "@/hooks/useData";
import { Checkbox } from "@/components/ui/checkbox";

// Asset type mapping
type AssetType = "perfil" | "bm" | "conta";

interface UnifiedAsset {
    id: string;
    name: string;
    type: AssetType;
    status: string;
    details: string;
    originalData: any;
    created_at: string;
}

const Assets = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("all");
    const [search, setSearch] = useState("");

    // Data hooks
    const { data: profiles, isLoading: loadingProfiles } = useFbProfiles();
    const { data: bms, isLoading: loadingBms } = useBms();
    const { data: accounts, isLoading: loadingAccounts } = useAdAccounts();

    // Creation states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createType, setCreateType] = useState<AssetType>("perfil");

    // Selection and Filters
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [statusFilter, setStatusFilter] = useState("all");
    const [bmFilter, setBmFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [showBulkEdit, setShowBulkEdit] = useState(false);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    // Detail states
    const [selectedAsset, setSelectedAsset] = useState<UnifiedAsset | null>(null);

    // Unified List Transformation
    const unifiedAssets = useMemo(() => {
        const list: UnifiedAsset[] = [];

        profiles?.forEach(p => list.push({
            id: p.id,
            name: p.name,
            type: "perfil",
            status: p.status,
            details: p.email_login || "—",
            originalData: p,
            created_at: p.created_at
        }));

        bms?.forEach(b => list.push({
            id: b.id,
            name: b.name,
            type: "bm",
            status: "ativo",
            details: b.bm_id_facebook || "Sem ID FB",
            originalData: b,
            created_at: b.created_at
        }));

        accounts?.forEach(a => list.push({
            id: a.id,
            name: a.name,
            type: "conta",
            status: a.status || "ativo",
            details: (a as any).bm?.name || "Sem BM",
            originalData: a,
            created_at: a.created_at
        }));

        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [profiles, bms, accounts]);

    const filteredAssets = useMemo(() => {
        let list = unifiedAssets;
        if (activeTab !== "all") {
            const types: Record<string, AssetType> = {
                perfis: "perfil",
                bms: "bm",
                contas: "conta"
            };
            list = list.filter(a => a.type === types[activeTab]);
        }
        if (statusFilter !== "all") {
            list = list.filter(a => a.status === statusFilter);
        }
        if (bmFilter !== "all") {
            list = list.filter(a => {
                if (a.type === "conta") return (a.originalData as any).bm_id === bmFilter;
                if (a.type === "bm") return a.id === bmFilter;
                return true;
            });
        }
        if (search) {
            list = list.filter(a =>
                a.name.toLowerCase().includes(search.toLowerCase()) ||
                a.details.toLowerCase().includes(search.toLowerCase()) ||
                ((a.originalData as any).tags && (a.originalData as any).tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase())))
            );
        }
        return list;
    }, [unifiedAssets, activeTab, search, statusFilter, bmFilter]);

    const toggleSelect = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelected(next);
    };

    const toggleAll = () => {
        if (selected.size === filteredAssets.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(filteredAssets.map(a => a.id)));
        }
    };

    // Calculate counts
    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        unifiedAssets.forEach(a => {
            counts[a.status] = (counts[a.status] || 0) + 1;
        });
        return counts;
    }, [unifiedAssets]);

    const bmOptions = useMemo(() => {
        return bms?.map(bm => ({
            label: bm.name,
            value: bm.id,
            icon: Building2
        })) || [];
    }, [bms]);

    const getStatusBadge = (asset: UnifiedAsset) => {
        const s = asset.status.toLowerCase();
        if (s === "ativo" || s === "disponivel") return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Ativo</Badge>;
        if (s === "bloqueado" || s === "caiu") return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-[10px]">Bloqueado</Badge>;
        if (s === "analise" || s === "em_analise") return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">Em Análise</Badge>;
        if (s === "restrita") return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 text-[10px]">Restrita</Badge>;
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">{asset.status}</Badge>;
    };

    const getTypeIcon = (type: AssetType) => {
        switch (type) {
            case "perfil": return <Users className="h-4 w-4 text-blue-500" />;
            case "bm": return <Building2 className="h-4 w-4 text-indigo-500" />;
            case "conta": return <CreditCard className="h-4 w-4 text-emerald-500" />;
        }
    };

    // --- Creation Logic ---
    const createProfile = useCreateFbProfile();
    const createBm = useCreateBm();
    const createAccount = useCreateAdAccount();

    const [formData, setFormData] = useState<any>({
        name: "",
        email_login: "",
        profile_link: "",
        status: "analise",
        date_received: new Date().toISOString().split("T")[0],
        bm_id_facebook: "", // for BM
        bm_id: "", // for Account
    });

    const handleCreateSubmit = async () => {
        try {
            if (createType === "perfil") {
                await createProfile.mutateAsync({
                    profile: {
                        name: formData.name,
                        email_login: formData.email_login || null,
                        profile_link: formData.profile_link || null,
                        status: formData.status,
                        date_received: formData.date_received || null,
                        date_blocked: null
                    }
                });
            } else if (createType === "bm") {
                await createBm.mutateAsync({
                    name: formData.name,
                    bm_id_facebook: formData.bm_id_facebook || undefined
                });
            } else if (createType === "conta") {
                await createAccount.mutateAsync({
                    name: formData.name,
                    bm_id: formData.bm_id === "none" ? undefined : formData.bm_id,
                    status: "ativo"
                });
            }
            toast({ title: `${createType === "perfil" ? "Perfil" : createType === "bm" ? "BM" : "Conta"} criado com sucesso!` });
            setShowCreateModal(false);
            setFormData({
                name: "", email_login: "", profile_link: "", status: "analise",
                date_received: new Date().toISOString().split("T")[0],
                bm_id_facebook: "", bm_id: ""
            });
        } catch (e) {
            toast({ title: "Erro ao criar ativo", variant: "destructive" });
        }
    };

    const deleteProfiles = useDeleteProfiles();
    const deleteBms = useDeleteBms();
    const deleteAccounts = useDeleteAdAccounts();

    const handleDelete = async () => {
        try {
            const profileIds = filteredAssets.filter(a => selected.has(a.id) && a.type === "perfil").map(a => a.id);
            const bmIds = filteredAssets.filter(a => selected.has(a.id) && a.type === "bm").map(a => a.id);
            const accountIds = filteredAssets.filter(a => selected.has(a.id) && a.type === "conta").map(a => a.id);

            const promises = [];
            if (profileIds.length > 0) promises.push(deleteProfiles.mutateAsync(profileIds));
            if (bmIds.length > 0) promises.push(deleteBms.mutateAsync(bmIds));
            if (accountIds.length > 0) promises.push(deleteAccounts.mutateAsync(accountIds));

            await Promise.all(promises);
            setSelected(new Set());
            toast({ title: "Ativos excluídos com sucesso" });
        } catch {
            toast({ title: "Erro ao excluir ativos", variant: "destructive" });
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <LayoutGrid className="h-6 w-6 text-primary" />
                        Gerenciador de Ativos
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Gerencie perfis, BMs e contas de anúncio em um só lugar.
                    </p>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="gap-2 shadow-sm font-semibold h-9">
                            <Plus className="h-4 w-4" />
                            Novo Ativo
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 p-2">
                        <DropdownMenuItem onClick={() => { setCreateType("perfil"); setShowCreateModal(true); }} className="gap-2 py-2 cursor-pointer">
                            <Users className="h-4 w-4 text-blue-500" />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">Novo Perfil</span>
                                <span className="text-[10px] text-muted-foreground">Adicionar perfil do Facebook</span>
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setCreateType("bm"); setShowCreateModal(true); }} className="gap-2 py-2 cursor-pointer">
                            <Building2 className="h-4 w-4 text-indigo-500" />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">Nova BM</span>
                                <span className="text-[10px] text-muted-foreground">Registrar Business Manager</span>
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setCreateType("conta"); setShowCreateModal(true); }} className="gap-2 py-2 cursor-pointer">
                            <CreditCard className="h-4 w-4 text-emerald-500" />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">Nova Conta</span>
                                <span className="text-[10px] text-muted-foreground">Cadastrar conta de anúncio</span>
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar ativo, email ou tag..."
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
                            {(statusFilter !== "all" || bmFilter !== "all") && (
                                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center rounded-full text-[10px]">
                                    {[statusFilter, bmFilter].filter(f => f !== "all").length}
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
                                    options={[
                                        { label: "Ativo", value: "ativo", icon: CheckCircle2 },
                                        { label: "Disponível", value: "disponivel", icon: CheckCircle2 },
                                        { label: "Em Análise", value: "analise", icon: History },
                                        { label: "Bloqueado", value: "bloqueado", icon: XCircle },
                                        { label: "Restrita", value: "restrita", icon: AlertCircle },
                                    ]}
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    counts={statusCounts}
                                />
                                <FacetedFilter
                                    title="BM Vinculada"
                                    options={bmOptions}
                                    value={bmFilter}
                                    onChange={setBmFilter}
                                />
                                <Button variant="ghost" size="sm" onClick={() => {
                                    setStatusFilter("all");
                                    setBmFilter("all");
                                }} className="h-9 text-xs">
                                    Redefinir Filtros
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="bg-muted/50 mb-4">
                    <TabsTrigger value="all" className="data-[state=active]:bg-background shadow-none">Todos</TabsTrigger>
                    <TabsTrigger value="perfis" className="data-[state=active]:bg-background shadow-none">Perfis</TabsTrigger>
                    <TabsTrigger value="bms" className="data-[state=active]:bg-background shadow-none">BMs</TabsTrigger>
                    <TabsTrigger value="contas" className="data-[state=active]:bg-background shadow-none">Contas</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-0 border rounded-xl bg-card overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-10">
                                    <Checkbox
                                        checked={filteredAssets.length > 0 && selected.size === filteredAssets.length}
                                        onCheckedChange={toggleAll}
                                    />
                                </TableHead>
                                <TableHead>Ativo</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tags</TableHead>
                                <TableHead>Detalhes</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingProfiles || loadingBms || loadingAccounts ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Carregando ativos...</TableCell>
                                </TableRow>
                            ) : filteredAssets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">Nenhum ativo encontrado.</TableCell>
                                </TableRow>
                            ) : (
                                filteredAssets.map((asset) => (
                                    <TableRow
                                        key={`${asset.type}-${asset.id}`}
                                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                                        onClick={() => setSelectedAsset(asset)}
                                    >
                                        <TableCell onClick={e => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selected.has(asset.id)}
                                                onCheckedChange={() => toggleSelect(asset.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-muted/50 flex items-center justify-center shrink-0">
                                                    {getTypeIcon(asset.type)}
                                                </div>
                                                <span className="font-semibold text-sm truncate">{asset.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs uppercase font-bold tracking-tight text-muted-foreground/80">{asset.type}</span>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(asset)}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {(asset.originalData as any).tags?.slice(0, 2).map((tag: string) => (
                                                    <Badge key={tag} variant="outline" className="text-[9px] px-1 h-4 bg-primary/5 text-primary border-primary/20">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {(asset.originalData as any).tags?.length > 2 && (
                                                    <span className="text-[10px] text-muted-foreground">+{(asset.originalData as any).tags.length - 2}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-medium text-muted-foreground truncate">{asset.details}</span>
                                        </TableCell>
                                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem onClick={() => setSelectedAsset(asset)}>Visualizar</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setShowHistory({ id: asset.id, type: asset.type === "perfil" ? "profile" : asset.type, name: asset.name })}>
                                                        <History className="h-4 w-4 mr-2" /> Histórico
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TabsContent>
            </Tabs>

            {/* Modals */}

            {/* Creation Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="sm:max-w-md text-gray-800">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {getTypeIcon(createType)}
                            Cadastrar {createType === "perfil" ? "Perfil" : createType === "bm" ? "BM" : "Conta"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome <span className="text-destructive">*</span></Label>
                            <Input
                                placeholder="Ex: Asset Principal 01"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {createType === "perfil" && (
                            <>
                                <div className="space-y-2">
                                    <Label>Email de Login</Label>
                                    <Input
                                        placeholder="email@login.com"
                                        value={formData.email_login}
                                        onChange={e => setFormData({ ...formData, email_login: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status Inicial</Label>
                                    <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ativo">Ativo</SelectItem>
                                            <SelectItem value="analise">Em Análise</SelectItem>
                                            <SelectItem value="bloqueado">Bloqueado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        {createType === "bm" && (
                            <div className="space-y-2">
                                <Label>ID Facebook (BM ID)</Label>
                                <Input
                                    placeholder="1234567890..."
                                    value={formData.bm_id_facebook}
                                    onChange={e => setFormData({ ...formData, bm_id_facebook: e.target.value })}
                                />
                            </div>
                        )}

                        {createType === "conta" && (
                            <div className="space-y-2">
                                <Label>BM Vinculada</Label>
                                <Select value={formData.bm_id} onValueChange={v => setFormData({ ...formData, bm_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="Selecionar BM" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhuma</SelectItem>
                                        {bms?.map(bm => (
                                            <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                        <Button onClick={handleCreateSubmit} disabled={!formData.name}>Criar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Modal (Unified) */}
            {selectedAsset && (
                <AssetDetailModal
                    asset={selectedAsset}
                    onClose={() => setSelectedAsset(null)}
                />
            )}

            {showBulkEdit && (
                <BulkEditAssetsModal
                    selectedAssets={filteredAssets.filter(a => selected.has(a.id)).map(a => ({ id: a.id, type: a.type }))}
                    onClose={() => { setShowBulkEdit(false); setSelected(new Set()); }}
                />
            )}

            <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-800">Confirmar exclusão em massa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir os <strong>{selected.size}</strong> ativos selecionados?
                            Esta ação não pode ser desfeita e removerá permanentemente os registros.
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
                            Excluir Ativos
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
};

export default Assets;
