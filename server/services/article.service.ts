import { TRPCError } from "@trpc/server";
import type { ArticleRepository, CreateArticleData, UpdateArticleData, FindArticlesParams } from "@/server/repositories/article.repository";

export class ArticleService {
  constructor(private articleRepository: ArticleRepository) {}

  async getArticleById(id: string) {
    const article = await this.articleRepository.findById(id);
    if (!article) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Article not found",
      });
    }
    return article;
  }

  async getArticleBySlug(slug: string) {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Article not found",
      });
    }
    return article;
  }

  async getArticles(params: FindArticlesParams) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    
    const result = await this.articleRepository.findAll(params);

    return {
      articles: result.articles,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  async createArticle(data: CreateArticleData) {
    // 验证必填字段
    if (!data.titleZh || !data.titleEn || !data.contentZh || !data.contentEn || !data.slug) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Title, content, and slug are required",
      });
    }

    // 验证 slug 格式
    if (!/^[a-z0-9-]+$/.test(data.slug)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Slug must contain only lowercase letters, numbers, and hyphens",
      });
    }

    const article = await this.articleRepository.create(data);
    return article;
  }

  async updateArticle(id: string, data: UpdateArticleData) {
    const existingArticle = await this.articleRepository.findById(id);
    if (!existingArticle) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Article not found",
      });
    }

    // 验证 slug 格式（如果提供）
    if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Slug must contain only lowercase letters, numbers, and hyphens",
      });
    }

    const article = await this.articleRepository.update(id, data);
    return article;
  }

  async deleteArticle(id: string) {
    const existingArticle = await this.articleRepository.findById(id);
    if (!existingArticle) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Article not found",
      });
    }

    await this.articleRepository.delete(id);
    return { success: true };
  }

  async togglePublishStatus(id: string) {
    const existingArticle = await this.articleRepository.findById(id);
    if (!existingArticle) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Article not found",
      });
    }

    const newStatus = !existingArticle.isPublished;
    const publishedAt = newStatus ? new Date() : null;

    const article = await this.articleRepository.update(id, {
      isPublished: newStatus,
      publishedAt,
    });

    return article;
  }
}

