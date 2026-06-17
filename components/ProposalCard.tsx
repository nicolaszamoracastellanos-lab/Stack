"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { useLanguage } from "@/lib/language-context";
import { approveProposal, rejectProposal } from "@/lib/pact-actions";
import type { ProposalView } from "@/lib/group-detail";

/**
 * A pending rule-change proposal (Batch 4 §5), surfaced prominently on the group
 * page. Every member must approve before the change applies; any rejection keeps
 * the current rules. Shows live status ("3 of 4 approved, waiting on Oscar").
 */
export function ProposalCard({ proposal }: { proposal: ProposalView }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [working, setWorking] = useState(false);

  async function act(kind: "approve" | "reject") {
    setWorking(true);
    if (kind === "approve") await approveProposal(proposal.id);
    else await rejectProposal(proposal.id);
    router.refresh();
  }

  return (
    <section className="rounded-card border border-volt/40 bg-volt/5 p-5">
      <p className="text-caption font-medium uppercase tracking-wide text-volt">
        {t("proposal_label")}
      </p>
      <p className="mt-2 text-label text-text-muted">
        {t("proposal_by", { name: proposal.proposerName })}
      </p>
      {proposal.summary && (
        <p className="mt-1 text-body font-medium text-text">{proposal.summary}</p>
      )}

      <p className="mt-3 text-label text-text">
        {t("proposal_status", {
          approved: proposal.approvedCount,
          total: proposal.memberCount,
        })}
        {proposal.waitingNames.length > 0 && (
          <span className="text-text-muted">
            {" · "}
            {t("proposal_waiting", { names: proposal.waitingNames.join(", ") })}
          </span>
        )}
      </p>

      {proposal.hasApproved ? (
        <p className="mt-3 text-label text-volt">{t("proposal_you_approved")}</p>
      ) : (
        <div className="mt-4 flex gap-3">
          <Button variant="primary" fullWidth onClick={() => act("approve")} disabled={working}>
            {t("proposal_approve")}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => act("reject")} disabled={working}>
            {t("proposal_reject")}
          </Button>
        </div>
      )}
    </section>
  );
}
