"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { login, type LoginState } from "@/app/admin/login/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    undefined
  );

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10"
    >
      <div className="text-center">
        <h1 className="font-display text-xl uppercase tracking-wide text-ink">
          Esquina Pasteburguer
        </h1>
        <p className="text-sm text-ink-soft">Painel administrativo</p>
      </div>

      <Input label="E-mail" name="email" type="email" required autoFocus />
      <Input label="Senha" name="password" type="password" required />

      {state?.error && (
        <p className="text-sm text-brand" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" isLoading={pending} className="w-full">
        Entrar
      </Button>
    </form>
  );
}
