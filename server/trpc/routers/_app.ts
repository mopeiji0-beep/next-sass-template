import { router, publicProcedure, protectedProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq, and, gt, gte, lte, desc, like, or, count, type SQL } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const appRouter = router({
  // Public procedures
  healthcheck: publicProcedure.query(() => {
    return { status: "ok" };
  }),

  // Get auth configuration
  getAuthConfig: publicProcedure.query(() => {
    return {
      allowRegistration: process.env.ALLOW_REGISTRATION !== "false",
      allowPasswordReset: process.env.ALLOW_PASSWORD_RESET !== "false",
    };
  }),

  // Auth procedures
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, email, password } = input;

      // Check if registration is enabled
      if (process.env.ALLOW_REGISTRATION === "false") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Registration is currently disabled",
        });
      }

      // Check if user already exists
      const existingUser = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already exists",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await ctx.db
        .insert(users)
        .values({
          name,
          email,
          password: hashedPassword,
        })
        .returning();

      return {
        id: String(newUser[0].id),
        name: newUser[0].name,
        email: newUser[0].email,
      };
    }),

  // Forgot password - send reset token
  forgotPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email } = input;

      // Check if password reset is enabled
      if (process.env.ALLOW_PASSWORD_RESET === "false") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Password reset is currently disabled",
        });
      }

      // Check if user exists
      const user = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (user.length === 0) {
        // Don't reveal if user exists or not for security
        return { success: true };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

      // Delete any existing reset tokens for this email
      // Note: If this fails, the table might not exist yet - run `pnpm db:push` to create it
      try {
        await ctx.db
          .delete(passwordResetTokens)
          .where(eq(passwordResetTokens.email, email));
      } catch (error) {
        // Table might not exist yet - this is OK, we'll create a new token anyway
        // If you see this error, run: pnpm db:push
        console.warn("Failed to delete existing reset tokens (table may not exist):", error);
      }

      // Create new reset token
      await ctx.db.insert(passwordResetTokens).values({
        email,
        token: resetToken,
        expires,
      });

      // In a real app, you would send an email here with the reset link
      // For now, we'll return the token (in production, remove this)
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3220"}/reset-password?token=${resetToken}`;
      
      console.log(`Password reset link for ${email}: ${resetUrl}`);

      return { success: true, resetToken: process.env.NODE_ENV === "development" ? resetToken : undefined };
    }),

  // Reset password with token
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { token, password } = input;

      // Find valid reset token
      const resetToken = await ctx.db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, token),
            gt(passwordResetTokens.expires, new Date())
          )
        )
        .limit(1);

      if (resetToken.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }

      const { email } = resetToken[0];

      // Find user
      const user = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (user.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user password
      await ctx.db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user[0].id));

      // Delete used reset token
      await ctx.db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token));

      return { success: true };
    }),

  // Protected procedures
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    const user = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.session.user.id))
      .limit(1);

    if (user.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      id: String(user[0].id),
      name: user[0].name,
      email: user[0].email,
      image: user[0].image || null,
    };
  }),

  // User management procedures
  getUsers: protectedProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          pageSize: z.number().min(1).max(100).default(10),
          search: z.string().optional(),
          status: z.enum(["all", "active", "inactive"]).optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 10;
      const searchTerm = input?.search?.trim() ?? "";
      const statusFilter = input?.status ?? "all";
      const dateFrom = input?.dateFrom;
      const dateTo = input?.dateTo;
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

      const totalQueryBuilder = ctx.db.select({ value: count() }).from(users);
      let totalResult: { value: number }[];
      if (filters.length === 0) {
        totalResult = await totalQueryBuilder;
      } else if (filters.length === 1) {
        totalResult = await totalQueryBuilder.where(filters[0]);
      } else {
        totalResult = await totalQueryBuilder.where(and(...filters));
      }

      const total = totalResult[0]?.value ?? 0;

      const dataQueryBuilder = ctx.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
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
        id: string
        name: string
        email: string
        image: string | null
        isActive: string | null
        createdAt: Date | null
        updatedAt: Date | null
      }[];
      if (filters.length === 0) {
        userList = await dataQueryBuilder;
      } else if (filters.length === 1) {
        userList = await dataQueryBuilder.where(filters[0]);
      } else {
        userList = await dataQueryBuilder.where(and(...filters));
      }

      return {
        users: userList.map((user) => ({
          id: String(user.id),
          name: user.name,
          email: user.email,
          image: user.image || null,
          isActive: user.isActive === "true",
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  getUserById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);

      if (user.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        id: String(user[0].id),
        name: user[0].name,
        email: user[0].email,
        image: user[0].image || null,
        isActive: user[0].isActive === "true",
        createdAt: user[0].createdAt,
        updatedAt: user[0].updatedAt,
      };
    }),

  createUser: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, email, password } = input;

      // Check if user already exists
      const existingUser = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already exists",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await ctx.db
        .insert(users)
        .values({
          name,
          email,
          password: hashedPassword,
          isActive: "true",
        })
        .returning();

      return {
        id: String(newUser[0].id),
        name: newUser[0].name,
        email: newUser[0].email,
        isActive: newUser[0].isActive === "true",
      };
    }),

  updateUser: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        password: z.string().min(6).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, email, password } = input;

      // Check if user exists
      const existingUser = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (existingUser.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check if email is being changed and if it's already taken
      if (email && email !== existingUser[0].email) {
        const emailTaken = await ctx.db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (emailTaken.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already in use",
          });
        }
      }

      // Prepare update data
      const updateData: {
        name?: string;
        email?: string;
        password?: string;
        updatedAt?: Date;
      } = {
        updatedAt: new Date(),
      };

      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      // Update user
      const updatedUser = await ctx.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();

      return {
        id: String(updatedUser[0].id),
        name: updatedUser[0].name,
        email: updatedUser[0].email,
        isActive: updatedUser[0].isActive === "true",
      };
    }),

  deleteUser: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Prevent deleting yourself
      if (ctx.session.user?.id === input.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete your own account",
        });
      }

      // Check if user exists
      const existingUser = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);

      if (existingUser.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Delete user
      await ctx.db.delete(users).where(eq(users.id, input.id));

      return { success: true };
    }),

  toggleUserStatus: protectedProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      // Prevent disabling yourself
      if (ctx.session.user?.id === input.id && !input.isActive) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot disable your own account",
        });
      }

      // Check if user exists
      const existingUser = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);

      if (existingUser.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Update user status
      const updatedUser = await ctx.db
        .update(users)
        .set({
          isActive: input.isActive ? "true" : "false",
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.id))
        .returning();

      return {
        id: String(updatedUser[0].id),
        isActive: updatedUser[0].isActive === "true",
      };
    }),
});

export type AppRouter = typeof appRouter;

