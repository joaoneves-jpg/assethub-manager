import { usePages, useBms, useAdAccounts, useFbProfiles } from "@/hooks/useData";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Building2, CreditCard, Users } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { key: "pages", label: "Páginas", icon: FileText },
  { key: "bms", label: "Business Managers", icon: Building2 },
  { key: "accounts", label: "Contas de Anúncio", icon: CreditCard },
  { key: "profiles", label: "Perfis Facebook", icon: Users },
];

const Dashboard = () => {
  const { data: pages } = usePages();
  const { data: bms } = useBms();
  const { data: accounts } = useAdAccounts();
  const { data: profiles } = useFbProfiles();

  const counts: Record<string, number> = {
    pages: pages?.length || 0,
    bms: bms?.length || 0,
    accounts: accounts?.length || 0,
    profiles: profiles?.length || 0,
  };

  const pagesByStatus = {
    disponivel: pages?.filter((p) => p.status === "disponivel").length || 0,
    em_uso: pages?.filter((p) => p.status === "em_uso").length || 0,
    caiu: pages?.filter((p) => p.status === "caiu").length || 0,
    restrita: pages?.filter((p) => p.status === "restrita").length || 0,
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral dos seus ativos</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{counts[s.key]}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Páginas por Status</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Disponível", count: pagesByStatus.disponivel, dotClass: "status-available" },
            { label: "Em Uso", count: pagesByStatus.em_uso, dotClass: "status-in-use" },
            { label: "Caiu", count: pagesByStatus.caiu, dotClass: "status-down" },
            { label: "Restrita", count: pagesByStatus.restrita, dotClass: "status-restricted" },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <span className={`status-dot ${item.dotClass}`} />
                <div>
                  <p className="text-xl font-bold">{item.count}</p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
