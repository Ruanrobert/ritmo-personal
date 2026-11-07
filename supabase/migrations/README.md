# Migrations

As migrações versionam o schema e as políticas RLS. Não edite o banco de produção manualmente.

`20261003120000_mvp_core.sql` cria o schema inicial do MVP: perfis, conta de personal,
convites e vínculos, catálogo de exercícios (com URL opcional de vídeo), programas,
atribuições com cópia da prescrição, sessões, séries, feedback e políticas RLS.
Inclui RPCs autenticadas para onboarding de personal, convite/aceite, atribuição e
execução/conclusão de treino.

Para aplicar localmente, com Docker Desktop ativo e Supabase CLI instalado:

```bash
supabase start
supabase db reset
```

Revise as políticas de acesso antes de aplicar em produção.

