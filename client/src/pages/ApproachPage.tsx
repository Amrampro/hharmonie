import { Heart, Leaf, Pill, Sprout } from "lucide-react";
import { theme } from "../config/theme";
import approachImage from "../assets/img/hh-approach.jpeg";

const pillars = [
  {
    icon: Leaf,
    title: "1. Phytothérapie",
    text: "Nous utilisons les bienfaits des plantes, notamment à travers nos tisanes H&H;, sélectionnées et formulées selon des besoins spécifiques.",
  },
  {
    icon: Sprout,
    title: "2. Gemmothérapie",
    text: "Elle utilise des macérats issus de bourgeons et de jeunes pousses. Ils sont sélectionnés pour compléter l'accompagnement selon les besoins de chaque profil.",
  },
  {
    icon: Pill,
    title: "3. Nutrithérapie",
    text: "Elle repose sur une sélection ciblée de vitamines, minéraux, acides gras et antioxydants afin de compléter les apports nutritionnels et soutenir le fonctionnement normal de l'organisme.",
  },
];

export function ApproachPage() {
  return (
    <div>
      {/* <section className="hh-approach-hero">
        <div>
          <h1>Notre approche</h1>
          <p className="script">Comment sont composés nos packs ?</p>
          <p>
            Chez Hormones & Harmonie, les packs reposent sur trois piliers de la naturopathie.
            La sélection dépend du profil, des symptômes dominants, du terrain, du projet de
            grossesse lorsqu'il existe et des besoins nutritionnels.
          </p>
        </div>
        <img src={approachImage} alt="Approche naturelle Hormones & Harmonie" />
      </section> */}

      <section className="hh-section">
        <div className="hh-section-heading">
          <h2>Comment sont composés nos packs ?</h2>
          <p>
            Chez <b>Hormones & Harmonie,</b> nos packs reposent sur <b>3 piliers de la naturopathie : la phytothérapie, la gemmothérapie et la nutrithérapie.</b>
          </p>
          <p>Parce que deux personnes ayant la même problématique n'ont pas forcément les mêmes besoins, nous sélectionnons et associons ces différentes approches en tenant compte <b>du profil, des besoins, des symptômes dominants et du projet de grossesse lorsqu'il existe.</b></p>
        </div>
        <div className="hh-pillar-grid">
          {pillars.map((pillar) => (
            <article key={pillar.title}>
              <pillar.icon size={42} />
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </article>
          ))}
        </div>
        <div className="hh-soft-note">
          <Heart size={24} />
          <span>
            Notre objectif : associer ces trois piliers de façon cohérente afin de proposer un accompagnement global et adapté à chaque profil.
          </span>
        </div>
      </section>

      <style>{`
        .hh-approach-hero {
          align-items: center;
          background: ${theme.colors.background.primary};
          display: grid;
          gap: 2rem;
          grid-template-columns: minmax(0, 0.95fr) minmax(320px, 1.05fr);
          min-height: 560px;
          padding: 4rem max(1.25rem, 8vw);
        }
        .hh-approach-hero h1 {
          color: ${theme.colors.primary.main};
          font-family: ${theme.typography.fontFamily.primary};
          font-size: clamp(2.8rem, 6vw, 5.2rem);
          line-height: 1;
          margin: 0 0 0.5rem;
        }
        .hh-approach-hero .script {
          color: ${theme.colors.accent.dark};
          font-family: Georgia, serif;
          font-size: clamp(1.4rem, 3vw, 2rem);
          font-style: italic;
          margin: 0 0 1.5rem;
        }
        .hh-approach-hero p:not(.script) {
          color: ${theme.colors.text.primary};
          font-size: 1.08rem;
          line-height: 1.8;
          max-width: 640px;
        }
        .hh-approach-hero img {
          border-radius: 8px;
          box-shadow: ${theme.shadow.lg};
          height: min(440px, 56vw);
          object-fit: cover;
          object-position: right center;
          width: 100%;
        }
        .hh-section {
          background: ${theme.colors.background.secondary};
          padding: 4rem max(1.25rem, 8vw);
        }
        .hh-section-heading {
          margin: 0 auto 2rem;
          max-width: 820px;
          text-align: center;
        }
        .hh-section-heading h2 {
          color: ${theme.colors.accent.dark};
          font-family: ${theme.typography.fontFamily.primary};
          font-size: clamp(2rem, 4vw, 3rem);
          margin: 0 0 0.75rem;
        }
        .hh-section-heading p,
        .hh-pillar-grid p,
        .hh-soft-note {
          color: ${theme.colors.text.secondary};
          line-height: 1.7;
        }
        .hh-pillar-grid {
          display: grid;
          gap: 1.4rem;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin: 0 auto;
          max-width: 1180px;
        }
        .hh-pillar-grid article {
          background: #fff;
          border: 1px solid ${theme.colors.border.light};
          border-radius: 8px;
          min-height: 250px;
          padding: 2rem;
          text-align: center;
        }
        .hh-pillar-grid svg {
          color: ${theme.colors.accent.main};
          margin-bottom: 1rem;
        }
        .hh-pillar-grid h3 {
          color: ${theme.colors.primary.main};
          font-size: 1.2rem;
          margin: 0 0 0.75rem;
        }
        .hh-soft-note {
          align-items: center;
          background: ${theme.colors.background.tertiary};
          border-radius: 8px;
          display: flex;
          gap: 0.9rem;
          margin: 1.5rem auto 0;
          max-width: 760px;
          padding: 1rem 1.2rem;
        }
        .hh-soft-note svg {
          color: ${theme.colors.primary.main};
          flex: 0 0 auto;
        }
        @media (max-width: 860px) {
          .hh-approach-hero,
          .hh-pillar-grid {
            grid-template-columns: 1fr;
          }
          .hh-approach-hero img {
            height: 320px;
          }
        }
      `}</style>
    </div>
  );
}

