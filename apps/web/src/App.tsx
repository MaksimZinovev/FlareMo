import {
  ApiError,
  createMemo,
  getAuthStatus,
  getStoredAccessToken,
  hardDeleteMemo,
  listMemos,
  storeAccessToken,
  trashMemo,
  updateMemo,
} from "@/api";
import { FlareMoSidebar, type MemoView as ViewMode } from "@/components/flaremo-sidebar";
import { MemoComposer } from "@/components/memo-composer";
import { MemoList } from "@/components/memo-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAllTags } from "@/lib/memo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { KeyRoundIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function FlareMoApp() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>("all");
  const [activeTag, setActiveTag] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [accessToken, setAccessToken] = useState(getStoredAccessToken);
  const [tokenInput, setTokenInput] = useState(accessToken);

  const authStatusQuery = useQuery({
    queryKey: ["auth-status"],
    queryFn: getAuthStatus,
  });
  const tokenRequired = authStatusQuery.data?.access_token_required ?? false;
  const canLoadMemos = authStatusQuery.isSuccess && (!tokenRequired || Boolean(accessToken));
  const normalMemosQuery = useQuery({
    enabled: canLoadMemos,
    queryKey: ["memos", "normal", accessToken],
    queryFn: () => listMemos({ state: "normal" }),
  });
  const trashedMemosQuery = useQuery({
    enabled: canLoadMemos,
    queryKey: ["memos", "trashed", accessToken],
    queryFn: () => listMemos({ state: "trashed", include_deleted: true }),
  });

  const invalidateMemos = () => queryClient.invalidateQueries({ queryKey: ["memos"] });
  const handleMutationError = (error: Error) => {
    if (error instanceof ApiError && error.status === 401) {
      toast.error("Access token required");
      return;
    }
    toast.error(error.message);
  };

  const createMutation = useMutation({
    mutationFn: createMemo,
    onSuccess: () => {
      toast.success("Memo saved");
      void invalidateMemos();
    },
    onError: handleMutationError,
  });

  const trashMutation = useMutation({
    mutationFn: trashMemo,
    onSuccess: () => {
      toast.success("Moved to trash");
      void invalidateMemos();
    },
    onError: handleMutationError,
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => updateMemo(id, { status: "normal" }),
    onSuccess: () => {
      toast.success("Memo restored");
      void invalidateMemos();
    },
    onError: handleMutationError,
  });

  const hardDeleteMutation = useMutation({
    mutationFn: hardDeleteMemo,
    onSuccess: () => {
      toast.success("Memo deleted");
      void invalidateMemos();
    },
    onError: handleMutationError,
  });

  const normalMemos = normalMemosQuery.data?.memos ?? [];
  const trashedMemos = trashedMemosQuery.data?.memos ?? [];
  const allTags = useMemo(() => getAllTags(normalMemos), [normalMemos]);
  const sourceMemos = view === "trashed" ? trashedMemos : normalMemos;
  const hasAuthError =
    (normalMemosQuery.error instanceof ApiError && normalMemosQuery.error.status === 401) ||
    (trashedMemosQuery.error instanceof ApiError && trashedMemosQuery.error.status === 401);
  const isLocked = authStatusQuery.isSuccess && tokenRequired && (!accessToken || hasAuthError);
  const filteredMemos = sourceMemos.filter((memo) => {
    const textMatch = query.trim() ? memo.content.toLowerCase().includes(query.trim().toLowerCase()) : true;
    const tagMatch = activeTag ? (memo.payload.tags ?? []).includes(activeTag) : true;
    return textMatch && tagMatch;
  });

  return (
    <TooltipProvider>
      <SidebarProvider>
        <FlareMoSidebar
          activeTag={activeTag}
          activeView={view}
          memoCount={normalMemos.length}
          tags={allTags}
          trashedCount={trashedMemos.length}
          onTagChange={setActiveTag}
          onViewChange={setView}
        />
        <SidebarInset>
          <div className="flex min-h-svh flex-col bg-background">
            <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
              <div className="mx-auto flex h-14 w-full max-w-4xl items-center gap-3 px-4">
                <SidebarTrigger />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-heading text-base font-semibold">Timeline</div>
                  <div className="truncate text-xs text-muted-foreground">Memos-compatible, Cloudflare-native</div>
                </div>
                <div className="relative hidden w-64 md:block">
                  <SearchIcon className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Search memos"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </div>
            </header>
            <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4">
              {isLocked ? (
                <Card className="mx-auto w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Access token</CardTitle>
                    <CardDescription>Enter the personal access token configured for this FlareMo instance.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {hasAuthError && (
                      <Alert variant="destructive">
                        <KeyRoundIcon />
                        <AlertTitle>Unauthorized</AlertTitle>
                        <AlertDescription>The token is missing or invalid.</AlertDescription>
                      </Alert>
                    )}
                    <Input
                      autoComplete="current-password"
                      placeholder="Bearer token"
                      type="password"
                      value={tokenInput}
                      onChange={(event) => setTokenInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          const nextToken = tokenInput.trim();
                          storeAccessToken(nextToken);
                          setAccessToken(nextToken);
                          void invalidateMemos();
                        }
                      }}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      disabled={!tokenInput.trim()}
                      onClick={() => {
                        const nextToken = tokenInput.trim();
                        storeAccessToken(nextToken);
                        setAccessToken(nextToken);
                        void invalidateMemos();
                      }}
                    >
                      <KeyRoundIcon data-icon="inline-start" />
                      Unlock
                    </Button>
                  </CardFooter>
                </Card>
              ) : authStatusQuery.isLoading ? (
                <MemoList isLoading memos={[]} onHardDelete={() => {}} onRestore={() => {}} onTrash={() => {}} />
              ) : (
                <>
                  <div className="relative md:hidden">
                    <SearchIcon className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      placeholder="Search memos"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>
                  {view === "all" && (
                    <MemoComposer
                      isPending={createMutation.isPending}
                      onSubmit={({ content, visibility, tags }) =>
                        createMutation.mutate({
                          content,
                          visibility,
                          payload: {
                            tags,
                          },
                          source: "web",
                        })
                      }
                    />
                  )}
                  <MemoList
                    isLoading={normalMemosQuery.isLoading || trashedMemosQuery.isLoading}
                    memos={filteredMemos}
                    onHardDelete={(id) => hardDeleteMutation.mutate(id)}
                    onRestore={(id) => restoreMutation.mutate(id)}
                    onTrash={(id) => trashMutation.mutate(id)}
                  />
                </>
              )}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  );
}

const rootRoute = createRootRoute({
  component: FlareMoApp,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
});

const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute]),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
