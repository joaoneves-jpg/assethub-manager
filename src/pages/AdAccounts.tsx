import { useState } from "react";
import { useAdAccounts, useCreateAdAccount, useBms } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const AdAccountsPage = () => {
  const { data: accounts, isLoading } = useAdAccounts();
  const { data: bms } = useBms();
  const createAccount = useCreateAdAccount();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [bmId, setBmId] = useState("");

  const handleCreate = async () => {
    try {
      await createAccount.mutateAsync({ name, bm_id: bmId || undefined });
      toast({ title: "Conta criada!" });
      setShowCreate(false);
      setName(""); setBmId("");
    } catch {
      toast({ title: "Erro ao criar conta", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contas de Anúncio</h1>
          <p className="text-muted-foreground text-sm mt-1">{accounts?.length || 0} contas</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Conta
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts?.map((acc: any, i: number) => (
            <motion.div key={acc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{acc.name}</p>
                    <p className="text-xs text-muted-foreground">{acc.bm?.name || "Sem BM"}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Conta de Anúncio</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Conta Alpha 01" />
            </div>
            <div className="space-y-2">
              <Label>BM Vinculada</Label>
              <Select value={bmId} onValueChange={setBmId}>
                <SelectTrigger><SelectValue placeholder="Selecionar BM" /></SelectTrigger>
                <SelectContent>
                  {bms?.map((bm) => (
                    <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!name || createAccount.isPending}>
              {createAccount.isPending ? "Criando..." : "Criar Conta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdAccountsPage;
