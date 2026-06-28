export type MemoVisibility = "private" | "protected" | "public";
export type MemoState = "normal" | "archived" | "trashed" | "deleted";

export type MemoPayload = {
  tags?: string[];
  property?: {
    title?: string;
    has_link?: boolean;
    has_task_list?: boolean;
    has_code?: boolean;
    has_incomplete_tasks?: boolean;
  };
  location?: unknown;
  client_id?: string;
  [key: string]: unknown;
};

export type Memo = {
  name: string;
  id: string;
  content: string;
  visibility: MemoVisibility;
  state: MemoState;
  pinned: boolean;
  payload: MemoPayload;
  create_time: string;
  update_time: string;
  display_time: string;
  creator: string;
};

export type ListMemosResponse = {
  memos: Memo[];
  next_page_token?: string;
};

export type CreateMemoRequest = {
  content: string;
  visibility?: MemoVisibility;
  payload?: MemoPayload;
  source?: string;
};

export type UpdateMemoRequest = Partial<{
  content: string;
  visibility: MemoVisibility;
  status: MemoState;
  pinned: boolean;
  payload: MemoPayload;
}>;

export type ListMemoParams = {
  state?: MemoState;
  q?: string;
  tag?: string;
  include_deleted?: boolean;
};

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function listMemos(params: ListMemoParams = {}) {
  const query = new URLSearchParams();
  query.set("page_size", "50");
  query.set("order_by", "created_at desc");
  if (params.state) query.set("state", params.state);
  if (params.q) query.set("q", params.q);
  if (params.tag) query.set("tag", params.tag);
  if (params.include_deleted) query.set("include_deleted", "true");

  return apiRequest<ListMemosResponse>(`/api/app/memos?${query.toString()}`);
}

export async function createMemo(input: CreateMemoRequest) {
  return apiRequest<Memo>("/api/app/memos", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateMemo(id: string, input: UpdateMemoRequest) {
  return apiRequest<Memo>(`/api/app/memos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function trashMemo(id: string) {
  return apiRequest<Memo>(`/api/app/memos/${id}`, {
    method: "DELETE",
  });
}

export async function hardDeleteMemo(id: string) {
  return apiRequest<{ ok: true }>(`/api/app/memos/${id}?hard=true`, {
    method: "DELETE",
  });
}

async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init.headers,
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    let message = response.statusText;
    if (isJson) {
      const body = (await response.json()) as { error?: { message?: string } };
      message = body.error?.message ?? message;
    }
    throw new ApiError(message, response.status);
  }

  if (!isJson) {
    throw new ApiError("Cloudflare Access session required", 401);
  }

  return (await response.json()) as T;
}
