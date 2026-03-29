import {
  asc,
  contractApprovals,
  contractComments,
  contracts,
  db,
  desc,
  equityGrants,
  eq,
  tasks,
  taskApprovals,
  workspaceInvites,
  workspaceMembers,
  workspaces,
  type RichTextBlock,
} from "@teamcap/db";

type MemberType = (typeof workspaceMembers.$inferSelect)["memberType"];
type InviteType = (typeof workspaceInvites.$inferSelect)["inviteType"];
type InviteStatus = (typeof workspaceInvites.$inferSelect)["status"];
type TaskStatus = (typeof tasks.$inferSelect)["status"];
type ApprovalDecision = (typeof contractApprovals.$inferSelect)["decision"];
type EquitySource = (typeof equityGrants.$inferSelect)["sourceType"];
type ContractStatus = (typeof contracts.$inferSelect)["status"];

export type WorkspaceOverview = {
  workspace: {
    id: string;
    name: string;
    slug: string;
    summary: string;
    fundingStage: string;
  };
  counts: {
    founders: number;
    community: number;
    employees: number;
    pendingInvites: number;
    approvedEquityBasisPoints: number;
  };
  members: {
    founders: MemberSummary[];
    community: MemberSummary[];
    employees: MemberSummary[];
  };
  invites: InviteSummary[];
  activeContract: ContractSummary | null;
  equitySummary: {
    approvedBasisPoints: number;
    proposedBasisPoints: number;
    cashInvestmentCents: number;
    bySource: Array<{
      sourceType: EquitySource;
      label: string;
      basisPoints: number;
      cashInvestmentCents: number;
    }>;
  };
  capTablePreview: Array<{
    memberId: string;
    fullName: string;
    roleTitle: string;
    memberType: MemberType;
    approvedBasisPoints: number;
    ownershipPercent: number;
    cashInvestmentCents: number;
  }>;
};

export type WorkspaceTasks = {
  workspace: {
    id: string;
    name: string;
    summary: string;
  };
  approvalQueue: TaskSummary[];
  tasks: TaskSummary[];
};

export type WorkspaceAnalytics = {
  workspace: {
    id: string;
    name: string;
    fundingStage: string;
    totalEquityBasisPoints: number;
  };
  memberMix: Array<{
    memberType: MemberType;
    count: number;
    equityEligible: number;
  }>;
  capTable: Array<{
    memberId: string;
    fullName: string;
    roleTitle: string;
    memberType: MemberType;
    approvedBasisPoints: number;
    ownershipPercent: number;
    cashInvestmentCents: number;
  }>;
  sourceBreakdown: Array<{
    sourceType: EquitySource;
    label: string;
    grants: number;
    approvedBasisPoints: number;
    proposedBasisPoints: number;
    cashInvestmentCents: number;
  }>;
  approvalMetrics: {
    contractsApproved: number;
    contractsPending: number;
    tasksApproved: number;
    tasksPending: number;
  };
  taskStatusBreakdown: Array<{
    status: TaskStatus;
    count: number;
  }>;
};

type MemberSummary = {
  id: string;
  fullName: string;
  email: string;
  memberType: MemberType;
  roleTitle: string;
  customRoleTitle: string | null;
  isFoundingMember: boolean;
  equityEligible: boolean;
  bio: string;
  joinedAt: string;
};

type InviteSummary = {
  id: string;
  email: string;
  inviteType: InviteType;
  customRoleTitle: string | null;
  equityEligible: boolean;
  status: InviteStatus;
  invitedBy: string | null;
  createdAt: string;
};

type ContractSummary = {
  id: string;
  title: string;
  subtitle: string;
  contractType: string;
  status: ContractStatus;
  requiresFounderApproval: boolean;
  content: RichTextBlock[];
  comments: Array<{
    id: string;
    authorName: string;
    content: RichTextBlock[];
    createdAt: string;
  }>;
  approvals: Array<{
    memberId: string;
    memberName: string;
    decision: ApprovalDecision;
    note: string | null;
    decidedAt: string | null;
  }>;
};

type TaskSummary = {
  id: string;
  title: string;
  summary: string;
  description: RichTextBlock[];
  status: TaskStatus;
  assigneeName: string | null;
  assigneeRole: string | null;
  requiresFounderApproval: boolean;
  approvalRule: string;
  rewardType: string;
  equityBasisPoints: number | null;
  cashRewardCents: number | null;
  dueAt: string | null;
  completedAt: string | null;
  approvals: Array<{
    memberId: string;
    memberName: string;
    decision: ApprovalDecision;
    note: string | null;
    decidedAt: string | null;
  }>;
  approvalProgress: {
    approved: number;
    pending: number;
    rejected: number;
    required: number;
  };
};

type WorkspaceSnapshot = {
  workspace: typeof workspaces.$inferSelect;
  members: Array<typeof workspaceMembers.$inferSelect>;
  invites: Array<typeof workspaceInvites.$inferSelect>;
  contracts: Array<typeof contracts.$inferSelect>;
  contractApprovals: Array<typeof contractApprovals.$inferSelect>;
  contractComments: Array<typeof contractComments.$inferSelect>;
  tasks: Array<typeof tasks.$inferSelect>;
  taskApprovals: Array<typeof taskApprovals.$inferSelect>;
  equityGrants: Array<typeof equityGrants.$inferSelect>;
};

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

async function getWorkspace(orgId?: string | null) {
  if (orgId) {
    const matched = await db.select().from(workspaces).where(eq(workspaces.clerkOrganizationId, orgId)).limit(1);
    if (matched[0]) {
      return matched[0];
    }
  }

  const fallback = await db.select().from(workspaces).orderBy(asc(workspaces.createdAt)).limit(1);
  return fallback[0] ?? null;
}

async function loadWorkspaceSnapshot(orgId?: string | null): Promise<WorkspaceSnapshot | null> {
  const workspace = await getWorkspace(orgId);

  if (!workspace) {
    return null;
  }

  const [members, invites, contractRows, contractApprovalRows, contractCommentRows, taskRows, taskApprovalRows, equityGrantRows] =
    await Promise.all([
      db.select().from(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspace.id)).orderBy(asc(workspaceMembers.joinedAt)),
      db.select().from(workspaceInvites).where(eq(workspaceInvites.workspaceId, workspace.id)).orderBy(desc(workspaceInvites.createdAt)),
      db.select().from(contracts).where(eq(contracts.workspaceId, workspace.id)).orderBy(desc(contracts.updatedAt)),
      db.select().from(contractApprovals).orderBy(asc(contractApprovals.memberId)),
      db.select().from(contractComments).orderBy(desc(contractComments.createdAt)),
      db.select().from(tasks).where(eq(tasks.workspaceId, workspace.id)).orderBy(desc(tasks.createdAt)),
      db.select().from(taskApprovals).orderBy(asc(taskApprovals.memberId)),
      db.select().from(equityGrants).where(eq(equityGrants.workspaceId, workspace.id)).orderBy(desc(equityGrants.createdAt)),
    ]);

  const contractIds = new Set(contractRows.map((contract) => contract.id));
  const taskIds = new Set(taskRows.map((task) => task.id));

  return {
    workspace,
    members,
    invites,
    contracts: contractRows,
    contractApprovals: contractApprovalRows.filter((approval) => contractIds.has(approval.contractId)),
    contractComments: contractCommentRows.filter((comment) => contractIds.has(comment.contractId)),
    tasks: taskRows,
    taskApprovals: taskApprovalRows.filter((approval) => taskIds.has(approval.taskId)),
    equityGrants: equityGrantRows,
  };
}

function summarizeMembers(members: WorkspaceSnapshot["members"]): Record<string, MemberSummary> {
  return Object.fromEntries(
    members.map((member) => [
      member.id,
      {
        id: member.id,
        fullName: member.fullName,
        email: member.email,
        memberType: member.memberType,
        roleTitle: member.roleTitle,
        customRoleTitle: member.customRoleTitle,
        isFoundingMember: member.isFoundingMember,
        equityEligible: member.equityEligible,
        bio: member.bio,
        joinedAt: member.joinedAt.toISOString(),
      } satisfies MemberSummary,
    ]),
  );
}

function buildCapTable(snapshot: WorkspaceSnapshot) {
  const memberMap = summarizeMembers(snapshot.members);

  return snapshot.members.map((member) => {
    const grants = snapshot.equityGrants.filter((grant) => grant.recipientMemberId === member.id && grant.status !== "proposed");
    const approvedBasisPoints = grants.reduce((total, grant) => total + grant.basisPoints, 0);
    const cashInvestmentCents = grants.reduce((total, grant) => total + (grant.cashInvestmentCents ?? 0), 0);

    return {
      memberId: member.id,
      fullName: memberMap[member.id]?.fullName ?? member.fullName,
      roleTitle: member.customRoleTitle || member.roleTitle,
      memberType: member.memberType,
      approvedBasisPoints,
      ownershipPercent: Number((approvedBasisPoints / snapshot.workspace.totalEquityBasisPoints * 100).toFixed(2)),
      cashInvestmentCents,
    };
  });
}

function mapContract(snapshot: WorkspaceSnapshot, contract: WorkspaceSnapshot["contracts"][number]): ContractSummary {
  const memberMap = summarizeMembers(snapshot.members);

  return {
    id: contract.id,
    title: contract.title,
    subtitle: contract.subtitle,
    contractType: contract.contractType,
    status: contract.status,
    requiresFounderApproval: contract.requiresFounderApproval,
    content: contract.content,
    comments: snapshot.contractComments
      .filter((comment) => comment.contractId === contract.id)
      .map((comment) => ({
        id: comment.id,
        authorName: comment.authorMemberId ? memberMap[comment.authorMemberId]?.fullName ?? "Unknown" : "Unknown",
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      })),
    approvals: snapshot.contractApprovals
      .filter((approval) => approval.contractId === contract.id)
      .map((approval) => ({
        memberId: approval.memberId,
        memberName: memberMap[approval.memberId]?.fullName ?? "Unknown",
        decision: approval.decision,
        note: approval.note,
        decidedAt: toIso(approval.decidedAt),
      })),
  };
}

function mapTask(snapshot: WorkspaceSnapshot, task: WorkspaceSnapshot["tasks"][number]): TaskSummary {
  const memberMap = summarizeMembers(snapshot.members);
  const founderCount = snapshot.members.filter((member) => member.isFoundingMember).length;
  const approvals = snapshot.taskApprovals
    .filter((approval) => approval.taskId === task.id)
    .map((approval) => ({
      memberId: approval.memberId,
      memberName: memberMap[approval.memberId]?.fullName ?? "Unknown",
      decision: approval.decision,
      note: approval.note,
      decidedAt: toIso(approval.decidedAt),
    }));

  return {
    id: task.id,
    title: task.title,
    summary: task.summary,
    description: task.description,
    status: task.status,
    assigneeName: task.assigneeMemberId ? memberMap[task.assigneeMemberId]?.fullName ?? null : null,
    assigneeRole: task.assigneeMemberId
      ? (memberMap[task.assigneeMemberId]?.customRoleTitle || memberMap[task.assigneeMemberId]?.roleTitle || null)
      : null,
    requiresFounderApproval: task.requiresFounderApproval,
    approvalRule: task.approvalRule,
    rewardType: task.rewardType,
    equityBasisPoints: task.equityBasisPoints,
    cashRewardCents: task.cashRewardCents,
    dueAt: toIso(task.dueAt),
    completedAt: toIso(task.completedAt),
    approvals,
    approvalProgress: {
      approved: approvals.filter((approval) => approval.decision === "approved").length,
      pending: approvals.filter((approval) => approval.decision === "pending").length,
      rejected: approvals.filter((approval) => approval.decision === "rejected").length,
      required: task.requiresFounderApproval ? founderCount : 0,
    },
  };
}

export async function getWorkspaceOverview(orgId?: string | null): Promise<WorkspaceOverview | null> {
  const snapshot = await loadWorkspaceSnapshot(orgId);

  if (!snapshot) {
    return null;
  }

  const memberMap = summarizeMembers(snapshot.members);
  const founders = snapshot.members
    .filter((member) => member.memberType === "founder")
    .map((member) => memberMap[member.id])
    .filter((member): member is MemberSummary => !!member);
  const community = snapshot.members
    .filter((member) => member.memberType === "community")
    .map((member) => memberMap[member.id])
    .filter((member): member is MemberSummary => !!member);
  const employees = snapshot.members
    .filter((member) => member.memberType === "employee")
    .map((member) => memberMap[member.id])
    .filter((member): member is MemberSummary => !!member);
  const approvedGrants = snapshot.equityGrants.filter((grant) => grant.status !== "proposed");
  const proposedGrants = snapshot.equityGrants.filter((grant) => grant.status === "proposed");
  const activeContractRow = snapshot.contracts[0] ?? null;
  const capTable = buildCapTable(snapshot);

  return {
    workspace: {
      id: snapshot.workspace.id,
      name: snapshot.workspace.name,
      slug: snapshot.workspace.slug,
      summary: snapshot.workspace.summary,
      fundingStage: snapshot.workspace.fundingStage,
    },
    counts: {
      founders: founders.length,
      community: community.length,
      employees: employees.length,
      pendingInvites: snapshot.invites.filter((invite) => invite.status === "pending").length,
      approvedEquityBasisPoints: approvedGrants.reduce((total, grant) => total + grant.basisPoints, 0),
    },
    members: {
      founders,
      community,
      employees,
    },
    invites: snapshot.invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      inviteType: invite.inviteType,
      customRoleTitle: invite.customRoleTitle,
      equityEligible: invite.equityEligible,
      status: invite.status,
      invitedBy: invite.invitedByMemberId ? memberMap[invite.invitedByMemberId]?.fullName ?? null : null,
      createdAt: invite.createdAt.toISOString(),
    })),
    activeContract: activeContractRow ? mapContract(snapshot, activeContractRow) : null,
    equitySummary: {
      approvedBasisPoints: approvedGrants.reduce((total, grant) => total + grant.basisPoints, 0),
      proposedBasisPoints: proposedGrants.reduce((total, grant) => total + grant.basisPoints, 0),
      cashInvestmentCents: snapshot.equityGrants.reduce((total, grant) => total + (grant.cashInvestmentCents ?? 0), 0),
      bySource: Array.from(
        snapshot.equityGrants.reduce((map, grant) => {
          const existing = map.get(grant.sourceType) ?? {
            sourceType: grant.sourceType,
            label: grant.sourceLabel,
            basisPoints: 0,
            cashInvestmentCents: 0,
          };
          existing.basisPoints += grant.basisPoints;
          existing.cashInvestmentCents += grant.cashInvestmentCents ?? 0;
          map.set(grant.sourceType, existing);
          return map;
        }, new Map<EquitySource, { sourceType: EquitySource; label: string; basisPoints: number; cashInvestmentCents: number }>()),
      ).map(([, value]) => value),
    },
    capTablePreview: capTable,
  };
}

export async function getWorkspaceTasks(orgId?: string | null): Promise<WorkspaceTasks | null> {
  const snapshot = await loadWorkspaceSnapshot(orgId);

  if (!snapshot) {
    return null;
  }

  const taskList = snapshot.tasks.map((task) => mapTask(snapshot, task));

  return {
    workspace: {
      id: snapshot.workspace.id,
      name: snapshot.workspace.name,
      summary: snapshot.workspace.summary,
    },
    approvalQueue: taskList.filter(
      (task) =>
        task.requiresFounderApproval &&
        (task.approvalProgress.pending > 0 || task.approvalProgress.rejected > 0),
    ),
    tasks: taskList,
  };
}

export async function getWorkspaceAnalytics(orgId?: string | null): Promise<WorkspaceAnalytics | null> {
  const snapshot = await loadWorkspaceSnapshot(orgId);

  if (!snapshot) {
    return null;
  }

  const capTable = buildCapTable(snapshot);

  return {
    workspace: {
      id: snapshot.workspace.id,
      name: snapshot.workspace.name,
      fundingStage: snapshot.workspace.fundingStage,
      totalEquityBasisPoints: snapshot.workspace.totalEquityBasisPoints,
    },
    memberMix: ["founder", "community", "employee"].map((memberType) => {
      const filtered = snapshot.members.filter((member) => member.memberType === memberType);
      return {
        memberType: memberType as MemberType,
        count: filtered.length,
        equityEligible: filtered.filter((member) => member.equityEligible).length,
      };
    }),
    capTable,
    sourceBreakdown: Array.from(
      snapshot.equityGrants.reduce((map, grant) => {
        const existing = map.get(grant.sourceType) ?? {
          sourceType: grant.sourceType,
          label: grant.sourceLabel,
          grants: 0,
          approvedBasisPoints: 0,
          proposedBasisPoints: 0,
          cashInvestmentCents: 0,
        };

        existing.grants += 1;
        existing.cashInvestmentCents += grant.cashInvestmentCents ?? 0;

        if (grant.status === "proposed") {
          existing.proposedBasisPoints += grant.basisPoints;
        } else {
          existing.approvedBasisPoints += grant.basisPoints;
        }

        map.set(grant.sourceType, existing);
        return map;
      }, new Map<EquitySource, {
        sourceType: EquitySource;
        label: string;
        grants: number;
        approvedBasisPoints: number;
        proposedBasisPoints: number;
        cashInvestmentCents: number;
      }>()),
    ).map(([, value]) => value),
    approvalMetrics: {
      contractsApproved: snapshot.contractApprovals.filter((approval) => approval.decision === "approved").length,
      contractsPending: snapshot.contractApprovals.filter((approval) => approval.decision === "pending").length,
      tasksApproved: snapshot.taskApprovals.filter((approval) => approval.decision === "approved").length,
      tasksPending: snapshot.taskApprovals.filter((approval) => approval.decision === "pending").length,
    },
    taskStatusBreakdown: ["proposed", "in_progress", "review", "approved", "completed", "blocked"].map((status) => ({
      status: status as TaskStatus,
      count: snapshot.tasks.filter((task) => task.status === status).length,
    })),
  };
}
