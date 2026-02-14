import { useState } from "react";
import { useCreatePage, useBms } from "@/hooks/useData";
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
  const [url, setUrl] = useState("");
  const [originBm, setOriginBm] = useState("");
  const [status, setStatus] = useState("disponivel");

  // Bulk
  const [bulkText, setBulkText] = useState("");
  const [bulkBm, setBulkBm] = useState("");

  const handleSingle = async () => {
    try {
      await createPage.mutateAsync([{
        name,
        url: url || undefined,
        origin_bm_id: originBm || undefined,
        status,
      }]);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Página</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="single">
          <TabsList className="w-full">
            <TabsTrigger value="single" className="flex-1">Cadastro Único</TabsTrigger>
            <TabsTrigger value="bulk" className="flex-1">Em Massa</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome da Página</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Página Alpha 01" />
            </div>
            <div className="space-y-2">
              <Label>URL (opcional)</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>BM Matriz</Label>
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
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em_uso">Em Uso</SelectItem>
                  <SelectItem value="caiu">Caiu</SelectItem>
                  <SelectItem value="restrita">Restrita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSingle} disabled={!name || createPage.isPending}>
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
