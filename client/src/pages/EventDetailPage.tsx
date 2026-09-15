import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { CalendarDays, MapPin } from "lucide-react";
import { useParams } from "react-router-dom";
import { eventService, type EventItem } from "../services/eventService";
import { SITE_NAME, SITE_URL } from "../components/Seo";

export function EventDetailPage() {
  const { slug = "" } = useParams();
  const [event, setEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    eventService.bySlug(slug).then((resp) => setEvent(resp.event)).catch(() => setEvent(null));
  }, [slug]);

  if (!event) return <section className="hh-events"><p>Événement introuvable.</p></section>;

  const eventUrl = `${SITE_URL}/events/${event.slug}`;
  const eventLocation =
    event.event_type === "online"
      ? {
          "@type": "VirtualLocation",
          url: event.online_url || eventUrl,
        }
      : {
          "@type": "Place",
          name: event.location_name || event.city || SITE_NAME,
          address: event.city || "Belgique",
        };

  return (
    <section className="hh-event-detail">
      <Helmet>
        <title>{`${event.title} | ${SITE_NAME}`}</title>
        <meta
          name="description"
          content={
            event.short_description ||
            "Événement H&H autour du cycle, des hormones, de la fertilité et des approches naturelles."
          }
        />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <link rel="canonical" href={eventUrl} />
        <meta property="og:type" content="event" />
        <meta property="og:title" content={`${event.title} | ${SITE_NAME}`} />
        <meta
          property="og:description"
          content={
            event.short_description ||
            "Événement H&H autour du cycle, des hormones et du bien-être naturel."
          }
        />
        <meta property="og:url" content={eventUrl} />
        {event.cover_image_url ? <meta property="og:image" content={event.cover_image_url} /> : null}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: event.title,
            description: event.short_description || event.description || event.title,
            image: event.cover_image_url ? [event.cover_image_url] : undefined,
            startDate: event.starts_at,
            endDate: event.ends_at || undefined,
            eventAttendanceMode:
              event.event_type === "online"
                ? "https://schema.org/OnlineEventAttendanceMode"
                : event.event_type === "hybrid"
                ? "https://schema.org/MixedEventAttendanceMode"
                : "https://schema.org/OfflineEventAttendanceMode",
            eventStatus: "https://schema.org/EventScheduled",
            location: eventLocation,
            organizer: {
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_URL,
            },
            offers: {
              "@type": "Offer",
              url: eventUrl,
              price: Number(event.price || 0).toFixed(2),
              priceCurrency: event.currency || "EUR",
              availability: "https://schema.org/InStock",
            },
          })}
        </script>
      </Helmet>
      <div className="event-cover event-cover--large" style={{ backgroundImage: event.cover_image_url ? `url(${event.cover_image_url})` : undefined }} />
      <div>
        <span>Événement H&H</span>
        <h1>{event.title}</h1>
        <p>{event.short_description}</p>
        <div className="event-meta"><CalendarDays size={18} /> {new Date(event.starts_at).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}</div>
        <div className="event-meta"><MapPin size={18} /> {event.event_type === "online" ? "En ligne" : [event.location_name, event.city].filter(Boolean).join(" - ")}</div>
        <p style={{ whiteSpace: "pre-line" }}>{event.description}</p>
      </div>
    </section>
  );
}
