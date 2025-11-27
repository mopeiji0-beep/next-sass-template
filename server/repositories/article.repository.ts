import { eq, desc, like, or, count, and, type SQL } from "drizzle-orm";
import { articles, articleCategories } from "@/lib/db/schema";
import type { db } from "@/lib/db";

export interface ArticleRepository {
  findById(id: string): Promise<ArticleEntity | null>;
  findBySlug(slug: string): Promise<ArticleEntity | null>;
  findAll(params: FindArticlesParams): Promise<{ articles: ArticleEntity[]; total: number }>;
  create(data: CreateArticleData): Promise<ArticleEntity>;
  update(id: string, data: UpdateArticleData): Promise<ArticleEntity>;
  delete(id: string): Promise<void>;
}

export interface ArticleEntity {
  id: string;
  titleZh: string;
  titleEn: string;
  contentZh: string;
  contentEn: string;
  slug: string;
  categoryId: string | null;
  categoryNameZh: string | null;
  categoryNameEn: string | null;
  authorId: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  metaTitleZh: string | null;
  metaTitleEn: string | null;
  metaDescriptionZh: string | null;
  metaDescriptionEn: string | null;
  metaKeywordsZh: string | null;
  metaKeywordsEn: string | null;
  ogImage: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateArticleData {
  titleZh: string;
  titleEn: string;
  contentZh: string;
  contentEn: string;
  slug: string;
  categoryId?: string;
  authorId?: string;
  isPublished?: boolean;
  publishedAt?: Date;
  metaTitleZh?: string;
  metaTitleEn?: string;
  metaDescriptionZh?: string;
  metaDescriptionEn?: string;
  metaKeywordsZh?: string;
  metaKeywordsEn?: string;
  ogImage?: string;
}

export interface UpdateArticleData {
  titleZh?: string;
  titleEn?: string;
  contentZh?: string;
  contentEn?: string;
  slug?: string;
  categoryId?: string;
  isPublished?: boolean;
  publishedAt?: Date;
  metaTitleZh?: string;
  metaTitleEn?: string;
  metaDescriptionZh?: string;
  metaDescriptionEn?: string;
  metaKeywordsZh?: string;
  metaKeywordsEn?: string;
  ogImage?: string;
}

export interface FindArticlesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  isPublished?: boolean;
}

export class ArticleRepositoryImpl implements ArticleRepository {
  constructor(private db: typeof db) {}

  async findById(id: string): Promise<ArticleEntity | null> {
    const result = await this.db
      .select()
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);

    if (result.length === 0) return null;

    return this.mapToEntity(result[0]);
  }

  async findBySlug(slug: string): Promise<ArticleEntity | null> {
    const result = await this.db
      .select({
        id: articles.id,
        titleZh: articles.titleZh,
        titleEn: articles.titleEn,
        contentZh: articles.contentZh,
        contentEn: articles.contentEn,
        slug: articles.slug,
        categoryId: articles.categoryId,
        authorId: articles.authorId,
        isPublished: articles.isPublished,
        publishedAt: articles.publishedAt,
        metaTitleZh: articles.metaTitleZh,
        metaTitleEn: articles.metaTitleEn,
        metaDescriptionZh: articles.metaDescriptionZh,
        metaDescriptionEn: articles.metaDescriptionEn,
        metaKeywordsZh: articles.metaKeywordsZh,
        metaKeywordsEn: articles.metaKeywordsEn,
        ogImage: articles.ogImage,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        categoryNameZh: articleCategories.nameZh,
        categoryNameEn: articleCategories.nameEn,
      })
      .from(articles)
      .leftJoin(articleCategories, eq(articles.categoryId, articleCategories.id))
      .where(eq(articles.slug, slug))
      .limit(1);

    if (result.length === 0) return null;

    return this.mapToEntityWithCategory(result[0]);
  }

  async findAll(params: FindArticlesParams): Promise<{ articles: ArticleEntity[]; total: number }> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const searchTerm = params.search?.trim() ?? "";
    const offset = (page - 1) * pageSize;

    const filters: SQL[] = [];

    if (searchTerm) {
      const searchCondition = or(
        like(articles.titleZh, `%${searchTerm}%`),
        like(articles.titleEn, `%${searchTerm}%`),
        like(articles.slug, `%${searchTerm}%`)
      );
      if (searchCondition) {
        filters.push(searchCondition);
      }
    }

    if (params.categoryId) {
      filters.push(eq(articles.categoryId, params.categoryId));
    }

    if (params.isPublished !== undefined) {
      filters.push(eq(articles.isPublished, params.isPublished ? "true" : "false"));
    }

    // Get total count
    const totalQueryBuilder = this.db.select({ value: count() }).from(articles);
    let totalResult: { value: number }[];
    if (filters.length === 0) {
      totalResult = await totalQueryBuilder;
    } else if (filters.length === 1) {
      totalResult = await totalQueryBuilder.where(filters[0]);
    } else {
      totalResult = await totalQueryBuilder.where(and(...filters));
    }

    const total = totalResult[0]?.value ?? 0;

    // Get paginated data
    const dataQueryBuilder = this.db
      .select()
      .from(articles)
      .orderBy(desc(articles.createdAt))
      .limit(pageSize)
      .offset(offset);

    let articleList: any[];
    if (filters.length === 0) {
      articleList = await dataQueryBuilder;
    } else if (filters.length === 1) {
      articleList = await dataQueryBuilder.where(filters[0]);
    } else {
      articleList = await dataQueryBuilder.where(and(...filters));
    }

    return {
      articles: articleList.map((article) => this.mapToEntity(article)),
      total,
    };
  }

  async create(data: CreateArticleData): Promise<ArticleEntity> {
    const result = await this.db
      .insert(articles)
      .values({
        titleZh: data.titleZh,
        titleEn: data.titleEn,
        contentZh: data.contentZh,
        contentEn: data.contentEn,
        slug: data.slug,
        categoryId: data.categoryId || null,
        authorId: data.authorId || null,
        isPublished: data.isPublished ? "true" : "false",
        publishedAt: data.publishedAt || null,
        metaTitleZh: data.metaTitleZh || null,
        metaTitleEn: data.metaTitleEn || null,
        metaDescriptionZh: data.metaDescriptionZh || null,
        metaDescriptionEn: data.metaDescriptionEn || null,
        metaKeywordsZh: data.metaKeywordsZh || null,
        metaKeywordsEn: data.metaKeywordsEn || null,
        ogImage: data.ogImage || null,
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async update(id: string, data: UpdateArticleData): Promise<ArticleEntity> {
    const updateData: {
      titleZh?: string;
      titleEn?: string;
      contentZh?: string;
      contentEn?: string;
      slug?: string;
      categoryId?: string | null;
      isPublished?: string;
      publishedAt?: Date | null;
      metaTitleZh?: string | null;
      metaTitleEn?: string | null;
      metaDescriptionZh?: string | null;
      metaDescriptionEn?: string | null;
      metaKeywordsZh?: string | null;
      metaKeywordsEn?: string | null;
      ogImage?: string | null;
      updatedAt?: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.titleZh) updateData.titleZh = data.titleZh;
    if (data.titleEn) updateData.titleEn = data.titleEn;
    if (data.contentZh) updateData.contentZh = data.contentZh;
    if (data.contentEn) updateData.contentEn = data.contentEn;
    if (data.slug) updateData.slug = data.slug;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished ? "true" : "false";
    if (data.publishedAt !== undefined) updateData.publishedAt = data.publishedAt || null;
    if (data.metaTitleZh !== undefined) updateData.metaTitleZh = data.metaTitleZh || null;
    if (data.metaTitleEn !== undefined) updateData.metaTitleEn = data.metaTitleEn || null;
    if (data.metaDescriptionZh !== undefined) updateData.metaDescriptionZh = data.metaDescriptionZh || null;
    if (data.metaDescriptionEn !== undefined) updateData.metaDescriptionEn = data.metaDescriptionEn || null;
    if (data.metaKeywordsZh !== undefined) updateData.metaKeywordsZh = data.metaKeywordsZh || null;
    if (data.metaKeywordsEn !== undefined) updateData.metaKeywordsEn = data.metaKeywordsEn || null;
    if (data.ogImage !== undefined) updateData.ogImage = data.ogImage || null;

    const result = await this.db
      .update(articles)
      .set(updateData)
      .where(eq(articles.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(articles).where(eq(articles.id, id));
  }

  private mapToEntity(row: {
    id: string;
    titleZh: string;
    titleEn: string;
    contentZh: string;
    contentEn: string;
    slug: string;
    categoryId: string | null;
    authorId: string | null;
    isPublished: string;
    publishedAt: Date | null;
    metaTitleZh: string | null;
    metaTitleEn: string | null;
    metaDescriptionZh: string | null;
    metaDescriptionEn: string | null;
    metaKeywordsZh: string | null;
    metaKeywordsEn: string | null;
    ogImage: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  }): ArticleEntity {
    return {
      id: String(row.id),
      titleZh: row.titleZh,
      titleEn: row.titleEn,
      contentZh: row.contentZh,
      contentEn: row.contentEn,
      slug: row.slug,
      categoryId: row.categoryId ? String(row.categoryId) : null,
      categoryNameZh: null,
      categoryNameEn: null,
      authorId: row.authorId ? String(row.authorId) : null,
      isPublished: row.isPublished === "true",
      publishedAt: row.publishedAt,
      metaTitleZh: row.metaTitleZh,
      metaTitleEn: row.metaTitleEn,
      metaDescriptionZh: row.metaDescriptionZh,
      metaDescriptionEn: row.metaDescriptionEn,
      metaKeywordsZh: row.metaKeywordsZh,
      metaKeywordsEn: row.metaKeywordsEn,
      ogImage: row.ogImage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapToEntityWithCategory(row: {
    id: string;
    titleZh: string;
    titleEn: string;
    contentZh: string;
    contentEn: string;
    slug: string;
    categoryId: string | null;
    authorId: string | null;
    isPublished: string;
    publishedAt: Date | null;
    metaTitleZh: string | null;
    metaTitleEn: string | null;
    metaDescriptionZh: string | null;
    metaDescriptionEn: string | null;
    metaKeywordsZh: string | null;
    metaKeywordsEn: string | null;
    ogImage: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    categoryNameZh: string | null;
    categoryNameEn: string | null;
  }): ArticleEntity {
    return {
      id: String(row.id),
      titleZh: row.titleZh,
      titleEn: row.titleEn,
      contentZh: row.contentZh,
      contentEn: row.contentEn,
      slug: row.slug,
      categoryId: row.categoryId ? String(row.categoryId) : null,
      categoryNameZh: row.categoryNameZh,
      categoryNameEn: row.categoryNameEn,
      authorId: row.authorId ? String(row.authorId) : null,
      isPublished: row.isPublished === "true",
      publishedAt: row.publishedAt,
      metaTitleZh: row.metaTitleZh,
      metaTitleEn: row.metaTitleEn,
      metaDescriptionZh: row.metaDescriptionZh,
      metaDescriptionEn: row.metaDescriptionEn,
      metaKeywordsZh: row.metaKeywordsZh,
      metaKeywordsEn: row.metaKeywordsEn,
      ogImage: row.ogImage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

