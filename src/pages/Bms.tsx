import { useState } from "react";
import { useBms, useCreateBm } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const BmsPage = () => {
  const { data: bms, isLoading } = useBms();
  const createBm = useCreateBm();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [fbId, setFbId] = useState("");

  const handleCreate = async () => {
    try {
      await createBm.mutateAsync({ name, bm_id_facebook: fbId || undefined });
      toast({ title: "BM criada!" });
      setShowCreate(false);
      setName("");
      setFbId("");
    } catch {
      toast({ title: "Erro ao criar BM", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Business Managers</h1>
          <p className="text-muted-foreground text-sm mt-1">{bms?.length || 0} BMs cadastradas</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova BM
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bms?.map((bm, i) => (
            <motion.div key={bm.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{bm.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{bm.bm_id_facebook || "Sem ID FB"}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Business Manager</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="BM Alpha 01" />
            </div>
            <div className="space-y-2">
              <Label>ID Facebook (opcional)</Label>
              <Input value={fbId} onChange={(e) => setFbId(e.target.value)} placeholder="123456789" />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!name || createBm.isPending}>
              {createBm.isPending ? "Criando..." : "Criar BM"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BmsPage;
