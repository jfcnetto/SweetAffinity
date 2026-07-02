Sweet Affinitysweetaffinity.comEspecificação Técnica e Funcional Completa

Versão 1.2  •  Junho 2026  •  CONFIDENCIALEstratégia: Self-Hosted Custo Zero & Integração Exclusiva Stripe (Sem Supabase Auth/Mercado Pago)

1. Resumo Executivo

O Sweet Affinity é uma plataforma SaaS de relacionamentos do tipo Sugar destinada ao mercado brasileiro. O produto conecta Sugar Babies com Sugar Daddies e Sugar Mommies por meio de um ambiente seguro, verificado e orientado à assinatura premium.Este documento descreve o estado atual do código existente, a arquitetura completa proposta, os requisitos funcionais e técnicos faltantes, estratégias de SEO, conformidade legal, e um cronograma detalhado de desenvolvimento. Esta versão (1.2) consolida o merge técnico para migração de infraestrutura cloud proprietária (Supabase Auth/Storage) para uma solução 100% autogovernada (Self-Hosted via Fastify e MinIO) e substituição do gateway de pagamentos do Mercado Pago para a Stripe (com suporte a Pix e Cartão no Brasil), eliminando custos fixos de licenças externas.

1.1 Estado Atual do Código

O repositório entregue é uma aplicação React (TypeScript) puramente frontend, sem backend real. Os dados são 100% mockados (hardcoded). A seguir, um diagnóstico resumido:

Componente

Status

Observação

Frontend React/TS

✅ Existe

Vite + Tailwind CSS. Estrutura sólida.

Supabase (.env)

❌ Descontinuado

Chaves presentes no .env serão descartadas. Migração para Auth local e MinIO.

Google reCAPTCHA

⚠️ Configurado

Chave no .env; sem integração real.

Autenticação

❌ Ausente

Login/cadastro são simulações locais (useState). Será gerido nativamente via Fastify-JWT.

Login Social (Google)

❌ Ausente

GoogleIcon existe na UI, mas sem OAuth real. Será acoplado via Fastify-Passport/OAuth2.

Banco de Dados

❌ Ausente

Todos os dados são mocks em constants.tsx. Migração para Postgres 16 local no Docker.

Backend/API

❌ Ausente

Nenhum servidor Node/Express/Fastify. Desenvolvimento do zero com Fastify.

Sistema de Pagamentos

❌ Ausente

PaymentModal é uma simulação com setTimeout. Substituição completa pela API da Stripe.

Sistema de Mensagens

❌ Ausente

MessageModal usa dados hardcoded. Integração real via Socket.IO local.

Upload de Fotos

❌ Ausente

PhotoUpload.tsx simula upload sem storage real. Conexão direta com MinIO local via Docker.

Email Transacional

❌ Ausente

Sem verificação de e-mail ou notificações. Implementação com plano gratuito do Resend (até 3k/mês).

Painel Admin Real

❌ Ausente

AdminPage.tsx usa mockUsers[] hardcoded. Requer endpoints dedicados e seguros.

Dashboard Financeiro

❌ Ausente

Não existe nenhum componente financeiro. Será integrado às métricas da Stripe e banco local.

Docker / Infra

❌ Ausente

Sem Dockerfile, docker-compose ou CI/CD. Necessário para orquestração local.

SEO

❌ Ausente

index.html básico sem meta tags ou sitemap. Requer migração estrutural Next.js 14 pública.

types.ts

⚠️ Incompleto

Referenciado mas estrutura de tipos parcial.

node_modules Windows

⚠️ Atenção

esbuild.exe e rollup.win32 detectados — dependências de plataforma errada. Remover do histórico.



2. Arquitetura Proposta — Full Stack com Docker

2.1 Visão Geral da Stack (Abordagem Self-Hosted Custo Zero)

Camada

Tecnologia

Justificativa

Frontend

React 19 + TypeScript + Vite

Já existente; migrar para Next.js futuramente para SSR/SEO.

Backend API

Node.js + Fastify 4

Alta performance, tipagem nativa com TypeScript, plugins robustos.

Banco Principal

PostgreSQL 16

ACID, suporte a JSON, open source, rodando localmente no Docker da VPS.

Autenticação

Fastify-JWT + Passport

Substitui o Supabase Auth. Login nativo e OAuth social local, sem custos.

Cache / Sessões

Redis 7

Cache de sessões, rate limiting, filas de jobs.

Mensagens Real-time

Socket.IO (Fastify plugin)

Chat em tempo real sobre WebSocket local.

Storage de Arquivos

MinIO Server (S3 OpenSource)

Substitui o Supabase Storage. Upload de fotos local com custo zero usando o disco da VPS.

Pagamentos

Stripe API

Substitui o Mercado Pago. Gateway estável para Pix e Cartão no BR, sem custos fixos.

Email

Resend.com

API moderna, templates React Email, plano gratuito de até 3.000 envios/mês.

CDN / Proxy

Nginx (Docker)

Reverse proxy, SSL termination gratuito (Let's Encrypt), rate limiting.

Containerização

Docker + Docker Compose

Ambiente único e reprodutível para todos os serviços locais.

CI/CD

GitHub Actions

Deploy automatizado via push para main em direção à VPS.



2.2 Estrutura de Containers Docker

Container

Imagem

Porta

Volumes / Finalidade

nginx

nginx:alpine

80, 443

nginx.conf, certs/ (Proxy Reverso e SSL Let's Encrypt)

frontend

node:20-alpine (build)

3000

src/, dist/ (Interface do Usuário React)

api

node:20-alpine

4000

src/, uploads/ (Backend Core Fastify + JWT local)

postgres

postgres:16-alpine

5432

pgdata/ (Banco de Dados Relacional Persistente)

redis

redis:7-alpine

6379

redisdata/ (Cache de Dados e Rate Limiting de Endpoints)

minio

minio/minio

9000, 9001

minio-data/ (Servidor de Storage S3 local para Fotos)

pgadmin

dpage/pgadmin4 (dev)

5050

— (Painel local de visualização do DB em Desenvolvimento)



2.3 Estrutura de Diretórios do Projeto Refatorado

sweetaffinity/├── docker-compose.yml├── docker-compose.prod.yml├── .env.example├── nginx/│   ├── nginx.conf│   └── certs/├── packages/│   ├── frontend/          ← React atual (refatorado)│   │   ├── src/│   │   │   ├── components/│   │   │   ├── pages/│   │   │   ├── hooks/│   │   │   ├── contexts/│   │   │   ├── services/   ← chamadas à API│   │   │   └── types/│   │   ├── Dockerfile│   │   └── vite.config.ts│   └── backend/           ← NOVO│       ├── src/│       │   ├── routes/│       │   ├── controllers/│       │   ├── services/│       │   ├── middleware/│       │   ├── models/│       │   └── jobs/│       ├── Dockerfile│       └── package.json└── infra/    ├── migrations/         ← SQL migrations locais    └── seeds/

3. Modelagem do Banco de Dados (PostgreSQL)

3.1 Diagrama de Entidades Principais

O esquema relacional cobre todas as funcionalidades da plataforma, com os IDs de usuários gerados nativamente pelo banco via UUID (gen_random_uuid()) e hashes armazenados localmente:

Tabela: users

Coluna

Tipo

Descrição

id

UUID PRIMARY KEY

Gerado localmente no banco de dados

email

VARCHAR(255) UNIQUE NOT NULL

Email de acesso

password_hash

VARCHAR(255) NOT NULL

Hash da senha criptografada via bcrypt local

phone

VARCHAR(20)

Telefone (verificação SMS)

profile_type

ENUM('Baby','Daddy','Mommy')

Tipo de perfil

status

ENUM('pending','active','suspended','banned')

Status da conta

is_verified

BOOLEAN DEFAULT false

Verificação manual pelo admin

is_premium

BOOLEAN DEFAULT false

Possui assinatura Stripe ativa

auth_provider

ENUM('email','google','apple')

Provedor de login

created_at

TIMESTAMPTZ DEFAULT NOW()

Data de cadastro

last_login

TIMESTAMPTZ

Último acesso



Tabela: profiles

Coluna

Tipo

Descrição

id

UUID REFERENCES users(id)

FK para users

display_name

VARCHAR(50) NOT NULL

Nome exibido no perfil

birth_date

DATE NOT NULL

Data de nascimento (valida +18)

gender

VARCHAR(30)

Gênero

state

CHAR(2)

Estado (UF)

city

VARCHAR(100)

Cidade

bio

TEXT

Descrição pessoal

height_range

VARCHAR(20)

Ex: 1.60m - 1.70m

ethnicity

VARCHAR(50)

Etnia

hair_color

VARCHAR(30)

Cor do cabelo

eye_color

VARCHAR(30)

Cor dos olhos

smoking

VARCHAR(30)

Hábito de fumar

drinking

VARCHAR(30)

Hábito de beber

education

VARCHAR(50)

Escolaridade

profession

VARCHAR(100)

Profissão

marital_status

VARCHAR(30)

Estado civil

income_range

VARCHAR(50)

Faixa de renda (Daddy/Mommy)

seeking_description

TEXT

O que busca

popularity_score

INTEGER DEFAULT 0

Score de popularidade

profile_views

INTEGER DEFAULT 0

Contagem de visualizações

updated_at

TIMESTAMPTZ

Última atualização



Tabela: photos

Coluna

Tipo

Descrição

id

UUID PRIMARY KEY

ID da foto

user_id

UUID REFERENCES users(id)

Dono da foto

storage_path

TEXT NOT NULL

Caminho relativo no bucket do MinIO local

is_primary

BOOLEAN DEFAULT false

Foto de capa do perfil

is_approved

BOOLEAN DEFAULT false

Aprovada pela moderação

is_private

BOOLEAN DEFAULT false

Visível só para premium

sort_order

INTEGER

Ordem de exibição

created_at

TIMESTAMPTZ DEFAULT NOW()

Data de upload



Tabela: subscriptions

Coluna

Tipo

Descrição

id

UUID PRIMARY KEY

ID da assinatura

user_id

UUID REFERENCES users(id)

Assinante

plan_id

UUID REFERENCES plans(id)

Plano contratado

status

ENUM('active','cancelled','expired','past_due')

Status da assinatura

provider

ENUM('stripe','manual')

Gateway de pagamento unificado

provider_subscription_id

VARCHAR(255)

ID no painel da Stripe

current_period_start

TIMESTAMPTZ

Início do período atual

current_period_end

TIMESTAMPTZ

Fim do período atual

cancel_at_period_end

BOOLEAN DEFAULT false

Cancelamento programado na Stripe

created_at

TIMESTAMPTZ DEFAULT NOW()

Data de criação



Tabela: payments

Coluna

Tipo

Descrição

id

UUID PRIMARY KEY

ID do pagamento

user_id

UUID REFERENCES users(id)

Pagador

subscription_id

UUID REFERENCES subscriptions(id)

Assinatura relacionada

amount

DECIMAL(10,2) NOT NULL

Valor em BRL

currency

CHAR(3) DEFAULT 'BRL'

Moeda

status

ENUM('pending','paid','failed','refunded')

Status do pagamento

payment_method

ENUM('credit_card','pix')

Método aceito via Stripe

provider_payment_id

VARCHAR(255)

ID da intent na Stripe

pix_qr_code

TEXT

String Pix Copia e Cola / QR Code gerado

paid_at

TIMESTAMPTZ

Data do pagamento

created_at

TIMESTAMPTZ DEFAULT NOW()

Data de criação



Tabelas Adicionais

Tabela

Descrição

messages

Chat entre usuários (id, from_user_id, to_user_id, content, read_at, created_at)

likes / matches

Sistema de curtidas e matches mútuos

blocks

Bloqueio de usuários

reports

Denúncias de perfis impróprios

profile_views

Log de quem visitou qual perfil (feature premium)

notifications

Notificações internas (nova mensagem, match, etc.)

verification_documents

Documentos enviados para verificação de identidade (Selfie + RG/CNH)

plans

Planos disponíveis (Gratuito, Premium R$299, Diamante R$499)

admin_users

Usuários administradores locais com roles (super_admin, moderator, financial)

audit_logs

Log de ações administrativas para compliance local

email_templates

Templates de e-mail configuráveis pelo admin

site_settings

Configurações globais do site (banner, textos, etc.)



4. Sistema de Autenticação Autohospedado

4.1 Provedores Suportados

A autenticação é desvinculada do Supabase Cloud, operando de forma interna através da biblioteca @fastify/jwt:

Provedor

Método

Prioridade

Observação

Email + Senha

Nativo Fastify-JWT

P1 — Essencial

Senha criptografada com bcrypt local, com confirmação obrigatória por e-mail.

Google OAuth 2.0

@fastify/oauth2

P1 — Essencial

UI já existe (GoogleIcon em AuthModal.tsx). Autenticação via API Fastify local.

Apple Sign In

Passport / JWT

P2 — Importante

Fluxo gerenciado internamente pela API para futura expansão iOS.

SMS/WhatsApp OTP

Twilio / Z-API

P3 — Desejável

Verificação opcional de segurança processada por chamadas HTTP na API.



4.2 Fluxo de Cadastro Completo

1. Usuário preenche o formulário de cadastro (AuthModal.tsx) com validação de +18 anos.2. Seleção do tipo de perfil: Baby, Daddy ou Mommy.3. Integração com API do IBGE para Estado/Cidade (já implementada no código).4. Aceite dos Termos de Uso (já implementado).5. API Fastify gera o usuário, gera um token temporário, salva o hash e envia e-mail de confirmação (via Resend grátis).6. Após confirmação, usuário faz upload de fotos (PhotoUpload.tsx é conectado ao endpoint do MinIO local).7. Usuário envia selfie com documento para verificação de identidade local.8. Status muda para 'pending' — tela PendingVerification.tsx é exibida.9. Admin aprova ou rejeita via painel administrativo interno.10. Após aprovação, usuário recebe e-mail de boas-vindas e acessa a plataforma.11. Sugar Daddies/Mommies devem assinar um plano pago via Stripe para liberar o envio de mensagens.

4.3 Segurança de Autenticação

• JWT local com expiração de 1 hora + refresh token rotativo armazenado no banco local.• Rate limiting no endpoint de login: 5 tentativas por IP/15 min usando Redis local.• reCAPTCHA v3 na tela de cadastro (chave já configurada no arquivo .env).• Validação rígida e sanitização de inputs na API para proteção contra SQL Injection e XSS.• Senhas com mínimo 8 caracteres, contendo no mínimo 1 maiúscula e 1 número.• Logout forçado em todos os dispositivos cadastrados ao trocar senha de acesso.• 2FA opcional via TOTP com bibliotecas integradas na API (Google Authenticator).

5. Funcionalidades Faltantes — Especificação Detalhada

5.1 Endpoints da API (Node.js + Fastify)

Módulo

Endpoint

Método

Autenticação

Auth

POST /auth/register

POST

Público

Auth

POST /auth/login

POST

Público

Auth

POST /auth/logout

POST

Token JWT

Auth

POST /auth/refresh

POST

Refresh Token

Auth

POST /auth/google

POST

Público (OAuth)

Auth

POST /auth/forgot-password

POST

Público

Perfis

GET /profiles

GET

Token JWT

Perfis

GET /profiles/:id

GET

Token JWT

Perfis

PUT /profiles/:id

PUT

Token JWT (Dono)

Perfis

POST /profiles/:id/like

POST

Token + Premium

Perfis

POST /profiles/:id/block

POST

Token JWT

Perfis

POST /profiles/:id/report

POST

Token JWT

Fotos

POST /photos/upload

POST

Token (Multipart -> MinIO)

Fotos

DELETE /photos/:id

DELETE

Token JWT (Dono)

Fotos

PUT /photos/:id/primary

PUT

Token JWT (Dono)

Mensagens

GET /messages/:userId

GET

Token + Premium

Mensagens

POST /messages/:userId

POST

Token + Premium

Mensagens

WS /ws/chat

WebSocket

Token JWT (Socket.IO)

Assinaturas

GET /subscriptions/plans

GET

Público

Assinaturas

POST /subscriptions/create

POST

Token JWT

Assinaturas

DELETE /subscriptions/cancel

DELETE

Token JWT

Stripe Pagamentos

POST /payments/stripe-checkout

POST

Token JWT

Stripe Pagamentos

POST /payments/webhook/stripe

POST

Público (Stripe Signature)

Notificações

GET /notifications

GET

Token JWT

Notificações

PUT /notifications/:id/read

PUT

Token JWT

Admin

GET /admin/users

GET

Admin JWT Token

Admin

PUT /admin/users/:id/approve

PUT

Admin JWT Token

Admin

PUT /admin/users/:id/ban

PUT

Admin JWT Token

Admin

GET /admin/photos/pending

GET

Admin JWT Token

Admin

GET /admin/reports

GET

Admin JWT Token

Admin

GET /admin/financial

GET

Admin JWT Token (Financial Role)

Admin

GET /admin/analytics

GET

Admin JWT Token



5.2 Sistema de Pagamentos Integrado à Stripe

O PaymentModal.tsx atual usa setTimeout() para simular pagamento. Toda a integração com a Stripe (exclusiva) deve ser feita:

Gateway

Métodos

Uso

Prioridade

Stripe Brasil

Pix Nativo

Método prioritário nacional

P1 — Essencial

Stripe Brasil

Cartão de Crédito

Assinaturas Recorrentes Nacionais

P1 — Essencial

Stripe International

Cartão Internacional / Apple Pay

Clientes estrangeiros (Daddies/Mommies)

P2 — Importante

Manual (Admin)

PIX Manual / Transferência

Casos excepcionais aprovados pelo admin

P3 — Desejável



Funcionalidades de pagamento a implementar:• Geração de QR Code PIX dinâmico via Stripe API com vencimento padrão de 30 minutos.• Checkout com cartão tokenizado via Stripe Elements ou Stripe Checkout (conforme PCI Compliance).• Webhook dedicado da Stripe para capturar eventos de pagamento aprovado e falhas de cobrança.• Renovação automatizada de assinaturas configurada diretamente no Billing da Stripe.• Cancelamento simplificado integrado ao Stripe Customer Portal ou internamente com acesso garantido até o fim do ciclo pago.• Emissão de reembolsos parciais ou totais disparados diretamente pelo painel admin integrado à API da Stripe.• Geração de relatório financeiro completo contendo MRR, Churn Rate, LTV e receita agregada por planos de assinatura.

5.3 Sistema de Mensagens em Tempo Real

O MessageModal.tsx usa MOCK_MESSAGES hardcoded. Implementação real:• WebSocket via Socket.IO com autenticação por token JWT local.• Mensagens persistidas de forma imediata na tabela 'messages' do PostgreSQL.• Indicadores visuais de status da mensagem (entregue e lida).• Notificação push via Web Push API nativa quando o usuário de destino estiver offline.• Upload de imagens na conversa hospedado no MinIO local (exclusivo para assinantes premium).• Moderação automática de conteúdo ofensivo ou dados de contato pessoais com middlewares na API.• Limite estrito de mensagens por dia para contas de plano Gratuito (ex: máximo de 5 msgs/dia).• Histórico completo de conversas anteriores com ferramenta de busca de palavras.

5.4 Sistema de Moderação e Verificação

O painel admin atual (AdminPage.tsx) possui dados inteiramente mockados. Necessidades:• Fila de moderação para novos cadastros contendo fotos reais do perfil.• Visualização de mídias de verificação de identidade (selfie comparativa + foto do documento oficial).• Mecanismo de aprovação e rejeição com envio automático de e-mail descritivo personalizado ao usuário.• Aprovação manual de fotos de perfil (visualização individual ou processamento em lote).• Central de denúncias recebidas categorizadas por gravidade e ordem cronológica.• Logs de auditoria interna detalhando todas as ações executadas pelos moderadores do sistema.• Monitoramento de integridade e bloqueio automático de perfis identificados como fakes ou duplicados.

6. Painel Administrativo e Financeiro

6.1 Módulos do Painel

O painel admin deve ser acessível em /admin com autenticação local separada (não compartilha cookies de usuários comuns). Roles estabelecidas: Super Admin, Moderator, Financial.

Módulo

Acesso

Funcionalidades

Dashboard Geral

Super Admin

KPIs operacionais: usuários ativos, novos cadastros/dia, receita corrente MRR, denúncias.

Gestão de Usuários

Super Admin + Moderator

Listagem total, busca avançada, visualização de perfis, banimento ou suspensões.

Fila de Verificação

Super Admin + Moderator

Análise de documentos e selfies enviados para validação de conta (Aprovar/Rejeitar).

Moderação de Fotos

Super Admin + Moderator

Aprovação em lote de fotos enviadas para a galeria pública ou privada.

Denúncias

Super Admin + Moderator

Tratamento de denúncias enviadas pelos usuários e aplicação de punições regulamentares.

Dashboard Financeiro

Super Admin + Financial

Acompanhamento de receita bruta, líquida, MRR, ARR, churn e métricas de planos.

Assinaturas

Super Admin + Financial

Listagem de planos ativos da Stripe, cancelamento manual ou aplicação de cupons.

Histórico de Pagamentos

Super Admin + Financial

Auditoria de transações Pix/Cartão, exportação de dados em CSV/Excel por período.

Gestão de Planos

Super Admin

Parametrização dinâmica de valores e limites de planos direto no banco de dados.

Configurações do Site

Super Admin

Controles de banners, textos da home, templates de e-mail e variáveis globais.

Logs de Auditoria

Super Admin

Rastreabilidade de ações administrativas registrando IP, data, operador e ação realizada.

Gestão de Blog

Super Admin + Moderator

CRUD completo de artigos e guias informativos com editor rich text integrado.

Relatórios

Super Admin + Financial

Exportação agregada de relatórios contábeis e estatísticos em PDF, Excel ou CSV.



6.2 KPIs do Dashboard Financeiro

Métrica

Fórmula de Cálculo

Periodicidade

MRR (Monthly Recurring Revenue)

Soma dos planos de assinaturas ativas no mês corrente via Stripe

Tempo Real / Mensal

ARR (Annual Recurring Revenue)

MRR atualizado × 12 meses

Anual

Churn Rate

(Cancelamentos de assinaturas / Total de assinantes no início do mês) × 100

Mensal

LTV (Lifetime Value)

Faturamento médio por assinante (ARPU) / Churn Rate

Calculado

CAC (Customer Acquisition Cost)

Total investido em marketing / Total de novos usuários pagantes convertidos

Mensal

ARPU (Avg Revenue Per User)

Faturamento MRR total / Volume de assinantes ativos

Mensal

Taxa de Conversão Free→Premium

(Usuários que realizaram upgrade / Volume de cadastros gratuitos) × 100

Mensal

Taxa de Retenção

1 - Churn Rate calculado

Mensal

Net Revenue

Receita bruta de vendas - reembolsos processados - taxas da Stripe

Mensal

Inadimplência

Volume de intents com status 'past_due' / Total geral de assinaturas

Tempo Real



7. Questões Legais, Compliance e Política de Conteúdo

7.1 Avaliação de Risco Legal — Brasil

Ponto Crítico

Risco

Mitigação Operacional Incorporada

Prostituição / Exploração

ALTO (Arts. 228-232 CP)

Proibição contratual nos Termos de Uso de transações financeiras diretas em troca de atos sexuais. Moderação ativa.

Exposição de Menores

CRÍTICO (ECA)

Validação mandatória de maioridade (+18) via documento oficial com foto e selfie. Tolerância zero.

LGPD (Proteção de Dados)

MÉDIO (Multas até 2%)

Política de privacidade visível, consentimento claro para dados sensíveis, painel de exclusão de conta definitivo.

Marco Civil da Internet

MÉDIO (Guarda de dados)

Retenção segura de logs de conexão por prazo mínimo de 6 meses (Art. 15) para cumprimento judicial.

Publicidade Enganosa

MÉDIO (CDC)

Cláusulas transparentes sem promessa de facilidades financeiras garantidas. Termos de cancelamento simples.

Intermediação de Prostituição

ALTO (Art. 228 CP)

Definição estrita da plataforma como rede de relacionamentos afetivos de alto padrão (Sugar lifestyle).



7.2 Medidas de Proteção Legal Obrigatórias

• Termos de Uso explícitos determinando que a plataforma proíbe qualquer comércio ou facilitação de atos de cunho sexual.• Filtro e moderação automatizada de mensagens bloqueando envio de termos associados a tabelas de preços ou programas.• Verificação fotográfica e documental obrigatória para validação completa de idade ativa superior a 18 anos.• Botão acessível para denúncia rápida integrado em todos os perfis e salas de conversas.• Logs técnicos de acessos e modificações resguardados pelo período mínimo legal de 6 meses (Marco Civil, Art. 15).• Nomeação de canal direto (DPO) para tratamento de requisições baseadas em privacidade e direitos da LGPD.• Moderação humana ativa nas filas de aprovação de perfil antes da liberação final do acesso público no feed.

7.3 Política de Conteúdo (Community Guidelines)

• PERMITIDO: Ensaios artísticos, fotos em trajes de banho, diálogos maduros consensuais entre os usuários cadastrados.• PROIBIDO: Nudez explícita, genital ou pornográfica em mídias de perfil públicas ou de capa.• PROIBIDO: Oferta direta de valores em dinheiro vivos explícitos associados a favores sexuais no chat.• PROIBIDO: Cadastro e permanência de menores de 18 anos sob qualquer justificativa.• PROIBIDO: Uso de fotos de celebridades, catfishing ou falsidade ideológica no preenchimento do perfil.• PROIBIDO: Divulgação pública de redes sociais pessoais (Instagram/WhatsApp) diretamente na bio para capturar tráfego externo.

8. Estratégia de SEO — Plataforma Adulta / Relacionamentos

8.1 Desafios Específicos do Nicho Sugar

O Google categoriza plataformas do ecossistema Sugar sob diretrizes estritas de conteúdo. Anúncios pagos no Google Ads possuem severas restrições. A estratégia central baseia-se em otimização do tráfego orgânico (SEO) com foco exclusivo no pilar de 'relacionamentos premium de alto padrão', evitando abordagens explícitas.

8.2 Palavras-chave Estratégicas

Termo Alvo

Volume (BR)

Dificuldade

Estratégia de Posicionamento

sugar baby brasil

8.000/mês

Média

Landing page otimizada e artigos focados no blog.

site sugar daddy brasil

5.000/mês

Média

Palavra-chave on-page na página principal (Homepage).

relacionamento sugar

6.000/mês

Baixa

Inclusão estruturada no FAQ principal da plataforma.

como ser sugar baby

12.000/mês

Baixa

Produção de artigos educacionais e guias pilares no blog.

sugar daddy o que é

18.000/mês

Baixa

Artigos de esclarecimento conceitual e glossário.

plataforma relacionamentos premium

2.000/mês

Baixa

Landing page descritiva direcionada à conversão dos planos.



8.3 Implementação Técnica de SEO

A aplicação React SPA (Vite) atual limita a indexação orgânica. A estratégia requer a migração da camada pública para Next.js 14+ com Server-Side Rendering (SSR) nas rotas abertas (/como-funciona, /planos, /blog, /faq), aplicando JSON-LD estruturado, sitemap.xml dinâmico, monitoramento rígido do Core Web Vitals (LCP < 2.5s, FID < 200ms, CLS < 0.1) e cache em Redis local para aceleração do TTFB.

8.4 Estratégia de Conteúdo (Blog)

O blog servirá de atração orgânica prioritária, com publicação regular de artigos abrangentes (ex: 'O que é Sugar Baby? Guia Completo para Iniciantes' com 2000+ palavras), mitigando jargões sexuais explícitos para blindar o domínio contra filtros de SafeSearch.

9. Cronograma de Desenvolvimento Adaptado por Dependências

9.1 Metodologia de Gerenciamento

O cronograma foi reorganizado. Como a autenticação e o storage de arquivos foram internalizados na API Fastify e Docker da VPS (sem Supabase), as fases iniciais incorporam o esforço de codificação desses sistemas locais. O desenvolvimento da integração de pagamentos com a Stripe torna-se mais ágil. Estimativa calculada para 1 Desenvolvedor Full-Stack Sênior + 1 Desenvolvedor Júnior.

9.2 Sprints Detalhadas por Tarefas

FASE 0 — Setup de Infraestrutura Local & Docker (Semana 1 — 5 dias)

Tarefa do Projeto

Prioridade

Tempo

Criar estrutura de monorepo unificada no GitHub (packages/frontend + packages/backend).

P1

0.5 dia

Configurar docker-compose.yml local incluindo serviços estáveis: nginx, node, postgres, redis e minio.

P1

1.0 dia

Montar arquivo .env.example completo documentando parametrizações locais da API.

P1

0.5 dia

Configurar banco PostgreSQL local criando scripts iniciais de tabelas e migrations (node-pg-migrate).

P1

1.0 dia

Remover permanentemente a pasta node_modules do histórico Git limpando binários Windows (esbuild).

P1

0.5 dia

Configurar GitHub Actions automatizando rotinas de validação de build e lint na pipeline.

P1

1.0 dia

Ajustar Nginx atuando como proxy reverso local mapeando as portas da API (4000) e Frontend (3000).

P1

0.5 dia



FASE 1 — Backend Base & Autenticação Nativa (Semanas 2-3 — 10 dias)

Tarefa do Projeto

Prioridade

Tempo

Inicializar projeto estruturado do Fastify utilizando TypeScript, ESLint e Prettier.

P1

1.0 dia

Criar tabelas locais de usuários, senhas com hashes e gerador nativo de UUID no Postgres.

P1

1.5 dia

Implementar middleware de geração e verificação de tokens locais via @fastify/jwt.

P1

1.5 dia

Construir endpoints base: /auth/register, /auth/login, /auth/logout, /auth/refresh.

P1

2.0 dias

Integrar fluxo de Login Social do Google OAuth fazendo o tratamento e validação local na API.

P1

1.5 dia

Acoplar SDK local do MinIO criando buckets para upload isolado de mídias e fotos.

P1

1.5 dia

Implementar middleware de Rate Limiting baseado em Redis para proteção contra força bruta.

P1

0.5 dia

Escrever rotinas de testes automatizados de integração de rotas com Jest/Supertest.

P2

0.5 dia



FASE 2 — Integração da Autenticação no Frontend (Semana 4 — 5 dias)

Tarefa do Projeto

Prioridade

Tempo

Substituir estados mocks de useState no AuthModal.tsx por chamadas HTTP para a API local.

P1

1.0 dia

Conectar fluxo completo do botão de Google Login com o fluxo de OAuth nativo da API.

P1

1.0 dia

Desenvolver o AuthContext no React gerenciando tokens JWT e persistência estável da sessão.

P1

1.0 dia

Implementar HOC de rotas protegidas (PrivateRoute) bloqueando acessos anônimos no front.

P1

0.5 dia

Refatorar PhotoUpload.tsx transmitindo arquivos multipart reais para o endpoint do MinIO.

P1

1.0 dia

Garantir validação rígida de maioridade (+18) direto nos schemas de validação da API.

P1

0.5 dia



FASE 3 — Perfis, Feed e Busca Avançada (Semanas 5-6 — 8 dias)

Tarefa do Projeto

Prioridade

Tempo

Mapear componente FeaturedProfiles consumindo listagens de usuários reais do banco Postgres.

P1

1.0 dia

Transformar filtros do AdvancedSearch.tsx em query params processados no banco de dados.

P1

1.5 dia

Implementar paginação baseada em cursor na busca de perfis prevenindo lentidões.

P1

1.0 dia

Vincular ProfileModal.tsx injetando informações detalhadas vindas de rotas dinâmicas.

P1

0.5 dia

Desenvolver lógica de curtidas e geração de matches registrando logs na tabela relacional.

P2

1.5 dia

Implementar fluxos de segurança: bloqueio mútuo e envio de denúncias de perfis.

P1

1.0 dia

Criar feature premium: 'Quem visitou meu perfil' lendo a tabela de logs de visualização.

P2

0.5 dia

Configurar cache de consultas de perfis no Redis local reduzindo IO do banco (TTL 5 min).

P2

1.0 dia



FASE 4 — Comunicação Real-time & WebSocket (Semanas 7-8 — 8 dias)

Tarefa do Projeto

Prioridade

Tempo

Configurar e subir o servidor Socket.IO acoplado ao Fastify validando tokens JWT locais.

P1

1.5 dia

Substituir MOCK_MESSAGES do MessageModal.tsx abrindo conexão WebSocket ativa bidirecional.

P1

2.0 dias

Garantir persistência síncrona de mensagens trocadas na tabela messages do Postgres.

P1

1.0 dia

Desenvolver confirmações de status da mensagem (recebimento e leitura em tempo real).

P2

1.0 dia

Listar conversas ativas no painel lateral ordenadas por data com sistema de busca por texto.

P2

1.5 dia

Acoplar Web Push API disparando notificações no navegador se o usuário de destino estiver offline.

P3

1.0 dia



FASE 5 — Mecanismo de Pagamentos com Stripe (Semanas 9-10 — 10 dias)

Tarefa do Projeto

Prioridade

Tempo

Integrar SDK da Stripe Brasil — parametrização de webhook e geração de Pix dinâmico.

P1

2.0 dias

Montar formulários do Stripe Elements no front aceitando cartão de crédito com criptografia PCI.

P1

1.5 dia

Construir endpoint de Webhook /payments/webhook/stripe validando a assinatura do evento.

P1

1.5 dia

Conectar PaymentModal.tsx chaveando os fluxos reais de checkout e respostas da Stripe.

P1

2.0 dias

Configurar assinaturas recorrentes e tratamento de inadimplência (past_due) via Stripe billing.

P1

1.0 dia

Integrar o Stripe Customer Portal permitindo autogerenciamento de cancelamento.

P1

0.5 dia

Disparar e-mails de confirmação e recibos detalhados após a aprovação da Stripe via Resend.

P2

1.5 dia



FASE 6 — Painel Admin & Backoffice Real (Semanas 11-12 — 10 dias)

Tarefa do Projeto

Prioridade

Tempo

Criar controle de login e tokens isolados na tabela admin_users para controle de acessos.

P1

1.0 dia

Conectar AdminPage.tsx para listar dados dinâmicos de usuários cadastrados via API.

P1

1.0 dia

Desenvolver tela de conferência exibindo selfies e fotos de documentos recebidos da fila pending.

P1

2.0 dias

Criar ações de moderação de mídias permitindo aprovação ou recusa de fotos individuais.

P1

1.0 dia

Construir interface de tratamento de denúncias permitindo banimentos em tempo real.

P1

1.0 dia

Alimentar Dashboard Financeiro calculando MRR, ARR e churn vindos da API da Stripe.

P1

2.0 dias

Desenvolver exportação de listagens fiscais e de auditoria em formatos Excel/CSV por filtros.

P2

1.0 dia

Registrar logs compulsórios de auditoria salvando ações executadas por administradores.

P1

1.0 dia



FASE 7 — Migração Next.js & Estrutura SEO (Semanas 13-15 — 12 dias)

Tarefa do Projeto

Prioridade

Tempo

Inicializar projeto Next.js 14 migrando a árvore de componentes estáticos públicos.

P1

3.0 dias

Configurar Server-Side Rendering (SSR) gerando indexação imediata nas rotas abertas.

P1

2.0 dias

Implementar geração estática (SSG) com revalidação dinâmica para os posts do blog.

P1

1.0 dia

Adicionar tags Meta Open Graph e Twitter Cards dinâmicas otimizando o compartilhamento.

P1

1.0 dia

Injetar schemas JSON-LD estruturados nas páginas de FAQ, Organização e Artigos do site.

P1

1.0 dia

Gerar sitemap.xml dinâmico e configurar diretivas de crawling no robots.txt.

P1

0.5 dia

Cadastrar e publicar os 10 posts iniciais refinados para atração orgânica de tráfego.

P1

3.0 dias

Configurar propriedades do Google Search Console e rastreamento do Google Analytics 4.

P1

0.5 dia



FASE 8 — Mensageria Transacional & Testes E2E (Semanas 16-17 — 8 dias)

Tarefa do Projeto

Prioridade

Tempo

Configurar domínio DNS no Resend.com montando templates estruturados em React Email.

P1

1.5 dia

Programar envios: boas-vindas, recuperação de acessos e links de confirmação de e-mail.

P1

1.5 dia

Disparar notificações de engajamento: novos matches recebidos ou alertas de novas mensagens.

P2

1.0 dia

Implementar componente visual de notificações in-app (sino de alertas no topo do cabeçalho).

P2

1.0 dia

Desenvolver feature de Boost de Perfil injetando checkout rápido via Stripe no front.

P3

1.0 dia

Escrever suíte de testes ponta a ponta abrangendo fluxos vitais do app usando Playwright.

P1

2.0 dias



FASE 9 — Compliance, Hardening & Go-Live (Semana 18 — 5 dias)

Tarefa do Projeto

Prioridade

Tempo

Realizar varreduras contra vulnerabilidades OWASP Top 10 corrigindo falhas de segurança.

P1

1.0 dia

Configurar certificados digitais SSL/TLS Let's Encrypt com scripts de auto-renovação no Nginx.

P1

0.5 dia

Disponibilizar ferramentas LGPD para o usuário: relatórios de dados e exclusão permanente de conta.

P1

1.0 dia

Setup de monitoramento corporativo instalando SDK do Sentry para capturar erros em produção.

P1

0.5 dia

Criar rotina de backup (pg_dump) diária e automática do banco Postgres retida por 30 dias.

P1

0.5 dia

Revisar e acoplar textos oficiais de Termos de Uso e Políticas obtidas de suporte jurídico.

P1

0.5 dia

Disparar Soft Launch restrito liberando o sistema para 50 convidados homologarem o ecossistema.

P1

0.5 dia

Realizar Lançamento Público abrindo acessos gerais com monitoria ativa técnica por 48 horas.

P1

0.5 dia



9.3 Resumo do Cronograma Comercial

Fase

Descrição Detalhada do Ciclo

Semanas

Total Dias Úteis

0

Setup de Infraestrutura e Arquitetura Docker Local

1

5 dias

1

Desenvolvimento do Backend API Fastify e Autenticação Nativa

2-3

10 dias

2

Integração da Autenticação no Frontend e Upload MinIO

4

5 dias

3

Conexão de Perfis, Matches e Mecanismos de Busca

5-6

8 dias

4

Servidor WebSocket e Mensagens em Tempo Real (Socket.IO)

7-8

8 dias

5

Motor de Pagamentos e Cobranças Recorrentes via Stripe

9-10

10 dias

6

Backoffice Administrativo e Telas de Moderação Humana

11-12

10 dias

7

Migração Estrutural Next.js 14 e Otimizações de SEO Orgânico

13-15

12 dias

8

E-mails Transacionais via Resend e Suíte de Testes Playwright

16-17

8 dias

9

LGPD, Hardening de Segurança, Backups e Lançamento Oficial

18

5 dias

TOTAL

Ciclo Completo de Desenvolvimento até o Lançamento Público

18 Semanas

81 dias úteis



10. Parametrizações e Variáveis de Ambiente

10.1 Arquivo .env Completo Proposto

O arquivo .env proposto mapeia todas as conexões internas necessárias para as ferramentas autohospedadas e chaves de produção da Stripe, removendo variáveis do Supabase Cloud:

# ─── APLICAÇÃO ────────────────────────────────────────NODE_ENV=productionAPP_URL=https://sweetaffinity.comAPI_URL=https://api.sweetaffinity.comPORT=4000JWT_SECRET=f9812a3d7bc4d6e8f9a2e3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4JWT_EXPIRES_IN=1hREFRESH_TOKEN_EXPIRES_IN=30d# ─── BANCO DE DADOS LOCAL (VPS) ───────────────────────DATABASE_URL=postgresql://sweet_admin:secure_password_2026@postgres:5432/sweetaffinityDATABASE_MAX_CONNECTIONS=20# ─── CACHE E RATE LIMITING LOCAL ──────────────────────REDIS_URL=redis://redis:6379# ─── STORAGE LOCAL (MinIO OpenSource) ──────────────────STORAGE_PROVIDER=minioMINIO_ENDPOINT=minioMINIO_PORT=9000MINIO_ACCESS_KEY=sweet_minio_access_keyMINIO_SECRET_KEY=sweet_minio_secret_key_strong_2026MINIO_BUCKET=sweetaffinity-media# ─── GOOGLE OAUTH ───────────────────────────────────────GOOGLE_CLIENT_ID=google_client_id_placeholder.apps.googleusercontent.comGOOGLE_CLIENT_SECRET=google_client_secret_placeholderGOOGLE_REDIRECT_URI=https://api.sweetaffinity.com/auth/callback# ─── RECAPTCHA ──────────────────────────────────────────RECAPTCHA_SITE_KEY=recaptcha_site_key_frontend_placeholderRECAPTCHA_SECRET_KEY=recaptcha_secret_key_backend_placeholder# ─── EMAIL (Resend - Plano Gratuito) ───────────────────RESEND_API_KEY=re_1234567890abcdefghijklmnopqrstuvwxyzEMAIL_FROM=noreply@sweetaffinity.comEMAIL_REPLY_TO=suporte@sweetaffinity.com# ─── GATEWAY EXCLUSIVO STRIPE ───────────────────────────STRIPE_SECRET_KEY=sk_live_1234567890abcdefghijklmnopqrstuvwxyzSTRIPE_PUBLISHABLE_KEY=pk_live_1234567890abcdefghijklmnopqrstuvwxyzSTRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyzSTRIPE_WEBHOOK_URL=https://api.sweetaffinity.com/payments/webhook/stripe# ─── MONITORAMENTO ──────────────────────────────────────SENTRY_DSN=https://sentry_dsn_placeholder_key@sentry.io/123456LOG_LEVEL=info

11. Estimativa de Custos de Infraestrutura

11.1 Custos Mensais — Fase de Lançamento (Foco Custo Fixo Zero)

Serviço Requisitado

Plano / Provedor

Custo Fixo / Mês

Observação Contábil / Escopo

VPS (Servidor Principal)

Droplet Dedicado / Contabo (4GB+ RAM)

Valor Cobrado pela VPS

Hospeda de forma integral todos os containers Docker da stack local.

Autenticação

Local (Fastify-JWT + Banco)

R$ 0,00

Solução desenvolvida nativamente, sem taxas ou dependência de terceiros.

Banco de Dados

Local (PostgreSQL 16 Docker)

R$ 0,00

Armazenamento relacional persistido em disco local na máquina virtual.

Storage de Fotos

Local (MinIO Server Docker)

R$ 0,00

Gerenciamento de mídias estruturado localmente sem limite financeiro de tráfego.

Gateway de Pagamentos

Stripe API Brasil

R$ 0,00

Custo Fixo Zero. Retém tarifas exclusivamente sobre vendas aprovadas.

Envio de E-mails

Resend API (Starter Tier)

R$ 0,00

Plano gratuito cobre de forma ideal até 3.000 e-mails enviados por mês.

CDN / DNS / Proxy

Cloudflare Free Plan

R$ 0,00

Terminação SSL, mascaramento de IPs, cache de borda e mitigação de DDoS.

Repositório e CI/CD

GitHub Free / Actions

R$ 0,00

Versionamento privado e minutos gratuitos de esteira de automação.

Monitoria de Erros

Sentry Developer Tier

R$ 0,00

Plano gratuito atende de forma estável até 5.000 logs de erros mensais.

TOTAL FIXO TERCEIROS

—

R$ 0,00

Excluindo a VPS obrigatória, o custo de ferramentas externas é zero.



11.2 Escalabilidade de Custos Operacionais

Volume de Usuários Ativos

Infraestrutura Recomendada

Custo Estimado / Mês

0 - 1.000 usuários

1 VPS Comercial Básica (4GB RAM) + Stack Docker Dockerizada

Apenas o custo base da VPS contratada

1.000 - 10.000 usuários

2 VPS de Médio Porte (8GB RAM) + Replicação de DB + Redis Dedicado

~ R$ 500,00 a R$ 800,00 / mês

10.000 - 50.000 usuários

Load Balancer Ativo + 3 VPS Cloud Dedicadas + Postgres Gerenciado

~ R$ 2.000,00 a R$ 3.000,00 / mês

50.000+ usuários ativos

Arquitetura Escalável baseada em Kubernetes (K8s) + Multi-Region RDS

Sob Consulta de Demanda Volumétrica



12. Próximos Passos Imediatos (Semana 1)

12.1 Ações Críticas — Antes de Qualquer Desenvolvimento

1. SEGURANÇA: Revogar e rotacionar as chaves antigas do Supabase expostas no repositório Git original (presentes no histórico de commits). Gerar um novo histórico limpo para o repositório.2. SEGURANÇA: Remover a pasta node_modules/ do repositório Git adicionando as diretivas corretas ao .gitignore, eliminando os binários indevidos do Windows (esbuild.exe).3. LEGAL: Contratar assessoria jurídica especializada em Direito Digital para validar as minutas de Termos de Uso e Políticas de Privacidade, dada a zona regulatória do nicho Sugar no Brasil.4. DOMÍNIO: Apontar as entradas DNS do domínio sweetaffinity.com para as zonas da Cloudflare, configurando os apontamentos do servidor de produção.5. CADASTROS DE INFRA: Criar as contas corporativas e chaves de teste nos painéis da Stripe Brasil, Resend e Sentry para obtenção das chaves do .env.6. INICIAR FASE 0: Criar o arquivo docker-compose.yml local estruturado para validar a comunicação inicial entre os containers.

12.2 Decisões Arquiteturais Consolidadas (Merge Técnico)

• Migração Next.js: Definido que a migração da camada pública para Next.js 14 ocorrerá de forma integral na Fase 7, evitando re-trabalho de desenvolvimento paralelo de SEO no React puro.• Autenticação e Storage Local: Rejeitado o uso de planos clouds terceirizados (Supabase); a aplicação será totalmente autossuficiente rodando serviços internos (Fastify-JWT e MinIO).• Gateway de Pagamentos Único: Confirmado o uso da Stripe como gateway unificado para o MVP (Pix e Cartão), simplificando a conciliação financeira inicial sem taxas fixas de manutenção.• Interface Mobile: Mantido o foco em Progressive Web App (PWA) acoplado ao Next.js para o MVP. O desenvolvimento de aplicativos nativos (React Native) fica postergado para a versão 2.0.

— FIM DO DOCUMENTO —Sweet Affinity — sweetaffinity.com — Documento Confidencial v1.2 — Junho 2026

