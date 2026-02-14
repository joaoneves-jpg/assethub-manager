import { useFbProfileLinks, useActivityLogs } from "@/hooks/useData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Clock, Building2, ShieldCheck, Mail, Calendar, Ban, ArrowRight } from "lucide-react";
import type { FbProfile } from "@/hooks/useData";

interface Props {
    profile: FbProfile;
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

const ProfileDetailModal = ({ profile, onClose }: Props) => {
    const { data: links } = useFbProfileLinks(profile.id);
    const { data: logs } = useActivityLogs("profile", profile.id);

    const statusColors: Record<string, string> = {
        ativo: "bg-green-100 text-green-700",
        analise: "bg-blue-100 text-blue-700",
        bloqueado: "bg-red-100 text-red-700",
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl text-gray-800 max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Detalhes do Perfil
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-y-auto pr-4 -mr-4">
                    <div className="space-y-6 pb-4">
                        {/* Basic Info Card */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Nome</p>
                                        <p className="text-sm font-medium">{profile.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email de Login</p>
                                        <p className="text-sm font-medium">{profile.email_login || "—"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className={`h-4 w-4 ${profile.status === 'ativo' ? 'text-green-500' : 'text-muted-foreground'}`} />
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status Geral</p>
                                        <Badge variant="secondary" className={statusColors[profile.status]}>
                                            {profile.status === 'analise' ? 'Em Análise' : profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Recebido em</p>
                                        <p className="text-sm font-medium">
                                            {profile.date_received ? format(new Date(profile.date_received), "dd/MM/yyyy") : "—"}
                                        </p>
                                    </div>
                                </div>
                                {profile.status === "bloqueado" && (
                                    <div className="flex items-center gap-2">
                                        <Ban className="h-4 w-4 text-red-500" />
                                        <div>
                                            <p className="text-xs text-red-500 uppercase tracking-wider font-semibold">Bloqueado em</p>
                                            <p className="text-sm font-medium text-red-600">
                                                {profile.date_blocked ? format(new Date(profile.date_blocked), "dd/MM/yyyy") : "—"}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="col-span-full pt-2 mt-2 border-t border-muted">
                                <p className="text-xs text-muted-foreground">
                                    Criado por <span className="font-semibold">{profile.creator?.name || "Sistema"}</span> em {format(new Date(profile.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                            </div>
                        </div>

                        {/* BM Links */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" />
                                Business Managers Vinculadas
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {links?.length ? links.map((link) => (
                                    <div key={link.id} className="p-3 bg-background border rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">{(link.bm as any)?.name}</p>
                                        </div>
                                        <Badge variant="outline" className="capitalize text-[10px] px-1.5 py-0 h-5 text-gray-600">
                                            {link.role_in_bm || "anunciante"}
                                        </Badge>
                                    </div>
                                )) : (
                                    <p className="text-xs text-muted-foreground italic col-span-full">Nenhuma BM vinculada.</p>
                                )}
                            </div>
                        </div>

                        {/* History */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                Histórico de Atividade
                            </h3>
                            <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-3.5 before:w-px before:bg-muted ml-1">
                                {logs?.length ? logs.map((log) => (
                                    <div key={log.id} className="relative pl-8 pb-1">
                                        <div className="absolute left-0 top-1.5 h-7 w-7 rounded-full bg-background border shadow-sm flex items-center justify-center z-10">
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                        <div className="bg-muted/20 p-3 rounded-lg border border-transparent hover:border-muted-foreground/10 transition-colors">
                                            <p className="text-xs">
                                                <span className="font-semibold text-gray-800">{log.user_name || "Sistema"}</span>{" "}
                                                <span className="text-muted-foreground">
                                                    {log.action_type === "create" ? "criou o perfil" : log.action_type === "update" ? "alterou o perfil" : "excluiu o perfil"}
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

export default ProfileDetailModal;
