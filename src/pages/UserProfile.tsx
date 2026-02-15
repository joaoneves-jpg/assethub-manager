import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile, useCreateGestor, useCreateAuxiliar, useCreateGestorTeam, useChangePassword, useTeamMembers, useRemoveMember, useAllUsers, useTeams, useAdminUpdateUserTeam, useAdminDeleteUser } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Save, Key, Users, Building2, UserPlus, Lock, Eye, EyeOff, ShieldCheck, Trash2, MoreVertical, LogOut, UserMinus, ChevronRight } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const UserProfile = () => {
    const { user, refreshProfile } = useAuth();
    const updateProfile = useUpdateProfile();
    const createGestor = useCreateGestor();
    const createAuxiliar = useCreateAuxiliar();
    const createTeam = useCreateGestorTeam();
    const changePassword = useChangePassword();
    const { data: members, isLoading: loadingMembers } = useTeamMembers();
    const removeMember = useRemoveMember();
    const { data: teams } = useTeams();
    const adminUpdateTeam = useAdminUpdateUserTeam();
    const adminDeleteUser = useAdminDeleteUser();
    const { toast } = useToast();

    // Profile State
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");

    // Password State
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Admin State
    const [gestorName, setGestorName] = useState("");
    const [gestorEmail, setGestorEmail] = useState("");

    // Gestor State
    const [auxName, setAuxName] = useState("");
    const [auxEmail, setAuxEmail] = useState("");

    // UI State
    const [showPassword, setShowPassword] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
    const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
    const [userToAssignTeam, setUserToAssignTeam] = useState<{ id: string; name: string; currentTeamId?: string } | null>(null);
    const [targetTeamId, setTargetTeamId] = useState<string>("");
    const { data: allUsers, isLoading: loadingAllUsers } = useAllUsers();

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setEmail(user.email || "");
        }
    }, [user]);

    const handleSaveProfile = async () => {
        try {
            await updateProfile.mutateAsync({ name, email });
            await refreshProfile();
            toast({ title: "Perfil atualizado!" });
        } catch {
            toast({ title: "Erro ao atualizar perfil", variant: "destructive" });
        }
    };

    const handleChangePassword = async () => {
        if (password !== confirmPassword) {
            toast({ title: "Senhas não conferem", variant: "destructive" });
            return;
        }
        if (password.length < 6) {
            toast({ title: "A senha deve ter no mínimo 6 caracteres", variant: "destructive" });
            return;
        }
        try {
            await changePassword.mutateAsync(password);
            setPassword("");
            setConfirmPassword("");
            toast({ title: "Senha alterada com sucesso!" });
        } catch {
            toast({ title: "Erro ao alterar senha", variant: "destructive" });
        }
    };

    const handleCreateGestor = async () => {
        try {
            await createGestor.mutateAsync({ email: gestorEmail, name: gestorName });
            setGestorEmail("");
            setGestorName("");
            toast({ title: "Gestor criado com sucesso!", description: "Senha padrão: senha@123" });
        } catch (error: any) {
            toast({ title: "Erro ao criar gestor", description: error?.message || "Verifique se você é admin.", variant: "destructive" });
        }
    };

    const handleCreateTeam = async () => {
        try {
            await createTeam.mutateAsync();
            toast({ title: "Time criado com sucesso!" });
        } catch (error: any) {
            toast({ title: "Erro ao criar time", description: error?.message, variant: "destructive" });
        }
    };

    const handleInviteAuxiliar = async () => {
        try {
            await createAuxiliar.mutateAsync({ email: auxEmail, name: auxName });
            setAuxEmail("");
            setAuxName("");
            toast({ title: "Auxiliar convidado com sucesso!", description: "Senha padrão: senha@123" });
        } catch (error: any) {
            toast({ title: "Erro ao convidar auxiliar", description: error?.message, variant: "destructive" });
        }
    };

    const handleRemoveMember = async () => {
        if (!memberToRemove) return;
        try {
            await removeMember.mutateAsync(memberToRemove.id);
            toast({ title: "Membro removido!" });
            setMemberToRemove(null);
        } catch (error: any) {
            toast({ title: "Erro ao remover membro", description: error?.message, variant: "destructive" });
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await adminDeleteUser.mutateAsync(userToDelete.id);
            toast({ title: "Usuário excluído do sistema!" });
            setUserToDelete(null);
        } catch (error: any) {
            toast({ title: "Erro ao excluir usuário", description: error?.message, variant: "destructive" });
        }
    };

    const handleAssignTeam = async () => {
        if (!userToAssignTeam || !targetTeamId) return;
        try {
            await adminUpdateTeam.mutateAsync({
                userId: userToAssignTeam.id,
                teamId: targetTeamId === "none" ? null : targetTeamId
            });
            toast({ title: targetTeamId === "none" ? "Usuário removido do time!" : "Usuário vinculado ao time!" });
            setUserToAssignTeam(null);
            setTargetTeamId("");
        } catch (error: any) {
            toast({ title: "Erro ao gerenciar time", description: error?.message, variant: "destructive" });
        }
    };

    const hasChanges = name !== user?.name || email !== user?.email;

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Gerencie suas informações e configurações da conta
                </p>
            </div>

            {/* Profile Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Informações Pessoais</CardTitle>
                    <CardDescription>Atualize seus dados básicos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                    </div>
                    <Button onClick={handleSaveProfile} disabled={!hasChanges || updateProfile.isPending}>
                        {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
                <CardHeader>
                    <CardTitle>Segurança</CardTitle>
                    <CardDescription>Alterar sua senha de acesso</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Nova Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9 pr-9"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Confirmar Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-9 pr-9"
                                />
                            </div>
                        </div>
                    </div>
                    <Button onClick={handleChangePassword} disabled={!password || !confirmPassword || changePassword.isPending}>
                        {changePassword.isPending ? "Alterando..." : "Alterar Senha"}
                    </Button>
                </CardContent>
            </Card>

            {/* Admin Zone: Create Gestor */}
            {user?.role === "admin" && (
                <Card className="border-blue-500/20 bg-blue-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-500">
                            <Users className="h-5 w-5" /> Área Administrativa
                        </CardTitle>
                        <CardDescription>Cadastrar novos Gestores</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Nome do Gestor</Label>
                                <Input value={gestorName} onChange={(e) => setGestorName(e.target.value)} placeholder="Nome completo" />
                            </div>
                            <div className="space-y-2">
                                <Label>Email do Gestor</Label>
                                <Input value={gestorEmail} onChange={(e) => setGestorEmail(e.target.value)} placeholder="email@exemplo.com" />
                            </div>
                        </div>
                        <Button onClick={handleCreateGestor} disabled={!gestorEmail || !gestorName || createGestor.isPending} className="bg-blue-600 hover:bg-blue-700">
                            {createGestor.isPending ? "Criando..." : <><UserPlus className="mr-2 h-4 w-4" /> Criar Gestor</>}
                        </Button>

                        <div className="pt-6 border-t mt-6">
                            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" /> Usuários Cadastrados
                            </h3>
                            {loadingAllUsers ? (
                                <p className="text-xs text-muted-foreground">Carregando usuários...</p>
                            ) : (
                                <div className="space-y-2">
                                    {allUsers?.map((u: any) => {
                                        const userRole = Array.isArray(u.roles) ? u.roles[0]?.role : (u.roles?.role || 'indefinido');
                                        const teamName = u.team?.name;
                                        return (
                                            <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-600">
                                                        {u.name?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium">{u.name}</p>
                                                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                                                {userRole}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <p className="text-xs text-muted-foreground">{u.email}</p>
                                                            {teamName && (
                                                                <>
                                                                    <span className="text-[10px] text-muted-foreground">•</span>
                                                                    <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-medium">
                                                                        <Building2 className="h-3 w-3" /> {teamName}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => {
                                                            setUserToAssignTeam({ id: u.id, name: u.name, currentTeamId: u.team_id });
                                                            setTargetTeamId(u.team_id || "none");
                                                        }}>
                                                            <Users className="mr-2 h-4 w-4" />
                                                            Gerenciar Time
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => setUserToDelete({ id: u.id, name: u.name })}>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Excluir do Sistema
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Gestor Zone: Create Team / Invite Auxiliar */}
            {user?.role === "gestor" && (
                <Card className="border-indigo-500/20 bg-indigo-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-indigo-500">
                            <Building2 className="h-5 w-5" /> Gestão de Equipe
                        </CardTitle>
                        <CardDescription>
                            {user.teamId ? "Gerencie os membros do seu time" : "Configure seu time para começar"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!user.teamId ? (
                            <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground mb-4">Você ainda não possui um time configurado.</p>
                                <Button onClick={handleCreateTeam} disabled={createTeam.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                                    {createTeam.isPending ? "Criando..." : "Criar Meu Time"}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="border-b pb-4 mb-4">
                                    <h3 className="text-sm font-semibold mb-2">Convidar Auxiliar</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Nome</Label>
                                            <Input value={auxName} onChange={(e) => setAuxName(e.target.value)} placeholder="Nome do auxiliar" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input value={auxEmail} onChange={(e) => setAuxEmail(e.target.value)} placeholder="email@exemplo.com" />
                                        </div>
                                    </div>
                                    <Button onClick={handleInviteAuxiliar} disabled={!auxEmail || !auxName || createAuxiliar.isPending} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                                        {createAuxiliar.isPending ? "Enviando..." : <><UserPlus className="mr-2 h-4 w-4" /> Cadastrar Auxiliar</>}
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">Membros do Time</h3>
                                    {loadingMembers ? (
                                        <p className="text-xs text-muted-foreground italic">Carregando membros...</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {members?.filter((m: any) => {
                                                const userRoles = Array.isArray(m.roles) ? m.roles.map((r: any) => r.role) : [];
                                                return m.id !== user.id && userRoles.includes('auxiliar');
                                            }).map((member: any) => (
                                                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                                                            {member.name?.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{member.name}</p>
                                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8"
                                                        onClick={() => setMemberToRemove({ id: member.id, name: member.name })}
                                                        disabled={removeMember.isPending}
                                                    >
                                                        Remover
                                                    </Button>
                                                </div>
                                            ))}
                                            {members?.filter((m: any) => {
                                                const userRoles = Array.isArray(m.roles) ? m.roles.map((r: any) => r.role) : [];
                                                return m.id !== user.id && userRoles.includes('auxiliar');
                                            }).length === 0 && (
                                                    <p className="text-xs text-muted-foreground italic">Nenhum auxiliar no time.</p>
                                                )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Account Info (Read-only) */}
            <Card>
                <CardHeader>
                    <CardTitle>Detalhes da Conta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Função:</span>
                        <span className="capitalize font-medium">{user?.role || "Indefinido"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Nome do Time:</span>
                        <span className="font-medium">{user?.teamName || "Nenhum"}</span>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover <span className="font-bold">{memberToRemove?.name}</span> do time?
                            Esta ação removerá o acesso dele aos ativos do time.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveMember}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {removeMember.isPending ? "Removendo..." : "Remover Membro"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o usuário <span className="font-bold">{userToDelete?.name}</span> permanentemente?
                            Esta ação NÃO pode ser desfeita e removerá todos os acessos e dados vinculados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {adminDeleteUser.isPending ? "Excluindo..." : "Excluir Usuário"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!userToAssignTeam} onOpenChange={(open) => !open && setUserToAssignTeam(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gerenciar Time</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Selecionar Time para {userToAssignTeam?.name}</Label>
                            <Select value={targetTeamId} onValueChange={setTargetTeamId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Escolha um time..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sem Time (Remover)</SelectItem>
                                    {teams?.map((t: any) => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUserToAssignTeam(null)}>Cancelar</Button>
                        <Button onClick={handleAssignTeam} disabled={adminUpdateTeam.isPending}>
                            {adminUpdateTeam.isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserProfile;
