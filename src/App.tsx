import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Ticket,
  TicketStatus,
  ticketApi,
} from "./api/ticketApi";

type Filter = "All" | TicketStatus;

const STATUSES: TicketStatus[] = ["Open", "Done"];

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("All");

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editStatus, setEditStatus] = useState<TicketStatus>("Open");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTickets(await ticketApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const fail = (err: unknown) =>
    setError(err instanceof Error ? err.message : "Something went wrong");

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !details.trim()) {
      setError("Title and details are required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await ticketApi.create({ title: title.trim(), details: details.trim() });
      setTitle("");
      setDetails("");
      setNotice("Ticket created");
      await load();
    } catch (err) {
      fail(err);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (ticket: Ticket) => {
    setEditingId(ticket.id);
    setEditTitle(ticket.title);
    setEditDetails(ticket.details);
    setEditStatus(ticket.status);
    setError(null);
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (editingId === null) return;
    if (!editTitle.trim() || !editDetails.trim()) {
      setError("Title and details are required");
      return;
    }
    setError(null);
    try {
      await ticketApi.update(editingId, {
        title: editTitle.trim(),
        details: editDetails.trim(),
        status: editStatus,
      });
      setEditingId(null);
      setNotice("Ticket updated");
      await load();
    } catch (err) {
      fail(err);
    }
  };

  const removeTicket = async (id: number) => {
    setError(null);
    try {
      await ticketApi.remove(id);
      if (editingId === id) setEditingId(null);
      setNotice("Ticket deleted");
      await load();
    } catch (err) {
      fail(err);
    }
  };

  const toggleStatus = async (ticket: Ticket) => {
    setError(null);
    try {
      await ticketApi.update(ticket.id, {
        title: ticket.title,
        details: ticket.details,
        status: ticket.status === "Open" ? "Done" : "Open",
      });
      await load();
    } catch (err) {
      fail(err);
    }
  };

  const visible = tickets.filter((t) => filter === "All" || t.status === filter);
  const openCount = tickets.filter((t) => t.status === "Open").length;

  return (
    <div className="page">
      <header className="header">
        <h1>Ticket Desk</h1>
        <p>
          {tickets.length} ticket{tickets.length === 1 ? "" : "s"} total &middot;{" "}
          {openCount} open
        </p>
      </header>

      {error && (
        <div className="banner error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="banner success" role="status">
          {notice}
        </div>
      )}

      <section className="card">
        <h2>New ticket</h2>
        <form onSubmit={handleCreate} className="stack">
          <label>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary"
              maxLength={200}
            />
          </label>
          <label>
            Details
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder="Describe the issue"
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create ticket"}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="row space-between">
          <h2>Tickets</h2>
          <div className="filters">
            {(["All", ...STATUSES] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={filter === f ? "chip active" : "chip"}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="muted">Loading tickets...</p>}

        {!loading && visible.length === 0 && (
          <p className="muted">No tickets here.</p>
        )}

        <ul className="list">
          {visible.map((ticket) => (
            <li key={ticket.id} className="ticket">
              {editingId === ticket.id ? (
                <form onSubmit={saveEdit} className="stack">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    maxLength={200}
                  />
                  <textarea
                    value={editDetails}
                    onChange={(e) => setEditDetails(e.target.value)}
                    rows={4}
                  />
                  <div className="row space-between">
                    <select
                      value={editStatus}
                      onChange={(e) =>
                        setEditStatus(e.target.value as TicketStatus)
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <div className="row">
                      <button type="submit" className="primary">
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <>
                  <div className="row space-between">
                    <h3>{ticket.title}</h3>
                    <span className={`badge ${ticket.status.toLowerCase()}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="details">{ticket.details}</p>
                  <div className="row actions">
                    <button type="button" onClick={() => startEdit(ticket)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="primary"
                      onClick={() => void toggleStatus(ticket)}
                    >
                      {ticket.status === "Open" ? "Mark done" : "Reopen"}
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => void removeTicket(ticket.id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
