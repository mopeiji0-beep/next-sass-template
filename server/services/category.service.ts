import { TRPCError } from "@trpc/server";
import type { CategoryRepository, CreateCategoryData, UpdateCategoryData, FindCategoriesParams } from "@/server/repositories/category.repository";

export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}

  async getCategoryById(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Category not found",
      });
    }
    return category;
  }

  async getCategories(params: FindCategoriesParams) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    
    const result = await this.categoryRepository.findAll(params);

    return {
      categories: result.categories,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  async createCategory(data: CreateCategoryData) {
    // 验证必填字段
    if (!data.nameZh || !data.nameEn || !data.slug) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Name and slug are required",
      });
    }

    // 验证 slug 格式
    if (!/^[a-z0-9-]+$/.test(data.slug)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Slug must contain only lowercase letters, numbers, and hyphens",
      });
    }

    const category = await this.categoryRepository.create(data);
    return category;
  }

  async updateCategory(id: string, data: UpdateCategoryData) {
    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Category not found",
      });
    }

    // 验证 slug 格式（如果提供）
    if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Slug must contain only lowercase letters, numbers, and hyphens",
      });
    }

    const category = await this.categoryRepository.update(id, data);
    return category;
  }

  async deleteCategory(id: string) {
    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Category not found",
      });
    }

    await this.categoryRepository.delete(id);
    return { success: true };
  }
}

