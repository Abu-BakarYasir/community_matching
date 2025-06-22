import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Replit Auth uses session-based authentication, no tokens needed

// Export setAuthToken for compatibility (no-op for session-based auth)
export function setAuthToken(token: string | null) {
  // No-op for session-based authentication
  console.log('setAuthToken called but using session-based auth');
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Use session cookies for Replit Auth
  });

  await throwIfResNotOk(res);
  
  // Check if response has content before trying to parse JSON
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const text = await res.text();
    if (text.trim()) {
      return JSON.parse(text);
    }
    return null;
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include", // Use session cookies for Replit Auth
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await res.text();
      if (text.trim()) {
        return JSON.parse(text);
      }
      return null;
    }
    return await res.text();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable refetch on focus for auth state
      staleTime: 0, // Don't cache auth state
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
