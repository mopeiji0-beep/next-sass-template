import { eq, and, gt, gte, lte, desc, like, or, count, type SQL } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import type { db } from "@/lib/db";

export interface UserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findAll(params: FindUsersParams): Promise<{ users: UserEntity[]; total: number }>;
  create(data: CreateUserData): Promise<UserEntity>;
  update(id: string, data: UpdateUserData): Promise<UserEntity>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, isActive: boolean): Promise<UserEntity>;
  updatePassword(id: string, hashedPassword: string): Promise<void>;
}

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  password: string;
  image: string | null;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  isActive?: boolean;
}

export interface UpdateUserData {
  name?: string;
  password?: string;
  isActive?: boolean;
}

export interface FindUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "all" | "active" | "inactive";
  dateFrom?: string;
  dateTo?: string;
}

export class UserRepositoryImpl implements UserRepository {
  constructor(private db: typeof db) {}

  async findById(id: string): Promise<UserEntity | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (result.length === 0) return null;

    return this.mapToEntity(result[0]);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (result.length === 0) return null;

    return this.mapToEntity(result[0]);
  }

  async findAll(params: FindUsersParams): Promise<{ users: UserEntity[]; total: number }> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const searchTerm = params.search?.trim() ?? "";
    const statusFilter = params.status ?? "all";
    const dateFrom = params.dateFrom;
    const dateTo = params.dateTo;
    const offset = (page - 1) * pageSize;

    const filters: SQL[] = [];

    if (searchTerm) {
      const searchCondition = or(
        like(users.name, `%${searchTerm}%`),
        like(users.email, `%${searchTerm}%`)
      );
      if (searchCondition) {
        filters.push(searchCondition);
      }
    }

    if (statusFilter === "active" || statusFilter === "inactive") {
      filters.push(eq(users.isActive, statusFilter === "active" ? "true" : "false"));
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (!Number.isNaN(fromDate.getTime())) {
        filters.push(gte(users.createdAt, fromDate));
      }
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      if (!Number.isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        filters.push(lte(users.createdAt, toDate));
      }
    }

    // Get total count
    const totalQueryBuilder = this.db.select({ value: count() }).from(users);
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
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        password: users.password,
        image: users.image,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset(offset);

    let userList: {
      id: string;
      name: string;
      email: string;
      password: string;
      image: string | null;
      isActive: string | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    }[];

    if (filters.length === 0) {
      userList = await dataQueryBuilder;
    } else if (filters.length === 1) {
      userList = await dataQueryBuilder.where(filters[0]);
    } else {
      userList = await dataQueryBuilder.where(and(...filters));
    }

    return {
      users: userList.map((user) => this.mapToEntity(user)),
      total,
    };
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const result = await this.db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        password: data.password,
        isActive: data.isActive ? "true" : "true",
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    const updateData: {
      name?: string;
      password?: string;
      isActive?: string;
      updatedAt?: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.name) updateData.name = data.name;
    if (data.password) updateData.password = data.password;
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive ? "true" : "false";
    }

    const result = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async updateStatus(id: string, isActive: boolean): Promise<UserEntity> {
    const result = await this.db
      .update(users)
      .set({
        isActive: isActive ? "true" : "false",
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  private mapToEntity(row: {
    id: string;
    name: string;
    email: string;
    password: string;
    image: string | null;
    isActive: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  }): UserEntity {
    return {
      id: String(row.id),
      name: row.name,
      email: row.email,
      password: row.password,
      image: row.image || null,
      isActive: row.isActive === "true",
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

