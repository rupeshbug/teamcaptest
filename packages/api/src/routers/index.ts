import type { RouterClient } from "@orpc/server";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { clerkClient } from "../context";
import { protectedProcedure, publicProcedure } from "../index";

const createTeamInput = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional()
    .or(z.literal("")),
});

const inviteTeamMemberInput = z.object({
  organizationId: z.string().trim().min(1),
  emailAddress: z.email().trim(),
  role: z.enum(["org:admin", "org:member"]).default("org:member"),
});

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      userId: context.auth?.userId,
    };
  }),
  createTeam: protectedProcedure.input(createTeamInput).handler(
    async ({ context, input }): Promise<{ id: string; name: string; slug: string | null }> => {
      const currentUserId = context.auth.userId;

      if (!currentUserId) {
        throw new ORPCError("UNAUTHORIZED");
      }

    const organization = await clerkClient.organizations.createOrganization({
      name: input.name,
      slug: input.slug || undefined,
      createdBy: currentUserId,
    });

      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      };
    },
  ),
  inviteTeamMember: protectedProcedure.input(inviteTeamMemberInput).handler(
    async ({
      context,
      input,
    }): Promise<{ id: string; emailAddress: string; role: string; status: string | undefined }> => {
      const currentUserId = context.auth.userId;

      if (!currentUserId) {
        throw new ORPCError("UNAUTHORIZED");
      }

    const memberships = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId: input.organizationId,
      limit: 100,
    });

    const currentMembership = memberships.data.find((membership) => membership.publicUserData?.userId === currentUserId);

    if (!currentMembership) {
      throw new ORPCError("FORBIDDEN", {
        message: "You are not a member of this team.",
      });
    }

    if (currentMembership.role !== "org:admin") {
      throw new ORPCError("FORBIDDEN", {
        message: "Only team admins can invite members.",
      });
    }

    const invitation = await clerkClient.organizations.createOrganizationInvitation({
      organizationId: input.organizationId,
      emailAddress: input.emailAddress,
      role: input.role,
      inviterUserId: currentUserId,
    });

      return {
        id: invitation.id,
        emailAddress: invitation.emailAddress,
        role: invitation.role,
        status: invitation.status,
      };
    },
  ),
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
