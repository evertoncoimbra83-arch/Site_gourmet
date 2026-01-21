import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Page 1", path: "/" },
  { icon: Users, label: "Page 2", path: "/some-path" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
          <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="flex flex-col items-center gap-6">
              <img
                src={APP_LOGO}
                alt={APP_TITLE}
                className="h-20 w-20 rounded-2xl object-cover ring-1 ring-border"
              />
              <div className="text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {APP_TITLE}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Please sign in to continue
                </p>
              </div>
              <Button
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
                size="lg"
                className="w-full"
              >
                Sign in
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find((item) => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      {/* SIDEBAR WRAPPER */}
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          disableTransition={isResizing}
          className="border-r-0 bg-background"
        >
          {/* Sidebar surface (card-like) */}
          <div className="m-2 rounded-2xl border border-border bg-card shadow-sm">
            <SidebarHeader className="h-16 justify-center border-b border-border/60">
              <div className="flex w-full items-center gap-3 px-3 group-data-[collapsible=icon]:px-2 transition-all">
                {isCollapsed ? (
                  <div className="relative h-9 w-9 shrink-0">
                    <img
                      src={APP_LOGO}
                      className="h-9 w-9 rounded-xl object-cover ring-1 ring-border"
                      alt="Logo"
                    />
                    <button
                      onClick={toggleSidebar}
                      className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70 opacity-0 backdrop-blur transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <PanelLeft className="h-4 w-4 text-foreground" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={APP_LOGO}
                        className="h-9 w-9 rounded-xl object-cover ring-1 ring-border shrink-0"
                        alt="Logo"
                      />
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-semibold tracking-tight">
                          {APP_TITLE}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          Painel
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={toggleSidebar}
                      className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                      aria-label="Collapse sidebar"
                    >
                      <PanelLeft className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </>
                )}
              </div>
            </SidebarHeader>

            <SidebarContent className="gap-0">
              <SidebarMenu className="px-2 py-2">
                {menuItems.map((item) => {
                  const isActive = location === item.path;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setLocation(item.path)}
                        tooltip={item.label}
                        className={[
                          "h-10 rounded-xl px-3",
                          "transition-colors font-normal",
                          "hover:bg-muted",
                          isActive
                            ? "bg-secondary text-secondary-foreground hover:bg-secondary"
                            : "",
                        ].join(" ")}
                      >
                        <item.icon
                          className={[
                            "h-4 w-4",
                            isActive ? "text-primary" : "text-muted-foreground",
                          ].join(" ")}
                        />
                        <span className="truncate">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="border-t border-border/60 p-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-muted transition-colors group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="h-9 w-9 border shrink-0">
                      <AvatarFallback className="text-xs font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                      <p className="truncate text-sm font-medium leading-none">
                        {user?.name || "-"}
                      </p>
                      <p className="mt-1.5 truncate text-xs text-muted-foreground">
                        {user?.email || "-"}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarFooter>
          </div>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={[
            "absolute top-0 right-0 h-full w-1 cursor-col-resize",
            "hover:bg-primary/15 transition-colors",
            isCollapsed ? "hidden" : "",
          ].join(" ")}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      {/* MAIN */}
      <SidebarInset className="bg-background">
        {/* Mobile topbar */}
        {isMobile && (
          <div className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="h-9 w-9 rounded-xl" />
                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium tracking-tight">
                    {activeMenuItem?.label ?? APP_TITLE}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {APP_TITLE}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content area with consistent container */}
        <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
          <div className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </>
  );
}
