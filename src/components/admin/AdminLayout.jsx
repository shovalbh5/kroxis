import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Tag, 
  FileText, 
  MessageCircle, 
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'לוח בקרה', exact: true },
  { path: '/admin/orders', icon: ShoppingCart, label: 'הזמנות' },
  { path: '/admin/products', icon: Package, label: 'מוצרים' },
  { path: '/admin/customers', icon: Users, label: 'לקוחות ו-B2B' },
  { path: '/admin/coupons', icon: Tag, label: 'קופונים ומבצעים' },
  { path: '/admin/blog', icon: FileText, label: 'ניהול בלוג' },
  { path: '/admin/whatsapp', icon: MessageCircle, label: 'וואטסאפ' },
  { path: '/admin/livechat', icon: MessageSquare, label: 'צ\'אט חי' },
  { path: '/admin/settings', icon: Settings, label: 'הגדרות חנות' },
];

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me()
      .then(u => { setUser(u); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center p-8">
          <h1 className="font-heading text-3xl font-bold mb-2">גישה חסומה</h1>
          <p className="text-muted-foreground mb-6">דף זה זמין למנהלים בלבד.</p>
          {!user && (
            <Button onClick={() => base44.auth.redirectToLogin()}>
              התחבר למערכת
            </Button>
          )}
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await base44.auth.logout('/');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-background flex font-body selection:bg-primary/20" dir="rtl">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 right-0 h-screen w-64 bg-background/80 backdrop-blur-2xl border-l border-border/50 z-50
        transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]
        ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <Link to="/" className="font-heading text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            KROXIS
          </Link>
          <button className="lg:hidden text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 pb-6 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-medium border border-primary/10">
              {(user.full_name || user.email).charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-muted-foreground font-medium mb-0.5">מחובר כ</p>
              <p className="font-medium text-sm truncate text-foreground">{user.full_name || user.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pb-4 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[0.98]' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:scale-[0.98]'
                  }
                `}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            התנתק
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-background/80 backdrop-blur-xl border-b border-border/50 p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="font-heading text-lg font-bold">ניהול KROXIS</div>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 -mr-2 text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 p-4 sm:p-8 lg:p-10 overflow-x-hidden max-w-[1600px] mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}