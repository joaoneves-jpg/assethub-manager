import { useState } from "react";
import { useBulkUpdateProfiles, useBulkUpdateBms, useBulkUpdateAdAccounts, useBms } from "@/hooks/useData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tags, CheckCircle2, History, XCircle, AlertCircle } from "lucide-react";

interface Props {
    selectedAssets: { id: string; type: "perfil" | "bm" | "conta" }[];
    onClose: () => void;
}

const BulkEditAssetsModal = ({ selectedAssets, onClose }: Props) => {
    const bulkUpdateProfiles = useBulkUpdateProfiles();
    const bulkUpdateBms = useBulkUpdateBms();
    const bulkUpdateAccounts = useBulkUpdateAdAccounts();
    const { data: bms } = useBms();
    const { toast } = useToast();

    const [status, setStatus] = useState("");
    const [tags, setTags] = useState("");
    const [bmId, setBmId] = useState("");

    const hasProfiles = selectedAssets.some(a => a.type === "perfil");
    const hasAccounts = selectedAssets.some(a => a.type === "conta");
    const hasBms = selectedAssets.some(a => a.type === "bm");

    const handleSubmit = async () => {
        const profileIds = selectedAssets.filter(a => a.type === "perfil").map(a => a.id);
        const bmIds = selectedAssets.filter(a => a.type === "bm").map(a => a.id);
        const accountIds = selectedAssets.filter(a => a.type === "conta").map(a => a.id);

        const tagList = tags.split(",").map(t => t.trim()).filter(t => t !== "");

        try {
            const promises = [];

            if (profileIds.length > 0) {
                const updates: any = {};
                if (status) updates.status = status;
                if (tagList.length > 0) updates.tags = tagList;
                if (Object.keys(updates).length > 0) {
                    promises.push(bulkUpdateProfiles.mutateAsync({ ids: profileIds, updates }));
                }
            }

            if (bmIds.length > 0) {
                const updates: any = {};
                if (tagList.length > 0) updates.tags = tagList;
                if (Object.keys(updates).length > 0) {
                    promises.push(bulkUpdateBms.mutateAsync({ ids: bmIds, updates }));
                }
            }

            if (accountIds.length > 0) {
                const updates: any = {};
                if (status) updates.status = status;
                if (bmId) updates.bm_id = bmId;
                if (tagList.length > 0) updates.tags = tagList;
                if (Object.keys(updates).length > 0) {
                    promises.push(bulkUpdateAccounts.mutateAsync({ ids: accountIds, updates }));
                }
            }

            if (promises.length === 0) {
                onClose();
                return;
            }

            await Promise.all(promises);
            toast({ title: `${selectedAssets.length} ativos atualizados!` });
            onClose();
        } catch {
            toast({ title: "Erro ao atualizar ativos", variant: "destructive" });
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md text-gray-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Editar {selectedAssets.length} Ativos
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <p className="text-xs text-muted-foreground">
                        Apenas os campos preenchidos serão alterados para os ativos selecionados.
                    </p>

                    {(hasProfiles || hasAccounts) && (
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger><SelectValue placeholder="Manter atual" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ativo">Ativo</SelectItem>
                                    <SelectItem value="analise">Em Análise</SelectItem>
                                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                                    <SelectItem value="restrita">Restrita</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {hasAccounts && (
                        <div className="space-y-2">
                            <Label>Vincular a BM</Label>
                            <Select value={bmId} onValueChange={setBmId}>
                                <SelectTrigger><SelectValue placeholder="Manter atual" /></SelectTrigger>
                                <SelectContent>
                                    {bms?.map(bm => (
                                        <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Tags className="h-4 w-4" />
                            Tags (separadas por vírgula)
                        </Label>
                        <Input
                            placeholder="vsl, novo, prioridade..."
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={bulkUpdateProfiles.isPending || bulkUpdateBms.isPending || bulkUpdateAccounts.isPending}>
                        Aplicar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BulkEditAssetsModal;
