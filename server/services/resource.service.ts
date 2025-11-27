import { TRPCError } from "@trpc/server";
import fs from "fs/promises";
import path from "path";
import type { ResourceRepository, CreateResourceData, UpdateResourceData, FindResourcesParams } from "@/server/repositories/resource.repository";

export class ResourceService {
  constructor(private resourceRepository: ResourceRepository) {}

  async getResourceById(id: string) {
    const resource = await this.resourceRepository.findById(id);
    if (!resource) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Resource not found",
      });
    }
    return resource;
  }

  async getResources(params: FindResourcesParams) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    
    const result = await this.resourceRepository.findAll(params);

    return {
      resources: result.resources,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  async createResource(data: CreateResourceData) {
    // 验证文件是否存在
    const fullPath = path.join(process.cwd(), "public", data.filePath);
    try {
      await fs.access(fullPath);
    } catch {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "File not found",
      });
    }

    const resource = await this.resourceRepository.create(data);
    return resource;
  }

  async updateResource(id: string, data: UpdateResourceData) {
    // Check if resource exists
    const existingResource = await this.resourceRepository.findById(id);
    if (!existingResource) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Resource not found",
      });
    }

    // 如果更改了目录，需要移动文件
    if (data.directory && data.directory !== existingResource.directory) {
      const oldPath = path.join(process.cwd(), "public", existingResource.filePath);
      const newDirectory = data.directory === "root" ? "" : "upload";
      const newFileName = existingResource.fileName;
      const newPath = newDirectory
        ? path.join(process.cwd(), "public", newDirectory, newFileName)
        : path.join(process.cwd(), "public", newFileName);
      const newFilePath = newDirectory
        ? path.join(newDirectory, newFileName).replace(/\\/g, "/")
        : newFileName;

      try {
        // 确保目标目录存在
        if (newDirectory) {
          const targetDir = path.join(process.cwd(), "public", newDirectory);
          await fs.mkdir(targetDir, { recursive: true });
        }

        // 移动文件
        await fs.rename(oldPath, newPath);

        // 更新数据库中的路径
        const updatedResource = await this.resourceRepository.update(id, {
          directory: data.directory,
          filePath: newFilePath,
        });

        return updatedResource;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to move file",
        });
      }
    }

    const resource = await this.resourceRepository.update(id, data);
    return resource;
  }

  async deleteResource(id: string) {
    // Check if resource exists
    const existingResource = await this.resourceRepository.findById(id);
    if (!existingResource) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Resource not found",
      });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), "public", existingResource.filePath);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // 文件不存在时忽略错误
      console.warn("File not found when deleting:", filePath);
    }

    // Delete from database
    await this.resourceRepository.delete(id);
    return { success: true };
  }

  getResourceUrl(resource: { filePath: string }): string {
    return `/${resource.filePath}`;
  }
}

