import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";

interface HeroSectionProps {
  language: "ta" | "en";
}

const HeroSection = ({ language }: HeroSectionProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Dynamic banners state
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/Banners/GetAllBanners`)
        if (Array.isArray(res.data)) {
          setBanners(res.data.filter((b: any) => b.IsActive));
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          setBanners(res.data.data.filter((b: any) => b.IsActive));
        } else {
          setBanners([]);
        }
      } catch (e) {
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);


  // Auto-slide logic (dynamic length)
  useEffect(() => {
    if (!banners.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % (banners.length || 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + (banners.length || 1)) % (banners.length || 1));

  const scrollToAbout = () => {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="hero" className="relative h-[600px] md:h-[700px] overflow-hidden pt-16 md:pt-20">
      {/* Background Images with Slideshow */}
      <div className="absolute inset-0">
        {banners.map((banner, index) => (
          <div
            key={banner.BannerId || index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlide === index ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${banner.BannerImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 5%', // move image a bit down
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/70"></div>
          </div>
        ))}

        {/* Additional gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary-dark/20 to-secondary/20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0djMyaDRWMTR6bTAgMGg0djRoLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        {loading ? (
          <div className="w-full text-center text-primary-foreground">Loading...</div>
        ) : banners.length === 0 ? (
          <div className="w-full text-center text-primary-foreground">No banners available</div>
        ) : (
          <div className="w-full max-w-4xl mx-auto text-center text-primary-foreground animate-fade-in">
            <h1 className={`text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight ${language === "ta" ? "tamil-font" : ""}`}>
              {language === "ta"
                ? banners[currentSlide]?.BannerTitleTam
                : banners[currentSlide]?.BannerTitleEng}
            </h1>
            <p className="text-lg md:text-2xl mb-8 opacity-90">
              {language === "ta"
                ? banners[currentSlide]?.BannerDescTam
                : banners[currentSlide]?.BannerDescEng}
            </p>
            {banners[currentSlide]?.ButtonURL ? (
              <a
                href={banners[currentSlide].ButtonURL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  variant="secondary"
                  className="font-semibold text-base md:text-lg px-8 py-6 shadow-elevated hover:scale-105 transition-transform"
                >
                  {language === "ta" ? "மேலும் அறிக" : "Learn More"}
                </Button>
              </a>
            ) : (
              <Button
                size="lg"
                variant="secondary"
                className="font-semibold text-base md:text-lg px-8 py-6 shadow-elevated hover:scale-105 transition-transform"
                onClick={scrollToAbout}
              >
                {language === "ta" ? "மேலும் அறிக" : "Learn More"}
              </Button>
            )}
          </div>
        )}

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-background/30 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-background/30 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Slide Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
                currentSlide === index ? "bg-primary-foreground w-6 md:w-8" : "bg-primary-foreground/40"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroSection;
