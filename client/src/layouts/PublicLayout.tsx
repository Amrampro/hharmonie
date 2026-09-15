import { Outlet, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export default function PublicLayout() {
  const navigate = useNavigate();

  return (
    <>
      <Header />

      {/* contenu pages publiques */}
      <main>
        <Outlet />
      </main>

      <Footer
        onNavigate={(page) => {
          // tu utilises déjà onNavigate dans Footer avec "shop", "blog", etc.
          // ici on convertit en routes
          const p = (page || "").toLowerCase();

          if (p === "home" || p === "accueil") navigate("/");
          else if (p === "shop" || p === "boutique") navigate("/shop");
          else if (p === "approach" || p === "notre approche") navigate("/approach");
          else if (p === "about" || p === "à propos" || p === "apropos") navigate("/about");
          else if (p === "consultation" || p === "rendez-vous") navigate("/consultation");
          else if (p === "events" || p === "événements" || p === "evenements") navigate("/events");
          else if (p === "blog") navigate("/blog");
          else if (p === "faq" || p === "faqs") navigate("/faqs");
          else if (p === "contact") navigate("/contact");
          else navigate("/");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </>
  );
}
