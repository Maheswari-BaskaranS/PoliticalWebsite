import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import GoalsSection from "@/components/GoalsSection";
import EventsSection from "@/components/EventsSection";
import JoinSection from "@/components/JoinSection";
import SwitchableForm from "@/components/ui/SwitchableForm";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  const [language, setLanguage] = useState<"ta" | "en">("ta");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "ta" ? "en" : "ta"));
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header language={language} onLanguageToggle={toggleLanguage} />
      
      <main>
        <HeroSection language={language} />
        <AboutSection language={language} />
        <GoalsSection language={language} />
        <EventsSection language={language} />
        {/* <JoinSection language={language} /> */}
        <SwitchableForm language={language} onLanguageChange={setLanguage} />
        <ContactSection language={language} />
      </main>

      <Footer language={language} />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-8 right-8 rounded-full shadow-elevated z-50 animate-fade-in"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};

export default Index;
