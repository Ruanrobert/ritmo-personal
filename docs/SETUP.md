# Preparação do ambiente

## Requisitos

- Node.js 24 (veja .nvmrc)
- npm 11.16.1
- Expo Go em um aparelho Android ou iOS

## Instalar dependências

Na raiz do repositório:

```bash
npm install
```

Instale as dependências de todos os workspaces a partir da raiz para manter uma única árvore.

## Painel web

```bash
npm run dev:web
```

Abra http://localhost:3000. No celular conectado à mesma rede, use http://IP-DO-COMPUTADOR:3000.

## App mobile (Expo)

```bash
npm run dev:mobile
```

Leia o QR code com o Expo Go. Se a porta 8081 já estiver ocupada, o comando pode usar outra porta; o servidor atual deste projeto está em 8082.

O app Expo já tem telas iniciais de aluno, biblioteca, execução de treino com marcação de séries e descanso, resumo/avaliação, evolução e perfil. Esses dados ainda são de prévia local: o login, sincronização e persistência compartilhada entram quando o Supabase for configurado.

## Variáveis de ambiente

Copie apps/web/.env.example para apps/web/.env.local e apps/mobile/.env.example para apps/mobile/.env. Configure a URL e a chave publicável do projeto Supabase. Variáveis NEXT_PUBLIC_* e EXPO_PUBLIC_* ficam visíveis ao navegador/aplicativo; nunca coloque nelas a chave secreta do Supabase. SUPABASE_SECRET_KEY deve permanecer somente em servidor.

## Supabase

O schema inicial e a RLS estão em supabase/migrations/20261003120000_mvp_core.sql. Para aplicar e validar localmente, instale a Supabase CLI, inicie o Docker Desktop e execute na raiz:

```bash
supabase start
supabase db reset
```

O Docker daemon precisa estar ativo. No ambiente atual o daemon não estava disponível, então a migration foi criada mas ainda não foi aplicada.

## Verificação

```bash
npm run lint
npm run typecheck
npm run build
```

