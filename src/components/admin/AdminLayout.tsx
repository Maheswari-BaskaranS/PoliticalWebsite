import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Image, 
  FileText, 
  LogOut,
  Menu,
  MapPin,
  Building2,
  Map
} from "lucide-react";
import logo from "../../assets/icons/logo.jpg";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Users, label: "Members", path: "/admin/members" },
    { icon: Calendar, label: "Events", path: "/admin/events" },
    { icon: Image, label: "Banners", path: "/admin/banners" },
    { icon: FileText, label: "Content", path: "/admin/content" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-card border-r transition-all duration-300 flex flex-col h-screen sticky top-0 fixed md:relative md:w-64 z-50 md:z-auto`}
        style={{ minHeight: '100vh' }}
      >
        <div className="p-4 border-b flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src={logo} alt="TMK" className="w-8 h-8 rounded" />
            <h2 className={`font-bold text-primary transition-all duration-300 hidden md:block ${sidebarOpen ? "text-xl" : "text-xs"}`}>
              {sidebarOpen ? "TMK Admin" : "TMK"}
            </h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant={location.pathname === item.path ? "secondary" : "ghost"}
              className={`w-full justify-start ${!sidebarOpen && "justify-center md:justify-start"}`}
              onClick={() => handleNavigation(item.path)}
              title={!sidebarOpen ? item.label : ""}
            >
              <item.icon className={`w-5 h-5 ${sidebarOpen && "mr-2"}`} />
              {sidebarOpen && <span className="hidden md:inline">{item.label}</span>}
              {!sidebarOpen && <span className="hidden md:inline ml-2">{item.label}</span>}
            </Button>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <Button 
            variant="outline" 
            className={`w-full ${!sidebarOpen && "justify-center"}`}
            onClick={() => setLogoutDialogOpen(true)}
            title={!sidebarOpen ? "Logout" : ""}
          >
            <LogOut className={`w-5 h-5 ${sidebarOpen && "mr-2"}`} />
            {sidebarOpen && <span className="hidden md:inline">Logout</span>}
            {!sidebarOpen && <span className="hidden md:inline ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
              Logout
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Content */}
      <main className="flex-1 w-full md:w-auto p-4 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
};


export default AdminLayout;
