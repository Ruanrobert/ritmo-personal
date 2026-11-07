# REA — MFIT Personal 9.1.2 → Ritmo

Análise de engenharia reversa (REA) do concorrente e como cada ideia boa virou funcionalidade no Ritmo.
Só ideias e fluxos foram reaproveitados: nenhuma marca, texto, vídeo ou asset do MFIT foi copiado.

## 1. O que o APK revelou

| Item | Achado |
|---|---|
| Arquivo | `mfit-personal-9-1-2.apk` (SHA-256 `7AF7377E…15C8`) |
| Arquitetura | Wrapper **WebViewGold**: o app é um WebView, sem regra de negócio no APK |
| URL de entrada | `app.mfitpersonal.com.br/<base64>?os=android&version=11&appVersion=81`; o base64 decodifica para `0/null/organic/app_signup_android` (rastreio de origem de instalação) |
| Backend / push | Firebase `mfitpersonal-e2658`, OneSignal + FCM |
| Monetização | AdMob, Audience Network, Play Billing |
| Outros | GPSService, NfcActivity (genéricos do template) |

**Consequências:** sem modo offline, sem acessibilidade nativa e com UX de site dentro do app. O Ritmo é nativo (Expo) e local-first.

## 2. Bugs e fraquezas observados (BlueStacks + ADB)

1. A carga é texto livre: "15-15" foi plotado como **1.515 kg** no gráfico.
2. As medidas corporais são uma foto de uma folha de papel.
3. O banner "modo visualização" ocupa cerca de 30% da tela.
4. O card de exercício não abre detalhe; o modal de vídeo não tem controles e estoura a tela.
5. O feedback pós-treino é só texto, sem RPE e sem sinal de dor.

## 3. Ideia → implementação no Ritmo

| Ideia boa do MFIT | Como ficou no Ritmo | Arquivo |
|---|---|---|
| Card do personal (foto, CREF, WhatsApp, Instagram) | Card na Home com deep links | `apps/mobile/app/index.tsx` |
| Programa com validade | `Program.startsOn/endsOn`, barra de progresso e alerta de vencimento | `app/workouts.tsx`, `lib/training.ts` (`programStatus`) |
| Fichas por dia da semana | `WorkoutDay.weekday` (1–7); a Home mostra o treino de hoje ou o próximo | `lib/training.ts` (`todayOrNextDay`) |
| "Executado N vezes, última em…" | `dayStats` mais "ÚLTIMA VEZ" por exercício | `app/workouts.tsx`, `app/workout.tsx` |
| Gamificação | Frequência semanal e sequência 🔥 (`weekStreak`), PR detectado | `app/index.tsx` |
| Gráfico de evolução | Carga **numérica** (`loadKg`, `loadPerSide`), PR e delta, filtro `?exercise=` | `app/progress.tsx` |
| Medidas | Formulário estruturado (peso, cintura, quadril, peito, braço, coxa) com gráfico e deltas | `app/progress.tsx`, `lib/fitness-context.tsx` |
| Feedback | RPE 1–10, interruptor de dor e comentário | `app/workout.tsx` |

**Além do MFIT:** progressão dupla automática (`suggestLoad`): +2,5 kg, ou +1 kg quando a carga é por lado e ≤10 kg, depois de 2 sessões batendo `repsMax`. Também há a caixa "META HOJE", confirmação antes de descartar ou sair e suporte a web (`lib/dialogs.ts`).

## 4. Banco (Supabase)

Migração `supabase/migrations/20261025180000_programs_feedback_measurements.sql`:
- Tabelas novas: `programs`, `program_assignments`, `body_measurements`.
- `workout_plans` ganha `program_id`, `day_label`, `weekday`.
- `workout_exercises` ganha `reps_min`, `reps_max`, `load_per_side`.
- `session_feedback` ganha `rpe` e `pain`; `rating` passa a ser opcional.
- `trainer_accounts` ganha `cref`, `whatsapp`, `instagram`.
- RLS em todas as tabelas.

> Ainda não foi validada contra um banco real.

## 5. Limites da análise

- Não houve interceptação de tráfego nem extração de assets ou APIs privadas.
- A navegação no MFIT foi só leitura: nenhum treino iniciado, nenhum cupom resgatado.
- Medidas e dados de saúde ficam só no aparelho por enquanto (LGPD).

## 6. Pendências

- Sincronização real com o Supabase e push (FCM/Expo).
- Painel web: editor de programa com dias e validade, alertas de dor/RPE, medidas do aluno.
- Faturas, Arquivos (dieta e planners) e pontos→descontos.
