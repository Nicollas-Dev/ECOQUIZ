# ECOQUIZ

**Aprender. Jogar. Transformar.**

Plataforma de quizzes ao vivo com criação livre, biblioteca pessoal e banco educacional dos 17 Objetivos de Desenvolvimento Sustentável. A expansão reutiliza React, Express, Socket.IO, Prisma, SQLite e o fluxo de partidas da primeira etapa.

## Executar localmente

Requisitos: Node.js 24 ou superior e pnpm 10 ou superior. O monorepo usa `workspace:*` e tem lockfile pnpm.

```bash
pnpm install
pnpm db:prepare
pnpm dev
```

Se o pnpm pedir autorização para scripts de instalação, aprove os pacotes Prisma e esbuild com `pnpm approve-builds`. Antes de preparar novamente o banco, pare o backend: o Windows pode manter a biblioteca do Prisma em uso.

- Aplicação: http://localhost:5173
- API: http://localhost:3333
- Saúde: http://localhost:3333/health

Os aliases anteriores `dev:pnpm`, `db:prepare:pnpm`, `build:pnpm` e `typecheck:pnpm` continuam disponíveis.

```bash
pnpm typecheck
pnpm build
pnpm test
```

## Configuração

Exemplos: `.env.example`, `apps/server/.env.example` e `apps/web/.env.example`. Os padrões funcionam sem arquivos de configuração.

```env
# apps/server/.env
PORT=3333
DATABASE_URL=file:./dev.db
CLIENT_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

Para alunos usando celulares na mesma rede, substitua SEU-IP pelo endereço do computador e libere as portas no firewall quando necessário:

```env
# apps/server/.env
CLIENT_ORIGIN=http://localhost:5173,http://SEU-IP:5173

# apps/web/.env
VITE_API_URL=http://SEU-IP:3333
VITE_SOCKET_URL=http://SEU-IP:3333
```

Reinicie os servidores depois de alterar variáveis de ambiente.

## Criar e jogar

### Quiz próprio

1. Abra **Criar quiz** e preencha título, descrição e categoria livre.
2. Defina o tempo padrão e a ordem fixa ou aleatória. A associação aos ODS é opcional.
3. Adicione perguntas com duas a quatro alternativas e selecione uma resposta correta.
4. Use a barra lateral para editar, duplicar, mover, excluir com confirmação e visualizar a prévia.
5. Clique em **Salvar** para persistir o quiz no SQLite ou **Iniciar partida** para salvar e abrir uma sala.
6. Os alunos acessam **Entrar em sala**, informam PIN e apelido. O professor inicia, acompanha respostas e avança as perguntas até o pódio.

### Banco ODS e quizzes mistos

1. Abra **Explorar ODS** ou **Banco de questões**.
2. Filtre por um ou mais ODS, dificuldade e palavras-chave.
3. Selecione perguntas manualmente ou informe a quantidade para seleção aleatória sem repetição.
4. Clique em **Montar quiz** e dê um título.
5. Acrescente perguntas próprias, reordene e ajuste os tempos no editor.

No editor, **Adicionar do banco ODS** permite incorporar perguntas a um quiz existente. Cada pergunta importada vira uma cópia editável. Editar ou excluir essa cópia preserva o original.

### Biblioteca e credencial anônima

**Meus quizzes** lista apenas os quizzes associados à credencial deste navegador. A biblioteca permite jogar novamente, editar, duplicar e excluir com confirmação. Encerrar uma sala não remove o quiz.

Não há login nesta etapa. O servidor gera uma credencial aleatória de 256 bits, guarda somente seu hash SHA-256 e autoriza o CRUD por `Authorization: Bearer`. A entidade `Creator` possui `userId` opcional para futura integração com contas.

A credencial é armazenada no `localStorage` do navegador. **Guardar credencial** baixa uma cópia; **Restaurar acesso** aceita a credencial em outro navegador conectado ao mesmo backend. Ela concede acesso de edição à biblioteca e deve permanecer secreta. Sem uma cópia, perder os dados do navegador significa perder o acesso aos quizzes anônimos.

O PIN público não concede edição nem controle da sala. Cada sala possui uma credencial independente do professor, guardada no `sessionStorage` da aba. Participantes também recebem credenciais privadas para retomar a sessão após desconexão ou recarregamento.

### Rascunhos

Alterações no editor são guardadas localmente. O texto **Rascunho salvo neste navegador** não significa que o quiz foi salvo no servidor. **Salvo no banco de dados** aparece após confirmação da API. Perguntas incompletas permanecem como rascunhos locais; salvar no banco exige perguntas válidas. Quizzes sem perguntas podem ser salvos, mas não podem iniciar partidas.

Uma revisão numérica protege contra sobrescrita por outra aba. Se a versão do servidor mudou, o editor carrega a versão atual e informa a existência de um rascunho antigo. O rascunho antigo permanece no armazenamento local até uma nova edição ou salvamento.

## Banco e migrations

`pnpm db:prepare` aplica migrations pendentes, gera o Prisma Client e executa o seed. Arquivo padrão: `apps/server/prisma/dev.db`.

Migrations:

- `202610130001_baseline`: reconhece ou cria as tabelas da etapa inicial.
- `202610130002_quizzes_ods`: acrescenta ODS, autoria, Quiz e QuizQuestion; torna a trilha opcional e amplia Question com dificuldade, origem, ODS, fonte e datas.

As 20 perguntas anteriores e suas alternativas são preservadas. A migração da tabela Question ocorre dentro de uma transação, com verificação de chaves estrangeiras antes do commit. O executor registra nome e checksum em `_EcoquizMigration` e recusa alterações em migrations já aplicadas.

Este ambiente Windows apresentou falha no engine de `prisma db push`. Por isso, o projeto usa o executor SQL versionado em `scripts/prepare-db.mjs`, baseado no SQLite nativo do Node 24. Use esse executor para aplicar migrations; não misture seu histórico com `prisma migrate deploy`.

Para executar somente migrations:

```bash
pnpm --filter @ecoquiz/server exec node scripts/prepare-db.mjs --migrate-only
```

Para repetir somente o seed:

```bash
pnpm --filter @ecoquiz/server exec tsx prisma/seed.ts
```

O seed usa IDs estáveis e upserts sem sobrescrever registros existentes. Não apaga quizzes, autores, questões ou opções. Antes de migrar um banco importante, pare o backend e faça uma cópia do arquivo SQLite.

## Conteúdo dos ODS

São **85 questões novas**, cinco para cada ODS, com **34 fáceis, 34 médias e 17 difíceis**. As 20 questões ambientais anteriores continuam disponíveis em `/trilhas`.

| ODS | Nome | Questões |
| --- | --- | ---: |
| 1 | Erradicação da pobreza | 5 |
| 2 | Fome zero e agricultura sustentável | 5 |
| 3 | Saúde e bem-estar | 5 |
| 4 | Educação de qualidade | 5 |
| 5 | Igualdade de gênero | 5 |
| 6 | Água potável e saneamento | 5 |
| 7 | Energia limpa e acessível | 5 |
| 8 | Trabalho decente e crescimento econômico | 5 |
| 9 | Indústria, inovação e infraestrutura | 5 |
| 10 | Redução das desigualdades | 5 |
| 11 | Cidades e comunidades sustentáveis | 5 |
| 12 | Consumo e produção responsáveis | 5 |
| 13 | Ação contra a mudança global do clima | 5 |
| 14 | Vida na água | 5 |
| 15 | Vida terrestre | 5 |
| 16 | Paz, justiça e instituições eficazes | 5 |
| 17 | Parcerias e meios de implementação | 5 |

São questões autorais do ECOQUIZ, não provas oficiais da ONU. Cada questão contém explicação e uma URL de referência. Fontes: [objetivos e metas da ONU](https://sdgs.un.org/goals), [nomes em português](https://brasil.un.org/pt-br/sdgs) e [identidade visual](https://www.un.org/sustainabledevelopment/wp-content/uploads/2023/09/E_SDG_Guidelines_Sep20238.pdf). Os ícones representativos são Lucide, não os pictogramas oficiais da ONU.

Para incluir mais perguntas, acrescente registros ao seed ou use Prisma Studio (`pnpm --filter @ecoquiz/server prisma:studio`). A interface consulta o banco: novas perguntas válidas não exigem alterações de componentes, rotas ou tabelas. As operações administrativas do banco ficam fora da API pública.

## APIs

Rotas públicas:

- `GET /api/ods`
- `GET /api/questions?odsIds=ods-4,ods-6&difficulty=easy&search=água`
- `POST /api/questions/random`: `{ odsIds, count, difficulty? }`
- `POST /api/creators`: gera credencial anônima.
- `GET /api/rooms/:pin`: estado público sem segredos.
- `GET /api/tracks`: compatibilidade com trilhas anteriores.

Rotas que exigem a credencial do criador:

- `GET /api/quizzes`
- `POST /api/quizzes`
- `GET /api/quizzes/:id`
- `PUT /api/quizzes/:id`, incluindo `revision`.
- `DELETE /api/quizzes/:id`
- `POST /api/quizzes/:id/duplicate`
- `POST /api/rooms`: `{ quizId }`.

Adicionar, editar, excluir e reordenar perguntas usa o mesmo `PUT` transacional do quiz, com a lista de perguntas na ordem desejada. Não há gravações parciais de um quiz inválido.

A consulta do banco pode revelar respostas para o modo de estudo e autoria. O estado da partida usa identificadores novos e não expõe gabarito, explicação ou associação ao registro original enquanto a questão está aberta. Salas recebem snapshots independentes: editar ou excluir o quiz não modifica a partida já criada.

## Regras e limites

- Até 100 perguntas por quiz, configurável em `QUIZ_LIMITS`.
- Duas a quatro alternativas, exatamente uma correta.
- Tempo de 10 a 120 segundos; padrão editável.
- Título: 120 caracteres; enunciado: 1.000; alternativa: 300; explicação: 2.000.
- Até 200 participantes por sala e 500 salas ativas por processo.
- Validações no cliente e no servidor; dados Socket.IO também são validados.
- O servidor valida participante, sala, pergunta, alternativa, estado, tempo e duplicidade.
- Acerto: 500 + até 500 pontos por tempo restante. Erro ou ausência de resposta: zero.
- A pergunta fecha ao terminar o tempo ou quando todos os participantes conectados responderem.
- A ordem aleatória é sorteada novamente ao criar outra sala.
- Reiniciar uma partida limpa a pontuação e usa novos identificadores de pergunta para rejeitar respostas antigas.

## Testes

`pnpm test` usa Node Test Runner, SQLite temporário e um servidor real em porta livre. Não altera o banco de desenvolvimento.

A suíte cobre conteúdo e dificuldades, pesquisa e filtros, seleção aleatória, autorização, validação, concorrência, CRUD, quiz próprio com cinco questões, quiz misto com três ODS, snapshots, duplicatas de resposta, pontuação, cronômetro, ranking, reutilização, reconexão, migrations, seed idempotente e persistência após reinício.

A interface foi conferida em desktop e em largura de smartphone, incluindo criação, importação do banco, salvamento e partida real em duas abas.

## Arquivos principais

- `packages/shared/src/index.ts`: contratos e limites.
- `apps/server/prisma/schema.prisma`, `migrations/` e `seed.ts`: modelo e dados.
- `apps/server/src/data/odsContent.ts`: categorias e 85 questões.
- `apps/server/src/quizService.ts`: autoria, consultas e CRUD.
- `apps/server/src/roomManager.ts` e `index.ts`: integração e segurança das partidas.
- `apps/server/tests/expansion.test.ts`: testes automatizados.
- `apps/web/src/pages/OdsPage.tsx`, `QuestionBankPage.tsx`, `QuizEditorPage.tsx` e `MyQuizzesPage.tsx`: novos fluxos.
- `apps/web/src/lib/api.ts`, `editor.ts`, `studentSession.ts` e `components/Dialog.tsx`: integração e controles.
- `App.tsx`, `AppShell.tsx`, `HomePage.tsx`, `CreateRoomPage.tsx`, páginas de sala, `QuestionView.tsx` e `styles/index.css`: navegação, jogo e responsividade.
- `package.json`, `pnpm-lock.yaml`, `.gitignore` e `apps/server/scripts/prepare-db.mjs`: execução, dependências de teste e migrations versionadas.

## Limitações atuais

Salas, jogadores, respostas e rankings são mantidos em memória. Reiniciar o backend encerra salas ativas, mas preserva quizzes, credenciais de edição e banco ODS. Ainda não há contas, recuperação de credenciais pelo servidor, histórico de partidas, relatórios ou administração pública do banco. Rascunhos locais pertencem ao navegador. O SQLite e as salas em memória atendem um único processo; múltiplos servidores exigirão banco compartilhado e coordenação das salas.
