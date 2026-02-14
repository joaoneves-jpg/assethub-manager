import { useActivityLogs } from "@/hooks/useData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Layout,
    Clock,
    Building2,
    ShieldCheck,
    User,
    Calendar,
    CreditCard,
    Fingerprint,
    ArrowRight
} from "lucide-react";
import type { Page } from "@/hooks/useData";

interface Props {
    page: Page;
    onClose: () => void;
}

const fieldLabels: Record<string, string> = {
    name: "Nome",
    status: "Status",
    current_bm_id: "BM em Uso",
    current_ad_account_id: "Conta de Anúncio",
    current_manager_id: "Gestor",
    usage_date: "Data de Uso",
    account_status: "Status da Conta",
    origin_bm_id: "BM de Origem",
    fb_page_id: "ID da Página",
    current_fb_profile_id: "Perfil",
};

const statusLabels: Record<string, string> = {
    disponivel: "Disponível",
    em_uso: "Em Uso",
    caiu: "Caiu",
    restrita: "Restrita",
};

const statusColors: Record<string, string> = {
    disponivel: "bg-green-100 text-green-700 border-green-200",
    em_uso: "bg-blue-100 text-blue-700 border-blue-200",
    caiu: "bg-red-100 text-red-700 border-red-200",
    restrita: "bg-amber-100 text-amber-700 border-amber-200",
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

const PageDetailModal = ({ page, onClose }: Props) => {
    const { data: logs } = useActivityLogs("page", page.id);

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl text-gray-800 max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Layout className="h-5 w-5 text-primary" />
                        Detalhes da Página
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-y-auto pr-4 -mr-4">
                    <div className="space-y-6 pb-4">
                        {/* Status and Name Card */}
                        <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-lg font-bold">{page.name}</h2>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Fingerprint className="h-3 w-3" />
                                        <span>ID: {page.fb_page_id || "Não informado"}</span>
                                    </div>
                                </div>
                                <Badge variant="outline" className={`${statusColors[page.status]} capitalize px-3 py-1`}>
                                    {statusLabels[page.status] || page.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">BM Matriz</p>
                                        <p className="text-sm font-medium">{(page.origin_bm as any)?.name || "—"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Criada em</p>
                                        <p className="text-sm font-medium">{format(new Date(page.created_at), "dd/MM/yyyy")}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Usage Info Section */}
                        {page.status === "em_uso" && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest pl-1">Informações de Uso</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg border bg-blue-50/20 space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold uppercase tracking-tight">
                                            <Building2 className="h-3 w-3" />
                                            BM em Uso
                                        </div>
                                        <p className="text-sm font-medium">{(page.current_bm as any)?.name || "—"}</p>
                                    </div>
                                    <div className="p-3 rounded-lg border bg-purple-50/20 space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs text-purple-700 font-semibold uppercase tracking-tight">
                                            <CreditCard className="h-3 w-3" />
                                            Conta de Anúncio
                                        </div>
                                        <p className="text-sm font-medium">{(page.current_ad_account as any)?.name || "—"}</p>
                                    </div>
                                    <div className="p-3 rounded-lg border bg-amber-50/20 space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold uppercase tracking-tight">
                                            <User className="h-3 w-3" />
                                            Perfil Vinculado
                                        </div>
                                        <p className="text-sm font-medium">{page.fb_profile?.name || "—"}</p>
                                    </div>
                                    <div className="p-3 rounded-lg border bg-green-50/20 space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold uppercase tracking-tight">
                                            <ShieldCheck className="h-3 w-3" />
                                            Gestor
                                        </div>
                                        <p className="text-sm font-medium">{(page.manager as any)?.name || "—"}</p>
                                    </div>
                                    <div className="p-3 rounded-lg border bg-gray-50/30 col-span-2 space-y-1 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold uppercase tracking-tight">
                                                <Calendar className="h-3 w-3" />
                                                Data de Início de Uso
                                            </div>
                                            <p className="text-sm font-medium">{page.usage_date ? format(new Date(page.usage_date), "dd/MM/yyyy") : "—"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* History Section */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest pl-1">Histórico de Atividade</h3>
                            <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-3.5 before:w-px before:bg-muted ml-1">
                                {logs?.length ? logs.map((log) => (
                                    <div key={log.id} className="relative pl-8 pb-1">
                                        <div className="absolute left-0 top-1.5 h-7 w-7 rounded-full bg-background border shadow-sm flex items-center justify-center z-10">
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                        <div className="bg-muted/10 p-3 rounded-lg border border-transparent hover:border-muted-foreground/10 transition-colors">
                                            <p className="text-xs">
                                                <span className="font-semibold text-gray-800">{log.user_name || "Sistema"}</span>{" "}
                                                <span className="text-muted-foreground">
                                                    {log.action_type === "create" ? "criou a página" : log.action_type === "update" ? "alterou a página" : "excluiu a página"}
                                                </span>
                                            </p>
                                            {formatLogChanges(log.changes, log.action_type)}
                                            <p className="text-[10px] text-muted-foreground mt-2">
                                                {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-xs text-muted-foreground italic ml-8">Nenhuma atividade registrada.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default PageDetailModal;
