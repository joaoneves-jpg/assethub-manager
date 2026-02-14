# Instruções para Aplicar as Migrações

## Migração: Triggers de Histórico de Atividades

Esta migração adiciona triggers automáticos para registrar todas as alterações nas tabelas `pages` e `facebook_profiles` na tabela `activity_logs`.

### Como Aplicar

Você tem duas opções para aplicar esta migração:

#### Opção 1: Usando o Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Copie e cole o conteúdo do arquivo `supabase/migrations/20260214152100_add_activity_triggers.sql`
5. Clique em **Run** para executar a migração

#### Opção 2: Usando Supabase CLI

Se você tem o Supabase CLI instalado e configurado:

```bash
cd /Users/jpbaladineves/Desktop/projetcs/assethub-manager
supabase db push
```

### O que esta migração faz

- **Cria função `log_page_changes()`**: Registra automaticamente todas as operações (INSERT, UPDATE, DELETE) na tabela `pages`
- **Cria função `log_profile_changes()`**: Registra automaticamente todas as operações (INSERT, UPDATE, DELETE) na tabela `facebook_profiles`
- **Cria triggers**: Ativa as funções acima sempre que houver mudanças nas tabelas

### Benefícios

Após aplicar esta migração:
- ✅ Todas as alterações em páginas serão registradas automaticamente no histórico
- ✅ Todas as alterações em perfis do Facebook serão registradas automaticamente no histórico
- ✅ Você poderá ver quem fez cada alteração e quando
- ✅ Você poderá ver exatamente o que foi alterado (valores antigos vs novos)

### Verificação

Após aplicar a migração, você pode verificar se os triggers foram criados executando:

```sql
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table IN ('pages', 'facebook_profiles');
```

Você deve ver:
- `on_page_change` para a tabela `pages`
- `on_profile_change` para a tabela `facebook_profiles`
