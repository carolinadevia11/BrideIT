import { ReactNode, useEffect, useState } from "react";
import {
  Baby,
  Bell,
  CircleHelp,
  HelpCircle,
  LucideIcon,
  LogOut,
  MessageSquarePlus,
  Plus,
  Settings,
  Search,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type DashboardNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  tone?: "default" | "alert";
};

type DashboardShellProps = {
  children: ReactNode;
  navItems: DashboardNavItem[];
  activeItem: string;
  onNavigate: (id: string) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenChildren?: () => void;
  onCreateQuickAction?: () => void;
  onOpenMessages?: () => void;
  onStartTour?: () => void;
  currentUser?: { firstName: string; lastName: string; email: string } | null;
  heroSubtitle?: string;
};

const DashboardNavigation = ({
  navItems,
  activeItem,
  onNavigate,
}: {
  navItems: DashboardNavItem[];
  activeItem: string;
  onNavigate: (id: string) => void;
}) => {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroup className="px-3">
      <SidebarGroupLabel className="text-xs uppercase tracking-[0.2em] text-slate-400">
        Navigate
      </SidebarGroupLabel>
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              className={cn(
                "text-slate-600 hover:text-slate-900 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700",
                item.tone === "alert" && "text-orange-600 data-[active=true]:text-orange-700"
              )}
              isActive={activeItem === item.id}
              onClick={() => {
                onNavigate(item.id);
                setOpenMobile(false);
              }}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </SidebarMenuButton>
            {item.badge && (
              <SidebarMenuBadge className="bg-slate-100 text-slate-700 border border-slate-200">
                {item.badge}
              </SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};

const DashboardShell = ({
  children,
  navItems,
  activeItem,
  onNavigate,
  onLogout,
  onOpenSettings,
  onOpenChildren,
  onCreateQuickAction,
  onOpenMessages,
  onStartTour,
  currentUser,
  heroSubtitle = "Fair & balanced co-parenting",
}: DashboardShellProps) => {
  const activeLabel =
    navItems.find((item) => item.id === activeItem)?.label ?? "Settings";

  const initials = currentUser
    ? `${currentUser.firstName?.[0] ?? ""}${currentUser.lastName?.[0] ?? ""}` ||
    currentUser.email?.[0] ||
    "B"
    : "B";

  // Control sidebar state based on screen size
  // 769px-1093px: collapsed (hamburger)
  // Above 1093px: expanded
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 1093;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // Above 1093px, sidebar should be open
      if (width > 1093) {
        setSidebarOpen(true);
      } else if (width >= 769) {
        // 769px-1093px, sidebar should be closed (hamburger)
        setSidebarOpen(false);
      }
      // Below 769px, keep current state (mobile behavior)
    };

    // Set initial state
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="bg-slate-50 text-slate-900 overflow-x-hidden">
        <Sidebar className="bg-white text-slate-700 border-r border-slate-200 shadow-sm flex flex-col h-full">
          <SidebarHeader className="px-3 sm:px-4 pt-4 sm:pt-5 pb-2 sm:pb-3 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-semibold tracking-tight text-slate-900 truncate">
                  Bridge-it
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">{heroSubtitle}</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="gap-6 flex-1 min-h-0 overflow-y-auto">
            <DashboardNavigation
              navItems={navItems}
              activeItem={activeItem}
              onNavigate={onNavigate}
            />
            <SidebarSeparator className="bg-slate-100" />
            <SidebarGroup className="px-3">
              <SidebarGroupLabel className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Quick actions
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => onCreateQuickAction?.()}
                    className="text-slate-600 hover:text-slate-900 data-[active=true]:bg-slate-100 data-[active=true]:text-slate-900"
                  >
                    <Plus className="h-4 w-4" />
                    New request
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => onOpenMessages?.()}
                    className="text-slate-600 hover:text-slate-900 data-[active=true]:bg-slate-100 data-[active=true]:text-slate-900"
                  >
                    <MessageSquarePlus className="h-4 w-4" />
                    Message partner
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-3 border-t border-slate-100 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                activeItem === "settings" && "bg-blue-50 text-blue-700"
              )}
              onClick={onOpenSettings}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              onClick={onLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>
      </div>
      <SidebarInset className="bg-slate-50">
        <header className="flex h-14 sm:h-16 items-center border-b border-slate-200 bg-white px-3 sm:px-4 md:px-8">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <SidebarTrigger className="text-slate-600 hover:text-slate-900 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-slate-400 truncate">
                Bridge-it workspace
              </p>
              <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                {activeLabel}
              </h1>
            </div>
          </div>
          <div className="ml-2 sm:ml-6 hidden flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3 py-1 lg:flex max-w-md">
            <Search className="h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search calendar, expenses, or documents"
              className="h-8 border-none bg-transparent text-sm shadow-none focus-visible:ring-0 w-full"
            />
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {onStartTour && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-tour-button
                      className="text-slate-600 hover:text-blue-700 h-8 w-8 sm:h-9 sm:w-9"
                      onClick={() => onStartTour()}
                    >
                      <HelpCircle className="h-4 w-4" />
                      <span className="sr-only">Take a Tour</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Take a Tour</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              variant="outline"
              size="sm"
              className="hidden lg:inline-flex border-slate-200 text-slate-700 text-xs sm:text-sm"
              onClick={() => onCreateQuickAction?.()}
            >
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xl:inline">Quick add</span>
            </Button>
            {onOpenChildren && (
              <Button
                variant="outline"
                size="sm"
                className="border-green-200 text-green-700 text-xs sm:text-sm px-2 sm:px-3"
                onClick={onOpenChildren}
              >
                <Baby className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Manage kids</span>
                <span className="sm:hidden">Kids</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 h-8 w-8 sm:h-9 sm:w-9"
              onClick={() => onOpenMessages?.()}
            >
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>
            <Avatar
              className="h-8 w-8 sm:h-9 sm:w-9 border border-slate-100 cursor-pointer hover:ring-2 hover:ring-slate-300 transition-all flex-shrink-0"
              onClick={onOpenSettings}
            >
              <AvatarFallback className="bg-slate-900 text-white text-xs sm:text-sm">
                {initials.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-bridge-blue/5 px-3 sm:px-4 py-4 sm:py-6 md:px-8">
          <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export type { DashboardNavItem };
export default DashboardShell;

