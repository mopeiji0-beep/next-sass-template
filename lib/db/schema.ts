import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  isActive: text("is_active").default("true").notNull(), // "true" or "false" as string
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: timestamp("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires").notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resources = pgTable("resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: text("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  directory: text("directory").default("upload").notNull(), // "root" or "upload"
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const articleCategories = pgTable("article_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  nameZh: text("name_zh").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug").notNull().unique(),
  descriptionZh: text("description_zh"),
  descriptionEn: text("description_en"),
  sortOrder: text("sort_order").default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const articles = pgTable("articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  titleZh: text("title_zh").notNull(),
  titleEn: text("title_en").notNull(),
  contentZh: text("content_zh").notNull(),
  contentEn: text("content_en").notNull(),
  slug: text("slug").notNull().unique(),
  categoryId: uuid("category_id").references(() => articleCategories.id, { onDelete: "set null" }),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  isPublished: text("is_published").default("false").notNull(), // "true" or "false" as string
  publishedAt: timestamp("published_at"),
  // SEO fields
  metaTitleZh: text("meta_title_zh"),
  metaTitleEn: text("meta_title_en"),
  metaDescriptionZh: text("meta_description_zh"),
  metaDescriptionEn: text("meta_description_en"),
  metaKeywordsZh: text("meta_keywords_zh"),
  metaKeywordsEn: text("meta_keywords_en"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

