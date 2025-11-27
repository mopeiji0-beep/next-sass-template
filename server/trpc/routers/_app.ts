import { router, publicProcedure, protectedProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq, and, gt, gte, lte, desc, like, or, count, type SQL } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { UserController } from "@/server/controllers/user.controller";

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

    const controller = new UserController(ctx);
    return await controller.getCurrentUser(ctx.session.user.id);
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
      const controller = new UserController(ctx);
      return await controller.getUsers(input ?? {});
    }),

  getUserById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = new UserController(ctx);
      return await controller.getUserById(input.id);
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
      const controller = new UserController(ctx);
      return await controller.createUser(input);
    }),

  updateUser: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        // email 不允许修改，已从输入中移除
        password: z.string().min(6).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, password } = input;
      const controller = new UserController(ctx);
      const updateData: { name?: string; password?: string } = {};
      if (name) updateData.name = name;
      if (password) updateData.password = password;
      return await controller.updateUser(id, updateData);
    }),

  deleteUser: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const controller = new UserController(ctx);
      return await controller.deleteUser(input.id, ctx.session.user?.id);
    }),

  toggleUserStatus: protectedProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const controller = new UserController(ctx);
      const user = await controller.toggleUserStatus(input.id, input.isActive, ctx.session.user?.id);
      return {
        id: user.id,
        isActive: user.isActive,
      };
    }),

  // Change user password (admin function)
  changeUserPassword: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const controller = new UserController(ctx);
      return await controller.changeUserPassword(input.userId, input.password);
    }),

  // Update current user profile
  updateCurrentUser: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        // email 不允许修改，已从输入中移除
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const controller = new UserController(ctx);
      return await controller.updateCurrentUser(ctx.session.user.id, input);
    }),

  // Change current user password
  changeCurrentUserPassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const controller = new UserController(ctx);
      return await controller.changeCurrentUserPassword(
        ctx.session.user.id,
        input.currentPassword,
        input.newPassword
      );
    }),
});

export type AppRouter = typeof appRouter;

