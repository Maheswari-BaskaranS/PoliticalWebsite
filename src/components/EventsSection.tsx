import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Calendar, Clock, MapPin } from "lucide-react";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "@/lib/api";

interface EventsSectionProps {
  language: "ta" | "en";
}

const EventsSection = ({ language }: EventsSectionProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const title = language === "ta" ? "நிகழ்வுகள்" : "Events";
  const subtitle = language === "ta"
    ? "எதிர்வரும் நிகழ்வுகளில் கலந்து கொள்ளுங்கள்"
    : "Join us in our upcoming events";
  const viewDetails = language === "ta" ? "விவரங்களை காண்க" : "View Details";

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/Events/GetAllEvents`);
        let data = [];
        if (Array.isArray(res.data)) {
          data = res.data.filter((e: any) => e.IsActive);
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          data = res.data.data.filter((e: any) => e.IsActive);
        }
        setEvents(data);
      } catch (e) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [language]);

  // State to track expanded events
  const [openDialogId, setOpenDialogId] = useState<number | null>(null);

  // Carousel state
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const carouselInterval = useRef<NodeJS.Timeout | null>(null);

  // Pause carousel when dialog is open or mouse is over a card
  useEffect(() => {
    if (events.length > 3) {
      if (openDialogId !== null || carouselPaused) {
        // Pause carousel
        if (carouselInterval.current) clearInterval(carouselInterval.current);
        return;
      }
      if (carouselInterval.current) clearInterval(carouselInterval.current);
      carouselInterval.current = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % Math.ceil(events.length / 3));
      }, 3500);
      return () => {
        if (carouselInterval.current) clearInterval(carouselInterval.current);
      };
    } else {
      setCarouselIndex(0);
      if (carouselInterval.current) clearInterval(carouselInterval.current);
    }
  }, [events.length, openDialogId, carouselPaused]);

  return (
    <section id="events" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 max-w-4xl mx-auto animate-fade-in">
          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-primary ${language === "ta" ? "tamil-font" : ""}`}>
            {title}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            {subtitle}
          </p>
        </div>

        {loading ? (
          <div className="text-center text-primary-foreground">Loading...</div>
        ) : events.length === 0 ? (
          <div className="text-center text-primary-foreground">No events available</div>
        ) : (
          events.length > 3 ? (
            <div className="relative max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {events.slice(carouselIndex * 3, carouselIndex * 3 + 3).map((event, index) => {
                  const desc = language === "ta" ? event.EventDescTam : event.EventDescEng;
                  const isLong = desc.split(/\r?\n/).join(" ").length > 120 || desc.split(/\r?\n/).length > 1;
                  let formattedDate = event.EventDate;
                  if (event.EventDate) {
                    const dateObj = new Date(event.EventDate);
                    if (!isNaN(dateObj.getTime())) {
                      formattedDate = dateObj.toLocaleDateString(language === "ta" ? "ta-IN" : "en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                    }
                  }
                  let displayText = desc;
                  if (isLong) {
                    const firstLine = desc.split(/\r?\n/)[0];
                    displayText = firstLine.length > 120 ? firstLine.slice(0, 120) + "..." : firstLine;
                  }
                  return (
                    <>
                      <Card
                        key={event.EventId || index}
                        className="overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 group animate-scale-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                        onMouseEnter={() => setCarouselPaused(true)}
                        onMouseLeave={() => setCarouselPaused(false)}
                      >
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={event.EventImage}
                            alt={language === "ta" ? event.TitleTam : event.TitleEng}
                            className="w-full h-full object-contain bg-white transition-transform duration-500"
                            style={{ maxHeight: '300px', maxWidth: '100%' }}
                          />
                        </div>
                        <CardHeader>
                          <CardTitle className={`text-xl md:text-2xl ${language === "ta" ? "tamil-font" : ""}`}>
                            {language === "ta" ? event.TitleTam : event.TitleEng}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className={`text-sm text-muted-foreground ${language === "ta" ? "tamil-font" : ""}`}>
                            {isLong ? displayText : desc}
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-foreground">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span className={language === "ta" ? "tamil-font" : ""}>{formattedDate}</span>
                            </div>
                            <div className="flex items-center gap-2 text-foreground">
                              <Clock className="w-4 h-4 text-primary" />
                              <span className={language === "ta" ? "tamil-font" : ""}>{event.EventTime}</span>
                            </div>
                            <div className="flex items-center gap-2 text-foreground">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className={language === "ta" ? "tamil-font" : ""}>{language === "ta" ? event.EventLocationTam : event.EventLocationEng}</span>
                            </div>
                          </div>
                          {isLong && (
                            <div className="flex justify-center">
                              <Button size="sm" className="mt-2" onClick={() => setOpenDialogId(event.EventId || index)}>
                                {language === "ta" ? "மேலும்" : "View More"}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      {/* Popup Dialog for full description */}
                      <Dialog open={openDialogId === (event.EventId || index)} onOpenChange={(open) => !open && setOpenDialogId(null)}>
                        <DialogContent className="max-w-2xl w-full max-h-[80vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()}>
                          <DialogHeader>
                            <DialogTitle className={language === "ta" ? "tamil-font" : ""}>
                              {language === "ta" ? event.TitleTam : event.TitleEng}
                            </DialogTitle>
                            <DialogDescription asChild>
                              <div className={`whitespace-pre-line mt-2 ${language === "ta" ? "tamil-font" : ""}`}>{desc}</div>
                            </DialogDescription>
                          </DialogHeader>
                        </DialogContent>
                      </Dialog>
                    </>
                  );
                })}
              </div>
              {/* Carousel indicators */}
              <div className="flex justify-center mt-4 gap-2">
                {Array.from({ length: Math.ceil(events.length / 3) }).map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-3 h-3 rounded-full ${carouselIndex === idx ? 'bg-primary' : 'bg-gray-300'}`}
                    onClick={() => setCarouselIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
              {events.map((event, index) => {
                const desc = language === "ta" ? event.EventDescTam : event.EventDescEng;
                const isLong = desc.split(/\r?\n/).join(" ").length > 120 || desc.split(/\r?\n/).length > 1;
                let formattedDate = event.EventDate;
                if (event.EventDate) {
                  const dateObj = new Date(event.EventDate);
                  if (!isNaN(dateObj.getTime())) {
                    formattedDate = dateObj.toLocaleDateString(language === "ta" ? "ta-IN" : "en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });
                  }
                }
                let displayText = desc;
                if (isLong) {
                  const firstLine = desc.split(/\r?\n/)[0];
                  displayText = firstLine.length > 120 ? firstLine.slice(0, 120) + "..." : firstLine;
                }
                return (
                  <>
                    <Card
                      key={event.EventId || index}
                      className="overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 group animate-scale-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={event.EventImage}
                          alt={language === "ta" ? event.TitleTam : event.TitleEng}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <CardHeader>
                        <CardTitle className={`text-xl md:text-2xl ${language === "ta" ? "tamil-font" : ""}`}>
                          {language === "ta" ? event.TitleTam : event.TitleEng}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className={`text-sm text-muted-foreground ${language === "ta" ? "tamil-font" : ""}`}>
                          {isLong ? displayText : desc}
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-foreground">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className={language === "ta" ? "tamil-font" : ""}>{formattedDate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-foreground">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className={language === "ta" ? "tamil-font" : ""}>{event.EventTime}</span>
                          </div>
                          <div className="flex items-center gap-2 text-foreground">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span className={language === "ta" ? "tamil-font" : ""}>{language === "ta" ? event.EventLocationTam : event.EventLocationEng}</span>
                          </div>
                        </div>
                        {isLong && (
                          <div className="flex justify-center">
                            <Button size="sm" className="mt-2" onClick={() => setOpenDialogId(event.EventId || index)}>
                              {language === "ta" ? "மேலும்" : "View More"}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    {/* Popup Dialog for full description */}
                    <Dialog open={openDialogId === (event.EventId || index)} onOpenChange={(open) => !open && setOpenDialogId(null)}>
                      <DialogContent className="max-w-2xl w-full max-h-[80vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()}>
                        <DialogHeader>
                          <DialogTitle className={language === "ta" ? "tamil-font" : ""}>
                            {language === "ta" ? event.TitleTam : event.TitleEng}
                          </DialogTitle>
                          <DialogDescription asChild>
                            <div className={`whitespace-pre-line mt-2 ${language === "ta" ? "tamil-font" : ""}`}>{desc}</div>
                          </DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                  </>
                );
              })}
            </div>
          )
        )}
      </div>
    </section>
  );
};

export default EventsSection;
