import { z } from "zod";
import { UserService } from "@/server/services/user.service";
import { UserRepositoryImpl } from "@/server/repositories/user.repository";
import type { Context } from "@/server/trpc/context";

export class UserController {
  private userService: UserService;

  constructor(ctx: Context) {
    const userRepository = new UserRepositoryImpl(ctx.db);
    this.userService = new UserService(userRepository);
  }

  async getCurrentUser(userId: string) {
    return await this.userService.getUserById(userId);
  }

  async getUsers(input: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: "all" | "active" | "inactive";
    dateFrom?: string;
    dateTo?: string;
  }) {
    return await this.userService.getUsers(input);
  }

  async getUserById(id: string) {
    return await this.userService.getUserById(id);
  }

  async createUser(input: { name: string; email: string; password: string }) {
    return await this.userService.createUser(input);
  }

  async updateUser(id: string, input: { name?: string; password?: string }) {
    return await this.userService.updateUser(id, input);
  }

  async deleteUser(id: string, currentUserId?: string) {
    return await this.userService.deleteUser(id, currentUserId);
  }

  async toggleUserStatus(id: string, isActive: boolean, currentUserId?: string) {
    return await this.userService.toggleUserStatus(id, isActive, currentUserId);
  }

  async changeUserPassword(userId: string, password: string) {
    return await this.userService.changeUserPassword(userId, password);
  }

  async updateCurrentUser(userId: string, input: { name?: string }) {
    return await this.userService.updateCurrentUser(userId, input);
  }

  async changeCurrentUserPassword(userId: string, currentPassword: string, newPassword: string) {
    return await this.userService.changeCurrentUserPassword(userId, currentPassword, newPassword);
  }
}

