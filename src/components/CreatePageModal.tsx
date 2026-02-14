import { useState } from "react";
import { motion } from "framer-motion";
import { useCreatePage, useBms, useAdAccounts, useTeamMembers, useFbProfiles } from "@/hooks/useData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onClose: () => void;
}

const CreatePageModal = ({ onClose }: Props) => {
  const createPage = useCreatePage();
  const { data: bms } = useBms();
  const { toast } = useToast();

  // Single
  const [name, setName] = useState("");
  const [fbPageId, setFbPageId] = useState("");
  const [originBm, setOriginBm] = useState("");
  const [status, setStatus] = useState("disponivel");

  // Condicionais para "Em Uso"
  const [currentAdAccount, setCurrentAdAccount] = useState("");
  const [currentBm, setCurrentBm] = useState("");
  const [currentManager, setCurrentManager] = useState("");
  const [currentFbProfile, setCurrentFbProfile] = useState("");
  const [usageDate, setUsageDate] = useState("");

  const { data: accounts } = useAdAccounts();
  const { data: members } = useTeamMembers();
  const { data: fbProfiles } = useFbProfiles();

  // Set default usage date when status becomes "em_uso"
  useState(() => {
    if (status === "em_uso" && !usageDate) {
      setUsageDate(new Date().toISOString().split("T")[0]);
    }
  });

  // Bulk
  const [bulkText, setBulkText] = useState("");
  const [bulkBm, setBulkBm] = useState("");

  const handleSingle = async () => {
    try {
      await createPage.mutateAsync([{
        name,
        fb_page_id: fbPageId,
        origin_bm_id: originBm,
        status,
        current_ad_account_id: status === "em_uso" ? currentAdAccount || null : null,
        current_bm_id: status === "em_uso" ? currentBm || null : null,
        current_manager_id: status === "em_uso" ? currentManager || null : null,
        current_fb_profile_id: status === "em_uso" ? currentFbProfile || null : null,
        usage_date: status === "em_uso" ? usageDate || null : null,
      } as any]);
      toast({ title: "Página criada!" });
      onClose();
    } catch {
      toast({ title: "Erro ao criar página", variant: "destructive" });
    }
  };

  const handleBulk = async () => {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    try {
      await createPage.mutateAsync(
        lines.map((name) => ({
          name,
          origin_bm_id: bulkBm || undefined,
          status: "disponivel",
        }))
      );
      toast({ title: `${lines.length} páginas criadas!` });
      onClose();
    } catch {
      toast({ title: "Erro ao criar páginas", variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg text-gray-800">
        <DialogHeader>
          <DialogTitle>Nova Página</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="single">
          <TabsList className="w-full">
            <TabsTrigger value="single" className="flex-1">Cadastro Único</TabsTrigger>
            <TabsTrigger value="bulk" className="flex-1">Em Massa</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label>Nome da Página <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Página Alpha 01" />
            </div>
            <div className="space-y-2">
              <Label>ID da Página <span className="text-destructive">*</span></Label>
              <Input value={fbPageId} onChange={(e) => setFbPageId(e.target.value)} placeholder="Ex: 1029384756" />
            </div>
            <div className="space-y-2">
              <Label>BM Matriz <span className="text-destructive">*</span></Label>
              <Select value={originBm} onValueChange={setOriginBm}>
                <SelectTrigger><SelectValue placeholder="Selecionar BM" /></SelectTrigger>
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
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em_uso">Em Uso</SelectItem>
                  <SelectItem value="caiu">Caiu</SelectItem>
                  <SelectItem value="restrita">Restrita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status === "em_uso" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4 pt-2 border-t mt-4">
                <div className="space-y-2">
                  <Label>Conta de Anúncio</Label>
                  <Select value={currentAdAccount} onValueChange={setCurrentAdAccount}>
                    <SelectTrigger><SelectValue placeholder="Selecionar conta" /></SelectTrigger>
                    <SelectContent>
                      {accounts?.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>BM em uso</Label>
                  <Select value={currentBm} onValueChange={setCurrentBm}>
                    <SelectTrigger><SelectValue placeholder="Selecionar BM" /></SelectTrigger>
                    <SelectContent>
                      {bms?.map((bm) => (
                        <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gestor</Label>
                  <Select value={currentManager} onValueChange={setCurrentManager}>
                    <SelectTrigger><SelectValue placeholder="Selecionar gestor" /></SelectTrigger>
                    <SelectContent>
                      {members?.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Select value={currentFbProfile} onValueChange={setCurrentFbProfile}>
                    <SelectTrigger><SelectValue placeholder="Selecionar perfil" /></SelectTrigger>
                    <SelectContent>
                      {fbProfiles?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Uso</Label>
                  <Input type="date" value={usageDate} onChange={(e) => setUsageDate(e.target.value)} />
                </div>
              </motion.div>
            )}

            <Button className="w-full mt-4" onClick={handleSingle} disabled={!name || !fbPageId || !originBm || createPage.isPending}>
              {createPage.isPending ? "Criando..." : "Criar Página"}
            </Button>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Cole os nomes das páginas (uma por linha)</Label>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"Página Alpha 01\nPágina Alpha 02\nPágina Alpha 03"}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                {bulkText.split("\n").filter((l) => l.trim()).length} páginas detectadas
              </p>
            </div>
            <div className="space-y-2">
              <Label>BM Matriz padrão (opcional)</Label>
              <Select value={bulkBm} onValueChange={setBulkBm}>
                <SelectTrigger><SelectValue placeholder="Selecionar BM" /></SelectTrigger>
                <SelectContent>
                  {bms?.map((bm) => (
                    <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleBulk} disabled={createPage.isPending}>
              {createPage.isPending ? "Criando..." : "Importar Páginas"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePageModal;
