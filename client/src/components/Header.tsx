// client/src/components/Header.tsx
import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShoppingCart,
  Leaf,
  User,
  LogOut,
  UserCheck,
  CalendarDays,
} from "lucide-react";
import { theme } from "../config/theme";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSiteParams } from "../contexts/SiteParamsContext";
import { productService } from "../services/productService";
import type { ProductCategory } from "../lib/types";
import defaultCategoryImage from "../assets/img/default_cat.jpg";

interface HeaderProps {}

export function Header({}: HeaderProps) {
  const { getCartCount } = useCart();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const dropdownScrollRef = useRef<HTMLDivElement | null>(null);

  const siteState = useSiteParams() as any;
  const parameters =
    siteState?.parameters ?? siteState?.data ?? siteState?.siteParams ?? null;

  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  // Detect scroll to add shadow/effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadCategories() {
      try {
        const data = await productService.listCategories();
        if (mounted) setCategories(data.categories || []);
      } catch (error) {
        if (mounted) setCategories([]);
      }
    }
    void loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const navItems: { label: string; to: string }[] = [
    { label: "Notre approche", to: "/approach" },
    { label: "À propos", to: "/about" },
    { label: "Consultation", to: "/consultation" },
    { label: "Événements", to: "/events" },
    { label: "FAQ", to: "/faqs" },
    { label: "Contact", to: "/contact" },
    { label: "Nos collaborateurs", to: "/collaborators" },
  ];

  const isActive = (to: string) => {
    if (to === "/") return pathname === "/";
    return pathname === to || pathname.startsWith(`${to}/`);
  };

  const handleMobileNav = (to: string) => {
    navigate(to);
    setMobileMenuOpen(false);
    setProductsDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sortedCategories = [...categories].sort((a, b) => {
    const ao = Number(a.display_order ?? 0);
    const bo = Number(b.display_order ?? 0);
    if (ao !== bo) return ao - bo;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });

  const goToShopCategory = (slug?: string) => {
    const target = slug ? `/shop?category=${encodeURIComponent(slug)}` : "/shop";
    navigate(target);
    setProductsDropdownOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollDropdown = (direction: "left" | "right") => {
    const el = dropdownScrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -360 : 360,
      behavior: "smooth",
    });
  };

  const navbarLogo = String(parameters?.logo_navbar || "").trim();
  const promotionalText = String(parameters?.promotional_text || "").trim();

  return (
    <>
      {/* --- TOP PROMO BAR --- */}
      {promotionalText && (
        <div
          style={{
            backgroundColor: theme.colors.background.secondary,
            borderBottom: `1px solid ${theme.colors.border.light}`,
            padding: `${theme.spacing.xs} ${theme.spacing.md}`,
            overflow: "hidden",
          }}
        >
          <div className="marquee">
            <span className="marquee-text">{promotionalText}</span>
          </div>
        </div>
      )}

      {/* --- MAIN HEADER --- */}
      <header
        style={{
          backgroundColor: scrolled
            ? "rgba(255, 255, 255, 0.95)"
            : theme.colors.background.primary,
          backdropFilter: scrolled ? "blur(10px)" : "none",
          boxShadow: scrolled || mobileMenuOpen ? theme.shadow.md : "none",
          borderBottom: mobileMenuOpen
            ? "none"
            : `1px solid ${theme.colors.border.light}`,
          position: "sticky",
          top: 0,
          zIndex: 1000,
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            maxWidth: theme.container.maxWidth,
            margin: "0 auto",
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          {/* 1. LOGO */}
          <Link
            to="/"
            onClick={() => {
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: theme.spacing.sm,
              zIndex: 1002,
            }}
          >
            {navbarLogo ? (
              <img
                src={navbarLogo}
                alt="Logo"
                className="header-logo"
                style={{ width: "auto", objectFit: "contain" }}
              />
            ) : (
              <Leaf
                className="header-logo-icon"
                color={theme.colors.primary.main}
              />
            )}
          </Link>

          {/* 2. DESKTOP NAVIGATION */}
          <nav className="desktop-nav">
            <ul
              style={{
                display: "flex",
                gap: theme.spacing.xl,
                listStyle: "none",
                margin: 0,
                padding: 0,
                alignItems: "center",
              }}
            >
              <li>
                <Link
                  to="/"
                  className="nav-link"
                  style={{
                    fontFamily: theme.typography.fontFamily.body,
                    fontSize: theme.typography.fontSize.sm,
                    color: isActive("/")
                      ? theme.colors.primary.main
                      : theme.colors.text.primary,
                    fontWeight: isActive("/") ? 600 : 400,
                    textDecoration: "none",
                    paddingBottom: "4px",
                    borderBottom: isActive("/")
                      ? `2px solid ${theme.colors.primary.main}`
                      : "2px solid transparent",
                    transition: "all 0.2s ease",
                  }}
                >
                  Accueil
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setProductsDropdownOpen((open) => !open)}
                  className="nav-link product-dropdown-trigger"
                  style={{
                    fontFamily: theme.typography.fontFamily.body,
                    fontSize: theme.typography.fontSize.sm,
                    color: isActive("/shop")
                      ? theme.colors.primary.main
                      : theme.colors.text.primary,
                    fontWeight: isActive("/shop") ? 600 : 400,
                    textDecoration: "none",
                    paddingBottom: "4px",
                    border: "none",
                    borderBottom: isActive("/shop")
                      ? `2px solid ${theme.colors.primary.main}`
                      : "2px solid transparent",
                    transition: "all 0.2s ease",
                    background: "transparent",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                  aria-expanded={productsDropdownOpen}
                  aria-controls="products-mega-dropdown"
                >
                  Nos produits
                  <ChevronDown
                    size={16}
                    style={{
                      transform: productsDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s ease",
                    }}
                  />
                </button>
              </li>
              {navItems.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="nav-link"
                    style={{
                      fontFamily: theme.typography.fontFamily.body,
                      fontSize: theme.typography.fontSize.sm,
                      color: isActive(item.to)
                        ? theme.colors.primary.main
                        : theme.colors.text.primary,
                      fontWeight: isActive(item.to) ? 600 : 400,
                      textDecoration: "none",
                      paddingBottom: "4px",
                      borderBottom: isActive(item.to)
                        ? `2px solid ${theme.colors.primary.main}`
                        : "2px solid transparent",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 3. ICONS & ACTIONS */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: theme.spacing.md,
              zIndex: 1002,
            }}
          >
            {/* Cart Icon */}
            <Link
              to={"/consultation"}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                color: theme.colors.text.primary,
                display: "flex",
                alignItems: "center",
              }}
              title="Prendre rendez-vous"
            >
              <CalendarDays size={22} strokeWidth={1.5} />
            </Link>

            <Link
              to={"/cart"}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: "relative",
                color: theme.colors.text.primary,
                display: "flex",
                alignItems: "center",
              }}
              title="Panier"
            >
              <ShoppingCart size={22} strokeWidth={1.5} />
              {getCartCount() > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -8,
                    backgroundColor: theme.colors.primary.main,
                    color: "#fff",
                    borderRadius: "50%",
                    minWidth: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                    fontWeight: "bold",
                    padding: "0 4px",
                  }}
                >
                  {getCartCount()}
                </span>
              )}
            </Link>

            {/* Desktop User Actions */}
            <div
              className="desktop-actions"
              style={{
                display: "flex",
                gap: theme.spacing.md,
                alignItems: "center",
              }}
            >
              {user ? (
                <>
                  <Link
                    to="/account"
                    title="Compte"
                    style={{ color: theme.colors.text.primary }}
                  >
                    <UserCheck size={20} strokeWidth={1.5} />
                  </Link>
                  <button
                    onClick={handleSignOut}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: theme.colors.text.primary,
                    }}
                    title="Déconnexion"
                  >
                    <LogOut size={20} strokeWidth={1.5} />
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  title="Connexion"
                  style={{ color: theme.colors.text.primary }}
                >
                  <User size={22} strokeWidth={1.5} />
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                marginLeft: theme.spacing.xs,
              }}
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X size={24} color={theme.colors.text.primary} />
              ) : (
                <Menu size={24} color={theme.colors.text.primary} />
              )}
            </button>
          </div>
        </div>

        <div
          id="products-mega-dropdown"
          className={productsDropdownOpen ? "products-mega open" : "products-mega"}
        >
          <div className="products-mega-inner">
            <button
              type="button"
              className="products-mega-arrow products-mega-arrow-left"
              onClick={() => scrollDropdown("left")}
              aria-label="Voir les catégories précédentes"
            >
              <ChevronLeft size={22} />
            </button>

            <div className="products-mega-scroll" ref={dropdownScrollRef}>
              <button
                type="button"
                className="products-mega-card"
                onClick={() => goToShopCategory()}
              >
                <img src={defaultCategoryImage} alt="" />
                <span>Tous les produits</span>
              </button>

              {sortedCategories.map((category) => (
                <button
                  type="button"
                  className="products-mega-card"
                  key={category.id}
                  onClick={() => goToShopCategory(category.slug)}
                >
                  <img
                    src={category.image_url || defaultCategoryImage}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.src = defaultCategoryImage;
                    }}
                  />
                  <span>{category.name}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="products-mega-arrow products-mega-arrow-right"
              onClick={() => scrollDropdown("right")}
              aria-label="Voir les catégories suivantes"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>

        {/* --- MOBILE MENU DROPDOWN --- */}
        <div
          className={mobileMenuOpen ? "mobile-menu open" : "mobile-menu"}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: theme.colors.background.primary,
            borderBottom: `1px solid ${theme.colors.border.light}`,
            boxShadow: theme.shadow.lg,
            padding: mobileMenuOpen
              ? `${theme.spacing.lg} ${theme.spacing.lg}`
              : 0,
            maxHeight: mobileMenuOpen ? "100vh" : "0",
            overflow: "hidden",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            opacity: mobileMenuOpen ? 1 : 0,
            visibility: mobileMenuOpen ? "visible" : "hidden",
            zIndex: 999,
          }}
        >
          <ul
            style={{
              display: "flex",
              flexDirection: "column",
              gap: theme.spacing.lg,
              listStyle: "none",
              margin: 0,
              padding: 0,
              textAlign: "center",
            }}
          >
            <li>
              <button
                onClick={() => handleMobileNav("/")}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  fontFamily: theme.typography.fontFamily.body,
                  fontSize: theme.typography.fontSize.lg,
                  color: isActive("/")
                    ? theme.colors.primary.main
                    : theme.colors.text.primary,
                  fontWeight: isActive("/") ? 600 : 400,
                  cursor: "pointer",
                  padding: theme.spacing.xs,
                }}
              >
                Accueil
              </button>
            </li>
            <li>
              <button
                onClick={() => setProductsDropdownOpen((open) => !open)}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  fontFamily: theme.typography.fontFamily.body,
                  fontSize: theme.typography.fontSize.lg,
                  color: isActive("/shop")
                    ? theme.colors.primary.main
                    : theme.colors.text.primary,
                  fontWeight: isActive("/shop") ? 600 : 400,
                  cursor: "pointer",
                  padding: theme.spacing.xs,
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                Nos produits
                <ChevronDown
                  size={18}
                  style={{
                    transform: productsDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.25s ease",
                  }}
                />
              </button>
              <div
                style={{
                  maxHeight: productsDropdownOpen ? 420 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.3s ease",
                }}
              >
                <div className="mobile-category-grid">
                  <button type="button" onClick={() => goToShopCategory()}>
                    <img src={defaultCategoryImage} alt="" />
                    <span>Tous les produits</span>
                  </button>
                  {sortedCategories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => goToShopCategory(category.slug)}
                    >
                      <img
                        src={category.image_url || defaultCategoryImage}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.src = defaultCategoryImage;
                        }}
                      />
                      <span>{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </li>

            {navItems.map((item) => (
              <li key={item.to}>
                <button
                  onClick={() => handleMobileNav(item.to)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    fontFamily: theme.typography.fontFamily.body,
                    fontSize: theme.typography.fontSize.lg,
                    color: isActive(item.to)
                      ? theme.colors.primary.main
                      : theme.colors.text.primary,
                    fontWeight: isActive(item.to) ? 600 : 400,
                    cursor: "pointer",
                    padding: theme.spacing.xs,
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}

            <hr
              style={{
                width: "100%",
                border: `1px solid ${theme.colors.border.light}`,
                margin: "8px 0",
              }}
            />

            {/* Mobile Auth Actions */}
            {user ? (
              <>
                <li
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={() => handleMobileNav("/account")}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    <UserCheck size={18} /> Mon Compte
                  </button>
                  <button
                    onClick={handleSignOut}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "1rem",
                      color: theme.colors.error.main,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    <LogOut size={18} /> Déconnexion
                  </button>
                </li>
              </>
            ) : (
              <li>
                <button
                  onClick={() => handleMobileNav("/auth")}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.1rem",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    cursor: "pointer",
                  }}
                >
                  <User size={20} /> Connexion / Inscription
                </button>
              </li>
            )}
          </ul>
        </div>
      </header>

      {/* --- CSS MEDIA QUERIES + MARQUEE --- */}
      <style>{`
        /* Desktop Default */
        .desktop-nav { display: block; }
        .desktop-actions { display: flex; }
        .mobile-menu-toggle { display: none !important; }

        /* Logo Sizing */
        .header-logo { height: 78px; }
        .header-logo-icon { width: 64px; height: 64px; }

        /* Hover effect for desktop links */
        .nav-link:hover {
          color: ${theme.colors.primary.main} !important;
        }

        .product-dropdown-trigger:hover {
          color: ${theme.colors.primary.main} !important;
        }

        .products-mega {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: ${theme.colors.background.primary};
          border-bottom: 1px solid ${theme.colors.border.light};
          box-shadow: ${theme.shadow.lg};
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transform: translateY(-8px);
          transition: max-height 0.38s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease, transform 0.28s ease;
          pointer-events: none;
          z-index: 1001;
        }

        .products-mega.open {
          max-height: 360px;
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .products-mega-inner {
          max-width: ${theme.container.maxWidth};
          margin: 0 auto;
          padding: 28px ${theme.spacing.lg} 34px;
          position: relative;
        }

        .products-mega-scroll {
          display: flex;
          gap: 22px;
          overflow-x: auto;
          scroll-behavior: smooth;
          scrollbar-width: none;
          padding: 0 44px;
        }

        .products-mega-scroll::-webkit-scrollbar {
          display: none;
        }

        .products-mega-card {
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          text-align: left;
          flex: 0 0 clamp(220px, 23vw, 320px);
          color: ${theme.colors.text.primary};
          font-family: ${theme.typography.fontFamily.body};
        }

        .products-mega-card img {
          width: 100%;
          aspect-ratio: 1.55 / 1;
          object-fit: cover;
          border-radius: 16px;
          display: block;
          background: ${theme.colors.background.secondary};
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }

        .products-mega-card:hover img {
          transform: translateY(-2px);
          box-shadow: 0 16px 34px rgba(58, 35, 43, 0.14);
        }

        .products-mega-card span {
          display: block;
          margin-top: 12px;
          font-size: ${theme.typography.fontSize.base};
          font-weight: 500;
        }

        .products-mega-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: none;
          background: rgba(31, 31, 31, 0.78);
          color: #fff;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .products-mega-arrow:hover {
          background: rgba(31, 31, 31, 0.95);
          transform: translateY(-50%) scale(1.04);
        }

        .products-mega-arrow-left {
          left: ${theme.spacing.lg};
        }

        .products-mega-arrow-right {
          right: ${theme.spacing.lg};
        }

        .mobile-category-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          padding: 14px 0 2px;
        }

        .mobile-category-grid button {
          border: 1px solid ${theme.colors.border.light};
          background: ${theme.colors.background.secondary};
          border-radius: 12px;
          padding: 8px;
          text-align: left;
          color: ${theme.colors.text.primary};
          font-family: ${theme.typography.fontFamily.body};
          cursor: pointer;
        }

        .mobile-category-grid img {
          width: 100%;
          aspect-ratio: 1.45 / 1;
          object-fit: cover;
          border-radius: 8px;
          display: block;
          margin-bottom: 8px;
        }

        .mobile-category-grid span {
          display: block;
          font-size: 0.85rem;
          line-height: 1.25;
          font-weight: 500;
        }

        /* Marquee (single text) */
        .marquee {
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
        }

        .marquee-text {
          display: inline-block;
          padding-left: 100%;
          animation: marqueeMove 25s linear infinite;
          font-size: 0.75rem;
          font-weight: 500;
          color: ${theme.colors.text.secondary};
          font-family: ${theme.typography.fontFamily.body};
          letter-spacing: 0.02em;
        }

        @keyframes marqueeMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }

        /* Mobile Breakpoint */
        @media (max-width: 1023px) {
          .desktop-nav { display: none !important; }
          .desktop-actions { display: none !important; }
          .mobile-menu-toggle { display: block !important; }
          .products-mega { display: none; }

          .header-logo { height: 50px; }
          .header-logo-icon { width: 40px; height: 40px; }
        }
      `}</style>
    </>
  );
}
