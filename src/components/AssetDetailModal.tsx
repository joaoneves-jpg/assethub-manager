import { useState } from "react";
import { useFbProfileLinks, useActivityLogs, useUpdatePage, useUpdateBm, useUpdateAdAccount, useUpdateFbProfile, useBms, useAdAccounts } from "@/hooks/useData";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import {
    User, Clock, Building2, ShieldCheck, Mail, Calendar,
    Ban, ArrowRight, LayoutGrid, CreditCard, Tags, Copy,
    ChevronRight, CheckCircle2, Plus, X, Edit2, Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTeamMembers, useLogActivity } from "@/hooks/useData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComp } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";

interface AssetData {
    id: string;
    name: string;
    type: "perfil" | "bm" | "conta" | "pagina";
    status: string;
    details: string;
    originalData: any;
    created_at: string;
}

interface Props {
    asset: AssetData;
    onClose: () => void;
}

const fieldLabels: Record<string, string> = {
    name: "Nome",
    status: "Status",
    email_login: "Email de Login",
    profile_link: "Link do Perfil",
    role_in_bm: "Cargo",
    date_received: "Data de Recebimento",
    date_blocked: "Bloqueado em",
    bm_id_facebook: "ID Facebook (BM)",
    fb_account_id: "ID da Conta",
    bm_id: "BM Vinculada",
    tags: "Tags",
    current_bm_id: "BM em Uso",
    current_ad_account_id: "Conta de Anúncio",
    current_manager_id: "Gestor",
    usage_date: "Data de Uso",
    account_status: "Status da Conta",
    origin_bm_id: "BM de Origem",
    url: "URL",
    fb_page_id: "ID da Página"
};

const statusLabels: Record<string, string> = {
    disponivel: "Disponível",
    em_uso: "Em Uso",
    caiu: "Caiu",
    bloqueado: "Bloqueado",
    ativo: "Ativo",
    analise: "Em Análise",
    administrador: "Administrador",
    anunciante: "Anunciante",
    rejeitado: "Rejeitado",
    desativado: "Desativado",
    em_analise: "Em Análise",
    aquecimento: "Aquecimento",
};

const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "string") {
        return statusLabels[value] || value;
    }
    if (typeof value === "boolean") return value ? "Sim" : "Não";
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
};

const formatLogChanges = (changes: any, actionType: string): React.ReactNode => {
    if (!changes || typeof changes !== "object") return null;

    if (actionType === "create") {
        const relevantChanges = Object.entries(changes)
            .filter(([key, value]) => value !== null && value !== undefined && key !== "team_id" && key !== "creator_id");

        if (relevantChanges.length === 0) return null;

        return (
            <div className="mt-1 space-y-0.5">
                {relevantChanges.map(([key, value]) => (
                    <div key={key} className="text-[11px] flex gap-1.5 items-baseline">
                        <span className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider min-w-[70px]">{fieldLabels[key] || key}:</span>
                        <ArrowRight className="h-2.5 w-2.5 text-zinc-400" />
                        <span className="text-zinc-300">{formatValue(value)}</span>
                    </div>
                ))}
            </div>
        );
    }

    if (actionType === "update") {
        const updates = Object.entries(changes).filter(([, value]) => {
            return value && typeof value === "object" && "old" in value && "new" in value;
        });

        if (updates.length === 0) return null;

        return (
            <div className="mt-1 space-y-1">
                {updates.map(([key, change]: [string, any]) => (
                    <div key={key} className="text-[11px] flex flex-wrap gap-x-1.5 items-center">
                        <span className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider min-w-[70px]">{fieldLabels[key] || key}:</span>
                        <span className="text-red-400/80 line-through decoration-red-400/50">{formatValue(change.old)}</span>
                        <ArrowRight className="h-2.5 w-2.5 text-zinc-600" />
                        <span className="text-emerald-400 font-medium">{formatValue(change.new)}</span>
                    </div>
                ))}
            </div>
        );
    }

    return null;
};

const AssetDetailModal = ({ asset, onClose }: Props) => {
    const entityTypeMap: Record<string, string> = {
        perfil: "profile",
        pagina: "page",
        bm: "bm",
        conta: "ad_account"
    };

    const { data: links } = useFbProfileLinks(asset.type === "perfil" ? asset.id : "");
    const { data: logs } = useActivityLogs(entityTypeMap[asset.type] || asset.type, asset.id);
    const { toast } = useToast();

    const updatePage = useUpdatePage();
    const updateBm = useUpdateBm();
    const updateAdAccount = useUpdateAdAccount();
    const updateFbProfile = useUpdateFbProfile();

    const [tags, setTags] = useState<string[]>(asset.originalData.tags || []);
    const [newTag, setNewTag] = useState("");
    const [isAddingTag, setIsAddingTag] = useState(false);

    const { data: members } = useTeamMembers();
    const logActivity = useLogActivity();
    const { user: authUser } = useAuth();

    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(asset.name);
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [editedStatus, setEditedStatus] = useState(asset.status === 'restrita' ? 'bloqueado' : asset.status);
    const [editedBlockedDate, setEditedBlockedDate] = useState(asset.originalData.date_blocked ? new Date(asset.originalData.date_blocked) : new Date());
    const [isEditingManager, setIsEditingManager] = useState(false);
    const [editedManagerId, setEditedManagerId] = useState(asset.originalData.current_manager_id || asset.originalData.manager_id || "none");
    const [isEditingBm, setIsEditingBm] = useState(false);
    const [editedBmId, setEditedBmId] = useState(asset.originalData.current_bm_id || "none");
    const [isEditingAdAccount, setIsEditingAdAccount] = useState(false);
    const [editedAdAccountId, setEditedAdAccountId] = useState(asset.originalData.current_ad_account_id || "none");
    const [isEditingUsageDate, setIsEditingUsageDate] = useState(false);
    const [editedUsageDate, setEditedUsageDate] = useState(asset.originalData.usage_date ? new Date(asset.originalData.usage_date) : new Date());

    const { data: bms } = useBms();
    const { data: adAccounts } = useAdAccounts();

    const handleUpdateField = async (field: string, value: any) => {
        try {
            const updates: any = { [field]: value };

            // If setting status to blocked, also send date_blocked
            if (field === 'status' && value === 'bloqueado') {
                updates.date_blocked = editedBlockedDate.toISOString();
            }

            if (asset.type === "pagina") {
                await updatePage.mutateAsync({ id: asset.id, updates });
            } else if (asset.type === "bm") {
                await updateBm.mutateAsync({ id: asset.id, updates });
            } else if (asset.type === "conta") {
                await updateAdAccount.mutateAsync({ id: asset.id, updates });
            } else if (asset.type === "perfil") {
                await updateFbProfile.mutateAsync({ id: asset.id, updates: updates as any });
            }

            const oldVal = field === 'status' ? asset.status : (asset.originalData[field] || asset.name);
            await logActivity.mutateAsync({
                entity_type: entityTypeMap[asset.type] as any,
                entity_id: asset.id,
                action_type: "update",
                changes: { [field]: { old: oldVal, new: value } }
            });

            toast({ title: "Atualizado com sucesso!" });
            return true;
        } catch (error) {
            toast({ title: "Erro ao atualizar.", variant: "destructive" });
            return false;
        }
    };

    const handleSaveName = async () => {
        if (editedName.trim() === asset.name) {
            setIsEditingName(false);
            return;
        }
        const success = await handleUpdateField('name', editedName.trim());
        if (success) setIsEditingName(false);
    };

    const handleSaveStatus = async () => {
        const success = await handleUpdateField('status', editedStatus);
        if (success) setIsEditingStatus(false);
    };

    const handleSaveManager = async () => {
        const val = editedManagerId === "none" ? null : editedManagerId;
        const field = asset.type === "perfil" ? "manager_id" : "current_manager_id";
        const success = await handleUpdateField(field, val);
        if (success) setIsEditingManager(false);
    };

    const handleSaveBm = async () => {
        const val = editedBmId === "none" ? null : editedBmId;
        const field = asset.type === "conta" ? "bm_id" : "current_bm_id";
        const success = await handleUpdateField(field, val);
        if (success) setIsEditingBm(false);
    };

    const handleSaveAdAccount = async () => {
        const val = editedAdAccountId === "none" ? null : editedAdAccountId;
        const success = await handleUpdateField('current_ad_account_id', val);
        if (success) setIsEditingAdAccount(false);
    };

    const handleSaveUsageDate = async () => {
        const success = await handleUpdateField('usage_date', editedUsageDate.toISOString());
        if (success) setIsEditingUsageDate(false);
    };

    const handleAddTag = async () => {
        if (!newTag.trim()) return;
        const tagToAdd = newTag.trim();

        if (tags.some((t: string) => t.toLowerCase() === tagToAdd.toLowerCase())) {
            toast({ title: "Esta tag já existe.", variant: "destructive" });
            return;
        }

        const updatedTags = [...tags, tagToAdd];

        try {
            if (asset.type === "pagina") {
                await updatePage.mutateAsync({ id: asset.id, updates: { tags: updatedTags } });
            } else if (asset.type === "bm") {
                await updateBm.mutateAsync({ id: asset.id, updates: { tags: updatedTags } });
            } else if (asset.type === "conta") {
                await updateAdAccount.mutateAsync({ id: asset.id, updates: { tags: updatedTags } });
            } else if (asset.type === "perfil") {
                await updateFbProfile.mutateAsync({ id: asset.id, updates: { tags: updatedTags } as any });
            }
            setTags(updatedTags);
            setNewTag("");
            setIsAddingTag(false);
            toast({ title: "Tag adicionada com sucesso!" });
        } catch (error) {
            toast({ title: "Erro ao adicionar tag.", variant: "destructive" });
        }
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        const updatedTags = tags.filter((t: string) => t !== tagToRemove);

        try {
            if (asset.type === "pagina") {
                await updatePage.mutateAsync({ id: asset.id, updates: { tags: updatedTags } });
            } else if (asset.type === "bm") {
                await updateBm.mutateAsync({ id: asset.id, updates: { tags: updatedTags } });
            } else if (asset.type === "conta") {
                await updateAdAccount.mutateAsync({ id: asset.id, updates: { tags: updatedTags } });
            } else if (asset.type === "perfil") {
                await updateFbProfile.mutateAsync({ id: asset.id, updates: { tags: updatedTags } as any });
            }
            setTags(updatedTags);
            toast({ title: "Tag removida com sucesso!" });
        } catch (error) {
            toast({ title: "Erro ao remover tag.", variant: "destructive" });
        }
    };

    const statusConfig: Record<string, { color: string; bg: string }> = {
        bloqueado: { color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
        caiu: { color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
        restrita: { color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
        aquecimento: { color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20" },
        em_uso: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
        analise: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
        em_analise: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
        ativo: { color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
        disponivel: { color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
    };

    const getTypeIcon = (size = "h-6 w-6") => {
        switch (asset.type) {
            case "perfil": return <User className={cn(size, "text-blue-500")} />;
            case "bm": return <Building2 className={cn(size, "text-indigo-500")} />;
            case "conta": return <CreditCard className={cn(size, "text-emerald-500")} />;
            default: return <LayoutGrid className={cn(size, "text-zinc-500")} />;
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado para a área de transferência" });
    };

    const groupedLogs = logs?.reduce((acc: any[], log) => {
        const logDate = new Date(log.created_at);
        const logTimeStr = format(logDate, "HH:mm");
        const logDateStr = format(logDate, "dd/MM/yyyy");
        const lastGroup = acc[acc.length - 1];

        if (lastGroup && lastGroup.user === (log.user_name || "Sistema") && lastGroup.date === logDateStr && lastGroup.time === logTimeStr) {
            lastGroup.items.push(log);
        } else {
            acc.push({
                user: log.user_name || "Sistema",
                date: logDateStr,
                time: logTimeStr,
                items: [log]
            });
        }
        return acc;
    }, []) || [];

    const currentStatusConfig = statusConfig[asset.status.toLowerCase()] || { color: "text-zinc-500", bg: "bg-zinc-500/10 border-zinc-500/20" };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-zinc-950 border-zinc-800 rounded-xl">
                <div className="flex h-[80vh] bg-zinc-950 text-zinc-100">
                    {/* Left Column: Details */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-8 space-y-10">
                            {/* Hero Section */}
                            <div className="flex items-center gap-6">
                                <div className="h-20 w-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
                                    {getTypeIcon("h-10 w-10")}
                                </div>
                                <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center justify-between group/name">
                                        {isEditingName ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={editedName}
                                                    onChange={(e) => setEditedName(e.target.value)}
                                                    className="h-8 text-lg font-bold bg-zinc-900 border-zinc-700 w-64"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveName();
                                                        if (e.key === 'Escape') { setIsEditingName(false); setEditedName(asset.name); }
                                                    }}
                                                />
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleSaveName}>
                                                    <Check className="h-4 w-4 text-emerald-500" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setIsEditingName(false); setEditedName(asset.name); }}>
                                                    <X className="h-4 w-4 text-zinc-500" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-2xl font-bold tracking-tight text-zinc-100">{asset.name}</h2>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover/name:opacity-100 transition-opacity"
                                                    onClick={() => setIsEditingName(true)}
                                                >
                                                    <Edit2 className="h-3 w-3 text-zinc-500" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 group/status">
                                        {isEditingStatus ? (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Select value={editedStatus} onValueChange={setEditedStatus}>
                                                        <SelectTrigger className="h-7 w-36 text-[10px] font-bold uppercase tracking-wider bg-zinc-900 border-zinc-700">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                                            <SelectItem value="disponivel">Disponível</SelectItem>
                                                            <SelectItem value="em_uso">Em Uso</SelectItem>
                                                            <SelectItem value="caiu">Caiu</SelectItem>
                                                            <SelectItem value="bloqueado">Bloqueado</SelectItem>
                                                            <SelectItem value="ativo">Ativo</SelectItem>
                                                            <SelectItem value="analise">Em Análise</SelectItem>
                                                            <SelectItem value="aquecimento">Aquecimento</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSaveStatus}>
                                                        <Check className="h-4 w-4 text-emerald-500" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setIsEditingStatus(false); setEditedStatus(asset.status === 'restrita' ? 'bloqueado' : asset.status); }}>
                                                        <X className="h-4 w-4 text-zinc-500" />
                                                    </Button>
                                                </div>

                                                {editedStatus === 'bloqueado' && (
                                                    <div className="flex flex-col gap-1">
                                                        <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest pl-1">Bloqueado em:</p>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-36 justify-start text-left font-normal h-7 text-[10px] bg-zinc-900 border-zinc-700",
                                                                        !editedBlockedDate && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    <Calendar className="mr-2 h-3 w-3" />
                                                                    {editedBlockedDate ? format(editedBlockedDate, "dd/MM/yyyy") : <span>Selecione a data</span>}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                <CalendarComp
                                                                    mode="single"
                                                                    selected={editedBlockedDate}
                                                                    onSelect={(date) => date && setEditedBlockedDate(date)}
                                                                    initialFocus
                                                                    locale={ptBR}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div
                                                className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer hover:brightness-110",
                                                    currentStatusConfig.bg,
                                                    currentStatusConfig.color
                                                )}
                                                onClick={() => setIsEditingStatus(true)}
                                            >
                                                <div className={cn("h-1.5 w-1.5 rounded-full mr-1.5 animate-pulse", currentStatusConfig.color.replace('text-', 'bg-'))} />
                                                {statusLabels[asset.status === 'restrita' ? 'bloqueado' : asset.status] || asset.status.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Property List */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    {asset.originalData.email_login && (
                                        <div className="flex items-center justify-between group py-1">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                                    <Mail className="h-4 w-4 text-zinc-500" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Email de Login</p>
                                                    <p className="text-sm font-medium text-zinc-200">{asset.originalData.email_login}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800"
                                                onClick={() => copyToClipboard(asset.originalData.email_login)}
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="flex items-center gap-3 py-1">
                                            <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                                <Calendar className="h-4 w-4 text-zinc-500" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Recebido em</p>
                                                <p className="text-sm font-medium text-zinc-200">
                                                    {asset.originalData.date_received ? format(new Date(asset.originalData.date_received), "dd 'de' MMMM, yyyy", { locale: ptBR }) : "—"}
                                                </p>
                                            </div>
                                        </div>

                                        {(asset.status === "bloqueado" || asset.status === "restrita" || asset.originalData.date_blocked) && (
                                            <div className="flex items-center gap-3 py-1 text-red-400">
                                                <div className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                                    <Ban className="h-4 w-4" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">Bloqueado em</p>
                                                    <p className="text-sm font-medium font-mono">
                                                        {asset.originalData.date_blocked ? format(new Date(asset.originalData.date_blocked), "dd/MM/yyyy") : "—"}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between group/manager py-1 border-t border-zinc-800/20 pt-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                                <ShieldCheck className="h-4 w-4 text-zinc-500" />
                                            </div>
                                            <div className="space-y-0.5 min-w-[140px]">
                                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Gestor Responsável</p>
                                                {isEditingManager ? (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Select value={editedManagerId} onValueChange={setEditedManagerId}>
                                                            <SelectTrigger className="h-7 text-xs bg-zinc-900 border-zinc-700">
                                                                <SelectValue placeholder="Selecionar gestor" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                                                <SelectItem value="none">Nenhum</SelectItem>
                                                                {members?.map((m) => (
                                                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSaveManager}>
                                                            <Check className="h-4 w-4 text-emerald-500" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setIsEditingManager(false); setEditedManagerId(asset.originalData.current_manager_id || asset.originalData.manager_id || "none"); }}>
                                                            <X className="h-4 w-4 text-zinc-500" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-medium text-zinc-200">
                                                        {asset.originalData.manager?.name || asset.originalData.creator?.name || "Sistema"}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {!isEditingManager && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover/manager:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-100"
                                                onClick={() => setIsEditingManager(true)}
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>

                                    {(asset.status === 'em_uso' || asset.originalData.current_bm_id || asset.originalData.bm_id) && (
                                        <div className="flex items-center justify-between group/bm py-1 border-t border-zinc-800/20 pt-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                                    <Building2 className="h-4 w-4 text-zinc-500" />
                                                </div>
                                                <div className="space-y-0.5 min-w-[140px]">
                                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                                                        {asset.type === "conta" ? "BM Matriz" : "BM em Uso"}
                                                    </p>
                                                    {isEditingBm ? (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Select value={editedBmId} onValueChange={setEditedBmId}>
                                                                <SelectTrigger className="h-7 text-xs bg-zinc-900 border-zinc-700">
                                                                    <SelectValue placeholder="Selecionar BM" />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                                                    <SelectItem value="none">Nenhuma</SelectItem>
                                                                    {bms?.map((b) => (
                                                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSaveBm}>
                                                                <Check className="h-4 w-4 text-emerald-500" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setIsEditingBm(false); setEditedBmId(asset.originalData.current_bm_id || asset.originalData.bm_id || "none"); }}>
                                                                <X className="h-4 w-4 text-zinc-500" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm font-medium text-zinc-200">
                                                            {asset.originalData.current_bm?.name || asset.originalData.bm?.name || "—"}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {!isEditingBm && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover/bm:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-100"
                                                    onClick={() => setIsEditingBm(true)}
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {(asset.status === 'em_uso' || asset.originalData.current_ad_account_id) && (
                                        <div className="flex items-center justify-between group/account py-1 border-t border-zinc-800/20 pt-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                                    <CreditCard className="h-4 w-4 text-zinc-500" />
                                                </div>
                                                <div className="space-y-0.5 min-w-[140px]">
                                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Conta de Anúncio</p>
                                                    {isEditingAdAccount ? (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Select value={editedAdAccountId} onValueChange={setEditedAdAccountId}>
                                                                <SelectTrigger className="h-7 text-xs bg-zinc-900 border-zinc-700">
                                                                    <SelectValue placeholder="Selecionar conta" />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                                                    <SelectItem value="none">Nenhuma</SelectItem>
                                                                    {adAccounts?.map((a) => (
                                                                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSaveAdAccount}>
                                                                <Check className="h-4 w-4 text-emerald-500" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setIsEditingAdAccount(false); setEditedAdAccountId(asset.originalData.current_ad_account_id || "none"); }}>
                                                                <X className="h-4 w-4 text-zinc-500" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm font-medium text-zinc-200">
                                                            {asset.originalData.current_ad_account?.name || "—"}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {!isEditingAdAccount && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover/account:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-100"
                                                    onClick={() => setIsEditingAdAccount(true)}
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {(asset.status === 'em_uso' || asset.originalData.usage_date) && (
                                        <div className="flex items-center justify-between group/date py-1 border-t border-zinc-800/20 pt-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                                    <Clock className="h-4 w-4 text-zinc-500" />
                                                </div>
                                                <div className="space-y-0.5 min-w-[140px]">
                                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Data de Uso</p>
                                                    {isEditingUsageDate ? (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant={"outline"}
                                                                        className={cn(
                                                                            "w-36 justify-start text-left font-normal h-7 text-[10px] bg-zinc-900 border-zinc-700",
                                                                            !editedUsageDate && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        <Calendar className="mr-2 h-3 w-3" />
                                                                        {editedUsageDate ? format(editedUsageDate, "dd/MM/yyyy") : <span>Selecione a data</span>}
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                    <CalendarComp
                                                                        mode="single"
                                                                        selected={editedUsageDate}
                                                                        onSelect={(date) => date && setEditedUsageDate(date)}
                                                                        initialFocus
                                                                        locale={ptBR}
                                                                    />
                                                                </PopoverContent>
                                                            </Popover>
                                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSaveUsageDate}>
                                                                <Check className="h-4 w-4 text-emerald-500" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setIsEditingUsageDate(false); setEditedUsageDate(asset.originalData.usage_date ? new Date(asset.originalData.usage_date) : new Date()); }}>
                                                                <X className="h-4 w-4 text-zinc-500" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm font-medium text-zinc-200">
                                                            {asset.originalData.usage_date ? format(new Date(asset.originalData.usage_date), "dd/MM/yyyy") : "—"}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {!isEditingUsageDate && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover/date:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-100"
                                                    onClick={() => setIsEditingUsageDate(true)}
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* BM / Account Links */}
                                {asset.type === "perfil" && links && links.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest px-1">Business Managers Vinculadas</p>
                                        <div className="space-y-2">
                                            {links.map((link) => (
                                                <div key={link.id} className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                                            {(link.bm as any)?.name?.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-semibold text-zinc-200">{(link.bm as any)?.name}</p>
                                                            <p className="text-[10px] text-zinc-500 uppercase font-medium">{link.role_in_bm || "anunciante"}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {asset.type === "conta" && asset.originalData.bm && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest px-1">BM Matriz</p>
                                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                                    {asset.originalData.bm.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <p className="text-sm font-semibold text-zinc-200">{asset.originalData.bm.name}</p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                )}

                                {/* Tags */}
                                {/* Tags */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 px-1 text-zinc-500">
                                            <Tags className="h-3 w-3" />
                                            <p className="text-[10px] uppercase font-bold tracking-widest">Tags</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-100"
                                            onClick={() => setIsAddingTag(!isAddingTag)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {isAddingTag && (
                                        <div className="flex gap-2 animate-in slide-in-from-top-2 duration-200">
                                            <Input
                                                value={newTag}
                                                onChange={(e) => setNewTag(e.target.value)}
                                                placeholder="Nova tag..."
                                                className="h-8 text-xs bg-zinc-900/50 border-zinc-800"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleAddTag();
                                                    if (e.key === "Escape") setIsAddingTag(false);
                                                }}
                                                autoFocus
                                            />
                                            <Button size="sm" onClick={handleAddTag} className="h-8 px-3">
                                                Adicionar
                                            </Button>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {tags.length > 0 ? (
                                            tags.map((tag: string) => (
                                                <Badge
                                                    key={tag}
                                                    variant="outline"
                                                    className="group bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-100 hover:border-zinc-700 transition-all uppercase text-[9px] px-2 py-0 h-6 tracking-wider flex items-center gap-1.5 pr-1.5"
                                                >
                                                    {tag}
                                                    <div
                                                        className="h-3.5 w-3.5 rounded-full hover:bg-zinc-800 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveTag(tag);
                                                        }}
                                                    >
                                                        <X className="h-2.5 w-2.5" />
                                                    </div>
                                                </Badge>
                                            ))
                                        ) : (
                                            !isAddingTag && (
                                                <p className="text-xs text-zinc-600 italic px-1">Nenhuma tag adicionada.</p>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Metadata Footer */}
                            <div className="pt-6 border-t border-zinc-800/50">
                                <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                                    Ativo registrado por <span className="text-zinc-400">{asset.originalData.creator?.name || "Sistema"}</span>
                                    <br />
                                    Criado em {format(new Date(asset.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: History */}
                    <div className="w-[380px] bg-zinc-900/30 border-l border-zinc-800/50 flex flex-col">
                        <div className="p-6 border-b border-zinc-800/50 bg-zinc-950/20">
                            <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-100 uppercase tracking-widest">
                                <Clock className="h-4 w-4 text-zinc-500" />
                                Histórico
                            </h3>
                        </div>
                        <ScrollArea className="flex-1">
                            {groupedLogs.length > 0 ? (
                                <div className="p-6 space-y-8 relative before:absolute before:inset-y-0 before:left-[31px] before:w-[1px] before:bg-zinc-800/50">
                                    {groupedLogs.map((group, idx) => (
                                        <div key={idx} className="relative pl-10 group">
                                            <div className="absolute left-[-2px] top-1.5 h-1.5 w-1.5 rounded-full bg-zinc-700 border border-zinc-600 group-hover:bg-primary transition-colors z-10" />

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-tight">{group.user}</p>
                                                    <p className="text-[10px] font-medium text-zinc-500 font-mono tracking-tighter">
                                                        {group.date} • {group.time}
                                                    </p>
                                                </div>

                                                <div className="space-y-3">
                                                    {group.items.map((log: any) => (
                                                        <div key={log.id} className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                {log.action_type === 'create' ? <CheckCircle2 className="h-3 w-3 text-zinc-600" /> : <ShieldCheck className="h-3 w-3 text-zinc-600" />}
                                                                <p className="text-[10px] text-zinc-500 font-medium">
                                                                    {log.action_type === "create" ? "Criação de Ativo" : log.action_type === "update" ? "Atualização de dados" : "Exclusão"}
                                                                </p>
                                                            </div>
                                                            {formatLogChanges(log.changes, log.action_type)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                                    <Clock className="h-8 w-8 text-zinc-800" />
                                    <p className="text-xs text-zinc-600 font-medium">Nenhuma atividade registrada.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AssetDetailModal;
