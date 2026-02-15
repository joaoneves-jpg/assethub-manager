import { useState } from "react";
import { useUpdateBm } from "@/hooks/useData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Props {
    bm: { id: string; name: string; bm_id_facebook: string | null };
    onClose: () => void;
}

const EditBmModal = ({ bm, onClose }: Props) => {
    const updateBm = useUpdateBm();
    const [name, setName] = useState(bm.name);
    const [fbId, setFbId] = useState(bm.bm_id_facebook || "");
    const { toast } = useToast();

    const handleSave = async () => {
        try {
            await updateBm.mutateAsync({
                id: bm.id,
                updates: {
                    name,
                    bm_id_facebook: fbId || null
                }
            });
            toast({ title: "BM atualizada com sucesso!" });
            onClose();
        } catch {
            toast({ title: "Erro ao atualizar BM", variant: "destructive" });
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Business Manager</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label>Nome da BM</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>ID Facebook (BM ID)</Label>
                        <Input value={fbId} onChange={(e) => setFbId(e.target.value)} />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button className="flex-1" onClick={handleSave} disabled={!name || updateBm.isPending}>
                            {updateBm.isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditBmModal;
