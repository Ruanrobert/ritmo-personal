# Plano inicial — plataforma SaaS para personal trainer

## Leitura do pedido

A imagem é uma referência de experiência visual para dois produtos: o app do aluno e o painel web do personal. O texto colado descreve uma visão ampla de SaaS. Este documento transforma essa visão em um primeiro recorte implementável; não propõe copiar a interface, os dados ou a marca de outro produto.

O arquivo de requisitos recebido termina no cabeçalho “Página de vendas do personal” e na palavra “Mostrar”. O plano cobre os requisitos visíveis até esse ponto. A pasta de trabalho estava vazia na análise inicial.

## Recomendação

Construir uma primeira versão que prove o ciclo principal:

1. O personal cria a conta e cadastra/convida um aluno.
2. O personal monta e atribui um treino usando uma biblioteca inicial de exercícios.
3. O aluno abre o treino no app, registra séries e conclui a sessão.
4. O personal acompanha conclusão, frequência e feedback básico.

Esse fluxo entrega valor observável sem assumir desde o início o custo e a complexidade de pagamentos, agenda, chat, IA, administração da plataforma e tratamento extensivo de dados de saúde.

## Direção visual da referência

- **Painel web do personal:** navegação lateral azul-marinho, área de trabalho clara, cartões brancos, tipografia enxuta, azul vivo para ações e gráficos, verde para estados de sucesso e progresso.
- **App do aluno:** superfícies azul-marinho muito escuras, texto claro, ações principais em verde-menta e azul claro para abas, seleção e indicadores.
- Disponibilizar temas claro e escuro nas configurações, mantendo a preferência da pessoa no dispositivo.
- Manter essa diferença entre as duas interfaces: o painel prioriza leitura e gestão; o app prioriza foco durante o treino. Usar a imagem como direção visual, sem copiar marca, fotos ou textos de produto de terceiros.

## Pontos a resolver na especificação

- A arquitetura descreve “clientes → backend/API → Supabase”, enquanto Supabase também permite acesso direto pelo cliente. Proposta: usar Supabase Auth e acesso aos dados de escopo limitado com RLS; reservar funções server-side para convites, operações privilegiadas, integrações e segredos.
- “ADMIN” aparece entre os usuários iniciais, mas um painel administrativo da plataforma não é necessário para validar o produto. Proposta: manter administração como capacidade interna futura; no MVP, suportar personal e aluno.
- Receita e pagamentos aparecem no dashboard, mas não há regras de cobrança, planos ou definição de quem recebe o dinheiro. Proposta: deixar pagamentos fora do primeiro ciclo e evitar apresentar receita fictícia como dado real.
- A especificação pede mensagens simples e também chat em tempo real futuro. Proposta: começar com aviso do personal e feedback pós-treino; adiar chat.
- Anamnese e saúde são desejadas, mas ampliam muito o risco e as obrigações de privacidade. Proposta: não coletar condições, medicamentos ou fotos no MVP. Definir finalidade, base legal, acesso, retenção e fluxo de direitos antes de incluir esses campos.
- O escopo mistura mobile nativo, painel web, vendas, pagamentos, agenda, notificações, biblioteca de vídeo e IA. Construir tudo em conjunto atrasaria a validação e aumentaria custos operacionais.

## Escopo sugerido

### MVP

- Autenticação de personal e aluno, recuperação de senha e convite do aluno.
- Relação explícita entre personal e aluno.
- Cadastro simples de aluno e status de vínculo.
- Biblioteca pequena inicial de exercícios, com metadados e mídia de demonstração própria/licenciada.
- Criação, edição e atribuição de treinos com exercícios ordenados, séries, repetições, carga, descanso e observações.
- App do aluno: treino atual, execução passo a passo, registro de séries, cronômetro de descanso e conclusão.
- Histórico de sessões e resumo simples de frequência para aluno e personal.
- Feedback curto ao fim da sessão.
- Dashboard do personal com contagens calculadas a partir de dados reais.
- Layout responsivo, estados vazios, carregamento, erro e acessibilidade básica.

### Depois de validar o MVP

- Medidas e gráficos de evolução.
- Upload de fotos privadas e avaliação física.
- Agenda e recorrências.
- Push notifications e mensagens/chat.
- Página pública de vendas por personal.
- Mercado Pago e webhooks de assinatura.
- Painel administrativo, relatórios avançados e gestão de academias.
- Assistente de IA.

## Arquitetura proposta

- **Monorepo TypeScript** para manter tipos, validação e regras de domínio compartilháveis.
- **Web:** Next.js para o painel do personal e, se útil, páginas públicas futuras.
- **Mobile:** Expo + React Native para Android e iOS do aluno.
- **Backend inicial:** Supabase Auth, PostgreSQL, Storage e RLS. Edge Functions ou rotas server-side para operações privilegiadas e integrações externas.
- **Vídeos:** começar com vídeos curtos próprios ou licenciados. Guardar no banco apenas IDs, metadados e URLs controladas. Avaliar Cloudflare Stream quando volume e consumo justificarem; a cobrança atual é baseada em minutos armazenados e entregues.
- **Deploy:** Vercel para web e Supabase para backend, conforme preferência do briefing.
- **Observabilidade:** Sentry e analytics só quando houver fluxo real de usuários, configurados sem enviar dados de saúde ou conteúdo de mensagens.

### Reuso entre web e mobile

Compartilhar tipos, schemas de validação, formatos de treino, regras de progressão e clientes de API em pacotes TypeScript. Manter componentes visuais específicos por plataforma: uma interface web de gestão e uma interface mobile focada em execução durante o treino.

## Modelo de dados inicial

Todas as tabelas de domínio devem ter chaves UUID, timestamps e vínculos explícitos. Dados pertencentes a um personal carregam `trainer_id` (ou uma chave de tenant equivalente), validado por RLS.

- `profiles`: identidade de aplicação ligada a `auth.users`; nome e papel permitido.
- `trainer_accounts`: dados básicos da conta do personal/tenant.
- `trainer_students`: vínculo personal-aluno, estado do convite e datas de ativação/desativação.
- `exercises`: catálogo compartilhado e controlado pela plataforma; nome, grupo muscular, equipamento, nível, instruções e referência de mídia.
- `workout_plans`: definição do treino, proprietário/tenant, nome, objetivo e estado.
- `workout_exercises`: exercícios do plano, ordem e prescrição (séries, faixa de repetições, descanso, instruções).
- `workout_assignments`: atribuição de um plano a um aluno, vigência e estado.
- `training_sessions`: execução iniciada/concluída pelo aluno vinculado.
- `set_logs`: dados por série (carga, repetições, conclusão e nota opcional), vinculados à sessão e ao exercício prescrito.
- `session_feedback`: avaliação simples pós-treino, vinculada à sessão.

Medidas, anamnese, fotos, mensagens, agenda e cobrança ficam fora do schema inicial até terem regras próprias de privacidade, retenção e autorização. Evitar duplicar dados de perfil em registros históricos sem motivo; preservar o histórico necessário quando um treino for alterado depois de atribuído.

## Segurança e privacidade

- RLS habilitada em todas as tabelas expostas pela API. O personal só consulta alunos com vínculo ativo no seu tenant; o aluno só consulta seus próprios dados e treinos atribuídos. Políticas devem cobrir leitura, inserção, atualização e exclusão separadamente.
- Não confiar em `trainer_id`, papel ou ID de aluno recebido do cliente sem checar o vínculo no banco.
- Chaves `service_role`, segredos do Mercado Pago e chave da OpenAI somente no servidor/função; nunca no app mobile ou navegador.
- Buckets privados para fotos e documentos, com URLs assinadas de curta duração e autorização checada antes da emissão. Fotos ficam adiadas no MVP.
- Limitar e validar uploads; impor quotas, tipos e tamanho.
- Registrar consentimentos/avisos aplicáveis, pedidos de acesso/correção/eliminação e política de retenção. Minimizar dados e não coletar anamnese clínica por padrão.
- Dados de saúde são dados pessoais sensíveis na LGPD. A finalidade e hipótese legal aplicável precisam ser definidas com orientação especializada antes de coletá-los; consentimento genérico não resolve todos os casos. A lei também prevê medidas de segurança desde a concepção do serviço.
- Decidir hospedagem/região e revisar contratos/suboperadores e transferências internacionais antes de produção, incluindo Supabase, Vercel, serviços de vídeo, analytics e monitoramento.
- Não apresentar o produto como ferramenta de diagnóstico ou tratamento clínico.

## APIs e operações

Com Supabase, o CRUD restrito pode usar a API gerada com RLS. Operações de maior privilégio devem passar por funções/rotas de servidor, por exemplo:

- `POST /invites`: criar convite de aluno e enviar link de acesso.
- `POST /workout-assignments`: validar treinador, aluno, plano e atribuir treino.
- `POST /training-sessions`: iniciar sessão para o aluno autenticado.
- `POST /training-sessions/:id/sets`: registrar ou atualizar série da própria sessão.
- `POST /training-sessions/:id/complete`: concluir sessão e salvar feedback.
- `GET /trainer/dashboard`: devolver contagens agregadas apenas do tenant atual.

No MVP, preferir operações idempotentes para gravação de séries e conclusão de sessão. Definir paginação, limites e erros consistentes antes de abrir APIs a integrações externas.

## Estrutura sugerida

```text
apps/
  web/                 # Next.js: painel do personal
  mobile/              # Expo: app do aluno
packages/
  domain/              # tipos, schemas e regras de treino compartilhadas
  api/                 # cliente tipado e funções de acesso
  config/              # TypeScript, lint e configuração comum
supabase/
  migrations/          # schema e políticas RLS versionados
  functions/           # convites e operações privilegiadas
docs/
  product/             # decisões de produto e fluxos
```

## Ordem de desenvolvimento

1. Confirmar decisões de produto mínimas e criar protótipo navegável do fluxo principal.
2. Preparar monorepo, ambientes e migrations do schema essencial.
3. Implementar autenticação, vínculo/convite e RLS antes das telas de dados.
4. Implementar gestão de alunos, catálogo inicial e criador de treino no painel web.
5. Implementar treino atribuído e execução no app Expo.
6. Implementar histórico, feedback e dashboard com dados reais.
7. Revisar políticas de acesso, privacidade, recuperação de conta e estados de erro.
8. Pilotar com poucos personais e alunos; usar o feedback para priorizar evolução, agenda e cobrança.

## Custos e riscos operacionais

- Supabase e Vercel têm limites e preços por plano/uso; revisar a página oficial antes de escolher produção e monitorar banco, armazenamento, egress e funções.
- Cloudflare Stream cobra por minutos armazenados e entregues; útil para não operar transcodificação própria, mas o consumo de reprodução precisa ser medido.
- O custo de notificações, e-mail, analytics, logs e suporte também cresce com uso. Deixar limites e alertas de orçamento configuráveis.
- A maior fonte de risco técnico inicial é uma política RLS incompleta entre personais. A maior fonte de risco de produto é coletar saúde/fotos sem necessidade e sem um fluxo de privacidade resolvido.

## Decisões mínimas antes de implementar

1. **Mercado inicial:** personal individual ou pequenas academias? Recomendação: personal individual, um tenant por personal, sem funcionários no MVP.
2. **Alcance da primeira entrega:** protótipo visual ou produto funcional com backend? Recomendação: fluxo funcional mínimo, liberado primeiro para piloto.
3. **Idioma e marca:** nome provisório, identidade visual e se a interface será apenas em português brasileiro. Recomendação: português brasileiro e marca provisória própria.
4. **Cadastro de aluno:** convite por e-mail ou telefone/WhatsApp? Recomendação: e-mail no início, sem integração externa de mensagens.
5. **Saúde e menores:** aceitar apenas adultos e adiar anamnese clínica/fotos? Recomendação: sim para reduzir o escopo e o risco inicial.
6. **Pagamento no MVP:** cobrar assinatura do personal desde o piloto ou validar o fluxo sem cobrança integrada? Recomendação: sem gateway no primeiro piloto.

## Referências consultadas

- [Lei nº 13.709/2018 — LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD — perguntas frequentes sobre dados pessoais e dados sensíveis](https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes)
- [Supabase — preços e limites atuais](https://supabase.com/pricing)
- [Cloudflare Stream — preços atuais](https://developers.cloudflare.com/stream/pricing/)
