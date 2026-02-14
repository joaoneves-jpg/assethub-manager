import { useState, useEffect } from "react";
import { useUpdateFbProfile, useBms, useFbProfileLinks } from "@/hooks/useData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import type { FbProfile } from "@/hooks/useData";

interface Props {
    profile: FbProfile;
    onClose: () => void;
}

const EditFbProfileModal = ({ profile, onClose }: Props) => {
    const updateProfile = useUpdateFbProfile();
    const { data: bms } = useBms();
    const { data: existingLinks } = useFbProfileLinks(profile.id);
    const { toast } = useToast();

    const [name, setName] = useState(profile.name);
    const [email, setEmail] = useState(profile.email_login || "");
    const [link, setLink] = useState(profile.profile_link || "");
    const [status, setStatus] = useState(profile.status);
    const [dateReceived, setDateReceived] = useState(profile.date_received || "");
    const [dateBlocked, setDateBlocked] = useState(profile.date_blocked || "");

    const [bmLinks, setBmLinks] = useState<{ bm_id: string; role_in_bm: string }[]>([]);

    useEffect(() => {
        if (existingLinks) {
            setBmLinks(existingLinks.map(l => ({ bm_id: l.bm_id, role_in_bm: l.role_in_bm || "anunciante" })));
        }
    }, [existingLinks]);

    useEffect(() => {
        if (status === "bloqueado" && !dateBlocked) {
            setDateBlocked(new Date().toISOString().split("T")[0]);
        }
    }, [status]);

    const addBmLink = () => {
        setBmLinks([...bmLinks, { bm_id: "", role_in_bm: "anunciante" }]);
    };

    const removeBmLink = (index: number) => {
        setBmLinks(bmLinks.filter((_, i) => i !== index));
    };

    const updateBmLink = (index: number, field: "bm_id" | "role_in_bm", value: string) => {
        const next = [...bmLinks];
        next[index] = { ...next[index], [field]: value };
        setBmLinks(next);
    };

    const handleSave = async () => {
        try {
            if (bmLinks.some(l => !l.bm_id)) {
                toast({ title: "Selecione a BM em todos os vínculos", variant: "destructive" });
                return;
            }

            await updateProfile.mutateAsync({
                id: profile.id,
                updates: {
                    name,
                    email_login: email || null,
                    profile_link: link || null,
                    status: status as any,
                    date_received: dateReceived || null,
                    date_blocked: status === "bloqueado" ? dateBlocked || null : null,
                },
                bmLinks,
            });
            toast({ title: "Perfil atualizado com sucesso!" });
            onClose();
        } catch {
            toast({ title: "Erro ao atualizar perfil", variant: "destructive" });
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Perfil</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email de Login</Label>
                            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Link do Perfil</Label>
                        <Input value={link} onChange={(e) => setLink(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ativo">Ativo</SelectItem>
                                    <SelectItem value="analise">Em Análise</SelectItem>
                                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>Data de Recebimento</Label>
                            <Input type="date" value={dateReceived} onChange={(e) => setDateReceived(e.target.value)} />
                        </div>
                        {status === "bloqueado" && (
                            <div className="space-y-2">
                                <Label>Data de Bloqueio</Label>
                                <Input type="date" value={dateBlocked} onChange={(e) => setDateBlocked(e.target.value)} />
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-base">Vínculos com BMs</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addBmLink}>
                                <Plus className="h-4 w-4 mr-1" /> Add BM
                            </Button>
                        </div>

                        {bmLinks.map((link, index) => (
                            <div key={index} className="flex gap-2 items-end bg-muted/40 p-3 rounded-lg border">
                                <div className="flex-1 space-y-1">
                                    <Label className="text-xs">Business Manager</Label>
                                    <Select value={link.bm_id} onValueChange={(v) => updateBmLink(index, "bm_id", v)}>
                                        <SelectTrigger className="h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            {bms?.map((bm) => (
                                                <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-32 space-y-1">
                                    <Label className="text-xs">Cargo na BM</Label>
                                    <Select value={link.role_in_bm} onValueChange={(v) => updateBmLink(index, "role_in_bm", v)}>
                                        <SelectTrigger className="h-9"><SelectValue placeholder="Cargo..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="administrador">Admin</SelectItem>
                                            <SelectItem value="anunciante">Anunciante</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeBmLink(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button className="flex-1" onClick={handleSave} disabled={!name || updateProfile.isPending}>
                            {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditFbProfileModal;
