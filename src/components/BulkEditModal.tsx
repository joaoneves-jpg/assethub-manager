import { useState } from "react";
import { useBulkUpdatePages, useBms, useAdAccounts, useTeamMembers } from "@/hooks/useData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Props {
  selectedIds: string[];
  onClose: () => void;
}

const BulkEditModal = ({ selectedIds, onClose }: Props) => {
  const bulkUpdate = useBulkUpdatePages();
  const { data: bms } = useBms();
  const { data: accounts } = useAdAccounts();
  const { data: members } = useTeamMembers();
  const { toast } = useToast();

  const [status, setStatus] = useState("");
  const [currentBm, setCurrentBm] = useState("");
  const [adAccount, setAdAccount] = useState("");
  const [manager, setManager] = useState("");
  const [usageDate, setUsageDate] = useState("");

  const handleSubmit = async () => {
    const updates: Record<string, any> = {};
    if (status) updates.status = status;
    if (currentBm) updates.current_bm_id = currentBm;
    if (adAccount) updates.current_ad_account_id = adAccount;
    if (manager) updates.current_manager_id = manager;
    if (usageDate) updates.usage_date = usageDate;

    if (Object.keys(updates).length === 0) return;

    try {
      await bulkUpdate.mutateAsync({ ids: selectedIds, updates });
      toast({ title: `${selectedIds.length} páginas atualizadas!` });
      onClose();
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar {selectedIds.length} páginas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">
            Apenas os campos preenchidos serão alterados.
          </p>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Manter atual" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="em_uso">Em Uso</SelectItem>
                <SelectItem value="caiu">Caiu</SelectItem>
                <SelectItem value="restrita">Restrita</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>BM em Uso</Label>
            <Select value={currentBm} onValueChange={setCurrentBm}>
              <SelectTrigger><SelectValue placeholder="Manter atual" /></SelectTrigger>
              <SelectContent>
                {bms?.map((bm) => (
                  <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Conta de Anúncio</Label>
            <Select value={adAccount} onValueChange={setAdAccount}>
              <SelectTrigger><SelectValue placeholder="Manter atual" /></SelectTrigger>
              <SelectContent>
                {accounts?.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Gestor</Label>
            <Select value={manager} onValueChange={setManager}>
              <SelectTrigger><SelectValue placeholder="Manter atual" /></SelectTrigger>
              <SelectContent>
                {members?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data de Uso</Label>
            <Input type="date" value={usageDate} onChange={(e) => setUsageDate(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={bulkUpdate.isPending}>
            {bulkUpdate.isPending ? "Atualizando..." : "Aplicar Alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditModal;
