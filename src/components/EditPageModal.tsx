import { useState, useEffect } from "react";
import { useUpdatePage, useBms, useAdAccounts, useTeamMembers, useFbProfiles } from "@/hooks/useData";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { Page } from "@/hooks/useData";

interface Props {
    page: Page;
    onClose: () => void;
}

const EditPageModal = ({ page, onClose }: Props) => {
    const updatePage = useUpdatePage();
    const { data: bms } = useBms();
    const { data: accounts } = useAdAccounts();
    const { data: members } = useTeamMembers();
    const { data: fbProfiles } = useFbProfiles();
    const { toast } = useToast();

    const [name, setName] = useState(page.name);
    const [fbPageId, setFbPageId] = useState(page.fb_page_id || "");
    const [status, setStatus] = useState(page.status);
    const [originBm, setOriginBm] = useState(page.origin_bm_id || "");
    const [currentBm, setCurrentBm] = useState(page.current_bm_id || "");
    const [adAccount, setAdAccount] = useState(page.current_ad_account_id || "");
    const [manager, setManager] = useState(page.current_manager_id || "");
    const [fbProfile, setFbProfile] = useState(page.current_fb_profile_id || "");
    const [usageDate, setUsageDate] = useState(page.usage_date || "");

    useEffect(() => {
        if (status === "em_uso" && !usageDate) {
            setUsageDate(new Date().toISOString().split("T")[0]);
        }
    }, [status]);

    const handleSave = async () => {
        try {
            await updatePage.mutateAsync({
                id: page.id,
                updates: {
                    name,
                    fb_page_id: fbPageId,
                    status,
                    origin_bm_id: originBm || null,
                    current_bm_id: status === "em_uso" ? currentBm || null : null,
                    current_ad_account_id: status === "em_uso" ? adAccount || null : null,
                    current_manager_id: status === "em_uso" ? manager || null : null,
                    current_fb_profile_id: status === "em_uso" ? fbProfile || null : null,
                    usage_date: status === "em_uso" ? usageDate || null : null,
                } as any,
            });
            toast({ title: "Página atualizada com sucesso!" });
            onClose();
        } catch {
            toast({ title: "Erro ao atualizar página", variant: "destructive" });
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Página</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label>Nome da Página</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da página" />
                    </div>

                    <div className="space-y-2">
                        <Label>ID da Página</Label>
                        <Input value={fbPageId} onChange={(e) => setFbPageId(e.target.value)} placeholder="Ex: 1029384756" />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-2">
                            <Label>Status <span className="text-destructive">*</span></Label>
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

                    {status === "em_uso" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4 pt-2 border-t mt-4">
                            <div className="space-y-2">
                                <Label>BM em Uso</Label>
                                <Select value={currentBm} onValueChange={setCurrentBm}>
                                    <SelectTrigger><SelectValue placeholder="Selecionar BM" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhuma</SelectItem>
                                        {bms?.map((bm) => (
                                            <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Conta de Anúncio</Label>
                                <Select value={adAccount} onValueChange={setAdAccount}>
                                    <SelectTrigger><SelectValue placeholder="Selecionar conta" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhuma</SelectItem>
                                        {accounts?.map((a) => (
                                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Gestor</Label>
                                <Select value={manager} onValueChange={setManager}>
                                    <SelectTrigger><SelectValue placeholder="Selecionar gestor" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        {members?.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Perfil</Label>
                                <Select value={fbProfile} onValueChange={setFbProfile}>
                                    <SelectTrigger><SelectValue placeholder="Selecionar perfil" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        {fbProfiles?.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Data de Uso</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !usageDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {usageDate ? format(new Date(usageDate), "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={usageDate ? new Date(usageDate) : undefined}
                                            onSelect={(date) => setUsageDate(date ? date.toISOString().split("T")[0] : "")}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </motion.div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button className="flex-1" onClick={handleSave} disabled={!name || !originBm || updatePage.isPending}>
                            {updatePage.isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                        <Button variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditPageModal;
