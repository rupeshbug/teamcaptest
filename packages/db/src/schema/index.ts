import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type RichTextBlock = {
  type: "heading" | "paragraph" | "bullet-list" | "numbered-list" | "quote";
  level?: 1 | 2 | 3;
  text?: string;
  items?: string[];
};

export const fundingStageEnum = pgEnum("funding_stage", ["idea", "pre_seed", "seed"]);
export const memberTypeEnum = pgEnum("member_type", ["founder", "community", "employee"]);
export const inviteTypeEnum = pgEnum("invite_type", ["cofounder", "community", "employee"]);
export const inviteStatusEnum = pgEnum("invite_status", ["pending", "accepted", "revoked"]);
export const contractTypeEnum = pgEnum("contract_type", [
  "founders_agreement",
  "community_participation",
  "employment_offer",
  "equity_addendum",
]);
export const contractStatusEnum = pgEnum("contract_status", ["draft", "in_review", "approved", "executed"]);
export const approvalDecisionEnum = pgEnum("approval_decision", ["pending", "approved", "rejected"]);
export const taskStatusEnum = pgEnum("task_status", [
  "proposed",
  "in_progress",
  "review",
  "approved",
  "completed",
  "blocked",
]);
export const approvalRuleEnum = pgEnum("approval_rule", ["all_founders", "majority_founders"]);
export const rewardTypeEnum = pgEnum("reward_type", ["none", "equity", "cash", "equity_and_cash"]);
export const equitySourceEnum = pgEnum("equity_source", [
  "founding_commitment",
  "cash_investment",
  "task_completion",
]);
export const equityGrantStatusEnum = pgEnum("equity_grant_status", ["proposed", "approved", "issued"]);

export const workspaces = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    clerkOrganizationId: text("clerk_organization_id"),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    summary: text("summary").notNull(),
    fundingStage: fundingStageEnum("funding_stage").notNull().default("idea"),
    totalEquityBasisPoints: integer("total_equity_basis_points").notNull().default(10_000),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("workspaces_slug_idx").on(table.slug),
    clerkOrganizationIdIdx: uniqueIndex("workspaces_clerk_organization_id_idx").on(table.clerkOrganizationId),
  }),
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id"),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    memberType: memberTypeEnum("member_type").notNull(),
    roleTitle: text("role_title").notNull(),
    customRoleTitle: text("custom_role_title"),
    isFoundingMember: boolean("is_founding_member").notNull().default(false),
    equityEligible: boolean("equity_eligible").notNull().default(false),
    bio: text("bio").notNull().default(""),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    active: boolean("active").notNull().default(true),
  },
  (table) => ({
    workspaceMemberIdx: index("workspace_members_workspace_id_idx").on(table.workspaceId),
  }),
);

export const workspaceInvites = pgTable(
  "workspace_invites",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    inviteType: inviteTypeEnum("invite_type").notNull(),
    customRoleTitle: text("custom_role_title"),
    equityEligible: boolean("equity_eligible").notNull().default(false),
    status: inviteStatusEnum("status").notNull().default("pending"),
    invitedByMemberId: text("invited_by_member_id").references(() => workspaceMembers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    workspaceInviteIdx: index("workspace_invites_workspace_id_idx").on(table.workspaceId),
  }),
);

export const contracts = pgTable(
  "contracts",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    createdByMemberId: text("created_by_member_id").references(() => workspaceMembers.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull().default(""),
    contractType: contractTypeEnum("contract_type").notNull(),
    status: contractStatusEnum("status").notNull().default("draft"),
    requiresFounderApproval: boolean("requires_founder_approval").notNull().default(true),
    content: jsonb("content").$type<RichTextBlock[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (table) => ({
    contractWorkspaceIdx: index("contracts_workspace_id_idx").on(table.workspaceId),
  }),
);

export const contractComments = pgTable(
  "contract_comments",
  {
    id: text("id").primaryKey(),
    contractId: text("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    authorMemberId: text("author_member_id").references(() => workspaceMembers.id, {
      onDelete: "set null",
    }),
    content: jsonb("content").$type<RichTextBlock[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    contractCommentIdx: index("contract_comments_contract_id_idx").on(table.contractId),
  }),
);

export const contractApprovals = pgTable(
  "contract_approvals",
  {
    id: text("id").primaryKey(),
    contractId: text("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => workspaceMembers.id, { onDelete: "cascade" }),
    decision: approvalDecisionEnum("decision").notNull().default("pending"),
    note: text("note"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (table) => ({
    contractApprovalIdx: uniqueIndex("contract_approvals_contract_member_idx").on(table.contractId, table.memberId),
  }),
);

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    assigneeMemberId: text("assignee_member_id").references(() => workspaceMembers.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    description: jsonb("description").$type<RichTextBlock[]>().notNull(),
    status: taskStatusEnum("status").notNull().default("proposed"),
    requiresFounderApproval: boolean("requires_founder_approval").notNull().default(false),
    approvalRule: approvalRuleEnum("approval_rule").notNull().default("all_founders"),
    rewardType: rewardTypeEnum("reward_type").notNull().default("none"),
    equityBasisPoints: integer("equity_basis_points"),
    cashRewardCents: integer("cash_reward_cents"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    taskWorkspaceIdx: index("tasks_workspace_id_idx").on(table.workspaceId),
  }),
);

export const taskApprovals = pgTable(
  "task_approvals",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => workspaceMembers.id, { onDelete: "cascade" }),
    decision: approvalDecisionEnum("decision").notNull().default("pending"),
    note: text("note"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (table) => ({
    taskApprovalIdx: uniqueIndex("task_approvals_task_member_idx").on(table.taskId, table.memberId),
  }),
);

export const equityGrants = pgTable(
  "equity_grants",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    recipientMemberId: text("recipient_member_id")
      .notNull()
      .references(() => workspaceMembers.id, { onDelete: "cascade" }),
    sourceType: equitySourceEnum("source_type").notNull(),
    sourceLabel: text("source_label").notNull(),
    status: equityGrantStatusEnum("status").notNull().default("proposed"),
    basisPoints: integer("basis_points").notNull(),
    cashInvestmentCents: integer("cash_investment_cents"),
    linkedTaskId: text("linked_task_id").references(() => tasks.id, { onDelete: "set null" }),
    linkedContractId: text("linked_contract_id").references(() => contracts.id, { onDelete: "set null" }),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
  },
  (table) => ({
    equityGrantWorkspaceIdx: index("equity_grants_workspace_id_idx").on(table.workspaceId),
  }),
);

export const workspaceRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  invites: many(workspaceInvites),
  contracts: many(contracts),
  tasks: many(tasks),
  equityGrants: many(equityGrants),
}));

export const workspaceMemberRelations = relations(workspaceMembers, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  contractsCreated: many(contracts),
  contractComments: many(contractComments),
  contractApprovals: many(contractApprovals),
  tasksAssigned: many(tasks),
  taskApprovals: many(taskApprovals),
  equityGrants: many(equityGrants),
}));

export const contractRelations = relations(contracts, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [contracts.workspaceId],
    references: [workspaces.id],
  }),
  createdBy: one(workspaceMembers, {
    fields: [contracts.createdByMemberId],
    references: [workspaceMembers.id],
  }),
  comments: many(contractComments),
  approvals: many(contractApprovals),
  equityGrants: many(equityGrants),
}));

export const taskRelations = relations(tasks, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [tasks.workspaceId],
    references: [workspaces.id],
  }),
  assignee: one(workspaceMembers, {
    fields: [tasks.assigneeMemberId],
    references: [workspaceMembers.id],
  }),
  approvals: many(taskApprovals),
  equityGrants: many(equityGrants),
}));

export const equityGrantRelations = relations(equityGrants, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [equityGrants.workspaceId],
    references: [workspaces.id],
  }),
  recipient: one(workspaceMembers, {
    fields: [equityGrants.recipientMemberId],
    references: [workspaceMembers.id],
  }),
  task: one(tasks, {
    fields: [equityGrants.linkedTaskId],
    references: [tasks.id],
  }),
  contract: one(contracts, {
    fields: [equityGrants.linkedContractId],
    references: [contracts.id],
  }),
}));
