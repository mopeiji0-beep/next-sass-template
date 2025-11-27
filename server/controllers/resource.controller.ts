import { ResourceService } from "@/server/services/resource.service";
import { ResourceRepositoryImpl } from "@/server/repositories/resource.repository";
import type { Context } from "@/server/trpc/context";
import type { FindResourcesParams, CreateResourceData, UpdateResourceData } from "@/server/repositories/resource.repository";

export class ResourceController {
  private resourceService: ResourceService;

  constructor(ctx: Context) {
    const resourceRepository = new ResourceRepositoryImpl(ctx.db);
    this.resourceService = new ResourceService(resourceRepository);
  }

  async getResources(input: FindResourcesParams) {
    return await this.resourceService.getResources(input);
  }

  async getResourceById(id: string) {
    return await this.resourceService.getResourceById(id);
  }

  async createResource(input: CreateResourceData) {
    return await this.resourceService.createResource(input);
  }

  async updateResource(id: string, input: UpdateResourceData) {
    return await this.resourceService.updateResource(id, input);
  }

  async deleteResource(id: string) {
    return await this.resourceService.deleteResource(id);
  }
}

