import { useState } from "react";
import { useBms, useCreateBm } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Building2, CreditCard, Layout } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
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
              <Card className="h-full">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{bm.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{bm.bm_id_facebook || "Sem ID FB"}</p>
                    </div>
                  </div>

                  {/* Ad Accounts */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <CreditCard className="h-3 w-3" />
                      Contas de Anúncio
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {((bm as any).ad_accounts?.length > 0) ? (bm as any).ad_accounts.map((acc: any) => (
                        <Badge key={acc.id} variant="secondary" className="text-[10px] font-normal">
                          {acc.name}
                        </Badge>
                      )) : (
                        <span className="text-[10px] text-muted-foreground italic">Nenhuma conta vinculada</span>
                      )}
                    </div>
                  </div>

                  {/* Pages */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <Layout className="h-3 w-3" />
                      Páginas
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {(bm as any).pages_origin?.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between text-xs p-1.5 bg-muted/30 rounded border border-muted/50">
                          <span className="truncate flex-1">{p.name}</span>
                          <Badge className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100 text-[9px] h-4 px-1">BM Matriz</Badge>
                        </div>
                      ))}
                      {(bm as any).pages_current?.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between text-xs p-1.5 bg-muted/30 rounded border border-muted/50">
                          <span className="truncate flex-1">{p.name}</span>
                          <Badge className="ml-2 bg-purple-100 text-purple-700 hover:bg-purple-100 text-[9px] h-4 px-1">BM em Uso</Badge>
                        </div>
                      ))}
                      {(!((bm as any).pages_origin?.length > 0) && !((bm as any).pages_current?.length > 0)) && (
                        <span className="text-[10px] text-muted-foreground italic">Nenhuma página vinculada</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md text-gray-800">
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
