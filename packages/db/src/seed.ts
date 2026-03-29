import { db } from "./index";
import {
  contractApprovals,
  contractComments,
  contracts,
  equityGrants,
  taskApprovals,
  tasks,
  workspaceInvites,
  workspaceMembers,
  workspaces,
  type RichTextBlock,
} from "./schema";

const founderAgreementContent: RichTextBlock[] = [
  { type: "heading", level: 1, text: "Founders operating compact" },
  {
    type: "paragraph",
    text: "Novelty Lab exists to help founders recruit aligned cofounders, activate their founding community, and convert contribution into transparent ownership.",
  },
  {
    type: "bullet-list",
    items: [
      "All founding members must approve equity issued for task-based contribution.",
      "Cash investments can convert directly into equity based on the agreed cap table.",
      "Founding community contributors may earn equity through approved strategic work.",
    ],
  },
  { type: "heading", level: 2, text: "Approval rule" },
  {
    type: "paragraph",
    text: "Equity-bearing contracts, community allocations, and sweat-equity tasks require unanimous approval from all founding members before issuance.",
  },
];

const employeeOfferContent: RichTextBlock[] = [
  { type: "heading", level: 1, text: "Custom role employment offer" },
  {
    type: "paragraph",
    text: "Employees may be invited into custom roles such as Product Designer, Community Operations Lead, or Revenue Ops. These roles do not receive founding privileges by default.",
  },
  {
    type: "quote",
    text: "Custom-role employees can participate operationally without changing the founder approval structure.",
  },
];

const taskBlocks = (summary: string, deliverables: string[]): RichTextBlock[] => [
  { type: "paragraph", text: summary },
  { type: "bullet-list", items: deliverables },
];

async function main() {
  await db.delete(contractApprovals);
  await db.delete(contractComments);
  await db.delete(taskApprovals);
  await db.delete(equityGrants);
  await db.delete(tasks);
  await db.delete(contracts);
  await db.delete(workspaceInvites);
  await db.delete(workspaceMembers);
  await db.delete(workspaces);

  await db.insert(workspaces).values({
    id: "ws_novelty_lab",
    name: "Novelty Lab",
    slug: "novelty-lab",
    summary:
      "A founder workspace for recruiting cofounders, activating a founding community, and tracking contracts, approvals, and equity.",
    fundingStage: "pre_seed",
    totalEquityBasisPoints: 10_000,
  });

  await db.insert(workspaceMembers).values([
    {
      id: "mem_dipesh",
      workspaceId: "ws_novelty_lab",
      fullName: "Dipesh Chaulagain",
      email: "dipesh@noveltylab.com",
      memberType: "founder",
      roleTitle: "Founder & CEO",
      isFoundingMember: true,
      equityEligible: true,
      bio: "Leads founder recruiting, capital strategy, and final approvals.",
    },
    {
      id: "mem_aarav",
      workspaceId: "ws_novelty_lab",
      fullName: "Aarav Shrestha",
      email: "aarav@noveltylab.com",
      memberType: "founder",
      roleTitle: "Co-founder & CTO",
      isFoundingMember: true,
      equityEligible: true,
      bio: "Owns platform architecture and approves all equity-bearing work.",
    },
    {
      id: "mem_priya",
      workspaceId: "ws_novelty_lab",
      fullName: "Priya Karki",
      email: "priya@noveltylab.com",
      memberType: "community",
      roleTitle: "Founding Community Lead",
      customRoleTitle: "Community Growth Architect",
      equityEligible: true,
      bio: "Leads the founding community and earns equity through approved strategic contribution.",
    },
    {
      id: "mem_sonia",
      workspaceId: "ws_novelty_lab",
      fullName: "Sonia Rai",
      email: "sonia@noveltylab.com",
      memberType: "employee",
      roleTitle: "Employee",
      customRoleTitle: "Product Designer",
      equityEligible: false,
      bio: "Non-founding employee invited into a custom product role.",
    },
    {
      id: "mem_nikhil",
      workspaceId: "ws_novelty_lab",
      fullName: "Nikhil Bhandari",
      email: "nikhil@noveltylab.com",
      memberType: "employee",
      roleTitle: "Employee",
      customRoleTitle: "Revenue Operations Lead",
      equityEligible: false,
      bio: "Custom-role employee responsible for CRM and operating cadence.",
    },
  ]);

  await db.insert(workspaceInvites).values([
    {
      id: "invite_rehan",
      workspaceId: "ws_novelty_lab",
      email: "rehan@company.com",
      inviteType: "cofounder",
      equityEligible: true,
      status: "pending",
      invitedByMemberId: "mem_dipesh",
    },
    {
      id: "invite_emma",
      workspaceId: "ws_novelty_lab",
      email: "emma@company.com",
      inviteType: "employee",
      customRoleTitle: "Community Operations Lead",
      equityEligible: false,
      status: "pending",
      invitedByMemberId: "mem_aarav",
    },
  ]);

  await db.insert(contracts).values([
    {
      id: "contract_founders_compact",
      workspaceId: "ws_novelty_lab",
      createdByMemberId: "mem_dipesh",
      title: "Founders Compact v1",
      subtitle: "Defines approval, equity issuance, and community participation rules.",
      contractType: "founders_agreement",
      status: "approved",
      requiresFounderApproval: true,
      content: founderAgreementContent,
      publishedAt: new Date("2026-03-20T09:00:00Z"),
    },
    {
      id: "contract_employee_roles",
      workspaceId: "ws_novelty_lab",
      createdByMemberId: "mem_aarav",
      title: "Employee Custom Role Terms",
      subtitle: "Clarifies non-founding employment roles and compensation boundaries.",
      contractType: "employment_offer",
      status: "in_review",
      requiresFounderApproval: true,
      content: employeeOfferContent,
    },
  ]);

  await db.insert(contractComments).values([
    {
      id: "comment_founders_1",
      contractId: "contract_founders_compact",
      authorMemberId: "mem_aarav",
      content: [{ type: "paragraph", text: "Add explicit wording that task-based equity requires unanimous founder approval." }],
    },
    {
      id: "comment_founders_2",
      contractId: "contract_founders_compact",
      authorMemberId: "mem_priya",
      content: [{ type: "paragraph", text: "Community contributors should have visibility into how approved task equity is recorded." }],
    },
    {
      id: "comment_employee_1",
      contractId: "contract_employee_roles",
      authorMemberId: "mem_dipesh",
      content: [{ type: "paragraph", text: "Keep employee custom roles clearly separate from founding equity rights." }],
    },
  ]);

  await db.insert(contractApprovals).values([
    {
      id: "contract_approval_1",
      contractId: "contract_founders_compact",
      memberId: "mem_dipesh",
      decision: "approved",
      note: "Aligned with our founder governance model.",
      decidedAt: new Date("2026-03-19T09:00:00Z"),
    },
    {
      id: "contract_approval_2",
      contractId: "contract_founders_compact",
      memberId: "mem_aarav",
      decision: "approved",
      note: "Ship it.",
      decidedAt: new Date("2026-03-19T10:15:00Z"),
    },
    {
      id: "contract_approval_3",
      contractId: "contract_employee_roles",
      memberId: "mem_dipesh",
      decision: "approved",
      note: "Good with the custom-role framing.",
      decidedAt: new Date("2026-03-28T12:00:00Z"),
    },
    {
      id: "contract_approval_4",
      contractId: "contract_employee_roles",
      memberId: "mem_aarav",
      decision: "pending",
    },
  ]);

  await db.insert(tasks).values([
    {
      id: "task_community_launch",
      workspaceId: "ws_novelty_lab",
      assigneeMemberId: "mem_priya",
      title: "Launch founding community ambassador pilot",
      summary: "Run the first community cohort and document conversion from contributor to qualified cofounder referrals.",
      description: taskBlocks("Deliver the ambassador pilot with reporting and referral attribution.", [
        "Recruit 20 founding community members",
        "Publish cohort handbook",
        "Deliver referral performance review",
      ]),
      status: "completed",
      requiresFounderApproval: true,
      approvalRule: "all_founders",
      rewardType: "equity",
      equityBasisPoints: 150,
      dueAt: new Date("2026-03-15T00:00:00Z"),
      completedAt: new Date("2026-03-16T16:00:00Z"),
    },
    {
      id: "task_data_room",
      workspaceId: "ws_novelty_lab",
      assigneeMemberId: "mem_sonia",
      title: "Design investor data room narrative",
      summary: "Prepare the pre-seed deck system and data room structure.",
      description: taskBlocks("Create investor-facing artifacts and visual consistency.", [
        "Product narrative deck",
        "Usage and traction snapshots",
        "Brand-consistent data room templates",
      ]),
      status: "review",
      requiresFounderApproval: false,
      rewardType: "cash",
      cashRewardCents: 120000,
      dueAt: new Date("2026-04-03T00:00:00Z"),
    },
    {
      id: "task_growth_loop",
      workspaceId: "ws_novelty_lab",
      assigneeMemberId: "mem_priya",
      title: "Build referral growth loop for founder intake",
      summary: "Proposed sweat-equity project to automate community referrals into founder pipeline scoring.",
      description: taskBlocks("Turn community activity into qualified founder pipeline inputs.", [
        "Map referral lifecycle",
        "Score community contributions",
        "Recommend equity rubric for founder approval",
      ]),
      status: "review",
      requiresFounderApproval: true,
      approvalRule: "all_founders",
      rewardType: "equity",
      equityBasisPoints: 80,
      dueAt: new Date("2026-04-10T00:00:00Z"),
    },
  ]);

  await db.insert(taskApprovals).values([
    {
      id: "task_approval_1",
      taskId: "task_community_launch",
      memberId: "mem_dipesh",
      decision: "approved",
      note: "Community launch directly improved founder pipeline quality.",
      decidedAt: new Date("2026-03-17T09:15:00Z"),
    },
    {
      id: "task_approval_2",
      taskId: "task_community_launch",
      memberId: "mem_aarav",
      decision: "approved",
      note: "Metrics and deliverables were complete.",
      decidedAt: new Date("2026-03-17T11:00:00Z"),
    },
    {
      id: "task_approval_3",
      taskId: "task_growth_loop",
      memberId: "mem_dipesh",
      decision: "approved",
      note: "Worth equity if Aarav approves the implementation quality.",
      decidedAt: new Date("2026-03-28T10:00:00Z"),
    },
    {
      id: "task_approval_4",
      taskId: "task_growth_loop",
      memberId: "mem_aarav",
      decision: "pending",
    },
  ]);

  await db.insert(equityGrants).values([
    {
      id: "grant_founder_dipesh",
      workspaceId: "ws_novelty_lab",
      recipientMemberId: "mem_dipesh",
      sourceType: "founding_commitment",
      sourceLabel: "Founder allocation",
      status: "issued",
      basisPoints: 4200,
      notes: "Initial founder ownership allocation.",
      approvedAt: new Date("2026-03-19T10:15:00Z"),
    },
    {
      id: "grant_founder_aarav",
      workspaceId: "ws_novelty_lab",
      recipientMemberId: "mem_aarav",
      sourceType: "founding_commitment",
      sourceLabel: "Founder allocation",
      status: "issued",
      basisPoints: 3200,
      notes: "Initial technical founder allocation.",
      approvedAt: new Date("2026-03-19T10:15:00Z"),
    },
    {
      id: "grant_community_priya",
      workspaceId: "ws_novelty_lab",
      recipientMemberId: "mem_priya",
      sourceType: "task_completion",
      sourceLabel: "Ambassador pilot milestone",
      status: "approved",
      basisPoints: 150,
      linkedTaskId: "task_community_launch",
      linkedContractId: "contract_founders_compact",
      notes: "Sweat-equity grant approved by all founders.",
      approvedAt: new Date("2026-03-17T11:00:00Z"),
    },
    {
      id: "grant_investment_dipesh",
      workspaceId: "ws_novelty_lab",
      recipientMemberId: "mem_dipesh",
      sourceType: "cash_investment",
      sourceLabel: "Founder bridge investment",
      status: "approved",
      basisPoints: 400,
      cashInvestmentCents: 2500000,
      linkedContractId: "contract_founders_compact",
      notes: "Direct financial investment converted into equity.",
      approvedAt: new Date("2026-03-22T09:00:00Z"),
    },
    {
      id: "grant_growth_loop",
      workspaceId: "ws_novelty_lab",
      recipientMemberId: "mem_priya",
      sourceType: "task_completion",
      sourceLabel: "Referral growth loop proposal",
      status: "proposed",
      basisPoints: 80,
      linkedTaskId: "task_growth_loop",
      notes: "Pending unanimous founder approval.",
    },
  ]);

  console.log("Seeded founding workspace demo data.");
}

void main().catch((error) => {
  const missingRelationCode = "42P01";
  const databaseErrorCode =
    error && typeof error === "object" && "cause" in error && error.cause && typeof error.cause === "object" && "code" in error.cause
      ? String(error.cause.code)
      : undefined;

  if (databaseErrorCode === missingRelationCode) {
    console.error(
      "Database tables are missing. Run `pnpm db:push` first, then run `pnpm db:seed` again.",
    );
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});
