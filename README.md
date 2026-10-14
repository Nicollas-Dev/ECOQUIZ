# ECOQUIZ

**Aprender. Jogar. Transformar.**

ECOQUIZ é uma plataforma web gamificada para educação ambiental, inspirada no fluxo de jogos ao vivo em sala de aula. Esta primeira etapa entrega um MVP funcional para professores criarem uma sala, alunos entrarem por PIN e todos jogarem uma partida sincronizada em tempo real.

## Tecnologias

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router e Lucide React.
- Backend: Node.js, TypeScript, Express e Socket.IO.
- Dados: Prisma ORM com SQLite local.
- Organização: monorepo com `apps/web`, `apps/server` e `packages/shared`.

## Estrutura

```text
apps/
  server/   API HTTP, Socket.IO, Prisma, seed e estado das salas em memória
  web/      Aplicação React responsiva para professor e aluno
packages/
  shared/   Tipos compartilhados entre frontend e backend
```

## Instalação

```bash
npm install
```

Neste ambiente de desenvolvimento o `npm` não estava disponível no PATH, então a validação foi feita com `pnpm`. O projeto também inclui scripts equivalentes:

```bash
pnpm install
```

## Variáveis de Ambiente

Use os exemplos em `.env.example`, `apps/server/.env.example` e `apps/web/.env.example`.

Para uso local padrão, nenhuma variável é obrigatória porque há valores default no código. Para testar com celular na mesma rede, configure os endereços do computador:

```env
# apps/server/.env
PORT=3333
CLIENT_ORIGIN=http://localhost:5173,http://SEU-IP-LOCAL:5173
DATABASE_URL=file:./dev.db

# apps/web/.env
VITE_API_URL=http://SEU-IP-LOCAL:3333
VITE_SOCKET_URL=http://SEU-IP-LOCAL:3333
```

## Banco Local

Prepare o SQLite e carregue as 4 trilhas com 20 perguntas:

```bash
npm run db:prepare
```

Ou, com pnpm:

```bash
pnpm db:prepare:pnpm
```

O script gera o Prisma Client, cria as tabelas locais de desenvolvimento e executa o seed.

## Executar

```bash
npm run dev
```

Ou, com pnpm:

```bash
pnpm dev:pnpm
```

URLs padrão:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3333`
- Health check: `http://localhost:3333/health`

## Como Testar uma Partida

1. Abra `http://localhost:5173` no navegador.
2. Clique em **Criar uma sala**.
3. Escolha uma trilha e gere o PIN.
4. Em outro navegador, aba anônima ou celular, acesse `/entrar`.
5. Informe o PIN e um apelido.
6. No painel do professor, inicie a partida.
7. Responda pelo aluno e avance as perguntas pelo professor.

## Funcionalidades Operacionais

- Landing page e seleção de trilhas.
- Criação de sala com PIN numérico de seis dígitos.
- Entrada de alunos com validação de PIN e apelido.
- Lobby em tempo real com participantes conectados.
- Perguntas sincronizadas via Socket.IO.
- Cronômetro controlado pelo servidor.
- Uma resposta por participante por pergunta.
- Gabarito oculto do aluno até o encerramento da pergunta.
- Pontuação por acerto e tempo de resposta.
- Resultado de pergunta com explicação educacional.
- Ranking final com pódio dos três primeiros.
- Botão de jogar novamente para o professor.

## Pontuação

A fórmula inicial é simples e ajustável no backend:

```text
acerto = 500 + até 500 pontos de bônus proporcional ao tempo restante
erro ou resposta fora do tempo = 0 pontos
```

Exemplo: uma resposta correta imediata vale perto de 1000 pontos; uma resposta correta no fim do tempo vale perto de 500.

## Limitações Conhecidas

- Salas e participantes ficam em memória; ao reiniciar o backend, salas ativas são perdidas.
- Não há autenticação, histórico persistente, relatórios ou painel administrativo.
- O professor que recarrega a página reassume o controle da sala pelo mesmo PIN.
- O seed recria as trilhas e perguntas demonstrativas.
- Para celular na rede local, é necessário configurar `CLIENT_ORIGIN`, `VITE_API_URL` e `VITE_SOCKET_URL` com o IP do computador.

## Validação Executada

- `pnpm install`
- `pnpm approve-builds --all`
- `pnpm --filter @ecoquiz/server db:prepare`
- `pnpm --filter @ecoquiz/shared build`
- `pnpm --filter @ecoquiz/server typecheck`
- `pnpm --filter @ecoquiz/web typecheck`
- `pnpm build:pnpm`
- Teste HTTP de `/health`, `/api/tracks` e criação de sala.
- Teste Socket.IO com professor e aluno: criação de sala, entrada, início de partida, envio de resposta, ocultação do gabarito antes do reveal e pontuação.
- Verificação visual da landing page em `http://localhost:5173`.

## Próxima Etapa Recomendada

Persistir partidas finalizadas e respostas por ODS para permitir relatórios pedagógicos, histórico por turma e análise de desempenho sem mudar o fluxo principal do MVP.
