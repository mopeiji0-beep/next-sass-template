import { eq, and, desc, like, or, count, type SQL } from "drizzle-orm";
import { resources } from "@/lib/db/schema";
import type { db } from "@/lib/db";

export interface ResourceRepository {
  findById(id: string): Promise<ResourceEntity | null>;
  findAll(params: FindResourcesParams): Promise<{ resources: ResourceEntity[]; total: number }>;
  create(data: CreateResourceData): Promise<ResourceEntity>;
  update(id: string, data: UpdateResourceData): Promise<ResourceEntity>;
  delete(id: string): Promise<void>;
}

export interface ResourceEntity {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: string;
  mimeType: string;
  directory: "root" | "upload";
  uploadedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateResourceData {
  fileName: string;
  filePath: string;
  fileSize: string;
  mimeType: string;
  directory: "root" | "upload";
  uploadedBy?: string;
}

export interface UpdateResourceData {
  filePath?: string;
  directory?: "root" | "upload";
}

export interface FindResourcesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  directory?: "root" | "upload" | "all";
}

export class ResourceRepositoryImpl implements ResourceRepository {
  constructor(private db: typeof db) {}

  async findById(id: string): Promise<ResourceEntity | null> {
    const result = await this.db
      .select()
      .from(resources)
      .where(eq(resources.id, id))
      .limit(1);

    if (result.length === 0) return null;

    return this.mapToEntity(result[0]);
  }

  async findAll(params: FindResourcesParams): Promise<{ resources: ResourceEntity[]; total: number }> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const searchTerm = params.search?.trim() ?? "";
    const directoryFilter = params.directory ?? "all";
    const offset = (page - 1) * pageSize;

    const filters: SQL[] = [];

    if (searchTerm) {
      const searchCondition = or(
        like(resources.fileName, `%${searchTerm}%`)
      );
      if (searchCondition) {
        filters.push(searchCondition);
      }
    }

    if (directoryFilter !== "all") {
      filters.push(eq(resources.directory, directoryFilter));
    }

    // Get total count
    const totalQueryBuilder = this.db.select({ value: count() }).from(resources);
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
      .from(resources)
      .orderBy(desc(resources.createdAt))
      .limit(pageSize)
      .offset(offset);

    let resourceList: any[];
    if (filters.length === 0) {
      resourceList = await dataQueryBuilder;
    } else if (filters.length === 1) {
      resourceList = await dataQueryBuilder.where(filters[0]);
    } else {
      resourceList = await dataQueryBuilder.where(and(...filters));
    }

    return {
      resources: resourceList.map((resource) => this.mapToEntity(resource)),
      total,
    };
  }

  async create(data: CreateResourceData): Promise<ResourceEntity> {
    const result = await this.db
      .insert(resources)
      .values({
        fileName: data.fileName,
        filePath: data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        directory: data.directory,
        uploadedBy: data.uploadedBy || null,
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async update(id: string, data: UpdateResourceData): Promise<ResourceEntity> {
    const updateData: {
      directory?: string;
      filePath?: string;
      updatedAt?: Date;
    } = {
      updatedAt: new Date(),
    };
    if (data.directory) updateData.directory = data.directory;
    if (data.filePath) updateData.filePath = data.filePath;

    const result = await this.db
      .update(resources)
      .set(updateData)
      .where(eq(resources.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(resources).where(eq(resources.id, id));
  }

  private mapToEntity(row: {
    id: string;
    fileName: string;
    filePath: string;
    fileSize: string;
    mimeType: string;
    directory: string;
    uploadedBy: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  }): ResourceEntity {
    return {
      id: String(row.id),
      fileName: row.fileName,
      filePath: row.filePath,
      fileSize: row.fileSize,
      mimeType: row.mimeType,
      directory: row.directory === "root" ? "root" : "upload",
      uploadedBy: row.uploadedBy ? String(row.uploadedBy) : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

