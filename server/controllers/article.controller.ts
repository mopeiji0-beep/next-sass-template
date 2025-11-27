import { ArticleService } from "@/server/services/article.service";
import { ArticleRepositoryImpl } from "@/server/repositories/article.repository";
import type { Context } from "@/server/trpc/context";
import type { FindArticlesParams, CreateArticleData, UpdateArticleData } from "@/server/repositories/article.repository";

export class ArticleController {
  private articleService: ArticleService;

  constructor(ctx: Context) {
    const articleRepository = new ArticleRepositoryImpl(ctx.db);
    this.articleService = new ArticleService(articleRepository);
  }

  async getArticles(input: FindArticlesParams) {
    return await this.articleService.getArticles(input);
  }

  async getArticleById(id: string) {
    return await this.articleService.getArticleById(id);
  }

  async getArticleBySlug(slug: string) {
    return await this.articleService.getArticleBySlug(slug);
  }

  async createArticle(input: CreateArticleData) {
    return await this.articleService.createArticle(input);
  }

  async updateArticle(id: string, input: UpdateArticleData) {
    return await this.articleService.updateArticle(id, input);
  }

  async deleteArticle(id: string) {
    return await this.articleService.deleteArticle(id);
  }

  async togglePublishStatus(id: string) {
    return await this.articleService.togglePublishStatus(id);
  }
}

