# Ritmo Personal

**Plataforma digital para organização de treinos e acompanhamento fitness.**

O Ritmo Personal é um projeto em desenvolvimento que busca conectar a experiência de treinamento físico a ferramentas digitais de acompanhamento, organização e evolução.

A plataforma utiliza uma arquitetura monorepo, reunindo o aplicativo mobile, a aplicação web e regras de domínio compartilhadas.

> 🚧 **Status:** Em desenvolvimento — MVP.

## ✨ Visão do projeto

O objetivo do Ritmo Personal é oferecer uma experiência simples e organizada para acompanhar a rotina de treinos, consultar exercícios e visualizar a evolução ao longo do tempo.

### Funcionalidades em desenvolvimento

- Organização e consulta de treinos.
- Catálogo e detalhes de exercícios.
- Acompanhamento de progresso.
- Perfil do usuário.
- Notificações e mensagens.
- Aplicação mobile e painel web.
- Estrutura de backend e banco de dados com Supabase.

As funcionalidades podem evoluir durante a construção do MVP.

## 🧱 Arquitetura

O projeto está organizado como um monorepo:

```text
ritmo-personal/
├── apps/
│   ├── mobile/       # Aplicativo mobile com Expo
│   └── web/          # Aplicação web com Next.js
├── packages/
│   └── domain/       # Regras de domínio compartilhadas
├── supabase/
│   ├── config.toml
│   └── migrations/   # Migrações do banco de dados
├── docs/             # Documentação técnica
├── PLANO-MVP.md
├── package.json
└── README.md
```

## 🛠️ Tecnologias

| Tecnologia | Utilização |
|---|---|
| React Native | Aplicativo mobile |
| Expo | Desenvolvimento e execução do app mobile |
| TypeScript | Tipagem e desenvolvimento |
| Next.js | Aplicação web |
| Supabase | Backend e banco de dados |
| PostgreSQL | Banco de dados relacional |
| npm Workspaces | Gerenciamento do monorepo |

## 🚀 Como executar localmente

### Pré-requisitos

- Node.js compatível com a versão definida no arquivo `.nvmrc`.
- npm.
- Git.
- Projeto Supabase configurado para utilizar os recursos que dependem do backend.

### 1. Clonar o repositório

```bash
git clone https://github.com/Ruanrobert/ritmo-personal.git
cd ritmo-personal
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Para a aplicação web, copie o arquivo de exemplo:

```powershell
Copy-Item apps\web\.env.example apps\web\.env.local
```

Para o aplicativo mobile:

```powershell
Copy-Item apps\mobile\.env.example apps\mobile\.env
```

Preencha as variáveis com os dados do seu projeto Supabase.

**Importante:** não publique arquivos `.env`, chaves secretas ou credenciais privadas. A variável `SUPABASE_SECRET_KEY` deve ser utilizada somente em ambiente de servidor.

### 4. Executar a aplicação web

Na raiz do projeto:

```bash
npm run dev
```

A aplicação web será iniciada pelo workspace `@ritmo/web`.

### 5. Executar o aplicativo mobile

```bash
npm run dev:mobile
```

O Expo iniciará o ambiente de desenvolvimento do aplicativo mobile.

## 🗄️ Banco de dados

O projeto utiliza Supabase e mantém as migrações SQL versionadas em:

```text
supabase/migrations/
```

As migrações devem ser aplicadas ao ambiente Supabase correspondente antes de utilizar os recursos que dependem das tabelas e políticas do banco.

Consulte a documentação do projeto para obter as instruções de configuração.

## 📚 Documentação

A documentação técnica está disponível no diretório [`docs/`](./docs).

O planejamento do MVP está em [`PLANO-MVP.md`](./PLANO-MVP.md).

## 🧪 Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia a aplicação web |
| `npm run dev:web` | Inicia a aplicação web |
| `npm run dev:mobile` | Inicia o aplicativo mobile |
| `npm run build` | Gera o build web |
| `npm run lint` | Executa o lint das aplicações |
| `npm run typecheck` | Executa a verificação de tipos |

## 🎯 Objetivo

O Ritmo Personal é um projeto de desenvolvimento de produto que envolve arquitetura de software, aplicações web e mobile, integração com backend e organização de código em um monorepo.

O projeto está em evolução e tem como objetivo transformar o planejamento do MVP em uma plataforma funcional.

---

Desenvolvido por [Ruan Robert](https://github.com/Ruanrobert).
