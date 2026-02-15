import { useFbProfileLinks, useActivityLogs } from "@/hooks/useData";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    User, Clock, Building2, ShieldCheck, Mail, Calendar,
    Ban, ArrowRight, LayoutGrid, CreditCard, Tags, Copy,
    ChevronRight, CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AssetData {
    id: string;
    name: string;
    type: "perfil" | "bm" | "conta";
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
    bm_id_facebook: "ID Facebook",
    bm_id: "BM Vinculada",
    tags: "Tags"
};

const statusLabels: Record<string, string> = {
    disponivel: "Disponível",
    em_uso: "Em Uso",
    caiu: "Caiu",
    restrita: "Restrita",
    ativo: "Ativo",
    analise: "Em Análise",
    bloqueado: "Bloqueado",
    administrador: "Administrador",
    anunciante: "Anunciante",
    rejeitado: "Rejeitado",
    desativado: "Desativado",
    em_analise: "Em Análise",
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
    const { data: links } = useFbProfileLinks(asset.type === "perfil" ? asset.id : "");
    const { data: logs } = useActivityLogs(asset.type === "perfil" ? "profile" : asset.type, asset.id);
    const { toast } = useToast();

    const statusConfig: Record<string, { color: string; bg: string }> = {
        ativo: { color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
        disponivel: { color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
        analise: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
        em_analise: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
        bloqueado: { color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
        caiu: { color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
        restrita: { color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
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
                                <div className="space-y-1.5">
                                    <h2 className="text-2xl font-bold tracking-tight text-zinc-100">{asset.name}</h2>
                                    <div className={cn(
                                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors",
                                        currentStatusConfig.bg,
                                        currentStatusConfig.color
                                    )}>
                                        <div className={cn("h-1.5 w-1.5 rounded-full mr-1.5 animate-pulse", currentStatusConfig.color.replace('text-', 'bg-'))} />
                                        {statusLabels[asset.status] || asset.status.toUpperCase()}
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

                                        {asset.originalData.date_blocked && (
                                            <div className="flex items-center gap-3 py-1 text-red-400">
                                                <div className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                                    <Ban className="h-4 w-4" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">Bloqueado em</p>
                                                    <p className="text-sm font-medium font-mono">
                                                        {format(new Date(asset.originalData.date_blocked), "dd/MM/yyyy")}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                                {asset.originalData.tags && asset.originalData.tags.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 px-1 text-zinc-500">
                                            <Tags className="h-3 w-3" />
                                            <p className="text-[10px] uppercase font-bold tracking-widest">Tags</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {asset.originalData.tags.map((tag: string) => (
                                                <Badge key={tag} variant="outline" className="bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-100 transition-colors uppercase text-[9px] px-2 py-0 h-5 tracking-wider">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
