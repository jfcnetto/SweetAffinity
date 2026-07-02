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

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    content: text("content").notNull(),
    metaDescription: text("meta_description").notNull(),
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