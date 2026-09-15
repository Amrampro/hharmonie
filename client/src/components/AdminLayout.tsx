import { ReactNode, useState, useEffect } from 'react';
import { Users, Package, BookOpen, HelpCircle, Tag, LayoutDashboard, LogOut, Palette } from 'lucide-react';
import { theme } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  page: string;
  label: string;
  icon: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const [currentPath, setCurrentPath] = useState('admin');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      setCurrentPath(hash || 'admin');
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!user?.is_admin) {
    window.location.hash = 'home';
    return null;
  }

  const navItems: NavItem[] = [
    { page: 'admin', label: 'Tableau de bord', icon: <LayoutDashboard size={20} /> },
    { page: 'admin-users', label: 'Utilisateurs', icon: <Users size={20} /> },
    { page: 'admin-products', label: 'Produits', icon: <Package size={20} /> },
    { page: 'admin-blog', label: 'Blog', icon: <BookOpen size={20} /> },
    { page: 'admin-faq', label: 'FAQ', icon: <HelpCircle size={20} /> },
    { page: 'admin-coupons', label: 'Coupons', icon: <Tag size={20} /> },
    { page: 'admin-theme', label: 'Configuration du thème', icon: <Palette size={20} /> },
  ];

  const navigate = (page: string) => {
    window.location.hash = page;
    setCurrentPath(page);
  };

  const handleLogout = async () => {
    await signOut();
    window.location.hash = 'home';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.colors.background.secondary }}>
      <aside
        style={{
          width: '280px',
          backgroundColor: theme.colors.background.primary,
          borderRight: `1px solid ${theme.colors.border.light}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          overflowY: 'auto',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          style={{
            padding: theme.spacing.xl,
            borderBottom: `1px solid ${theme.colors.border.light}`,
          }}
        >
          <h2
            style={{
              ...theme.heading.h4,
              color: theme.colors.primary.main,
              marginBottom: theme.spacing.xs,
            }}
          >
            Admin Panel
          </h2>
          <p
            style={{
              ...theme.body.small,
              color: theme.colors.text.secondary,
            }}
          >
            {user.first_name} {user.last_name}
          </p>
        </div>

        <nav style={{ flex: 1, padding: theme.spacing.lg }}>
          {navItems.map((item) => {
            const isActive = currentPath === item.page;
            return (
              <button
                key={item.page}
                onClick={() => navigate(item.page)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                  border: 'none',
                  backgroundColor: isActive ? theme.colors.primary[50] : 'transparent',
                  color: isActive ? theme.colors.primary.main : theme.colors.text.primary,
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  fontFamily: theme.typography.fontFamily.body,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: isActive ? theme.typography.fontWeight.medium : theme.typography.fontWeight.normal,
                  marginBottom: theme.spacing.xs,
                  transition: theme.transition.fast,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = theme.colors.background.secondary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div
          style={{
            padding: theme.spacing.lg,
            borderTop: `1px solid ${theme.colors.border.light}`,
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
              padding: `${theme.spacing.md} ${theme.spacing.lg}`,
              border: 'none',
              backgroundColor: 'transparent',
              color: theme.colors.error.main,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              fontFamily: theme.typography.fontFamily.body,
              fontSize: theme.typography.fontSize.base,
              transition: theme.transition.fast,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.error[50];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <LogOut size={20} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          marginLeft: '280px',
          padding: theme.spacing.xl,
        }}
      >
        {children}
      </main>
    </div>
  );
}
