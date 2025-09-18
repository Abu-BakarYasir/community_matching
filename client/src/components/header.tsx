// import { useState, useEffect, useRef } from "react";
// import { ChevronDown } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { apiRequest, queryClient } from "@/lib/queryClient";
// import { useLocation } from "wouter";

// export function Header() {
//   const [, setLocation] = useLocation();

//   const { data: user } = useQuery({
//     queryKey: ["/api/auth/me"],
//     queryFn: () => apiRequest("GET", "/api/auth/me"),
//   });

//   const { data: orgs = [], isLoading: isOrgsLoading } = useQuery({
//     queryKey: ["/api/my-organizations"],
//     queryFn: () => apiRequest("GET", "/api/my-organizations"),
//     select: (res) => res?.organizations ?? [],
//     enabled: !!user,
//   });

//   const [selectedOrgId, setSelectedOrgId] = useState<number | undefined>();
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (orgs.length && selectedOrgId === undefined) {
//       setSelectedOrgId(orgs[0].id);
//     }
//   }, [orgs, selectedOrgId]);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handler = (e: MouseEvent) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(e.target as Node)
//       ) {
//         setDropdownOpen(false);
//       }
//     };
//     if (dropdownOpen) {
//       document.addEventListener("mousedown", handler);
//     }
//     return () => document.removeEventListener("mousedown", handler);
//   }, [dropdownOpen]);

//   const logoutMutation = useMutation({
//     mutationFn: () => apiRequest("POST", "/api/auth/logout"),
//     onSuccess: () => {
//       queryClient.clear();
//       window.location.href = "/";
//     },
//     onError: () => {
//       queryClient.clear();
//       window.location.href = "/";
//     },
//   });

//   const getInitials = (first: string, last: string) =>
//     `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

//   if (!user) return null;

//   return (
//     <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center h-16">
//           {/*  Organization Switcher */}
//           <div ref={dropdownRef} className="flex items-center">
//             {isOrgsLoading ? (
//               <span className="text-2xl font-bold text-slate-600">
//                 Loading…
//               </span>
//             ) : (
//               <>
//                 <span
//                   className="text-2xl font-bold cursor-pointer text-blue-600 hover:text-blue-800"
//                   onClick={() => setLocation("/dashboard")}
//                 >
//                   {orgs.find((o) => o.id === selectedOrgId)?.name ??
//                     orgs[0]?.name ??
//                     "Community"}
//                 </span>
//                 <button
//                   className="ml-1 p-1 hover:bg-blue-100 rounded"
//                   onClick={() => setDropdownOpen((open) => !open)}
//                 >
//                   <ChevronDown
//                     className={`h-5 w-5 text-blue-600 transition-transform ${
//                       dropdownOpen ? "rotate-180" : ""
//                     }`}
//                   />
//                 </button>
//                 {dropdownOpen && (
//                   <ul className="absolute top-full left-0 mt-1 w-72 bg-white border rounded shadow-lg z-50 ml-[8%]">
//                     {orgs.map((org) => (
//                       <li
//                         key={org.id}
//                         className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${
//                           org.id === selectedOrgId
//                             ? "font-semibold bg-blue-50"
//                             : ""
//                         }`}
//                         onClick={() => {
//                           setSelectedOrgId(org.id);
//                           setDropdownOpen(false);
//                         }}
//                       >
//                         {org.name}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </>
//             )}
//           </div>

//           {/*  User & Navigation (exactly as before) */}
//           <div className="flex items-center space-x-4">
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button
//                   variant="ghost"
//                   className="flex items-center space-x-3 h-auto p-2"
//                 >
//                   <Avatar className="h-8 w-8">
//                     <AvatarFallback className="text-xs bg-blue-500 text-white">
//                       {getInitials(user.firstName, user.lastName)}
//                     </AvatarFallback>
//                   </Avatar>
//                   <span className="text-sm font-medium text-slate-700">
//                     {user.firstName} {user.lastName}
//                   </span>
//                   <ChevronDown className="h-4 w-4 text-slate-400" />
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end" className="w-48">
//                 <DropdownMenuItem onClick={() => setLocation("/profile")}>
//                   Edit Profile
//                 </DropdownMenuItem>
//                 <DropdownMenuItem onClick={() => setLocation("/dashboard")}>
//                   Dashboard
//                 </DropdownMenuItem>
//                 {user?.isAdmin && (
//                   <DropdownMenuItem onClick={() => setLocation("/admin")}>
//                     Community Admin
//                   </DropdownMenuItem>
//                 )}
//                 {user?.isSuperAdmin && (
//                   <DropdownMenuItem onClick={() => setLocation("/super-admin")}>
//                     Super Admin
//                   </DropdownMenuItem>
//                 )}
//                 {user?.isSuperAdmin && (
//                   <DropdownMenuItem onClick={() => setLocation("/test-roles")}>
//                     Test Roles
//                   </DropdownMenuItem>
//                 )}
//                 {user?.isSuperAdmin && (
//                   <DropdownMenuItem
//                     onClick={() => setLocation("/create-community")}
//                   >
//                     Create Community
//                   </DropdownMenuItem>
//                 )}
//                 <DropdownMenuItem
//                   onClick={() => logoutMutation.mutate()}
//                   className="text-red-600"
//                 >
//                   Logout
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// }

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

type Org = {
  id: number;
  name: string;
  is_admin?: boolean;
};

type User = {
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  organizationId?: number;
  avatarUrl?: string;
};

export function Header() {
  const [, setLocation] = useLocation();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: () => apiRequest("GET", "/api/auth/me"),
    // keep previous so UI doesn't flicker/disable during refetch
    placeholderData: (prev) => prev,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });

  const {
    data: orgs = [],
    isLoading: isOrgsLoading,
    isFetching: isOrgsFetching,
  } = useQuery<Org[]>({
    queryKey: ["/api/my-organizations"],
    queryFn: () => apiRequest("GET", "/api/my-organizations"),
    select: (res) => res?.organizations ?? [],
    enabled: !!user,
    placeholderData: (prev) => prev,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });

  const [selectedOrgId, setSelectedOrgId] = useState<number | undefined>();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize from server or first org
  useEffect(() => {
    if (user?.organizationId) {
      setSelectedOrgId(user.organizationId);
    } else if (selectedOrgId === undefined && orgs.length) {
      setSelectedOrgId(orgs[0].id);
    }
  }, [user?.organizationId, orgs, selectedOrgId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // Logout
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/";
    },
    onError: () => {
      queryClient.clear();
      window.location.href = "/";
    },
  });

  // Change organization
  const changeOrgMutation = useMutation({
    mutationFn: (vars: { organization_id: number; is_admin?: boolean }) =>
      apiRequest("PUT", "/change/organization", vars),

    onMutate: async (vars) => {
      // Optimistic UI
      setSelectedOrgId(vars.organization_id);
      setDropdownOpen(false);

      await queryClient.cancelQueries({ queryKey: ["/api/auth/me"] });
      const prevUser = queryClient.getQueryData<User>(["/api/auth/me"]);

      queryClient.setQueryData<User>(["/api/auth/me"], (u) =>
        u
          ? {
              ...u,
              organizationId: vars.organization_id,
              isAdmin: vars.is_admin ?? u.isAdmin,
            }
          : u,
      );

      return { prevUser };
    },

    onSuccess: (data: { user: User }) => {
      // Trust server
      if (data?.user) {
        queryClient.setQueryData(["/api/auth/me"], data.user);
      }
      // Optional: refresh orgs cache
      queryClient.invalidateQueries({ queryKey: ["/api/my-organizations"] });

      // Hard reload so the entire app reflects the new org (your request)
      // This avoids any stale derived state across pages.
      window.location.reload();
    },

    onError: (_err, _vars, ctx) => {
      // Rollback
      if (ctx?.prevUser) {
        queryClient.setQueryData(["/api/auth/me"], ctx.prevUser);
        setSelectedOrgId(ctx.prevUser.organizationId);
      }
    },

    onSettled: () => {
      // Ensure caches are fresh if we didn't reload (e.g., error path)
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const getInitials = (first?: string, last?: string) =>
    `${(first?.[0] ?? "").toUpperCase()}${(last?.[0] ?? "").toUpperCase()}` ||
    "U";

  if (!user) return null;

  const currentOrgName =
    orgs.find((o) => o.id === selectedOrgId)?.name ??
    orgs[0]?.name ??
    "Community";

  // Only disable the toggle while a switch is in-flight.
  // Do NOT disable during background refetches; that caused the “stuck disabled” feel.
  const switching = changeOrgMutation.isPending;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Organization Switcher */}
          <div ref={dropdownRef} className="flex items-center relative">
            {isOrgsLoading ? (
              <span className="text-2xl font-bold text-slate-600">
                Loading…
              </span>
            ) : (
              <>
                <span
                  className={`text-2xl font-bold cursor-pointer ${
                    switching
                      ? "text-slate-400"
                      : "text-blue-600 hover:text-blue-800"
                  }`}
                  onClick={() => !switching && setLocation("/dashboard")}
                  aria-busy={switching}
                >
                  {currentOrgName}
                  {switching && (
                    <span className="ml-2 text-sm">(switching…)</span>
                  )}
                </span>

                <button
                  className="ml-1 p-1 hover:bg-blue-100 rounded disabled:opacity-50"
                  onClick={() => setDropdownOpen((open) => !open)}
                  disabled={switching /* keep usable even if orgs refetch */}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOpen}
                  aria-label="Change organization"
                >
                  <ChevronDown
                    className={`h-5 w-5 text-blue-600 transition-transform ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <ul
                    role="listbox"
                    className="absolute top-full left-0 mt-1 w-72 bg-white border rounded shadow-lg z-50 ml-[8%] max-h-80 overflow-auto"
                  >
                    {orgs.map((org) => {
                      const active = org.id === selectedOrgId;
                      return (
                        <li
                          key={org.id}
                          role="option"
                          aria-selected={active}
                          className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${
                            active ? "font-semibold bg-blue-50" : ""
                          }`}
                          onClick={() => {
                            setDropdownOpen(false);
                            if (org.id !== selectedOrgId) {
                              changeOrgMutation.mutate({
                                organization_id: org.id,
                                is_admin: org.is_admin, // safe to omit if backend doesn't use it
                              });
                            }
                          }}
                        >
                          {org.name}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* User & Navigation */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-3 h-auto p-2"
                >
                  <Avatar className="h-8 w-8">
                    {user.avatarUrl ? (
                      <AvatarImage
                        src={user.avatarUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                      />
                    ) : (
                      <AvatarFallback className="text-xs bg-blue-500 text-white">
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-sm font-medium text-slate-700">
                    {user.firstName} {user.lastName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setLocation("/profile")}>
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/dashboard")}>
                  Dashboard
                </DropdownMenuItem>
                {user?.isAdmin && (
                  <DropdownMenuItem onClick={() => setLocation("/admin")}>
                    Community Admin
                  </DropdownMenuItem>
                )}
                {user?.isSuperAdmin && (
                  <DropdownMenuItem onClick={() => setLocation("/super-admin")}>
                    Super Admin
                  </DropdownMenuItem>
                )}
                {user?.isSuperAdmin && (
                  <DropdownMenuItem onClick={() => setLocation("/test-roles")}>
                    Test Roles
                  </DropdownMenuItem>
                )}
                {user?.isSuperAdmin && (
                  <DropdownMenuItem
                    onClick={() => setLocation("/create-community")}
                  >
                    Create Community
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  className="text-red-600"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
