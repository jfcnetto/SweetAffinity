import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  integer,
  pgEnum,
  index,
  uniqueIndex,
  doublePrecision,
  jsonb,
} from "drizzle-orm/pg-core";

// =====================================================
// ENUMS
// =====================================================

export const profileTypeEnum = pgEnum("profile_type", [
  "user",
  "admin",
  "moderator",
]);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
  "suspended",
  "banned",
  "pending",
]);

export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "other",
]);

// ✅ CORRIGIDO: relationshipType em profiles (Regra de Negócio)
export const relationshipTypeEnum = pgEnum("relationship_type", [
  "baby",
  "daddy",
  "mommy",
]);

export const maritalStatusEnum = pgEnum("marital_status", [
  "single",
  "married",
  "divorced",
  "widowed",
]);

export const smokingEnum = pgEnum("smoking", [
  "yes",
  "no",
  "occasionally",
]);

export const drinkingEnum = pgEnum("drinking", [
  "yes",
  "no",
  "occasionally",
]);

export const photoStatusEnum = pgEnum("photo_status", [
  "pending",
  "approved",
  "rejected",
]);

export const photoTypeEnum = pgEnum("photo_type", [
  "profile",
  "validation",
  "background",
]);

export const messageStatusEnum = pgEnum("message_status", [
  "sent",
  "delivered",
  "read",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trial",
  "active",
  "expired",
  "cancelled",
]);

export const swipeActionEnum = pgEnum("swipe_action", [
  "like",
  "pass",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "resolved",
  "dismissed",
]);

export const reportReasonEnum = pgEnum("report_reason", [
  "fake_profile",
  "harassment",
  "spam",
  "underage",
  "nudity",
  "prostitution",
  "other",
]);

// CRM — novos enums
export const financialEventTypeEnum = pgEnum("financial_event_type", [
  "revenue",
  "refund",
  "chargeback",
  "fee",
  "manual_credit",
  "manual_debit",
]);

export const specialAccessTypeEnum = pgEnum("special_access_type", [
  "lifetime",
  "free_premium",
  "vip",
  "tester",
  "influencer",
]);

export const aiUsageStatusEnum = pgEnum("ai_usage_status", [
  "success",
  "error",
  "timeout",
]);

export const campaignTypeEnum = pgEnum("campaign_type", [
  "email",
  "notification",
  "both",
]);

export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "scheduled",
  "sending",
  "sent",
  "failed",
]);

export const moderationStatusEnum = pgEnum("moderation_status", [
  "pending",
  "approved",
  "rejected",
]);

export const partnershipTypeEnum = pgEnum("partnership_type", [
  "financial",
  "mentorship",
  "travel",
  "companionship",
  "other",
]);

export const meetingFrequencyEnum = pgEnum("meeting_frequency", [
  "daily",
  "multi_weekly",
  "weekly",
  "bi_weekly",
  "monthly",
  "flexible",
]);

// =====================================================
// USERS
// =====================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),

    // ✅ CORRIGIDO: profileType → segurança do sistema (user/admin)
    profileType: profileTypeEnum("profile_type").notNull().default("user"),
    status: userStatusEnum("status").notNull().default("pending"),

    isVerified: boolean("is_verified").notNull().default(false),
    isPremium: boolean("is_premium").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    statusIdx: index("users_status_idx").on(table.status),
    profileTypeIdx: index("users_profile_type_idx").on(table.profileType),
  })
);

// =====================================================
// PROFILES
// =====================================================

export const profiles = pgTable(
  "profiles",
  {
    // FK para users — 1 usuário : 1 perfil (RN-001)
    id: uuid("id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),

    // ✅ CORRIGIDO: .notNull() pois displayName é obrigatório na criação (spec 3.1.3)
    displayName: text("display_name").notNull(),

    // ✅ CORRIGIDO: .notNull() pois birthDate é obrigatório + validação de 18 anos (RN-002)
    birthDate: date("birth_date").notNull(),

    gender: genderEnum("gender"),

    // ✅ CORRIGIDO: relationshipType é a regra de negócio (matching)
    relationshipType: relationshipTypeEnum("relationship_type").notNull(),

    state: text("state"),
    city: text("city"),

    bio: text("bio"),
    profession: text("profession"),
    education: text("education"),
    incomeRange: text("income_range"), // Obrigatório para Daddy/Mommy (RN-004) — validado no controller

    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    interests: jsonb("interests").$type<string[]>(),

    maritalStatus: maritalStatusEnum("marital_status"),

    heightRange: text("height_range"),
    ethnicity: text("ethnicity"),
    hairColor: text("hair_color"),
    eyeColor: text("eye_color"),

    smoking: smokingEnum("smoking"),
    drinking: drinkingEnum("drinking"),

    seekingDescription: text("seeking_description"), // ✅ ADICIONADO — spec 3.1.3

    // Novas colunas solicitadas
    country: text("country"),
    bodyType: text("body_type"),
    skinTone: text("skin_tone"),
    children: text("children"),
    netWorth: text("net_worth"),
    seekingGender: text("seeking_gender"),
    travelPreference: text("travel_preference"),

    // Passo 1 & Passo 10.4
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
    moderationStatus: moderationStatusEnum("moderation_status").notNull().default("pending"),
    availability: text("availability"),
    partnershipType: partnershipTypeEnum("partnership_type"),
    meetingFrequency: meetingFrequencyEnum("meeting_frequency"),

    // ✅ ADICIONADOS: campos de engajamento somente leitura (RN-005)
    popularityScore: integer("popularity_score").notNull().default(0),
    profileViews: integer("profile_views").notNull().default(0),

    // ✅ ADICIONADO: soft delete (CA-P08 — DELETE realiza exclusão lógica)
    deletedAt: timestamp("deleted_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    cityIdx: index("profiles_city_idx").on(table.city),
    stateIdx: index("profiles_state_idx").on(table.state),
    genderIdx: index("profiles_gender_idx").on(table.gender),
    relationshipTypeIdx: index("profiles_relationship_type_idx").on(table.relationshipType),
    // ✅ ADICIONADO: índice para ordenação de listagem (spec 3.1.4 sort params)
    popularityIdx: index("profiles_popularity_idx").on(table.popularityScore),
    deletedAtIdx: index("profiles_deleted_at_idx").on(table.deletedAt),
    moderationIdx: index("profiles_moderation_idx").on(table.moderationStatus),
    lastActiveIdx: index("profiles_last_active_idx").on(table.lastActiveAt),
  })
);

// =====================================================
// PHOTOS
// =====================================================

export const photos = pgTable(
  "photos",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // ✅ CORRIGIDO: storagePath em vez de url
    // Spec 3.3.3 passo 6: "users/{userId}/photos/{uuid}-original.{ext}"
    // A API serve a URL — o banco guarda apenas o path interno do MinIO
    storagePath: text("storage_path").notNull(),

    // ✅ CORRIGIDO: thumbnailPath em vez de thumbnailUrl (mesmo princípio)
    thumbnailPath: text("thumbnail_path"),

    isPrimary: boolean("is_primary").notNull().default(false),

    // status (pending/approved/rejected) cobre o is_approved da spec
    // Mais expressivo que um boolean simples
    status: photoStatusEnum("status").notNull().default("pending"),

    type: photoTypeEnum("type").notNull().default("profile"),

    // ✅ ADICIONADO: isPrivate — visibilidade premium (RN-018)
    isPrivate: boolean("is_private").notNull().default(false),

    // ✅ ADICIONADO: sortOrder — permite reordenação pelo usuário
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("photos_user_idx").on(table.userId),
    typeIdx: index("photos_type_idx").on(table.type),
    // ✅ ADICIONADO: índice para filtro de fotos privadas (RN-018)
    privateIdx: index("photos_private_idx").on(table.isPrivate),
  })
);

// =====================================================
// MESSAGES
// =====================================================

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    receiverId: uuid("receiver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    content: text("content").notNull(),

    status: messageStatusEnum("status").notNull().default("sent"),

    readAt: timestamp("read_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    senderIdx: index("messages_sender_idx").on(table.senderId),
    receiverIdx: index("messages_receiver_idx").on(table.receiverId),
  })
);

// =====================================================
// MATCHES
// =====================================================

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    user1Id: uuid("user1_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    user2Id: uuid("user2_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueMatch: uniqueIndex("unique_match_idx").on(
      table.user1Id,
      table.user2Id
    ),
  })
);

// =====================================================
// SWIPES (Substitui LIKES)
// =====================================================

export const swipes = pgTable(
  "swipes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    fromUserId: uuid("from_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    toUserId: uuid("to_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    action: swipeActionEnum("action").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueSwipe: uniqueIndex("unique_swipe_idx").on(
      table.fromUserId,
      table.toUserId
    ),
  })
);

// =====================================================
// REFRESH TOKENS
// =====================================================

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    token: text("token").notNull(),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    revokedAt: timestamp("revoked_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("refresh_tokens_user_idx").on(table.userId),
    tokenIdx: uniqueIndex("refresh_tokens_token_idx").on(table.token),
  })
);

// =====================================================
// SUBSCRIPTIONS (Stripe History)
// =====================================================

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    stripeSubscriptionId: text("stripe_subscription_id").notNull(),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    
    status: subscriptionStatusEnum("status").notNull(),
    planId: text("plan_id").notNull(),
    
    amount: integer("amount").notNull(), // Amount in cents

    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    userIdx: index("subscriptions_user_idx").on(table.userId),
    stripeSubIdx: uniqueIndex("subscriptions_stripe_sub_idx").on(table.stripeSubscriptionId),
    statusIdx: index("subscriptions_status_idx").on(table.status),
  })
);

// =====================================================
// AUDIT LOGS
// =====================================================

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    adminId: uuid("admin_id")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),

    action: text("action").notNull(), // ex: "approve_photo", "ban_user"
    
    entity: text("entity").notNull(), // ex: "photo", "user"
    entityId: text("entity_id").notNull(), // string para suportar UUIDs ou IDs numéricos genéricos

    details: jsonb("details"), // Informações extras

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    adminIdx: index("audit_logs_admin_idx").on(table.adminId),
    entityIdx: index("audit_logs_entity_idx").on(table.entity, table.entityId),
  })
);

// =====================================================
// BLOG POSTS (Growth / SEO)
// =====================================================

export const blogPostSourceEnum = pgEnum("blog_post_source", [
  "ai_auto",
  "ai_manual",
  "manual"
]);

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    content: text("content").notNull(),
    metaDescription: text("meta_description").notNull(),
    source: blogPostSourceEnum("source").notNull().default("manual"),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),

    publishedAt: timestamp("published_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("blog_posts_slug_idx").on(table.slug),
    publishedIdx: index("blog_posts_published_idx").on(table.publishedAt),
  })
);

// =====================================================
// NOTIFICATIONS (In-App)
// =====================================================

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: text("type").notNull(), // 'match', 'message', 'payment', 'system'
    title: text("title").notNull(),
    body: text("body").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    
    // Opcional: Para redirecionar o usuário (ex: /chat/123)
    link: text("link"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("notifications_user_idx").on(table.userId),
    readIdx: index("notifications_read_idx").on(table.isRead),
  })
);

// =====================================================
// REPORTS (Denúncias de perfis)
// Spec: seção 5.4 — Central de denúncias categorizadas por gravidade
// =====================================================

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Quem denunciou
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Quem foi denunciado
    reportedId: uuid("reported_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    reason: reportReasonEnum("reason").notNull(),

    description: text("description"), // Detalhes opcionais

    status: reportStatusEnum("status").notNull().default("pending"),

    // Administrador que tratou a denúncia
    resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolutionNote: text("resolution_note"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    reporterIdx: index("reports_reporter_idx").on(table.reporterId),
    reportedIdx: index("reports_reported_idx").on(table.reportedId),
    statusIdx: index("reports_status_idx").on(table.status),
  })
);

// =====================================================
// CRM — FINANCIAL EVENTS (Fluxo de Caixa)
// =====================================================

export const financialEvents = pgTable(
  "financial_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: financialEventTypeEnum("type").notNull(),
    amountCents: integer("amount_cents").notNull(), // positivo=entrada, negativo=saída
    currency: text("currency").notNull().default("BRL"),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
    stripeEventId: text("stripe_event_id"),
    description: text("description"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index("fin_events_type_idx").on(table.type),
    userIdx: index("fin_events_user_idx").on(table.userId),
    recordedIdx: index("fin_events_recorded_idx").on(table.recordedAt),
    stripeEventIdx: uniqueIndex("fin_events_stripe_idx").on(table.stripeEventId),
  })
);

// =====================================================
// CRM — AI USAGE LOGS (Controle de Tokens e Custos de IA)
// =====================================================

export const aiUsageLogs = pgTable(
  "ai_usage_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    service: text("service").notNull(),       // 'openai', 'gemini', 'anthropic'
    model: text("model").notNull(),            // 'gpt-4o', 'gemini-1.5-pro', etc.
    feature: text("feature").notNull(),        // 'blog_generator', 'moderation', etc.
    promptTokens: integer("prompt_tokens").notNull(),
    completionTokens: integer("completion_tokens").notNull(),
    totalTokens: integer("total_tokens").notNull(),
    costUsd: doublePrecision("cost_usd"),      // custo estimado USD
    costBrl: doublePrecision("cost_brl"),      // convertido pela taxa do dia
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    requestId: text("request_id"),
    status: aiUsageStatusEnum("status").notNull().default("success"),
    latencyMs: integer("latency_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    serviceIdx: index("ai_usage_service_idx").on(table.service),
    featureIdx: index("ai_usage_feature_idx").on(table.feature),
    createdIdx: index("ai_usage_created_idx").on(table.createdAt),
  })
);

// =====================================================
// CRM — AI BUDGET CONFIG (Limites de orçamento por serviço)
// =====================================================

export const aiBudgetConfig = pgTable(
  "ai_budget_config",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    service: text("service").notNull(),
    dailyLimitUsd: doublePrecision("daily_limit_usd").notNull().default(5.00),
    monthlyLimitUsd: doublePrecision("monthly_limit_usd").notNull().default(50.00),
    alertThreshold: doublePrecision("alert_threshold").notNull().default(80), // % do limite
    isEnabled: boolean("is_enabled").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    serviceIdx: uniqueIndex("ai_budget_service_idx").on(table.service),
  })
);

// =====================================================
// CRM — USER SPECIAL ACCESS (Perfis Vitalícios, Free, VIP)
// =====================================================

export const userSpecialAccess = pgTable(
  "user_special_access",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    accessType: specialAccessTypeEnum("access_type").notNull(),
    reason: text("reason"),
    grantedBy: uuid("granted_by").references(() => users.id, { onDelete: "set null" }),
    validUntil: timestamp("valid_until", { withTimezone: true }), // NULL = vitalício
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("special_access_user_idx").on(table.userId),
    typeIdx: index("special_access_type_idx").on(table.accessType),
    activeIdx: index("special_access_active_idx").on(table.isActive),
  })
);

// =====================================================
// CRM — ADMIN ROLES (RBAC — Permissões Granulares)
// =====================================================

export const adminRoles = pgTable(
  "admin_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    permissions: jsonb("permissions").notNull().$type<Record<string, boolean>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => ({
    nameIdx: uniqueIndex("admin_roles_name_idx").on(table.name),
  })
);

// =====================================================
// CRM — ADMIN USERS (Usuários do painel administrativo)
// =====================================================

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id").references(() => adminRoles.id, { onDelete: "restrict" }),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    lastLogin: timestamp("last_login", { withTimezone: true }),
    ipWhitelist: jsonb("ip_whitelist").$type<string[]>(),
    twoFactorSecret: text("two_factor_secret"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex("admin_users_user_idx").on(table.userId),
    roleIdx: index("admin_users_role_idx").on(table.roleId),
  })
);

// =====================================================
// CRM — USER CRM NOTES (Notas internas por usuário)
// =====================================================

export const userCrmNotes = pgTable(
  "user_crm_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("crm_notes_user_idx").on(table.userId),
    createdIdx: index("crm_notes_created_idx").on(table.createdAt),
  })
);

// =====================================================
// CRM — BROADCAST CAMPAIGNS (E-mails e Notificações em Massa)
// =====================================================

export const broadcastCampaigns = pgTable(
  "broadcast_campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    type: campaignTypeEnum("type").notNull(),
    targetSegment: jsonb("target_segment").$type<Record<string, unknown>>(),
    subject: text("subject"),
    bodyHtml: text("body_html"),
    notificationTitle: text("notification_title"),
    notificationBody: text("notification_body"),
    status: campaignStatusEnum("status").notNull().default("draft"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    sentCount: integer("sent_count").notNull().default(0),
    openedCount: integer("opened_count").notNull().default(0),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("campaigns_status_idx").on(table.status),
    scheduledIdx: index("campaigns_scheduled_idx").on(table.scheduledFor),
  })
);

// =====================================================
// CRM — SITE SETTINGS (Configurações Globais)
// =====================================================

export const siteSettings = pgTable(
  "site_settings",
  {
    key: text("key").primaryKey(),
    value: jsonb("value").notNull(),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  }
);

// =====================================================
// PLANS
// =====================================================
export const plans = pgTable(
  "plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    priceCents: integer("price_cents").notNull(),
    billingPeriod: text("billing_period").notNull(), // 'monthly', 'yearly', etc.
    features: jsonb("features").notNull().$type<string[]>(),
    stripePriceId: text("stripe_price_id"),
    isActive: boolean("is_active").notNull().default(true),
    isHighlighted: boolean("is_highlighted").notNull().default(false),
    discountPercentage: integer("discount_percentage").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  }
);

// =====================================================
// PROFILE MODERATION QUEUE
// =====================================================
export const profileModerationQueue = pgTable(
  "profile_moderation_queue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: moderationStatusEnum("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    profileIdx: index("mod_queue_profile_idx").on(table.profileId),
    statusIdx: index("mod_queue_status_idx").on(table.status),
  })
);