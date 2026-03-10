"use client";

import { useEffect, useMemo, useState } from "react";

type MessageResponse = {
  error?: string;
  message?: {
    id: string;
    status: string;
  };
  inviteUrl?: string;
};

type SearchUser = {
  id: string;
  name: string;
  username?: string | null;
  email: string;
};

type ContactItem = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  linkedUser?: SearchUser | null;
};

type TemplateItem = {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: string;
};

type BrowserContact = {
  name?: string[];
  email?: string[];
  tel?: string[];
};

type ContactsManager = {
  select: (
    properties: Array<"name" | "email" | "tel">,
    options?: { multiple?: boolean },
  ) => Promise<BrowserContact[]>;
};

type NavigatorWithContacts = Navigator & {
  contacts?: ContactsManager;
};

type DeliveryMode = "now" | "schedule";

type NewMessageFormProps = {
  initialRecipient?: SearchUser | null;
  initialReplyToId?: string;
};

function toIsoDate(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

export function NewMessageForm({ initialRecipient, initialReplyToId }: NewMessageFormProps) {
  const [query, setQuery] = useState(initialRecipient?.username ? `@${initialRecipient.username}` : initialRecipient?.name ?? "");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<SearchUser | null>(initialRecipient ?? null);
  const [replyToId, setReplyToId] = useState(initialReplyToId ?? "");

  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [importingContacts, setImportingContacts] = useState(false);

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const [bodyText, setBodyText] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("now");
  const [scheduledFor, setScheduledFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const availableTemplates = useMemo(() => {
    if (selectedCategory === "all") {
      return templates;
    }

    return templates.filter((template) => template.category === selectedCategory);
  }, [templates, selectedCategory]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [templatesResponse, contactsResponse] = await Promise.all([
          fetch("/api/templates"),
          fetch("/api/contacts"),
        ]);

        if (templatesResponse.ok) {
          const templatesResult = (await templatesResponse.json()) as {
            categories: string[];
            items: TemplateItem[];
          };
          setTemplates(templatesResult.items ?? []);
          setCategories(templatesResult.categories ?? []);
        }

        if (contactsResponse.ok) {
          const contactsResult = (await contactsResponse.json()) as { items: ContactItem[] };
          setContacts(contactsResult.items ?? []);
        }
      } catch {
        // no-op: non-critical data, form still works via user search.
      } finally {
        setLoadingContacts(false);
      }
    };

    void fetchInitialData();
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
        if (!response.ok) return;

        const result = (await response.json()) as { items: SearchUser[] };
        setSearchResults(result.items ?? []);
      } catch {
        setSearchResults([]);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleChooseTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);

    const template = templates.find((item) => item.id === templateId);
    if (template) {
      setBodyText(template.body);
    }
  };

  const loadContacts = async () => {
    const response = await fetch("/api/contacts");
    if (!response.ok) return;

    const result = (await response.json()) as { items: ContactItem[] };
    setContacts(result.items ?? []);
  };

  const importPhoneContacts = async () => {
    setError(null);

    const nav = navigator as NavigatorWithContacts;
    if (!nav.contacts || typeof nav.contacts.select !== "function") {
      setError(
        "Tu navegador no permite importar contactos automaticamente. En movil Android con Chrome suele funcionar.",
      );
      return;
    }

    setImportingContacts(true);

    try {
      const selected = await nav.contacts.select(["name", "email", "tel"], { multiple: true });
      if (!selected || selected.length === 0) {
        setImportingContacts(false);
        return;
      }

      const payload = {
        contacts: selected.map((item) => ({
          name: item.name?.[0] ?? null,
          email: item.email?.[0] ?? null,
          phone: item.tel?.[0] ?? null,
        })),
      };

      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "No se pudieron importar contactos.");
      }

      await loadContacts();
      setSuccess("Contactos importados correctamente.");
    } catch (contactError) {
      const message = contactError instanceof Error ? contactError.message : "Error importando contactos.";
      setError(message);
    } finally {
      setImportingContacts(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedRecipient) {
      setError("Selecciona una persona para enviar el mensaje.");
      return;
    }

    if (bodyText.trim().length < 5) {
      setError("El mensaje debe tener al menos 5 caracteres.");
      return;
    }

    const scheduledIso = deliveryMode === "schedule" ? toIsoDate(scheduledFor) : undefined;

    if (deliveryMode === "schedule" && !scheduledIso) {
      setError("Selecciona una fecha y hora validas para programar.");
      return;
    }

    setLoading(true);

    const payload = {
      recipientId: selectedRecipient.id,
      templateId: selectedTemplateId || undefined,
      inReplyToId: replyToId || undefined,
      body: bodyText.trim(),
      scheduledFor: scheduledIso,
    };

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as MessageResponse;

      if (!response.ok) {
        setError(result.error ?? "No se pudo enviar el mensaje.");
        setLoading(false);
        return;
      }

      const inviteText = result.inviteUrl ? ` Enlace: ${result.inviteUrl}` : "";
      const wasScheduled = result.message?.status === "SCHEDULED";
      setSuccess(
        wasScheduled
          ? `Mensaje programado correctamente.${inviteText}`
          : `Mensaje enviado correctamente.${inviteText}`,
      );

      setBodyText("");
      setScheduledFor("");
      setDeliveryMode("now");
      setSelectedTemplateId("");
      setReplyToId("");
      setLoading(false);
    } catch {
      setError("Error de red. Intentalo de nuevo.");
      setLoading(false);
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="recipient-search-box">
        <label className="label" htmlFor="recipientSearch">
          Buscar persona (nombre, email o @username)
          <input
            className="input"
            id="recipientSearch"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ej: ana, @ana o ana@email.com"
            type="text"
            value={query}
          />
        </label>

        {selectedRecipient ? (
          <div className="selected-recipient">
            <strong>
              Destinatario: {selectedRecipient.name}
              {selectedRecipient.username ? ` (@${selectedRecipient.username})` : ""}
            </strong>
            <button
              className="button button-ghost"
              onClick={() => {
                setSelectedRecipient(null);
                setReplyToId("");
              }}
              type="button"
            >
              Cambiar
            </button>
          </div>
        ) : null}

        {replyToId ? (
          <p className="message-meta">Esta accion cuenta como respuesta directa y suma mas al medidor.</p>
        ) : null}

        {searchResults.length > 0 ? (
          <div className="search-results-list">
            {searchResults.map((user) => (
              <button
                className="search-result-item"
                key={user.id}
                onClick={() => {
                  setSelectedRecipient(user);
                  setSearchResults([]);
                  setQuery(user.username ? `@${user.username}` : user.email);
                  setReplyToId("");
                }}
                type="button"
              >
                <strong>{user.name}</strong>
                <span className="message-meta">
                  {user.username ? `@${user.username} • ` : ""}
                  {user.email}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <section className="card" style={{ padding: "1rem", display: "grid", gap: "0.8rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem", flexWrap: "wrap" }}>
          <h3 style={{ fontSize: "1rem" }}>Contactos del telefono</h3>
          <button
            className="button button-secondary"
            disabled={importingContacts}
            onClick={importPhoneContacts}
            type="button"
          >
            {importingContacts ? "Importando..." : "Importar contactos"}
          </button>
        </div>
        <p className="message-meta">
          Nota: por privacidad del sistema, la importacion automatica depende del navegador y requiere permiso.
        </p>
        {loadingContacts ? (
          <p className="message-meta">Cargando contactos...</p>
        ) : contacts.length === 0 ? (
          <p className="message-meta">No hay contactos importados aun.</p>
        ) : (
          <div className="contacts-list">
            {contacts.slice(0, 8).map((contact) => (
              <button
                className="contact-item"
                key={contact.id}
                onClick={() => {
                  if (contact.linkedUser) {
                    setSelectedRecipient(contact.linkedUser);
                    setQuery(
                      contact.linkedUser.username
                        ? `@${contact.linkedUser.username}`
                        : contact.linkedUser.email,
                    );
                    setReplyToId("");
                  }
                }}
                type="button"
              >
                <strong>{contact.name}</strong>
                <span className="message-meta">
                  {contact.linkedUser
                    ? `Disponible en app: ${contact.linkedUser.name}${contact.linkedUser.username ? ` (@${contact.linkedUser.username})` : ""}`
                    : contact.email ?? contact.phone ?? "Sin email o telefono"}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <div style={{ display: "grid", gap: "0.8rem" }}>
        <label className="label" htmlFor="templateCategory">
          Categoria de mensaje predefinido
          <select
            id="templateCategory"
            onChange={(event) => setSelectedCategory(event.target.value)}
            value={selectedCategory}
          >
            <option value="all">Todas</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="label" htmlFor="templateId">
          Plantilla positiva / mindfulness
          <select
            id="templateId"
            onChange={(event) => handleChooseTemplate(event.target.value)}
            value={selectedTemplateId}
          >
            <option value="">Sin plantilla (escribir manual)</option>
            {availableTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title} - {template.category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="label" htmlFor="body">
        Mensaje
        <textarea
          id="body"
          name="body"
          onChange={(event) => setBodyText(event.target.value)}
          placeholder="Escribe un mensaje de apoyo o usa una plantilla"
          required
          rows={6}
          value={bodyText}
        />
      </label>

      <section className="card" style={{ padding: "1rem", display: "grid", gap: "0.8rem" }}>
        <p style={{ fontWeight: 700 }}>Momento del envio</p>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            className={`button ${deliveryMode === "now" ? "button-primary" : "button-secondary"}`}
            onClick={() => {
              setDeliveryMode("now");
              setScheduledFor("");
            }}
            type="button"
          >
            Enviar ahora
          </button>

          <button
            className={`button ${deliveryMode === "schedule" ? "button-primary" : "button-secondary"}`}
            onClick={() => setDeliveryMode("schedule")}
            type="button"
          >
            Programar
          </button>
        </div>

        {deliveryMode === "schedule" ? (
          <label className="label" htmlFor="scheduledFor">
            Fecha y hora
            <input
              className="input"
              id="scheduledFor"
              name="scheduledFor"
              onChange={(event) => setScheduledFor(event.target.value)}
              type="datetime-local"
              value={scheduledFor}
            />
          </label>
        ) : (
          <p className="message-meta">El mensaje se enviara inmediatamente al pulsar el boton.</p>
        )}
      </section>

      {error ? <p className="alert alert-error">{error}</p> : null}
      {success ? <p className="alert alert-success">{success}</p> : null}

      <button className="button button-primary" disabled={loading} type="submit">
        {loading ? "Guardando..." : deliveryMode === "schedule" ? "Programar mensaje" : "Enviar ahora"}
      </button>
    </form>
  );
}