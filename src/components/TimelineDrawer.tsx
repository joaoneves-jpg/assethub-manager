import { useActivityLogs } from "@/hooks/useData";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, ArrowRight } from "lucide-react";

interface Props {
  entityType: string;
  entityId: string;
  entityName: string;
  onClose: () => void;
}

// Mapeamento de campos para nomes legíveis em português
const fieldLabels: Record<string, string> = {
  name: "Nome",
  status: "Status",
  email_login: "Email de Login",
  profile_link: "Link do Perfil",
  role_in_bm: "Cargo na BM",
  date_received: "Data de Recebimento",
  date_blocked: "Data de Bloqueio",
  current_bm_id: "BM em Uso",
  current_ad_account_id: "Conta de Anúncio",
  current_manager_id: "Gestor",
  usage_date: "Data de Uso",
  account_status: "Status da Conta",
  origin_bm_id: "BM de Origem",
  url: "URL",
  fb_page_id: "ID da Página",
  current_fb_profile_id: "Perfil",
};

// Mapeamento de valores de status para português
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

const formatChanges = (changes: any, actionType: string): React.ReactNode => {
  if (!changes || typeof changes !== "object") return null;

  // Para ação de criação, mostrar campos principais
  if (actionType === "create") {
    const mainFields = ["name", "status", "email_login"];
    const relevantChanges = Object.entries(changes)
      .filter(([key]) => mainFields.includes(key))
      .filter(([, value]) => value !== null && value !== undefined);

    if (relevantChanges.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {relevantChanges.map(([key, value]) => (
          <div key={key} className="text-xs text-gray-700">
            <span className="font-medium">{fieldLabels[key] || key}:</span>{" "}
            <span className="text-muted-foreground">{formatValue(value)}</span>
          </div>
        ))}
      </div>
    );
  }

  // Para ação de atualização, mostrar mudanças
  if (actionType === "update") {
    const updates = Object.entries(changes).filter(([, value]) => {
      return value && typeof value === "object" && "old" in value && "new" in value;
    });

    if (updates.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {updates.map(([key, change]: [string, any]) => (
          <div key={key} className="text-xs">
            <div className="font-medium text-gray-700 mb-1">
              {fieldLabels[key] || key}:
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded">
                {formatValue(change.old)}
              </span>
              <ArrowRight className="h-3 w-3" />
              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">
                {formatValue(change.new)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Para ação de exclusão, mostrar campos principais
  if (actionType === "delete") {
    const mainFields = ["name", "status"];
    const relevantChanges = Object.entries(changes)
      .filter(([key]) => mainFields.includes(key))
      .filter(([, value]) => value !== null && value !== undefined);

    if (relevantChanges.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {relevantChanges.map(([key, value]) => (
          <div key={key} className="text-xs text-gray-700">
            <span className="font-medium">{fieldLabels[key] || key}:</span>{" "}
            <span className="text-muted-foreground">{formatValue(value)}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

const TimelineDrawer = ({ entityType, entityId, entityName, onClose }: Props) => {
  const { data: logs, isLoading } = useActivityLogs(entityType, entityId);

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[440px]">
        <SheetHeader>
          <SheetTitle className="text-left text-gray-800">Histórico: {entityName}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !logs?.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="w-px flex-1 bg-border mt-1" />
                  </div>
                  <div className="pb-4 flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {log.user_name || "Sistema"}{" "}
                      <span className="text-muted-foreground font-normal">
                        {log.action_type === "create" && "criou"}
                        {log.action_type === "update" && "alterou"}
                        {log.action_type === "delete" && "excluiu"}
                      </span>
                    </p>
                    {formatChanges(log.changes, log.action_type)}
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default TimelineDrawer;
