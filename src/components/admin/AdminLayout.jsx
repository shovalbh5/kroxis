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
    <div className="min-h-screen bg-muted/30 flex" dir="rtl">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 right-0 h-screen w-64 bg-secondary text-secondary-foreground z-50
        transition-transform duration-300 ease-in-out flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <Link to="/" className="font-heading text-2xl font-bold text-primary tracking-wider">
            KROXIS
          </Link>
          <button className="lg:hidden" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-4 mb-4 border-b border-secondary-foreground/10">
          <p className="text-sm text-secondary-foreground/60">מחובר כ:</p>
          <p className="font-medium truncate">{user.full_name || user.email}</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
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
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-primary text-primary-foreground font-medium' 
                    : 'text-secondary-foreground/80 hover:bg-secondary-foreground/10 hover:text-secondary-foreground'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-secondary-foreground/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            התנתק
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-background border-b border-border p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="font-heading text-xl font-bold">ניהול KROXIS</div>
          <button onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}