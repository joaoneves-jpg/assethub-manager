import { useState, useMemo, useEffect } from "react";
import { useShiftSelection } from "@/hooks/useShiftSelection";
import { useFbProfiles, useBms, useAdAccounts, usePages, useCreateFbProfile, useCreateBm, useCreateAdAccount } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
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
    LayoutGrid,
    CheckCircle2,
    History,
    XCircle,
    AlertCircle,
    ArrowRight,
    Mail,
    Fingerprint,
    Copy,
    ChevronRight,
    ExternalLink,
    ShieldCheck,
    Briefcase,
    Trash2,
    Edit,
    Tags,
    User,
    Send,
    Calendar as CalendarIcon,
    Layout,
    Check
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import AssetDetailModal from "@/components/AssetDetailModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
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
import { useDeleteProfiles, useDeleteBms, useDeleteAdAccounts, useDeletePages } from "@/hooks/useData";
import { Checkbox } from "@/components/ui/checkbox";
import TimelineDrawer from "@/components/TimelineDrawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
// Asset type mapping
type AssetType = "perfil" | "bm" | "conta" | "pagina";

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

    const { user } = useAuth();

    // Data hooks
    const { data: profiles, isLoading: loadingProfiles } = useFbProfiles();
    const { data: bms, isLoading: loadingBms } = useBms();
    const { data: accounts, isLoading: loadingAccounts } = useAdAccounts();
    const { data: pages, isLoading: loadingPages } = usePages();

    // Creation states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createType, setCreateType] = useState<AssetType>("perfil");

    // Selection and Filters
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [statusFilters, setStatusFilters] = useState<string[]>([]);
    const [typeFilters, setTypeFilters] = useState<string[]>([]);
    const [bmFilters, setBmFilters] = useState<string[]>([]);

    const toggleStatusFilter = (val: string) => {
        setStatusFilters(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };

    const toggleTypeFilter = (val: string) => {
        setTypeFilters(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };

    const toggleBmFilter = (val: string) => {
        setBmFilters(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };
    const [showBulkEdit, setShowBulkEdit] = useState(false);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    // Detail states
    const [selectedAsset, setSelectedAsset] = useState<UnifiedAsset | null>(null);
    const [assetToDelete, setAssetToDelete] = useState<UnifiedAsset | null>(null);

    const [timelineEntity, setTimelineEntity] = useState<{ type: string; id: string; name: string } | null>(null);

    // Bulk creation states
    const [inputList, setInputList] = useState("");
    const [stagedAssets, setStagedAssets] = useState<any[]>([]);
    const [showAllStaged, setShowAllStaged] = useState(false);

    // Clear selection when changing tabs to prevent selecting wrong asset types
    useEffect(() => {
        setSelected(new Set());
    }, [activeTab]);

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
            status: (a as any).status || "ativo",
            details: (a as any).bm?.name || "Sem BM",
            originalData: a,
            created_at: a.created_at
        }));

        pages?.forEach(p => list.push({
            id: p.id,
            name: p.name,
            type: "pagina",
            status: p.status,
            details: (p as any).origin_bm?.name || "Sem BM",
            originalData: p,
            created_at: p.created_at
        }));

        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [profiles, bms, accounts, pages]);

    const currentSelectedAsset = useMemo(() => {
        if (!selectedAsset) return null;
        return unifiedAssets.find(a => a.id === selectedAsset.id && a.type === selectedAsset.type) || null;
    }, [unifiedAssets, selectedAsset]);

    const filteredAssets = useMemo(() => {
        let list = unifiedAssets;
        if (activeTab !== "all") {
            const types: Record<string, AssetType> = {
                perfis: "perfil",
                bms: "bm",
                contas: "conta",
                paginas: "pagina"
            };
            list = list.filter(a => a.type === types[activeTab]);
        }
        if (typeFilters.length > 0) {
            list = list.filter(a => typeFilters.includes(a.type));
        }
        if (statusFilters.length > 0) {
            list = list.filter(a => statusFilters.includes(a.status));
        }
        if (bmFilters.length > 0) {
            list = list.filter(a => {
                const bmId = a.type === "conta" ? (a.originalData as any).bm_id : (a.type === "bm" ? a.id : (a.type === "pagina" ? (a.originalData as any).origin_bm_id : null));
                return bmId && bmFilters.includes(bmId);
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
    }, [unifiedAssets, activeTab, search, statusFilters, bmFilters, typeFilters]);

    const filteredAssetIds = useMemo(() => filteredAssets.map(a => a.id), [filteredAssets]);

    const { handleToggleSelect } = useShiftSelection(
        filteredAssetIds,
        selected,
        setSelected
    );

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

    const statusStyles: Record<string, string> = {
        aquecimento: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        ativo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        disponivel: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        em_uso: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        analise: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        em_analise: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        bloqueado: "bg-red-500/10 text-red-500 border-red-500/20",
        restrita: "bg-red-500/10 text-red-500 border-red-500/20",
        caiu: "bg-red-500/10 text-red-500 border-red-500/20",
    };

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        const label = s === "analise" || s === "em_analise" ? "Em Análise" :
            s === "restrita" ? "Bloqueado" :
                s === "em_uso" ? "Em Uso" :
                    s === "disponivel" ? "Disponível" :
                        s === "caiu" ? "Caiu" : s;
        return (
            <Badge variant="outline" className={cn(
                "font-bold text-[10px] py-0 h-5 px-2 uppercase tracking-wide",
                statusStyles[s] || "bg-zinc-800 text-zinc-500 border-zinc-700"
            )}>
                {label}
            </Badge>
        );
    };

    const copyToClipboard = (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado para a área de transferência" });
    };

    const getTypeIcon = (type: AssetType) => {
        switch (type) {
            case "perfil": return <Users className="h-4 w-4 text-blue-500" />;
            case "bm": return <Building2 className="h-4 w-4 text-indigo-500" />;
            case "conta": return <CreditCard className="h-4 w-4 text-emerald-500" />;
            case "pagina": return <Layout className="h-4 w-4 text-orange-500" />;
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

    const handleInsert = () => {
        const lines = inputList.split("\n").map(l => l.trim()).filter(Boolean);
        const newStaged: any[] = [];

        lines.forEach(line => {
            const parts = line.split(",").map(p => p.trim());
            const name = parts[0] || "";
            const secondary = parts[1] || "";

            if (name) {
                const tempId = Math.random().toString(36).substr(2, 9);
                if (createType === "perfil") {
                    newStaged.push({ id: tempId, name, email_login: secondary });
                } else if (createType === "bm") {
                    newStaged.push({ id: tempId, name, bm_id_facebook: secondary });
                } else if (createType === "conta") {
                    newStaged.push({ id: tempId, name, fb_account_id: secondary });
                }
            }
        });

        if (newStaged.length > 0) {
            setStagedAssets([...stagedAssets, ...newStaged]);
            setInputList("");
            toast({ title: `${newStaged.length} ativo(s) adicionados à lista.` });
        }
    };

    const removeStaged = (id: string) => {
        setStagedAssets(stagedAssets.filter(a => a.id !== id));
    };

    const handleCreateSubmit = async () => {
        if (stagedAssets.length === 0) return;
        try {
            if (createType === "perfil") {
                const profilesToCreate = stagedAssets.map(a => ({
                    profile: {
                        name: a.name,
                        email_login: a.email_login || null,
                        profile_link: formData.profile_link || null,
                        status: formData.status,
                        date_received: formData.date_received || null,
                        date_blocked: null
                    }
                }));
                await createProfile.mutateAsync(profilesToCreate);
            } else if (createType === "bm") {
                const bmsToCreate = stagedAssets.map(a => ({
                    name: a.name,
                    bm_id_facebook: a.bm_id_facebook || undefined
                }));
                await createBm.mutateAsync(bmsToCreate);
            } else if (createType === "conta") {
                const accountsToCreate = stagedAssets.map(a => ({
                    name: a.name,
                    bm_id: formData.bm_id === "none" ? undefined : formData.bm_id,
                    status: "ativo"
                }));
                await createAccount.mutateAsync(accountsToCreate);
            }
            toast({ title: `${stagedAssets.length} ativo(s) criado(s) com sucesso!` });
            setShowCreateModal(false);
            setStagedAssets([]);
            setInputList("");
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
    const deletePages = useDeletePages();

    const handleDelete = async () => {
        try {
            const selectedAssets = filteredAssets.filter(a => selected.has(a.id));
            console.log('Selected assets for deletion:', selectedAssets.map(a => ({ id: a.id, type: a.type, name: a.name })));

            const profileIds = filteredAssets.filter(a => selected.has(a.id) && a.type === "perfil").map(a => a.id);
            const bmIds = filteredAssets.filter(a => selected.has(a.id) && a.type === "bm").map(a => a.id);
            const accountIds = filteredAssets.filter(a => selected.has(a.id) && a.type === "conta").map(a => a.id);
            const pageIds = filteredAssets.filter(a => selected.has(a.id) && a.type === "pagina").map(a => a.id);

            console.log('Bulk delete:', { profileIds, bmIds, accountIds, pageIds });

            const promises = [];
            if (profileIds.length > 0) promises.push(deleteProfiles.mutateAsync(profileIds));
            if (bmIds.length > 0) promises.push(deleteBms.mutateAsync(bmIds));
            if (accountIds.length > 0) promises.push(deleteAccounts.mutateAsync(accountIds));
            if (pageIds.length > 0) promises.push(deletePages.mutateAsync(pageIds));

            await Promise.all(promises);
            setSelected(new Set());
            toast({ title: "Ativos excluídos com sucesso" });
        } catch (error: any) {
            console.error('Bulk delete error:', error);

            // Check for foreign key constraint violations
            if (error?.code === '23503') {
                const message = error.message || '';
                if (message.includes('facebook_profiles') && message.includes('pages')) {
                    toast({
                        title: "Não é possível excluir perfil",
                        description: "Este perfil ainda está vinculado a uma ou mais páginas. Remova o vínculo antes de excluir.",
                        variant: "destructive"
                    });
                } else if (message.includes('bms')) {
                    toast({
                        title: "Não é possível excluir BM",
                        description: "Esta BM ainda está vinculada a outros ativos. Remova os vínculos antes de excluir.",
                        variant: "destructive"
                    });
                } else {
                    toast({
                        title: "Não é possível excluir",
                        description: "Este ativo ainda está vinculado a outros recursos. Remova os vínculos antes de excluir.",
                        variant: "destructive"
                    });
                }
            } else {
                toast({ title: "Erro ao excluir ativos", variant: "destructive" });
            }
        }
    };

    const handleSingleDelete = async () => {
        if (!assetToDelete) return;
        try {
            console.log('Deleting asset:', { id: assetToDelete.id, type: assetToDelete.type, name: assetToDelete.name });

            if (assetToDelete.type === "perfil") await deleteProfiles.mutateAsync([assetToDelete.id]);
            else if (assetToDelete.type === "bm") await deleteBms.mutateAsync([assetToDelete.id]);
            else if (assetToDelete.type === "conta") await deleteAccounts.mutateAsync([assetToDelete.id]);
            else if (assetToDelete.type === "pagina") await deletePages.mutateAsync([assetToDelete.id]);
            else {
                console.error('Unknown asset type:', assetToDelete.type);
                throw new Error(`Tipo de ativo desconhecido: ${assetToDelete.type}`);
            }

            toast({ title: "Ativo excluído com sucesso" });
            setAssetToDelete(null);
        } catch (error: any) {
            console.error('Delete error:', error);

            // Check for foreign key constraint violations
            if (error?.code === '23503') {
                const message = error.message || '';
                if (message.includes('facebook_profiles') && message.includes('pages')) {
                    toast({
                        title: "Não é possível excluir perfil",
                        description: "Este perfil ainda está vinculado a uma ou mais páginas. Remova o vínculo antes de excluir.",
                        variant: "destructive"
                    });
                } else if (message.includes('bms')) {
                    toast({
                        title: "Não é possível excluir BM",
                        description: "Esta BM ainda está vinculada a outros ativos. Remova os vínculos antes de excluir.",
                        variant: "destructive"
                    });
                } else {
                    toast({
                        title: "Não é possível excluir",
                        description: "Este ativo ainda está vinculado a outros recursos. Remova os vínculos antes de excluir.",
                        variant: "destructive"
                    });
                }
            } else {
                toast({ title: "Erro ao excluir ativo", variant: "destructive" });
            }
        }
    };

    return (
        <div className="p-8 space-y-10 bg-zinc-950 text-zinc-100 min-h-screen custom-scrollbar">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Ativos</h1>
                    <p className="text-zinc-500 text-sm">
                        Gerencie perfis, BMs e contas de anúncio em um só lugar.
                    </p>
                </div>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            disabled={!user?.teamId}
                                            className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-bold gap-2"
                                        >
                                            <Plus className="h-4 w-4" strokeWidth={3} />
                                            Novo Ativo
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52 p-2 bg-zinc-900 border-zinc-800 text-zinc-200">
                                        <DropdownMenuItem onClick={() => { setCreateType("perfil"); setShowCreateModal(true); }} className="gap-3 py-3 cursor-pointer hover:bg-zinc-800">
                                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <Users className="h-4 w-4 text-blue-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold">Novo Perfil</span>
                                                <span className="text-[10px] text-zinc-500">Facebook Profile</span>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setCreateType("bm"); setShowCreateModal(true); }} className="gap-3 py-3 cursor-pointer hover:bg-zinc-800">
                                            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                                <Building2 className="h-4 w-4 text-indigo-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold">Nova BM</span>
                                                <span className="text-[10px] text-zinc-500">Business Manager</span>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setCreateType("conta"); setShowCreateModal(true); }} className="gap-3 py-3 cursor-pointer hover:bg-zinc-800">
                                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                <CreditCard className="h-4 w-4 text-emerald-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold">Nova Conta</span>
                                                <span className="text-[10px] text-zinc-500">Ad Account</span>
                                            </div>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </TooltipTrigger>
                        {!user?.teamId && (
                            <TooltipContent>
                                Você precisa estar em um time para cadastrar ativos
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Stats Quick Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                    { id: "perfis", label: "Perfis", count: profiles?.length || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
                    { id: "paginas", label: "Páginas", count: pages?.length || 0, icon: Layout, color: "text-orange-400", bg: "bg-orange-500/10" },
                    { id: "bms", label: "BMs", count: bms?.length || 0, icon: Building2, color: "text-indigo-400", bg: "bg-indigo-500/10" },
                    { id: "contas", label: "Contas", count: accounts?.length || 0, icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/10" }
                ].map((card) => (
                    <button
                        key={card.id}
                        onClick={() => setActiveTab(activeTab === card.id ? "all" : card.id)}
                        className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all text-left group elevation-sm",
                            activeTab === card.id
                                ? "bg-zinc-900 border-zinc-700 ring-2 ring-zinc-800 ring-offset-2 ring-offset-zinc-950"
                                : "bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900"
                        )}
                    >
                        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", card.bg)}>
                            <card.icon className={cn("h-5 w-5", card.color)} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">{card.label}</p>
                            <p className="text-xl font-black text-white">{card.count}</p>
                        </div>
                        <div className={cn(
                            "ml-auto h-1.5 w-1.5 rounded-full",
                            activeTab === card.id ? "bg-zinc-300" : "bg-zinc-800"
                        )} />
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[300px] max-w-md group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                        <Input
                            placeholder="Buscar por nome, ID, email ou tag..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-10 bg-zinc-900/50 border-zinc-800 text-zinc-200 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant={(statusFilters.length > 0 || bmFilters.length > 0 || typeFilters.length > 0) ? "secondary" : "outline"}
                                    size="sm"
                                    className={cn(
                                        "h-10 px-4 gap-2 border-zinc-800",
                                        (statusFilters.length > 0 || bmFilters.length > 0 || typeFilters.length > 0) ? "bg-zinc-800 text-zinc-100" : "bg-transparent text-zinc-400 font-medium hover:bg-zinc-900"
                                    )}
                                >
                                    <Filter className="h-4 w-4" />
                                    Filtros
                                    {(statusFilters.length > 0 || bmFilters.length > 0 || typeFilters.length > 0) && (
                                        <Badge className="ml-1 h-5 w-5 p-0 justify-center bg-zinc-100 text-zinc-950 rounded-full text-[10px] font-bold">
                                            {statusFilters.length + typeFilters.length + bmFilters.length}
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
                                                    {[
                                                        { label: "Aquecimento", value: "aquecimento" },
                                                        { label: "Ativo", value: "ativo" },
                                                        { label: "Em Análise", value: "analise" },
                                                        { label: "Bloqueado", value: "bloqueado" },
                                                    ].map((opt) => (
                                                        <CommandItem
                                                            key={opt.value}
                                                            onSelect={() => toggleStatusFilter(opt.value)}
                                                            className="flex items-center px-2 py-1.5 cursor-pointer"
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
                                        <LayoutGrid className="mr-2 h-4 w-4 text-zinc-500" />
                                        <span>Tipo</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="p-0 border-zinc-800 bg-zinc-950">
                                        <Command className="bg-transparent">
                                            <CommandInput placeholder="Filtrar tipo..." className="h-9" />
                                            <CommandList>
                                                <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                                                <CommandGroup>
                                                    {[
                                                        { label: "Perfil", value: "perfil" },
                                                        { label: "BM", value: "bm" },
                                                        { label: "Conta", value: "conta" },
                                                        { label: "Página", value: "pagina" },
                                                    ].map((opt) => (
                                                        <CommandItem
                                                            key={opt.value}
                                                            onSelect={() => toggleTypeFilter(opt.value)}
                                                            className="flex items-center px-2 py-1.5 cursor-pointer"
                                                        >
                                                            <div
                                                                className={cn(
                                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-zinc-700",
                                                                    typeFilters.includes(opt.value) ? "bg-zinc-100 border-zinc-100" : "bg-transparent"
                                                                )}
                                                            >
                                                                {typeFilters.includes(opt.value) && (
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
                                        <span>BM Vinculada</span>
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
                                                                className="flex items-center px-2 py-1.5 cursor-pointer"
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

                                <DropdownMenuSeparator className="bg-zinc-800" />
                                <DropdownMenuItem
                                    onClick={() => {
                                        setStatusFilters([]);
                                        setTypeFilters([]);
                                        setBmFilters([]);
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
                                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
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

            <TooltipProvider>
                <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 overflow-hidden shadow-2xl backdrop-blur-sm">
                    <Table>
                        <TableHeader className="bg-zinc-950/50">
                            <TableRow className="border-zinc-800 hover:bg-transparent font-bold uppercase text-[10px] tracking-widest text-zinc-500">
                                <TableHead className="w-12 text-center">
                                    <Checkbox
                                        checked={filteredAssets.length > 0 && selected.size === filteredAssets.length}
                                        onCheckedChange={toggleAll}
                                        className="border-zinc-700 data-[state=checked]:bg-zinc-100 data-[state=checked]:text-zinc-950"
                                    />
                                </TableHead>
                                <TableHead className="py-4">Ativo</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead>Tags</TableHead>
                                <TableHead className="w-12 text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingProfiles || loadingBms || loadingAccounts ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-24 text-zinc-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-8 w-8 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
                                            <span className="text-sm font-medium">Sincronizando ativos...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredAssets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-24 text-zinc-600">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center opacity-20 ring-8 ring-zinc-900/50">
                                                <Search className="h-8 w-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Nenhum Ativo Encontrado</p>
                                                <p className="text-xs text-zinc-600 max-w-[200px]">Não encontramos registros para o filtro selecionado.</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                                                onClick={() => {
                                                    if (activeTab !== "all") {
                                                        setCreateType(activeTab === "perfis" ? "perfil" : activeTab === "bms" ? "bm" : "conta");
                                                        setShowCreateModal(true);
                                                    } else {
                                                        setSearch("");
                                                        setActiveTab("all");
                                                    }
                                                }}
                                            >
                                                {activeTab !== "all" ? `Criar Novo ${activeTab.slice(0, -1)}` : "Limpar Filtros"}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAssets.map((asset, index) => {
                                    const typeConfigs: Record<AssetType, { icon: any; color: string; bg: string; label: string; detailIcon: any }> = {
                                        perfil: { icon: User, color: "text-blue-400", bg: "bg-blue-500/10", label: "Perfil", detailIcon: Mail },
                                        pagina: { icon: Layout, color: "text-orange-400", bg: "bg-orange-500/10", label: "Página", detailIcon: Building2 },
                                        bm: { icon: Building2, color: "text-indigo-400", bg: "bg-indigo-500/10", label: "BM", detailIcon: Fingerprint },
                                        conta: { icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Conta", detailIcon: Briefcase },
                                    };
                                    const cfg = typeConfigs[asset.type];

                                    return (
                                        <TableRow
                                            key={`${asset.type}-${asset.id}`}
                                            className="border-zinc-800/50 hover:bg-zinc-900/50 cursor-pointer group/row transition-all"
                                            onClick={() => setSelectedAsset(asset)}
                                        >
                                            <TableCell
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleSelect(asset.id, index, e);
                                                }}
                                                className="py-4 cursor-pointer"
                                            >
                                                <Checkbox
                                                    checked={selected.has(asset.id)}
                                                    onCheckedChange={() => { }}
                                                    className="mx-auto block border-zinc-700 data-[state=checked]:bg-zinc-100 data-[state=checked]:text-zinc-950 pointer-events-none"
                                                />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-zinc-800 shadow-xl", cfg.bg)}>
                                                        <cfg.icon className={cn("h-5 w-5", cfg.color)} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-semibold text-zinc-100 truncate max-w-[240px] tracking-tight">{asset.name}</span>
                                                        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                                                            <cfg.detailIcon className="h-2.5 w-2.5 text-zinc-600" />
                                                            <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[200px] uppercase font-bold tracking-tight">
                                                                {asset.details}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getStatusBadge(asset.status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(asset.originalData as any).tags?.slice(0, 2).map((tag: string) => (
                                                        <Badge key={tag} variant="outline" className="text-[9px] font-bold px-1.5 h-5 bg-zinc-900 text-zinc-400 border-zinc-800 uppercase tracking-tighter">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {(asset.originalData as any).tags?.length > 2 && (
                                                        <span className="text-[10px] font-black text-zinc-700 px-1">+{(asset.originalData as any).tags.length - 2}</span>
                                                    )}
                                                    {!(asset.originalData as any).tags?.length && (
                                                        <span className="text-[10px] text-zinc-800 italic">—</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-4" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 opacity-0 group-hover/row:opacity-100 transition-all font-mono"
                                                                onClick={(e) => copyToClipboard(e, asset.id)}
                                                            >
                                                                <Fingerprint className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-zinc-800 text-zinc-200 border-zinc-700">Copiar ID de Ativo</TooltipContent>
                                                    </Tooltip>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 opacity-0 group-hover/row:opacity-100 transition-all">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-zinc-800 text-zinc-300">
                                                            <DropdownMenuItem onClick={() => setSelectedAsset(asset)} className="hover:bg-zinc-800 cursor-pointer">
                                                                <Edit className="h-4 w-4 mr-2 text-zinc-500" /> Detalhes/Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => setAssetToDelete(asset)}
                                                                className="text-red-400 focus:text-red-400 hover:bg-red-500/10 cursor-pointer"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" /> Deletar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </TooltipProvider>

            {/* Modals */}

            {/* Replacement for edit modals - integrated into AssetDetailModal */}

            {
                timelineEntity && (
                    <TimelineDrawer
                        entityType={timelineEntity.type}
                        entityId={timelineEntity.id}
                        entityName={timelineEntity.name}
                        onClose={() => setTimelineEntity(null)}
                    />
                )
            }

            {/* Creation Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="flex items-center gap-2">
                            {getTypeIcon(createType)}
                            Cadastrar {createType === "perfil" ? "Perfil" : createType === "bm" ? "BM" : "Conta"} em Massa
                        </DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="flex-1 p-6 overflow-y-auto">
                        <div className="space-y-6">
                            {/* Input Section */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Adicionar {createType === "perfil" ? "Perfis" : createType === "bm" ? "BMs" : "Contas"}
                                </Label>
                                <div className="relative">
                                    <Textarea
                                        value={inputList}
                                        onChange={(e) => setInputList(e.target.value)}
                                        placeholder={createType === "perfil"
                                            ? "Exemplo:\nPerfil Alpha 01, email@login.com\nPerfil Alpha 02"
                                            : createType === "bm"
                                                ? "Exemplo:\nBM Master 01, 1029384756\nBM Master 02"
                                                : "Exemplo:\nConta Principal 01, 11223344\nConta Principal 02"
                                        }
                                        rows={4}
                                        className="resize-none pr-24"
                                    />
                                    <AnimatePresence>
                                        {inputList.trim() && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="absolute right-2 bottom-2"
                                            >
                                                <Button size="sm" onClick={handleInsert} className="gap-1.5 shadow-sm">
                                                    <Send className="h-3.5 w-3.5" />
                                                    Inserir
                                                </Button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Formato: Nome, {createType === "perfil" ? "Email" : createType === "bm" ? "ID FB" : "ID Conta"} (opcional) separado por vírgula. Uma por linha.
                                </p>
                            </div>

                            {/* List Section */}
                            {stagedAssets.length > 0 && (
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold flex justify-between items-center">
                                        <span>Ativos para criar ({stagedAssets.length})</span>
                                        <Button variant="ghost" size="sm" onClick={() => setStagedAssets([])} className="text-xs text-destructive hover:text-destructive hover:bg-red-50 h-7">
                                            Limpar Tudo
                                        </Button>
                                    </Label>
                                    <div className="border rounded-lg overflow-hidden bg-muted/20">
                                        <div className="divide-y">
                                            {(showAllStaged ? stagedAssets : stagedAssets.slice(0, 3)).map((asset) => (
                                                <motion.div
                                                    key={asset.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex items-center justify-between p-3 bg-card"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{asset.name}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">
                                                            {createType === "perfil" ? asset.email_login : createType === "bm" ? asset.bm_id_facebook : asset.fb_account_id || ""}
                                                        </span>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => removeStaged(asset.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </motion.div>
                                            ))}
                                            {!showAllStaged && stagedAssets.length > 3 && (
                                                <button
                                                    onClick={() => setShowAllStaged(true)}
                                                    className="w-full py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors border-t"
                                                >
                                                    Ver todos os {stagedAssets.length} ativos
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Common Settings Section */}
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest pl-1">Configurações Comuns</h3>

                                {createType === "perfil" && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Status Inicial</Label>
                                            <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ativo">Ativo</SelectItem>
                                                    <SelectItem value="analise">Em Análise</SelectItem>
                                                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Data de Recebimento</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal h-9",
                                                            !formData.date_received && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {formData.date_received ? format(new Date(formData.date_received), "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={formData.date_received ? new Date(formData.date_received) : undefined}
                                                        onSelect={(date) => setFormData({ ...formData, date_received: date ? date.toISOString().split('T')[0] : "" })}
                                                        initialFocus
                                                        locale={ptBR}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
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
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-6 border-t bg-muted/30 flex gap-3">
                        <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Cancelar</Button>
                        <Button
                            onClick={handleCreateSubmit}
                            disabled={stagedAssets.length === 0 || createProfile.isPending || createBm.isPending || createAccount.isPending}
                            className="flex-1"
                        >
                            {createProfile.isPending || createBm.isPending || createAccount.isPending ? "Criando..." : `Criar ${stagedAssets.length} Ativos`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Modal (Unified) */}
            {
                selectedAsset && (
                    <AssetDetailModal
                        asset={currentSelectedAsset || selectedAsset}
                        onClose={() => setSelectedAsset(null)}
                    />
                )
            }

            {
                showBulkEdit && (
                    <BulkEditAssetsModal
                        selectedAssets={filteredAssets.filter(a => selected.has(a.id)).map(a => ({ id: a.id, type: a.type }))}
                        onClose={() => { setShowBulkEdit(false); setSelected(new Set()); }}
                    />
                )
            }

            <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
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

            <AlertDialog open={!!assetToDelete} onOpenChange={(open) => !open && setAssetToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Deseja realmente excluir o ativo <span className="font-bold">{assetToDelete?.name}</span>?
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSingleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Assets;
