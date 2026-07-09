# Plano de Testes Manuais & UX — SweetAffinity

Este documento atua como um roteiro passo a passo para testes de Qualidade (QA) e Experiência do Usuário (UX). Siga este roteiro iniciando a aplicação a partir da página principal (`/`).

---

## 🎭 Fase 1: Jornada do Novo Usuário (Onboarding & Descoberta)

**Objetivo:** Avaliar a primeira impressão, fricção de cadastro, clareza do fluxo de criação de perfil e validações do onboarding.

### 1.1 Landing Page (`/`)
- **Ação:** Acesse a página inicial (index) como um visitante deslogado.
- **QA:** Os links de login e cadastro funcionam? A página carrega rápido?
- **UX:** A proposta de valor do SweetAffinity está clara nos primeiros 5 segundos? As cores e tipografia transmitem a emoção certa (ex: elegância, confiança)? O botão principal (Call to Action) chama atenção suficiente?

### 1.2 Cadastro e Login (`/auth`)
- **Ação:** Crie uma nova conta (e-mail/senha) e tente usar o Login Social (Google).
- **QA:** O sistema envia e-mail de confirmação? Mensagens de erro para senhas fracas ou e-mails repetidos aparecem corretamente?
- **UX:** O formulário é intimidador? Se houver erro, a mensagem é amigável e indica *exatamente* o que corrigir? O fluxo transmite segurança?

### 1.3 Criação de Perfil e Cadastro Multi-Etapas (Onboarding Wizard - `/register/profile`)
- **Ação:** Preencha os dados básicos no novo Wizard de Onboarding.
- **Etapas de Teste:**
  1. **Passo 1 (Identificação):** Escolha o papel (Sugar Baby, Sugar Daddy, Sugar Mommy) e digite o nome de exibição e data de nascimento. Teste colocar idade menor que 18 anos.
  2. **Passo 2 (Localização & Bio):** Digite a cidade e o estado (UF). Escreva uma biografia curta (< 20 caracteres) para testar a validação.
  3. **Passo 3 (Estilo de Vida):** Altere o Tipo de Acordo (Companheirismo, Suporte Financeiro, etc.) e a Frequência de Encontros. Se for Daddy/Mommy, preencha a faixa de renda.
  4. **Passo 4 (Upload da Foto):** Selecione uma foto principal para o upload.
  5. **Passo 5 (Revisão):** Confirme se todos os dados inseridos estão corretos no resumo.
- **QA:**
  * O sistema impede o avanço de menores de 18 anos?
  * O rascunho é persistido no `localStorage` caso você atualize a página no meio do preenchimento?
- **UX:** O design das etapas é limpo e encorajador? A barra de progresso dá sensação de avanço claro?

### 1.4 Moderação Automática pós-cadastro
- **Ação:** Ao concluir o Onboarding Wizard, tente buscar esse novo perfil usando uma conta secundária ou verifique se ele aparece nas buscas da home.
- **QA:** O perfil recém-criado deve iniciar com status `pending` e **não** deve aparecer na home nem nas buscas públicas. Tentar acessar `/profiles/:id` dele diretamente por outra conta comum deve retornar 404.

---

## 💬 Fase 2: Engajamento & Comunicação

**Objetivo:** Testar o "core" da aplicação: encontrar pessoas com os filtros de estilo de vida, dar match, privacidade (Modo Discrição) e conversar respeitando as cotas.

### 2.1 Descoberta / Feed & Filtros Avançados
- **Ação:** Com um perfil aprovado, utilize os novos filtros do painel `AdvancedSearch` (Acordo Desejado e Frequência de Encontros).
- **QA:** A listagem na home reflete precisamente os filtros de estilo de vida selecionados? O estado limpa os filtros corretamente ao clicar em "Limpar"?
- **UX:** A transição ao expandir e ocultar os filtros avançados é fluida? As fotos têm boa resolução? O card do perfil tem hierarquia visual clara?

### 2.2 Notificações e Match
- **Ação:** Usando outra aba ou conta de teste, dê um Like de volta no seu perfil de teste para gerar um "Match".
- **QA:** O sistema gera notificação em tempo real? O Match aparece na lista de conexões?
- **UX:** A tela de "Deu Match!" é empolgante? A animação recompensa o usuário?

### 2.3 Chat, Mensageria & Limite de Cotas (`/chat`)
- **Ação:** Envie mensagens de texto. Teste caracteres especiais, emojis e mensagens longas.
- **QA:**
  * O Socket.io entrega as mensagens em tempo real sem precisar atualizar a página?
  * Se estiver em conta gratuita (não-premium), envie até 10 mensagens. A 11ª mensagem deve ser bloqueada e disparar erro visual ("Limite de mensagens gratuitas atingido").
- **UX:** Os balões de fala diferenciam visualmente quem enviou? Há indicação de "Digitando..."? O campo de texto se expande graciosamente?

### 2.4 Modo Discrição & Inatividade (`PinLockOverlay`)
- **Ação:** Ative o Modo Discrição clicando no ícone do olho com barra no Cabeçalho.
- **QA:**
  * O título da aba do navegador é alterado instantaneamente para "Meu Blog de Receitas"?
  * Permaneça sem interagir. Em ambiente de teste, verifique se após 5 minutos de inatividade o `PinLockOverlay` assume o controle total da tela.
  * Tente inserir o PIN incorreto e depois o PIN correto (padrão inicial: `1234`).
- **UX:** A tela bloqueia completamente qualquer visualização de dados privados antes da senha ser validada?

---

## 💎 Fase 3: Monetização (Assinaturas Premium)

**Objetivo:** Avaliar a fricção e o convencimento para conversão financeira.

### 3.1 Paywall e Planos (`/premium`)
- **Ação:** Tente realizar uma ação restrita (ex: ver quem te curtiu, mandar mais mensagens após estourar a cota) e clique no botão para assinar.
- **QA:** A proteção de rotas (Paywall) funciona? A integração com o Stripe Checkout abre corretamente? Ao confirmar o pagamento fictício (Stripe Mock ou real), o limite de mensagens do usuário deve se tornar ilimitado instantaneamente no Redis, permitindo que ele continue conversando no chat.
- **UX:** O valor percebido dos planos Gold, Platinum e Elite está claro? O design dos cards ajuda na decisão de compra?

---

## 🛠️ Fase 4: Painel Administrativo / CRM (Visão da Empresa)

**Objetivo:** Garantir que a equipe interna consiga operar o SweetAffinity com eficiência e sem erros.
*Acesse `/admin` com a sua conta configurada como Admin.*

### 4.1 Dashboard e KPIs (`/admin`)
- **Ação:** Verifique os números principais (MRR, Usuários Ativos).
- **QA / UX:** Os dados estão visíveis instantaneamente? O layout passa uma sensação "Premium" para a gestão interna?

### 4.2 Ficha 360 e Gestão de Usuários (`/admin/users`)
- **Ação:** Busque o usuário de teste criado na Fase 1. Entre na Ficha 360. Adicione uma "Nota de CRM" interna e dê a ele um acesso "VIP" ou "Premium Grátis".
- **QA:** A nota é salva e aponta o autor? O benefício VIP reflete no perfil do usuário de teste?
- **UX:** É fácil achar um usuário específico? A interface tabulada da ficha 360 evita sobrecarga de informação?

### 4.3 Fila de Moderação Manual de Perfis (`/admin/moderation`)
- **Ação:** Vá na fila de aprovação e aprove ou rejeite os perfis pendentes submetidos.
- **QA:**
  * O moderador consegue clicar em **Aprovar** e o perfil torna-se público instantaneamente no feed?
  * Se clicar em **Rejeitar** e preencher o motivo do modal, o perfil permanece invisível e o usuário recebe um e-mail de rejeição detalhado?
- **UX:** A interface do moderador é ágil e permite despachar a fila rapidamente?

### 4.4 Controle Financeiro (`/admin/finance`)
- **Ação:** Simule um estorno (Refund) ou um "Crédito Manual" para o usuário. Exporte o CSV.
- **QA:** O RBAC impede acesso se o admin não tiver a role `finance.refund`? O arquivo CSV baixa com os dados corretos?
- **UX:** É intuitivo o processo de filtrar por data antes de exportar?

### 4.5 Controle de IA (`/admin/ai`)
- **Ação:** Revise os logs de custos das chamadas LLM e tente ajustar o orçamento de um serviço.
- **QA:** As barras de limite mudam de cor ao atingir limites altos?

### 4.6 Comunicações (`/admin/communications`)
- **Ação:** Crie uma notificação em massa para enviar para a base.
- **QA:** O editor HTML funciona? As notificações chegam via in-app para os usuários?

---

## 📝 Resumo de Critérios UX a observar durante todo o teste:
1. **Feedback de Estado:** Toda ação tem um loader, spinner, toast de sucesso ou erro?
2. **Prevenção de Erros:** O sistema evita que o usuário erre (ex: botões desabilitados enquanto formulários não estão preenchidos)?
3. **Responsividade:** A experiência é tão boa num celular apertando F12 (Mobile View) quanto no desktop?
4. **Tematização (Dark/Light Mode):** Há quebras de contraste ou textos invisíveis ao trocar de tema?
