import { eq, desc, like, or, count, and, type SQL } from "drizzle-orm";
import { articleCategories } from "@/lib/db/schema";
import type { db } from "@/lib/db";

export interface CategoryRepository {
  findById(id: string): Promise<CategoryEntity | null>;
  findAll(params: FindCategoriesParams): Promise<{ categories: CategoryEntity[]; total: number }>;
  create(data: CreateCategoryData): Promise<CategoryEntity>;
  update(id: string, data: UpdateCategoryData): Promise<CategoryEntity>;
  delete(id: string): Promise<void>;
}

export interface CategoryEntity {
  id: string;
  nameZh: string;
  nameEn: string;
  slug: string;
  descriptionZh: string | null;
  descriptionEn: string | null;
  sortOrder: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateCategoryData {
  nameZh: string;
  nameEn: string;
  slug: string;
  descriptionZh?: string;
  descriptionEn?: string;
  sortOrder?: string;
}

export interface UpdateCategoryData {
  nameZh?: string;
  nameEn?: string;
  slug?: string;
  descriptionZh?: string;
  descriptionEn?: string;
  sortOrder?: string;
}

export interface FindCategoriesParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export class CategoryRepositoryImpl implements CategoryRepository {
  constructor(private db: typeof db) {}

  async findById(id: string): Promise<CategoryEntity | null> {
    const result = await this.db
      .select()
      .from(articleCategories)
      .where(eq(articleCategories.id, id))
      .limit(1);

    if (result.length === 0) return null;

    return this.mapToEntity(result[0]);
  }

  async findAll(params: FindCategoriesParams): Promise<{ categories: CategoryEntity[]; total: number }> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const searchTerm = params.search?.trim() ?? "";
    const offset = (page - 1) * pageSize;

    const filters: SQL[] = [];

    if (searchTerm) {
      const searchCondition = or(
        like(articleCategories.nameZh, `%${searchTerm}%`),
        like(articleCategories.nameEn, `%${searchTerm}%`),
        like(articleCategories.slug, `%${searchTerm}%`)
      );
      if (searchCondition) {
        filters.push(searchCondition);
      }
    }

    // Get total count
    const totalQueryBuilder = this.db.select({ value: count() }).from(articleCategories);
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
      .from(articleCategories)
      .orderBy(desc(articleCategories.createdAt))
      .limit(pageSize)
      .offset(offset);

    let categoryList: any[];
    if (filters.length === 0) {
      categoryList = await dataQueryBuilder;
    } else if (filters.length === 1) {
      categoryList = await dataQueryBuilder.where(filters[0]);
    } else {
      categoryList = await dataQueryBuilder.where(and(...filters));
    }

    return {
      categories: categoryList.map((category) => this.mapToEntity(category)),
      total,
    };
  }

  async create(data: CreateCategoryData): Promise<CategoryEntity> {
    const result = await this.db
      .insert(articleCategories)
      .values({
        nameZh: data.nameZh,
        nameEn: data.nameEn,
        slug: data.slug,
        descriptionZh: data.descriptionZh || null,
        descriptionEn: data.descriptionEn || null,
        sortOrder: data.sortOrder || "0",
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async update(id: string, data: UpdateCategoryData): Promise<CategoryEntity> {
    const updateData: {
      nameZh?: string;
      nameEn?: string;
      slug?: string;
      descriptionZh?: string | null;
      descriptionEn?: string | null;
      sortOrder?: string;
      updatedAt?: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.nameZh) updateData.nameZh = data.nameZh;
    if (data.nameEn) updateData.nameEn = data.nameEn;
    if (data.slug) updateData.slug = data.slug;
    if (data.descriptionZh !== undefined) updateData.descriptionZh = data.descriptionZh || null;
    if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn || null;
    if (data.sortOrder) updateData.sortOrder = data.sortOrder;

    const result = await this.db
      .update(articleCategories)
      .set(updateData)
      .where(eq(articleCategories.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(articleCategories).where(eq(articleCategories.id, id));
  }

  private mapToEntity(row: {
    id: string;
    nameZh: string;
    nameEn: string;
    slug: string;
    descriptionZh: string | null;
    descriptionEn: string | null;
    sortOrder: string;
    createdAt: Date | null;
    updatedAt: Date | null;
  }): CategoryEntity {
    return {
      id: String(row.id),
      nameZh: row.nameZh,
      nameEn: row.nameEn,
      slug: row.slug,
      descriptionZh: row.descriptionZh,
      descriptionEn: row.descriptionEn,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

