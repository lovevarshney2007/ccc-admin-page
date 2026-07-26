import { type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { LayoutDashboard, Users, ScanLine, ShieldBan, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { title: 'Overview', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Registrations', url: '/dashboard/users', icon: Users },
  { title: 'QR Scanner', url: '/dashboard/scanner', icon: ScanLine },
  { title: 'IP Management', url: '/dashboard/ip', icon: ShieldBan },
];

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="flex flex-col h-full">
        {/* Brand */}
        <div className="p-4 pb-2">
          {!collapsed && (
            <div className="space-y-1">
              <div className="flex gap-1.5 items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              </div>
              <h2 className="font-heading font-bold text-base bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">CCC SPOCC</h2>
              <p className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">Admin Hub 2026</p>
            </div>
          )}
        </div>

        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout */}
        <div className="p-3">
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'default'}
            onClick={handleLogout}
            className="w-full text-sidebar-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const currentTitle = navItems.find((item) =>
    item.url === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(item.url)
  )?.title ?? 'Dashboard';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center gap-3 border-b border-border/50 px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border" />
            <h1 className="font-heading font-semibold text-lg">{currentTitle}</h1>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
