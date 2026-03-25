"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type AuthFormProps = {
  mode: "login" | "register";
  returnTo?: string;
};

type ApiResult = {
  error?: string;
};

function getSafeReturnTo(rawReturnTo: string | null | undefined): string {
  if (!rawReturnTo || !rawReturnTo.startsWith("/")) {
    return "/dashboard";
  }

  return rawReturnTo;
}

export function AuthForm({ mode, returnTo }: AuthFormProps) {
  const router = useRouter();
  const safeReturnTo = useMemo(() => getSafeReturnTo(returnTo), [returnTo]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      phone: String(formData.get("phone") || ""),
      country: String(formData.get("country") || ""),
      city: String(formData.get("city") || ""),
    };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as ApiResult;

      if (!response.ok) {
        setError(result.error ?? "No se pudo iniciar sesion.");
        setLoading(false);
        return;
      }

      router.push(safeReturnTo);
      router.refresh();
    } catch {
      setError(
        isRegister
          ? "No se pudo crear la cuenta. Intentalo de nuevo."
          : "No se pudo iniciar sesion. Intentalo de nuevo.",
      );
      setLoading(false);
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {isRegister ? (
        <label className="label" htmlFor="name">
          Nombre
          <input className="input" id="name" name="name" required type="text" />
        </label>
      ) : null}

      <label className="label" htmlFor="email">
        Correo
        <input className="input" id="email" name="email" required type="email" />
      </label>

      <label className="label" htmlFor="password">
        Contrasena
        <input
          className="input"
          id="password"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>

      {isRegister ? (
        <div className="location-fields-grid">
          <label className="label" htmlFor="phone">
            Telefono (opcional)
            <input className="input" id="phone" name="phone" placeholder="Ej: +34 600 111 222" type="tel" />
          </label>

          <label className="label" htmlFor="country">
            Pais (opcional)
            <input className="input" id="country" name="country" placeholder="Ej: Espana" type="text" />
          </label>

          <label className="label" htmlFor="city">
            Ciudad (opcional)
            <input className="input" id="city" name="city" placeholder="Ej: Madrid" type="text" />
          </label>
        </div>
      ) : null}

      {error ? <p className="alert alert-error">{error}</p> : null}

      <button className="button button-primary" disabled={loading} type="submit">
        {loading ? "Enviando..." : isRegister ? "Crear cuenta" : "Entrar"}
      </button>

      <div className="helper-row">
        <span>{isRegister ? "Ya tienes cuenta?" : "No tienes cuenta?"}</span>
        <Link href={isRegister ? `/login?returnTo=${encodeURIComponent(safeReturnTo)}` : `/register?returnTo=${encodeURIComponent(safeReturnTo)}`}>
          {isRegister ? "Ir a login" : "Crear cuenta"}
        </Link>
      </div>
    </form>
  );
}
