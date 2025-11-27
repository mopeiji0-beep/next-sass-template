import { CategoryService } from "@/server/services/category.service";
import { CategoryRepositoryImpl } from "@/server/repositories/category.repository";
import type { Context } from "@/server/trpc/context";
import type { FindCategoriesParams, CreateCategoryData, UpdateCategoryData } from "@/server/repositories/category.repository";

export class CategoryController {
  private categoryService: CategoryService;

  constructor(ctx: Context) {
    const categoryRepository = new CategoryRepositoryImpl(ctx.db);
    this.categoryService = new CategoryService(categoryRepository);
  }

  async getCategories(input: FindCategoriesParams) {
    return await this.categoryService.getCategories(input);
  }

  async getCategoryById(id: string) {
    return await this.categoryService.getCategoryById(id);
  }

  async createCategory(input: CreateCategoryData) {
    return await this.categoryService.createCategory(input);
  }

  async updateCategory(id: string, input: UpdateCategoryData) {
    return await this.categoryService.updateCategory(id, input);
  }

  async deleteCategory(id: string) {
    return await this.categoryService.deleteCategory(id);
  }
}

