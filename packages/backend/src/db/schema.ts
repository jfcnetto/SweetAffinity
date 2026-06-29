import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// =====================================================
// ENUMS
// =====================================================

export const userRoleEnum = pgEnum("user_role", [
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

export const profileTypeEnum = pgEnum("profile_type", [
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

// =====================================================
// USERS
// =====================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),

    role: userRoleEnum("role").notNull().default("user"),
    status: userStatusEnum("status").notNull().default("pending"),

    isVerified: boolean("is_verified").notNull().default(false),
    isPremium: boolean("is_premium").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    statusIdx: index("users_status_idx").on(table.status),
  })
);

// =====================================================
// PROFILES
// =====================================================

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),

    displayName: text("display_name"),
    birthDate: date("birth_date"),

    gender: genderEnum("gender"),
    profileType: profileTypeEnum("profile_type"),

    state: text("state"),
    city: text("city"),

    bio: text("bio"),
    profession: text("profession"),
    education: text("education"),
    incomeRange: text("income_range"),

    maritalStatus: maritalStatusEnum("marital_status"),

    heightRange: text("height_range"),
    ethnicity: text("ethnicity"),
    hairColor: text("hair_color"),
    eyeColor: text("eye_color"),

    smoking: smokingEnum("smoking"),
    drinking: drinkingEnum("drinking"),

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

    url: text("url").notNull(),
    thumbnailUrl: text("thumbnail_url"),

    isPrimary: boolean("is_primary").default(false),

    status: photoStatusEnum("status").default("pending"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("photos_user_idx").on(table.userId),
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

    status: messageStatusEnum("status").default("sent"),

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
// LIKES
// =====================================================

export const likes = pgTable(
  "likes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    fromUserId: uuid("from_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    toUserId: uuid("to_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueLike: uniqueIndex("unique_like_idx").on(
      table.fromUserId,
      table.toUserId
    ),
  })
);

// =====================================================
// REFRESH TOKENS (JWT B + SEGURANÇA)
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