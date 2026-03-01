"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronRight, Search } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getGroupCurrency } from "@/lib/constants";
import { formatAmount } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { toast, ToastContainer } from "@/components/ui/Toast";
import GroupModal from "@/components/group/GroupModal";
import type { Group } from "@/types";

export default function GroupsPage() {
  const router = useRouter();
  const { groups, isLoadingGroups, walletAddress, fetchGroups, getUserBalance } = useStore();
  const [modal, setModal] = useState<"create" | "join" | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { if (walletAddress) fetchGroups(); }, [walletAddress, fetchGroups]);

  const filtered = groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Groups</h1>
          <p style={{ color: "var(--text-secondary)" }}>{groups.length} group{groups.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={() => setModal("join")}>Join</Button>
          <Button onClick={() => setModal("create")}><Plus size={15} /> New Group</Button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
        <input className="input" style={{ paddingLeft: 40 }} placeholder="Search groups…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoadingGroups ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: 6 }}>{search ? "No matches" : "No groups yet"}</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 24 }}>
            {search ? "Try a different search term." : "Create or join a group to get started."}
          </p>
          {!search && <Button onClick={() => setModal("create")}><Plus size={16} /> Create a Group</Button>}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
          {filtered.map((group) => {
            const balance = getUserBalance(group.id);
            const currency = getGroupCurrency(group.type);
            return (
              <div key={group.id} className="card card-interactive" onClick={() => router.push(`/group/${group.id}`)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px" }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--bg-interactive)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{group.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{group.name}</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{group.member_count ?? 1} member{(group.member_count ?? 1) !== 1 ? "s" : ""}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div className="font-mono-nums" style={{ fontWeight: 700, fontSize: "0.9375rem", color: balance > 0 ? "var(--accent-green)" : balance < 0 ? "var(--error)" : "var(--text-tertiary)" }}>
                    {balance !== 0 ? `${balance > 0 ? "+" : ""}${formatAmount(Math.abs(balance))} ${currency}` : "Settled"}
                  </div>
                  <ChevronRight size={14} color="var(--text-tertiary)" style={{ marginTop: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && <GroupModal mode={modal} onClose={() => setModal(null)} onSuccess={(g) => { setModal(null); toast(`"${g.name}" ready!`, "success"); router.push(`/group/${g.id}`); }} />}
      <ToastContainer />
    </div>
  );
}
