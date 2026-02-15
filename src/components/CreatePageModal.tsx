import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreatePage, useBms, useAdAccounts, useTeamMembers, useLogActivity } from "@/hooks/useData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Layout, AlertCircle, Send, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  onClose: () => void;
}

interface StagedPage {
  id: string; // local temp id
  name: string;
  fb_page_id: string;
}

const CreatePageModal = ({ onClose }: Props) => {
  const createPage = useCreatePage();
  const { data: bms } = useBms();
  const { toast } = useToast();
  const logActivity = useLogActivity();

  const [inputList, setInputList] = useState("");
  const [stagedPages, setStagedPages] = useState<StagedPage[]>([]);
  const [showAllStaged, setShowAllStaged] = useState(false);

  // Common Fields
  const [originBm, setOriginBm] = useState("");
  const [status, setStatus] = useState("disponivel");

  // Condicionais para "Em Uso"
  const [currentAdAccount, setCurrentAdAccount] = useState("");
  const [currentBm, setCurrentBm] = useState("");
  const [currentManager, setCurrentManager] = useState("");
  const [usageDate, setUsageDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: accounts } = useAdAccounts();
  const { data: members } = useTeamMembers();

  const handleInsert = () => {
    const lines = inputList.split("\n").map(l => l.trim()).filter(Boolean);
    const newStaged: StagedPage[] = [];

    lines.forEach(line => {
      const parts = line.split(",").map(p => p.trim());
      const name = parts[0] || "";
      const fb_page_id = parts[1] || "";

      if (name) {
        newStaged.push({
          id: Math.random().toString(36).substr(2, 9),
          name,
          fb_page_id
        });
      }
    });

    if (newStaged.length > 0) {
      setStagedPages([...stagedPages, ...newStaged]);
      setInputList("");
      toast({ title: `${newStaged.length} página(s) adicionadas à lista.` });
    } else {
      toast({
        title: "Nenhuma página válida encontrada",
        description: "Use o formato: Nome da Página, ID da Página",
        variant: "destructive"
      });
    }
  };

  const removeStaged = (id: string) => {
    setStagedPages(stagedPages.filter(p => p.id !== id));
  };

  const handleCreate = async () => {
    if (stagedPages.length === 0) return;

    try {
      const pagesToCreate = stagedPages.map(page => ({
        name: page.name,
        fb_page_id: page.fb_page_id || null,
        origin_bm_id: originBm || null,
        status,
        current_ad_account_id: status === "em_uso" && currentAdAccount !== "none" ? currentAdAccount || null : null,
        current_bm_id: status === "em_uso" && currentBm !== "none" ? currentBm || null : null,
        current_manager_id: status === "em_uso" && currentManager !== "none" ? currentManager || null : null,
        usage_date: status === "em_uso" ? usageDate || null : null,
      }));

      await createPage.mutateAsync(pagesToCreate as any);

      // Log activity for BMs and Ad Account for each created page
      for (const sp of stagedPages) {
        if (originBm) {
          await logActivity.mutateAsync({
            entity_type: "bm",
            entity_id: originBm,
            action_type: "update",
            changes: { info: { new: `Página "${sp.name}" registrada como Matriz` } }
          });
        }

        if (status === "em_uso") {
          if (currentBm) {
            await logActivity.mutateAsync({
              entity_type: "bm",
              entity_id: currentBm,
              action_type: "update",
              changes: { info: { new: `Página "${sp.name}" vinculada para Uso` } }
            });
          }
          if (currentAdAccount) {
            await logActivity.mutateAsync({
              entity_type: "ad_account",
              entity_id: currentAdAccount,
              action_type: "update",
              changes: { info: { new: `Página "${sp.name}" vinculada para Uso` } }
            });
          }
        }
      }

      toast({ title: `${stagedPages.length} página(s) criada(s) com sucesso!` });
      onClose();
    } catch (error) {
      toast({ title: "Erro ao criar páginas", variant: "destructive" });
    }
  };

  const isFormValid = stagedPages.length > 0 && originBm && status;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary" />
            Cadastrar Nova(s) Página(s)
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto p-6 pt-4">
          <div className="space-y-6">
            {/* Input Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Páginas
              </Label>
              <div className="relative">
                <Textarea
                  value={inputList}
                  onChange={(e) => setInputList(e.target.value)}
                  placeholder={"Exemplo:\nPágina Alpha 01, 1029384756\nPágina Alpha 02, 1122334455"}
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
                Formato: Nome da Página, ID (opcional) separado por vírgula. Uma por linha.
              </p>
            </div>

            {/* List Section */}
            {stagedPages.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex justify-between items-center">
                  <span>Páginas para criar ({stagedPages.length})</span>
                  <Button variant="ghost" size="sm" onClick={() => setStagedPages([])} className="text-xs text-destructive hover:text-destructive hover:bg-red-50 h-7">
                    Limpar Tudo
                  </Button>
                </Label>
                <div className="border rounded-lg overflow-hidden bg-muted/20">
                  <div className="divide-y">
                    {(showAllStaged ? stagedPages : stagedPages.slice(0, 3)).map((page) => (
                      <motion.div
                        key={page.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 bg-card"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{page.name}</span>
                          {page.fb_page_id && <span className="text-[10px] text-muted-foreground font-mono">{page.fb_page_id}</span>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeStaged(page.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                    {!showAllStaged && stagedPages.length > 3 && (
                      <button
                        onClick={() => setShowAllStaged(true)}
                        className="w-full py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors border-t"
                      >
                        Ver todas as {stagedPages.length} páginas
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Common Settings Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest pl-1">Configurações Comuns</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>BM Matriz <span className="text-destructive">*</span></Label>
                  <Select value={originBm} onValueChange={setOriginBm}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Selecionar BM" /></SelectTrigger>
                    <SelectContent>
                      {bms?.map((bm) => (
                        <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status <span className="text-destructive">*</span></Label>
                  <Select value={status} onValueChange={(v) => {
                    setStatus(v);
                    if (v === "em_uso" && !usageDate) {
                      setUsageDate(new Date().toISOString().split("T")[0]);
                    }
                  }}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="em_uso">Em Uso</SelectItem>
                      <SelectItem value="restrita">Restrita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {status === "em_uso" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10"
                >
                  <div className="space-y-2">
                    <Label className="text-xs">Conta de Anúncio</Label>
                    <Select value={currentAdAccount} onValueChange={setCurrentAdAccount}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar conta" /></SelectTrigger>
                      <SelectContent>
                        {accounts?.map((a) => (
                          <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">BM em uso</Label>
                    <Select value={currentBm} onValueChange={setCurrentBm}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar BM" /></SelectTrigger>
                      <SelectContent>
                        {bms?.map((bm) => (
                          <SelectItem key={bm.id} value={bm.id} className="text-xs">{bm.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Gestor</Label>
                    <Select value={currentManager} onValueChange={setCurrentManager}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar gestor" /></SelectTrigger>
                      <SelectContent>
                        {members?.map((m) => (
                          <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 col-span-full">
                    <Label className="text-xs">Data de Uso</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full h-8 text-xs justify-start text-left font-normal",
                            !usageDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {usageDate ? format(new Date(usageDate), "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={usageDate ? new Date(usageDate) : undefined}
                          onSelect={(date) => setUsageDate(date ? date.toISOString().split("T")[0] : "")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 border-t bg-muted/30 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button
            className="flex-1"
            onClick={handleCreate}
            disabled={!isFormValid || createPage.isPending}
          >
            {createPage.isPending ? "Criando..." : stagedPages.length > 1 ? `Criar ${stagedPages.length} Páginas` : "Criar Página"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePageModal;
