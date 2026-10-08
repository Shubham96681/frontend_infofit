export type TicketStatus = "Open" | "Done";

export interface Ticket {
  id: number;
  title: string;
  details: string;
  status: TicketStatus;
}

export interface TicketPayload {
  title: string;
  details: string;
  status: TicketStatus;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new Error("Cannot reach the API. Is the backend running?");
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // keep default message
    }
    throw new Error(detail);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const ticketApi = {
  list: () => request<Ticket[]>("/tickets/"),

  create: (data: { title: string; details: string }) =>
    request<Ticket>("/tickets/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: TicketPayload) =>
    request<Ticket>(`/tickets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (id: number) =>
    request<{ message: string }>(`/tickets/${id}`, {
      method: "DELETE",
    }),
};
