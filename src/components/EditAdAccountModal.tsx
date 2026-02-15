import { useState } from "react";
import { useUpdateAdAccount, useBms } from "@/hooks/useData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Props {
    account: { id: string; name: string; bm_id: string | null; status: string };
    onClose: () => void;
}

const EditAdAccountModal = ({ account, onClose }: Props) => {
    const updateAccount = useUpdateAdAccount();
    const { data: bms } = useBms();
    const [name, setName] = useState(account.name);
    const [bmId, setBmId] = useState(account.bm_id || "none");
    const [status, setStatus] = useState(account.status);
    const { toast } = useToast();

    const handleSave = async () => {
        try {
            await updateAccount.mutateAsync({
                id: account.id,
                updates: {
                    name,
                    bm_id: bmId === "none" ? null : bmId,
                    status
                }
            });
            toast({ title: "Conta de Anúncios atualizada com sucesso!" });
            onClose();
        } catch {
            toast({ title: "Erro ao atualizar conta", variant: "destructive" });
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Conta de Anúncios</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label>Nome da Conta</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ativo">Ativo</SelectItem>
                                <SelectItem value="inativo">Inativo</SelectItem>
                                <SelectItem value="bloqueado">Bloqueado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>BM Vinculada</Label>
                        <Select value={bmId} onValueChange={setBmId}>
                            <SelectTrigger><SelectValue placeholder="Selecionar BM" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Nenhuma</SelectItem>
                                {bms?.map(bm => (
                                    <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button className="flex-1" onClick={handleSave} disabled={!name || updateAccount.isPending}>
                            {updateAccount.isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditAdAccountModal;
