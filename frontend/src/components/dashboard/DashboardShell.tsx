import { ReactNode } from "react";
import {
  Baby,
  Bell,
  CircleHelp,
  LucideIcon,
  LogOut,
  MessageSquarePlus,
  Plus,
  Settings,
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

  return (
    <SidebarProvider defaultOpen>
      <div className="bg-slate-50 text-slate-900">
        <Sidebar className="bg-white text-slate-700 border-r border-slate-200 shadow-sm">
          <SidebarHeader className="px-4 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <img
                src="/bridge-avatar.png"
                alt="Bridge"
                className="h-8 w-8 rounded-full bg-white/10 p-1"
              />
              <div>
                <p className="text-base font-semibold tracking-tight text-slate-900">
                  Bridge
                </p>
                <p className="text-xs text-slate-500">{heroSubtitle}</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="gap-6">
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
          <SidebarFooter className="p-3 border-t border-slate-100">
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
        <header className="flex h-16 items-center border-b border-slate-200 bg-white px-4 md:px-8">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-slate-600 hover:text-slate-900" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Bridge workspace
              </p>
              <h1 className="text-lg font-semibold text-slate-900">
                {activeLabel}
              </h1>
            </div>
          </div>
          <div className="ml-6 hidden flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3 py-1 md:flex">
            <Input
              placeholder="Search calendar, expenses, or documents"
              className="h-8 border-none bg-transparent text-sm shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex border-slate-200 text-slate-700"
              onClick={() => onCreateQuickAction?.()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Quick add
            </Button>
            {onOpenChildren && (
              <Button
                variant="outline"
                size="sm"
                className="border-green-200 text-green-700"
                onClick={onOpenChildren}
              >
                <Baby className="mr-2 h-4 w-4" />
                Manage kids
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600"
              onClick={() => onOpenMessages?.()}
            >
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>
            <Avatar
              className="h-9 w-9 border border-slate-100 cursor-pointer hover:ring-2 hover:ring-slate-300 transition-all"
              onClick={onOpenSettings}
            >
              <AvatarFallback className="bg-slate-900 text-white text-sm">
                {initials.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-6 md:px-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export type { DashboardNavItem };
export default DashboardShell;

