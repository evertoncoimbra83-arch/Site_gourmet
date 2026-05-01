import React, { CSSProperties, useEffect, useRef, useState } from "react";
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
import { APP_LOGO, APP_TITLE } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Users, 
  Settings, 
  ShoppingBag, 
  Truck, 
  Palette, 
  TrendingUp 
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom"; 
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

// ✅ Menu Items atualizado com a nova rota de BI/Analytics
const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: TrendingUp, label: "BI & Analytics", path: "/admin/analytics" },
  { icon: ShoppingBag, label: "Pedidos", path: "/admin/orders" },
  { icon: Users, label: "Usuários", path: "/admin/users" },
  { icon: Truck, label: "Frete", path: "/admin/shipping" },
  { icon: Palette, label: "Aparência", path: "/admin/theme" },
  { icon: Settings, label: "Configurações", path: "/admin/settings" },
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-4xl border border-slate-100 p-10 shadow-2xl shadow-slate-200 text-center space-y-8">
          <div className="flex flex-col items-center gap-6">
            <div className="h-24 w-24 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-xl">
               <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 object-contain invert" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Acesso Restrito</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Identifique-se para gerenciar a plataforma</p>
            </div>
            <Button
              onClick={() => { window.location.href = "/admin/login"; }}
              size="lg"
              className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg border-none"
            >
              Fazer Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const activeMenuItem = menuItems.find((item) => item.path === pathname);
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
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0 bg-background">
          <div className="m-2 rounded-2xl border border-border bg-card shadow-sm h-[calc(100vh-1rem)] flex flex-col">
            <SidebarHeader className="h-16 justify-center border-b border-border/60 shrink-0">
              <div className="flex w-full items-center gap-3 px-3 group-data-[collapsible=icon]:px-2 transition-all">
                {isCollapsed ? (
                  <div className="relative h-9 w-9 shrink-0">
                    <img src={APP_LOGO} className="h-9 w-9 rounded-xl object-cover ring-1 ring-border" alt="Logo" />
                    <button onClick={toggleSidebar} className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70 opacity-0 backdrop-blur transition-opacity hover:opacity-100">
                      <PanelLeft className="h-4 w-4 text-foreground" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex min-w-0 items-center gap-3">
                      <img src={APP_LOGO} className="h-9 w-9 rounded-xl object-cover ring-1 ring-border shrink-0" alt="Logo" />
                      <div className="min-w-0 text-left">
                        <span className="block truncate text-xs font-black uppercase italic tracking-tighter text-slate-900">{APP_TITLE}</span>
                        <span className="block truncate text-[9px] font-bold text-slate-400 uppercase tracking-widest">Painel Admin</span>
                      </div>
                    </div>
                    <button onClick={toggleSidebar} className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors shrink-0">
                      <PanelLeft className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </>
                )}
              </div>
            </SidebarHeader>

            <SidebarContent className="gap-0 overflow-y-auto flex-1">
              <SidebarMenu className="px-2 py-4">
                {menuItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => navigate(item.path)} 
                        tooltip={item.label}
                        className={[
                          "h-11 rounded-xl px-3 transition-all",
                          isActive 
                            ? "bg-slate-900 text-emerald-400 shadow-lg" 
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        ].join(" ")}
                      >
                        <item.icon className={["h-4 w-4", isActive ? "text-emerald-400" : "text-slate-400"].join(" ")} />
                        <span className="truncate font-black uppercase text-[10px] tracking-widest">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="border-t border-border/60 p-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-slate-50 transition-all outline-none border-none">
                    <Avatar className="h-9 w-9 border-2 border-white shadow-sm shrink-0">
                      <AvatarFallback className="text-[10px] font-black bg-emerald-50 text-emerald-600 uppercase">
                        {user?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                      <p className="truncate text-xs font-black uppercase text-slate-900 leading-none">{user?.name || "-"}</p>
                      <p className="mt-1.5 truncate text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{user?.email}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-2xl border-slate-100 bg-white">
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 rounded-xl font-black uppercase text-[10px] tracking-widest p-3 border-none">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair do Painel</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarFooter>
          </div>
        </Sidebar>

        <div
          className={["absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-emerald-500/20 transition-colors", isCollapsed ? "hidden" : ""].join(" ")}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-slate-50/50">
        {isMobile && (
          <div className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur-md p-3">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-10 w-10 rounded-xl bg-slate-900 text-white border-none" />
              <div className="text-left">
                <span className="block text-xs font-black uppercase italic tracking-tighter text-slate-900">{activeMenuItem?.label ?? "Painel"}</span>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">{APP_TITLE}</span>
              </div>
            </div>
          </div>
        )}

        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-10 text-left">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-[85vh]">
            {children}
          </div>
        </main>
      </SidebarInset>
    </>
  );
}
