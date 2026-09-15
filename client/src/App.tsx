// client/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { HomePage } from "./pages/HomePage";
import { ShopPage } from "./pages/ShopPage";
import { AboutPage } from "./pages/AboutPage";
import { BlogPage } from "./pages/BlogPage";
import { ContactPage } from "./pages/ContactPage";
import { ApproachPage } from "./pages/ApproachPage";
import { ConsultationPage } from "./pages/ConsultationPage";
import { EventsPage } from "./pages/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { CartPage } from "./pages/CartPage";
import { BlogDetailRoute } from "./routes/BlogDetailRoute";
import { FAQPage } from "./pages/FAQPage";
import { CheckoutPage } from "./pages/CheckoutPage";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import ProductCategoriesPage from "./pages/admin/ProductCategoriesPage";
import AdminProductsListPage from "./pages/admin/AdminProductsListPage";
import AdminProductFormPage from "./pages/admin/AdminProductFormPage";
import AdminBlogCategoriesPage from "./pages/admin/AdminBlogCategoriesPage";
import AdminBlogPostFormPage from "./pages/admin/AdminBlogPostFormPage";
import AdminBlogPostsListPage from "./pages/admin/AdminBlogPostsListPage";
import AdminFaqsPage from "./pages/admin/AdminFaqsPage";
import AdminBannersListPage from "./pages/admin/AdminBannersListPage";
import AdminBannerFormPage from "./pages/admin/AdminBannerFormPage";
import AdminLegalLinksListPage from "./pages/admin/AdminLegalLinksListPage";
import AdminLegalLinkFormPage from "./pages/admin/AdminLegalLinkFormPage";
import AdminParametersPage from "./pages/admin/AdminParametersPage";
import AdminProductReviewsPage from "./pages/admin/AdminProductReviewsPage";
import AdminOrdersLayout from "./pages/admin/orders/AdminOrdersLayout";
import AdminFinanceLayout from "./pages/admin/finance/AdminFinanceLayout";
import AdminNewsletterList from "./pages/admin/AdminNewsletterList";
import AdminAppointmentsPage from "./pages/admin/AdminAppointmentsPage";
import AdminEventsPage from "./pages/admin/AdminEventsPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import { AdminAmbassadorsPage } from "./pages/admin/AdminAmbassadorsPage";
import { AmbassadorDashboardPage } from "./pages/AmbassadorDashboardPage";
import { FidelitePage } from "./pages/FidelitePage";
import { AmbassadorsPage } from "./pages/AmbassadorsPage";
import { AmbassadorPage } from "./pages/AmbassadorPage";

import PublicLayout from "./layouts/PublicLayout";
import { SiteParamsProvider } from "./contexts/SiteParamsContext";
import { AuthProvider } from "./contexts/AuthContext";
import RequireAdmin from "./routes/RequireAdmin";
import { ScrollToTop } from "./components/ScrollToTop";
import { AccountPage } from "./pages/AccountPage";
import { Seo } from "./components/Seo";

function App() {
  return (
    <BrowserRouter>
      <Seo />
      <ScrollToTop />
      <AuthProvider>
        <SiteParamsProvider>
          <Routes>
            {/* ✅ Public layout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/approach" element={<ApproachPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogDetailRoute />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:slug" element={<EventDetailPage />} />
              <Route path="/consultation" element={<ConsultationPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/faqs" element={<FAQPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/fidelity" element={<FidelitePage />} />
              <Route path="/order-success" element={<OrderSuccessPage />} />
              <Route path="/ambassadors" element={<AmbassadorsPage />} />
            </Route>

            {/* Auth */}
            <Route path="/auth" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route path="/account" element={<AccountPage />} />            
            <Route path="/ambassador" element={<AmbassadorDashboardPage />} />
            <Route path="/ambassador/account" element={<AmbassadorPage />} />

            {/* ✅ Admin protected */}
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route
                path="product-categories"
                element={<ProductCategoriesPage />}
              />

              {/* Products */}
              <Route path="products" element={<AdminProductsListPage />} />
              <Route path="products/new" element={<AdminProductFormPage />} />
              <Route
                path="products/:id/edit"
                element={<AdminProductFormPage />}
              />

              {/* Blog */}
              <Route path="blog-posts" element={<AdminBlogPostsListPage />} />
              <Route
                path="blog-posts/new"
                element={<AdminBlogPostFormPage />}
              />
              <Route
                path="blog-posts/:id/edit"
                element={<AdminBlogPostFormPage />}
              />
              <Route
                path="blog-categories"
                element={<AdminBlogCategoriesPage />}
              />

              {/* FAQs */}
              <Route path="faqs" element={<AdminFaqsPage />} />

              {/* Banners */}
              <Route path="banners" element={<AdminBannersListPage />} />
              <Route path="banners/new" element={<AdminBannerFormPage />} />
              <Route
                path="banners/:id/edit"
                element={<AdminBannerFormPage />}
              />

              {/* Legal */}
              <Route path="legal-links" element={<AdminLegalLinksListPage />} />
              <Route
                path="legal-links/new"
                element={<AdminLegalLinkFormPage />}
              />
              <Route
                path="legal-links/:id/edit"
                element={<AdminLegalLinkFormPage />}
              />

              {/* Parameters */}
              <Route path="parameters" element={<AdminParametersPage />} />

              <Route
                path="product-reviews"
                element={<AdminProductReviewsPage />}
              />

              {/* Orders */}
              <Route path="orders" element={<AdminOrdersLayout />} />

              {/* Finance */}
              <Route path="finance" element={<AdminFinanceLayout />} />

              {/* Newsletter */}
              <Route path="newsletter" element={<AdminNewsletterList />} />

              <Route path="ambassadors" element={<AdminAmbassadorsPage />} />
              <Route path="appointments" element={<AdminAppointmentsPage />} />
              <Route path="events" element={<AdminEventsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SiteParamsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
