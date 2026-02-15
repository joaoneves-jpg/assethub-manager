# Instruções para Aplicar as Migrações

## Passo 1: Executar as Migrações SQL no Supabase

Você precisa executar 3 migrações SQL no dashboard do Supabase:

### 1. Adicionar current_manager_id para ad_accounts
```sql
-- Arquivo: 20260215154300_add_manager_to_ad_accounts.sql
ALTER TABLE ad_accounts
ADD COLUMN current_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX idx_ad_accounts_current_manager_id ON ad_accounts(current_manager_id);

COMMENT ON COLUMN ad_accounts.current_manager_id IS 'The current manager responsible for this ad account';
```

### 2. Criar sistema de tags
```sql
-- Arquivo: 20260215154800_create_tags_system.sql
-- (Veja o arquivo completo em supabase/migrations/)
```

## Passo 2: Regenerar os Tipos do Supabase

Após executar as migrações:

1. Acesse: https://supabase.com/dashboard/project/ynqhpnqyqzwvhqjqfnwp/settings/api
2. Vá para "API Settings" → "Generate Types"
3. Copie os tipos gerados
4. Substitua o conteúdo de `src/integrations/supabase/types.ts`

## Passo 3: Verificar Erros de Lint

Após regenerar os tipos, os erros de lint em `useData.ts` devem desaparecer.

## Como Executar as Migrações

### Opção A: Supabase Dashboard (Recomendado)
1. Acesse: https://supabase.com/dashboard/project/ynqhpnqyqzwvhqjqfnwp/editor
2. Clique em "SQL Editor"
3. Cole o conteúdo de cada arquivo de migração
4. Execute cada um separadamente

### Opção B: Supabase CLI (Se configurado)
```bash
npx supabase link --project-ref ynqhpnqyqzwvhqjqfnwp
npx supabase db push
```

## Próximos Passos Após Migrações

Depois de executar as migrações e regenerar os tipos, continuarei implementando:
- Interface de tags com dropdown
- Colunas específicas para páginas em /assets
- Botão criar página
- Edição de "recebido em"
- Melhorias na edição em massa
- Cópia de ID para perfis e BMs
