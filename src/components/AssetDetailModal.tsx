import { useFbProfileLinks, useActivityLogs } from "@/hooks/useData";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Clock, Building2, ShieldCheck, Mail, Calendar, Ban, ArrowRight, LayoutGrid, CreditCard, Tags } from "lucide-react";

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
    role_in_bm: "Cargo na BM",
    date_received: "Data de Recebimento",
    date_blocked: "Data de Bloqueio",
    bm_id_facebook: "ID Facebook",
    bm_id: "BM Vinculada",
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
    return String(value);
};

const formatLogChanges = (changes: any, actionType: string): React.ReactNode => {
    if (!changes || typeof changes !== "object") return null;

    if (actionType === "create") {
        const relevantChanges = Object.entries(changes)
            .filter(([key, value]) => value !== null && value !== undefined);

        if (relevantChanges.length === 0) return null;

        return (
            <div className="mt-1.5 space-y-0.5">
                {relevantChanges.map(([key, value]) => (
                    <div key={key} className="text-[11px] text-muted-foreground">
                        <span className="font-medium text-gray-600">{fieldLabels[key] || key}:</span>{" "}
                        <span>{formatValue(value)}</span>
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
            <div className="mt-2 space-y-2">
                {updates.map(([key, change]: [string, any]) => (
                    <div key={key} className="text-[11px]">
                        <div className="font-medium text-gray-700 mb-0.5">
                            {fieldLabels[key] || key}:
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">
                                {formatValue(change.old)}
                            </span>
                            <ArrowRight className="h-2.5 w-2.5" />
                            <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100">
                                {formatValue(change.new)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return null;
};

const AssetDetailModal = ({ asset, onClose }: Props) => {
    // Only fetch links for profiles
    const { data: links } = useFbProfileLinks(asset.type === "perfil" ? asset.id : "");
    const { data: logs } = useActivityLogs(asset.type === "perfil" ? "profile" : asset.type, asset.id);

    const statusColors: Record<string, string> = {
        ativo: "bg-green-100 text-green-700",
        disponivel: "bg-green-100 text-green-700",
        analise: "bg-blue-100 text-blue-700",
        em_analise: "bg-blue-100 text-blue-700",
        bloqueado: "bg-red-100 text-red-700",
        caiu: "bg-red-100 text-red-700",
        restrita: "bg-orange-100 text-orange-700",
    };

    const getTypeIcon = () => {
        switch (asset.type) {
            case "perfil": return <User className="h-6 w-6 text-blue-500" />;
            case "bm": return <Building2 className="h-6 w-6 text-indigo-500" />;
            case "conta": return <CreditCard className="h-6 w-6 text-emerald-500" />;
            default: return <LayoutGrid className="h-6 w-6 text-primary" />;
        }
    };

    const getStatusText = () => {
        const s = asset.status.toLowerCase();
        if (s === 'analise' || s === 'em_analise') return 'EM ANÁLISE';
        return s.toUpperCase();
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl text-gray-800 p-0 overflow-hidden">
                <div className="flex h-[80vh]">
                    {/* Left Column: Details */}
                    <div className="flex-1 border-r bg-muted/5 p-6 overflow-y-auto">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                {getTypeIcon()}
                                Detalhes do {asset.type === "perfil" ? "Perfil" : asset.type === "bm" ? "BM" : "Conta"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-4 bg-background p-4 rounded-xl border shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            {getTypeIcon()}
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none mb-1">Nome do Ativo</p>
                                            <p className="text-base font-semibold">{asset.name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                                            <ShieldCheck className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none mb-1">Status Geral</p>
                                            <Badge variant="secondary" className={cn("text-[10px] font-bold py-0 h-5", statusColors[asset.status.toLowerCase()])}>
                                                {getStatusText()}
                                            </Badge>
                                        </div>
                                    </div>

                                    {asset.type === "perfil" && (
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center">
                                                <Mail className="h-5 w-5 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none mb-1">Email de Login</p>
                                                <p className="text-sm font-medium">{asset.originalData.email_login || "—"}</p>
                                            </div>
                                        </div>
                                    )}

                                    {asset.type === "bm" && (
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center">
                                                <LayoutGrid className="h-5 w-5 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none mb-1">ID Facebook</p>
                                                <p className="text-sm font-medium">{asset.originalData.bm_id_facebook || "—"}</p>
                                            </div>
                                        </div>
                                    )}

                                    {asset.type === "conta" && (
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center">
                                                <Building2 className="h-5 w-5 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none mb-1">BM Vinculada</p>
                                                <p className="text-sm font-medium">{asset.originalData.bm?.name || "—"}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {asset.type === "perfil" && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-background p-3 rounded-xl border shadow-sm">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Recebido em</p>
                                            </div>
                                            <p className="text-sm font-semibold">
                                                {asset.originalData.date_received ? format(new Date(asset.originalData.date_received), "dd/MM/yyyy") : "—"}
                                            </p>
                                        </div>
                                        {asset.status === "bloqueado" && (
                                            <div className="bg-red-50/50 p-3 rounded-xl border border-red-100 shadow-sm">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Ban className="h-3.5 w-3.5 text-red-500" />
                                                    <p className="text-[9px] text-red-500 uppercase font-bold tracking-widest">Bloqueado em</p>
                                                </div>
                                                <p className="text-sm font-semibold text-red-700">
                                                    {asset.originalData.date_blocked ? format(new Date(asset.originalData.date_blocked), "dd/MM/yyyy") : "—"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Tags Section */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                    <Tags className="h-3.5 w-3.5 text-primary" />
                                    Tags
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {asset.originalData.tags?.length > 0 ? asset.originalData.tags.map((tag: string) => (
                                        <Badge key={tag} variant="outline" className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 transition-colors">
                                            {tag}
                                        </Badge>
                                    )) : (
                                        <span className="text-xs text-muted-foreground italic">Nenhuma tag...</span>
                                    )}
                                </div>
                            </div>

                            {/* BM Links (Only for Perfil) */}
                            {asset.type === "perfil" && (
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                        <Building2 className="h-3.5 w-3.5 text-primary" />
                                        Vínculos Business Manager
                                    </h3>
                                    <div className="space-y-2">
                                        {links?.length ? links.map((link) => (
                                            <div key={link.id} className="p-3 bg-background border rounded-lg flex items-center justify-between shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded bg-muted/50 flex items-center justify-center font-bold text-xs">
                                                        {(link.bm as any)?.name?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <p className="text-sm font-semibold">{(link.bm as any)?.name}</p>
                                                </div>
                                                <Badge variant="outline" className="capitalize text-[10px] font-bold px-1.5 py-0 h-5 text-gray-600 bg-gray-50">
                                                    {link.role_in_bm || "anunciante"}
                                                </Badge>
                                            </div>
                                        )) : (
                                            <p className="text-xs text-muted-foreground italic">Nenhuma BM vinculada.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="pt-4 border-t border-muted">
                                <p className="text-[10px] text-muted-foreground flex flex-col gap-1">
                                    <span>Criado por <span className="font-semibold text-foreground text-gray-800">{asset.originalData.creator?.name || "Sistema"}</span></span>
                                    <span>Em {format(new Date(asset.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: History */}
                    <div className="w-[450px] flex flex-col bg-background">
                        <div className="p-6 border-b">
                            <h3 className="text-base font-bold flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Histórico de Atividade
                            </h3>
                        </div>
                        <ScrollArea className="flex-1 p-6">
                            <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-muted ml-1">
                                {logs?.length ? logs.map((log) => (
                                    <div key={log.id} className="relative pl-8">
                                        <div className="absolute left-[-5px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background z-10" />
                                        <div className="bg-muted/30 p-4 rounded-xl border border-transparent hover:border-muted/20 transition-all shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-bold text-foreground text-gray-800">{log.user_name || "Sistema"}</p>
                                                <p className="text-[10px] font-medium text-muted-foreground">
                                                    {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-1">
                                                {log.action_type === "create" ? `Criou o(a) ${asset.type}` : log.action_type === "update" ? `Alterou o(a) ${asset.type}` : `Excluiu o(a) ${asset.type}`}
                                            </p>
                                            {formatLogChanges(log.changes, log.action_type)}
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-xs text-muted-foreground italic ml-8">Nenhuma atividade registrada.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AssetDetailModal;
