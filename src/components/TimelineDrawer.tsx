import { useActivityLogs } from "@/hooks/useData";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock } from "lucide-react";

interface Props {
  entityType: string;
  entityId: string;
  entityName: string;
  onClose: () => void;
}

const TimelineDrawer = ({ entityType, entityId, entityName, onClose }: Props) => {
  const { data: logs, isLoading } = useActivityLogs(entityType, entityId);

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[440px]">
        <SheetHeader>
          <SheetTitle className="text-left">Histórico: {entityName}</SheetTitle>
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
                  <div className="pb-4">
                    <p className="text-sm font-medium">
                      {log.user_name || "Sistema"}{" "}
                      <span className="text-muted-foreground font-normal">
                        {log.action_type === "create" && "criou"}
                        {log.action_type === "update" && "alterou"}
                        {log.action_type === "delete" && "excluiu"}
                      </span>
                    </p>
                    {log.changes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {JSON.stringify(log.changes)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
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
