import { useEffect, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { eventService, type EventItem } from "../services/eventService";
import { Button } from "../components/Button";

export function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventService.list({ limit: 50 }).then((resp) => setEvents(resp.events || [])).catch(() => setEvents([])).finally(() => setLoading(false));
  }, []);

  return (
    <section className="hh-events">
      <div className="hh-page-intro">
        <span>Événements</span>
        <h1>Rencontres et ateliers H&H</h1>
        <p>Ateliers, sessions en ligne et moments d'échange autour du cycle, des hormones et de la fertilité.</p>
      </div>
      {loading ? <p>Chargement...</p> : (
        <div className="hh-event-grid">
          {events.map((event) => (
            <article key={event.id}>
              <div className="event-cover" style={{ backgroundImage: event.cover_image_url ? `url(${event.cover_image_url})` : undefined }} />
              <div>
                <small><CalendarDays size={15} /> {new Date(event.starts_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</small>
                <h2>{event.title}</h2>
                <p>{event.short_description}</p>
                <small><MapPin size={15} /> {event.event_type === "online" ? "En ligne" : [event.location_name, event.city].filter(Boolean).join(" - ")}</small>
                <Button onClick={() => navigate(`/events/${event.slug}`)}>Voir l'événement</Button>
              </div>
            </article>
          ))}
          {!events.length && <p>Aucun événement publié pour le moment.</p>}
        </div>
      )}
    </section>
  );
}
