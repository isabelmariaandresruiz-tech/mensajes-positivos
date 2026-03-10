"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LocationSettingsFormProps = {
  initialCountry?: string | null;
  initialCity?: string | null;
};

type LocationApiResponse = {
  error?: string;
  message?: string;
};

export function LocationSettingsForm({ initialCountry, initialCity }: LocationSettingsFormProps) {
  const router = useRouter();
  const [country, setCountry] = useState(initialCountry ?? "");
  const [city, setCity] = useState(initialCity ?? "");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFeedback(null);

    const payload = {
      country: country.trim() || null,
      city: city.trim() || null,
    };

    try {
      const response = await fetch("/api/profile/location", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as LocationApiResponse;

      if (!response.ok) {
        setError(result.error ?? "No se pudo guardar la ubicacion.");
        setLoading(false);
        return;
      }

      setFeedback(result.message ?? "Ubicacion actualizada.");
      setLoading(false);
      router.refresh();
    } catch {
      setError("Error de red al guardar la ubicacion.");
      setLoading(false);
    }
  };

  return (
    <form className="location-settings-form" onSubmit={handleSubmit}>
      <div className="location-fields-grid">
        <label className="label" htmlFor="locationCountry">
          Pais
          <input
            className="input"
            id="locationCountry"
            maxLength={80}
            onChange={(event) => setCountry(event.target.value)}
            placeholder="Ej: Espana"
            type="text"
            value={country}
          />
        </label>

        <label className="label" htmlFor="locationCity">
          Ciudad
          <input
            className="input"
            id="locationCity"
            maxLength={80}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Ej: Madrid"
            type="text"
            value={city}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
        <button className="button button-secondary" disabled={loading} type="submit">
          {loading ? "Guardando..." : "Guardar ubicacion"}
        </button>
        {feedback ? <span className="alert alert-success">{feedback}</span> : null}
      </div>

      {error ? <p className="alert alert-error">{error}</p> : null}
    </form>
  );
}