# Relatório técnico — MFIT Personal 9.1.2

**Alvo:** `mfit-personal-9-1-2.apk`  
**SHA-256:** `7af7377e83f72814a57bf5b032374ff5aaf6181bad776fd3fbd4a6d7493f15c8`  
**Análise:** estática, offline. O APK não foi instalado nem executado e nenhum endpoint foi acessado.

## Resumo

O APK observado é principalmente um contêiner Android para uma aplicação web. A atividade principal configura uma `WebView`, carrega uma URL configurada pela aplicação e adiciona identificadores de idioma e push à URL. Quando a condição de rede não está satisfeita, o código abre uma página HTML local de indisponibilidade. A tela, os dados e as regras de negócio principais não aparecem nos recursos HTML locais analisados.

Isso permite entender a arquitetura do cliente Android, algumas integrações do aparelho e o ponto de entrada web. Login, treino remoto, APIs, planos, créditos, armazenamento de projetos e fluxo real de notificações continuam desconhecidos sem evidência autorizada do serviço web.

## Fatos confirmados no APK

| Item | Observação estática |
|---|---|
| Pacote | `app.mfit.personal` |
| Versão | `9.1.2`, `versionCode 99` |
| SDK | mínimo 23; alvo 35; compilado com SDK 35 |
| Código empacotado | 13.697 classes DEX e 910 recursos decodificados pelo JADX |
| Entrada Android | `SplashScreenActivity` abre `MainActivity` após a rotina visual de inicialização |
| Interface principal | `CustomWebView`/`WebView`; JavaScript, DOM storage, cookies de terceiros, geolocalização, janelas e downloads são habilitados pelo código |
| URL inicial | o método `q3()` usa `app.mfit.personal.e.f12093a`; o valor final não foi recuperado nesta rodada |
| Parâmetros de URL | `webview_language` recebe o idioma do Android em maiúsculas; `onesignal_push_id` e `firebase_push_id` são incluídos quando disponíveis; `uuid` recebe o `android_id` |
| Offline | abre `file:///android_asset/local-html/index.html`; o HTML local oferece uma imagem/link de indisponibilidade |
| Links externos | trata URLs `http`/`https`, extras de deep link e link de abertura externa |
| Integrações declaradas | Google Play Billing, OneSignal/Firebase push, anúncios, seletor de arquivos, downloads, permissões de câmera/áudio e APIs de geolocalização da WebView |
| Permissões | incluem internet, estado de rede, câmera, áudio, notificações, armazenamento legado, biometria, billing, wake lock e inicialização pós-boot; declaração de permissão não prova uso de cada função |
| Configuração de rede | Manifesto declara `usesCleartextTraffic=true`; isso merece revisão em uma auditoria própria. Nenhum tráfego foi capturado |

O HTML local `index.html` contém um link para `app.mfitpersonal.com.br` com parâmetros de plataforma/versão. Isso é um link empacotado, não uma chamada observada. O arquivo `index2.html` é uma página de exemplo local; `custom.css` e `custom.js` estão vazios na listagem do APK.

## Fluxo Android reconstruído

1. A `Application` registra callbacks de ciclo de vida, inicializa OneSignal e chama rotinas auxiliares.
2. A tela de splash apresenta o estado visual e encaminha para a atividade principal.
3. `MainActivity` cria a WebView, o cliente de navegação, o cliente de permissões, o listener de downloads e o cliente de cobrança.
4. A atividade verifica a conectividade. Com rede, tenta restaurar a URL anterior ou carrega a URL-base; sem rede, abre a página HTML local.
5. A URL-base recebe parâmetros de idioma e IDs de push, além do identificador Android lido pelo código. O código permite cookies de terceiros e armazenamento DOM.

O fluxo descreve o código do invólucro Android. Não estabelece o comportamento da aplicação servida remotamente.

### Detalhes nativos identificados na inspeção adicional

- `MainActivity.q3()` tenta restaurar uma URL válida salva; se não houver, compõe a URL-base e carrega a página na WebView. O valor de `e.f12093a` continua sem resolução: a inspeção da inicialização estática da classe `e` não encontrou uma atribuição para esse campo.
- O código reconhece links HTTP/HTTPS recebidos por intents, o extra `ONESIGNAL_URL` e, após a inicialização, o extra `openURL`. Conforme a origem e a validação do link, ele carrega na WebView ou abre uma intent externa.
- O cliente de cobrança do Google Play é criado durante `MainActivity.onCreate`; o método `D3(SkuDetails)` chama o fluxo de billing do Android. Isso confirma a presença de um caminho de integração, mas não quais planos são exibidos nem se ele é alcançado pelo usuário.
- O pedido de captura de vídeo/áudio da WebView é convertido em permissões Android de câmera/microfone. O listener de downloads passa a URL ao roteador nativo, que pode entregá-la a um app externo.
- `CustomWebView` adiciona tratamento de gestos/rolagem, mas não contém telas do produto. A inicialização estática da classe `e` revela opções genéricas do invólucro, extensões de arquivo e domínios de exemplo; não fornece a URL-base nem as regras do serviço MFIT.

Esses detalhes aumentam a cobertura do cliente nativo, mas não expõem o HTML/JavaScript remoto, o contrato das APIs ou estados internos da conta. A rota de entrada encontrada no HTML empacotado não foi acessível pela ferramenta de navegação usada nesta rodada; portanto, nenhuma tela remota foi observada.

## O que não foi possível confirmar

- Telas reais de login/cadastro, autenticação, recuperação de senha e vínculo entre aluno e personal.
- Catálogo de exercícios, treinos atribuídos, execução, histórico, avaliação, medidas, fotos ou upload de vídeos.
- Conversas, notificações exibidas no produto, criação de treinos no painel e regras dos botões.
- Domínios/API usados pela aplicação web, rotas HTTP, payloads, respostas, autenticação das requisições ou serviços de persistência.
- Planos, créditos, pagamentos efetivamente oferecidos ao usuário e controle de acesso por assinatura.
- Se permissões de câmera, áudio, geolocalização, anúncios ou billing são acionadas na interface do produto.

Esses pontos dependem do conteúdo do servidor e/ou de uma sessão autorizada. O pacote não contém a lógica de negócio web e esta análise não iniciou a aplicação, sessão de usuário ou tráfego de rede.

## Evidências REA

| Evidência | Operação | Uso no relatório |
|---|---|---|
| `ev_d126effbe541c691c2208df5f3f73a7c4364fce2be1669f560718424933bbcc3` | `inspect_android_package` | identidade, manifesto, permissões e contagens |
| `ev_30097b571148fd9c9d4cfc83db79c88476fdb91d949c30241dad1278f888e8f7` | `inspect_android_method` — `MainActivity.onCreate` | configuração da WebView, billing, push, download e permissões |
| `ev_6961a2c63227783b36dcc0ae0be501bf17ea30ef94478e9de5ce099c62d1f387` | `inspect_android_method` — `MainActivity.q3` | carregamento, restauração e composição da URL |
| `ev_4e8c9402da2ee7db6154cbaa34c17adbf52c895fbc06d2931cb9441632341711` | `inspect_android_method` — `MainActivity.W2` | verificação de conectividade |
| `ev_44db032f043d943a23a485c403a8ef408fa90a50e4b8b5387e494a8d360cfed2` | `inspect_android_method` — `SplashScreenActivity.onCreate` | splash e encaminhamento após atraso |
| `ev_b8105a2f445a54408b5c85aed6f79705ade5426cf374915a7fc4cc112e931988` | `inspect_android_method` — `WebViewApp.onCreate` | inicialização da aplicação Android |
| `ev_63be28f17f305f334431e17266a7cffd82377e12bacf4ce0ba0f442e25a5d5f3` | `inspect_android_method` — `WebViewApp.c` | inicialização de push observada |
| `ev_80cf7467014af31b5dc9e9158f231109c6c86f40c4110e538eb1c98592327e78` | `inspect_android_method` — `e.<clinit>` | configurações estáticas do invólucro |
| `ev_aee0ec9797bee6ddeab79e35507d9bcfb1c829a90f89b50f41bef7b47d774785` | `inspect_android_class` — `WebViewApp` | inventário de membros Android |
| `ev_111f22abdd696db5f442f07f8b7fed0e0ea007823e99ff5fd31f21686be54b1f` | `inspect_android_method` — `MainActivity.F2` | mapeamento de captura de áudio/vídeo para permissões Android |
| `ev_15068818fe284a163087854252ddd4315be64de45525a41905936f7328af4bcb` | `inspect_android_method` — `MainActivity.D3` | abertura do fluxo de compra do Google Play Billing |
| `ev_58b79828a2da922bd3fa063d6530623bc35bfc9a4b570a31f2de0782563bb1b9` | `inspect_android_method` — `MainActivity.L2` | tratamento de URL recebida pelo listener de downloads |

**Ferramenta:** `jadx-headless-mcp 0.7.1`, com JDK 21.0.8. JAR oficial conferido por SHA-256 `6e5eacf500b64292bfb73c49797c1958f6ee44646e43e868039ae7feb573ff75`. O Android SDK/aapt já estava instalado. A configuração permanente do Codex/REA não foi alterada.

As conclusões são limitadas à análise estática. Os nomes ofuscados reduzem a legibilidade, a inicialização estática de `e.f12093a` não foi resolvida e as dependências de terceiros não foram tratadas como código de produto.

## Direção para a nossa aplicação

O briefing do projeto e as imagens do usuário descrevem a experiência que queremos construir; eles servem como requisitos e referência visual, não como prova de funcionalidades internas do MFIT. A proposta própria mantém o app do aluno focado em treino e o painel web focado em gestão:

- **Mobile Expo:** início, programação, biblioteca filtrável, detalhe de exercício, execução série a série, cronômetro, histórico, evolução, avisos, contato com o personal e preferências.
- **Painel Next.js:** alunos, biblioteca própria, prescrição e atribuição de treinos, acompanhamento e agenda.
- **Backend:** Supabase Auth + PostgreSQL com RLS desde o começo; vincular cada registro ao personal e ao aluno autenticados. Operações privilegiadas ficam em função/rota de servidor.
- **Vídeos:** guardar IDs/metadados e URLs no banco; armazenar/transmitir arquivos autorizados em storage ou Cloudflare Stream, nunca no PostgreSQL.
- **Privacidade:** adiar fotos e anamnese clínica até definir finalidade, acesso, retenção e proteção. Nunca colocar segredos no app.
- **Identidade:** paleta azul-marinho, texto claro, verde-menta para ações e azul-claro para seleção; usar componentes, textos e ativos próprios.

## Estado atual do protótipo mobile

Foi implementado um fluxo local independente do APK: pesquisa/filtro e favoritos, detalhe com instruções, registro de carga e repetições por série, descanso ajustável, conclusão com avaliação, histórico, progresso de carga, preferências Escuro/Claro/Sistema, avisos, conversa de demonstração e vídeo por exercício. O aluno pode colar um link autorizado ou escolher um vídeo da biblioteca do aparelho; vídeos locais são reproduzidos no detalhe e durante o treino. Preferências, favoritos, sessões e referências dos vídeos são salvos no aparelho com AsyncStorage.

Login, sincronização com o personal, envio real de mensagens/push, upload/compartilhamento de arquivo de vídeo e medidas corporais reais ainda requerem backend/configuração de produto. O vídeo escolhido permanece no aparelho; o app salva uma referência ao arquivo, não copia o arquivo para o backend. Mensagens e avisos atuais são conteúdo demonstrativo; o protótipo deixa isso indicado na interface. A persistência local é sem criptografia e não deve receber dados médicos ou sensíveis.
