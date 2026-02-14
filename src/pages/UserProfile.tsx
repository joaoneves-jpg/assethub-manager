import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Save } from "lucide-react";

const UserProfile = () => {
    const { user, refreshProfile } = useAuth();
    const updateProfile = useUpdateProfile();
    const { toast } = useToast();

    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");

    const handleSave = async () => {
        try {
            await updateProfile.mutateAsync({ name, email });
            await refreshProfile(); // Refresh user data in context
            toast({
                title: "Perfil atualizado!",
                description: "Suas informações foram salvas com sucesso.",
            });
        } catch (error) {
            toast({
                title: "Erro ao atualizar perfil",
                description: "Não foi possível salvar as alterações.",
                variant: "destructive",
            });
        }
    };

    const hasChanges = name !== user?.name || email !== user?.email;

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Gerencie suas informações pessoais
                </p>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Informações Pessoais</CardTitle>
                    <CardDescription>
                        Atualize seu nome e email de contato
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Seu nome completo"
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="pl-9"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Este email será usado para notificações e comunicações
                        </p>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges || updateProfile.isPending}
                            className="w-full sm:w-auto"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                        {hasChanges && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setName(user?.name || "");
                                    setEmail(user?.email || "");
                                }}
                            >
                                Cancelar
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Informações da Conta</CardTitle>
                    <CardDescription>
                        Detalhes sobre sua conta no sistema
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-sm font-medium">ID do Usuário</span>
                        <span className="text-sm text-muted-foreground font-mono">{user?.id}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-sm font-medium">Team ID</span>
                        <span className="text-sm text-muted-foreground font-mono">
                            {user?.teamId || "Nenhum time associado"}
                        </span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-sm font-medium">Função</span>
                        <span className="text-sm text-muted-foreground capitalize">
                            {user?.role || "Sem função definida"}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserProfile;
