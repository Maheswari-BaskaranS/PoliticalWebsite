import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Globe, Menu, X } from "lucide-react";
import logo from "../assets/icons/logo.jpg"

interface HeaderProps {
  language: "ta" | "en";
  onLanguageToggle: () => void;
}

const Header = ({ language, onLanguageToggle }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const menuItems = {
    ta: ["முகப்பு", "பற்றி", "இலக்குகள்", "நிகழ்வுகள்", "இணைய", "தொடர்பு"],
    en: ["Home", "About", "Goals", "Events", "Join", "Contact"],
  };

  const sections = ["hero", "about", "goals", "events", "join", "contact"];

  // Track which section is currently in view
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset for header height
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element) {
          const elementTop = element.offsetTop;
          if (scrollPosition >= elementTop) {
            setActiveSection(i);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (index: number) => {
    const element = document.getElementById(sections[index]);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 md:w-18 md:h-18 rounded-full overflow-hidden border-2 border-primary/20">
              <img 
                src={logo} 
                alt="TMK Party Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base md:text-lg text-primary">
                {language === "ta" ? "தெ.மு.க" : "TMK"}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:block">
                {language === "ta" ? "தெலுங்கினர் முன்னேற்ற கழகம்" : "Teluginar Munetra Kazhagam"}
              </span>
            </div>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden lg:flex items-center gap-6">
            {menuItems[language].map((item, index) => (
              <button
                key={item}
                onClick={() => scrollToSection(index)}
                className={`relative text-sm font-medium transition-all duration-300 px-3 py-2 rounded-md hover:scale-105 group ${
                  activeSection === index
                    ? 'text-primary bg-primary/10 scale-105'
                    : 'text-foreground hover:text-primary hover:bg-primary/10'
                }`}
              >
                <span className="relative z-10">{item}</span>
                {/* Hover/Active underline effect */}
                <div className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${
                  activeSection === index ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></div>
              </button>
            ))}
          </nav>

          {/* Language Toggle & Mobile Menu */}
          <div className="flex items-center gap-2">
<Button
  variant="outline"
  size="sm"
  onClick={onLanguageToggle}
  className="relative w-24 h-8 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden"
>
  <div
    className={`absolute top-1 left-1 h-6 w-11 rounded-full bg-white shadow transition-all duration-300 ${
      language === "ta" ? "translate-x-0" : "translate-x-12"
    }`}
  ></div>

  <div className="absolute inset-0 flex text-xs font-medium items-center justify-between px-3">
    <span className={language === "ta" ? "text-black" : "text-gray-500"}>தமிழ்</span>
    <span className={language === "ta" ? "text-gray-500" : "text-black"}>EN</span>
  </div>
</Button>




            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              {menuItems[language].map((item, index) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(index)}
                  className={`text-left px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 hover:translate-x-2 hover:scale-105 relative group ${
                    activeSection === index
                      ? 'bg-primary/10 text-primary translate-x-2 scale-105'
                      : 'text-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  <span className="relative z-10">{item}</span>
                  {/* Mobile hover/active indicator */}
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-primary rounded-r transition-all duration-300 ${
                    activeSection === index ? 'h-full' : 'h-0 group-hover:h-full'
                  }`}></div>
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
