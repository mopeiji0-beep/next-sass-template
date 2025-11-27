import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import type { UserRepository, CreateUserData, UpdateUserData, FindUsersParams } from "@/server/repositories/user.repository";

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }
    return this.sanitizeUser(user);
  }

  async getUserByEmail(email: string) {
    return await this.userRepository.findByEmail(email);
  }

  async getUsers(params: FindUsersParams) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    
    const result = await this.userRepository.findAll(params);

    return {
      users: result.users.map((user) => this.sanitizeUser(user)),
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  async createUser(data: CreateUserData) {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    return this.sanitizeUser(user);
  }

  async updateUser(id: string, data: UpdateUserData) {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Hash password if provided
    const updateData: UpdateUserData = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await this.userRepository.update(id, updateData);
    return this.sanitizeUser(user);
  }

  async deleteUser(id: string, currentUserId?: string) {
    // Prevent deleting yourself
    if (currentUserId && currentUserId === id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cannot delete your own account",
      });
    }

    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    await this.userRepository.delete(id);
    return { success: true };
  }

  async toggleUserStatus(id: string, isActive: boolean, currentUserId?: string) {
    // Prevent disabling yourself
    if (currentUserId && currentUserId === id && !isActive) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cannot disable your own account",
      });
    }

    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const user = await this.userRepository.updateStatus(id, isActive);
    return this.sanitizeUser(user);
  }

  async changeUserPassword(userId: string, newPassword: string) {
    // Check if user exists
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updatePassword(userId, hashedPassword);

    return { success: true };
  }

  async changeCurrentUserPassword(userId: string, currentPassword: string, newPassword: string) {
    // Get current user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updatePassword(userId, hashedPassword);

    return { success: true };
  }

  async updateCurrentUser(userId: string, data: { name?: string }) {
    // Check if user exists
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const user = await this.userRepository.update(userId, data);
    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: { id: string; name: string; email: string; image: string | null; isActive: boolean; createdAt: Date | null; updatedAt: Date | null }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

