"use client";

import { useState } from "react";
import { updateUserName, updateUserRole } from "@/app/admin/(dashboard)/usuarios/actions";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDateTime } from "@/lib/utils/date";
import type { Profile, StaffRole } from "@/lib/types";

const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Administrador",
  caixa: "Atendente/Caixa",
  cozinha: "Cozinha",
};

function UserRow({ profile, currentUserId }: { profile: Profile; currentUserId: string }) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [role, setRole] = useState<StaffRole>((profile.role as StaffRole) ?? "caixa");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRoleChange(newRole: StaffRole) {
    setRole(newRole);
    setPending(true);
    setError(null);
    const result = await updateUserRole(profile.id, newRole);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  async function handleNameBlur() {
    if (fullName === (profile.full_name ?? "")) return;
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("full_name", fullName);
    const result = await updateUserName(profile.id, undefined, formData);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 p-4 last:border-0">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onBlur={handleNameBlur}
          placeholder="Nome do funcionário"
          className="max-w-56"
        />
        {profile.id === currentUserId && <Badge tone="muted">Você</Badge>}
      </div>
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-brand">{error}</span>}
        <Select
          value={role}
          disabled={pending}
          onChange={(e) => handleRoleChange(e.target.value as StaffRole)}
          className="w-44"
        >
          {(Object.keys(ROLE_LABELS) as StaffRole[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </div>
      <span className="w-full text-xs text-ink-soft md:w-auto">
        Desde {formatDateTime(profile.created_at)}
      </span>
    </div>
  );
}

export function UsersList({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl uppercase tracking-wide text-ink">Usuários</h1>

      <p className="text-sm text-ink-soft">
        Para criar um novo usuário, adicione-o em Supabase → Authentication → Users
        e depois defina o nome e o papel dele aqui.
      </p>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink/10">
        {profiles.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink-soft">Nenhum usuário encontrado.</p>
        ) : (
          profiles.map((profile) => (
            <UserRow key={profile.id} profile={profile} currentUserId={currentUserId} />
          ))
        )}
      </div>
    </div>
  );
}
