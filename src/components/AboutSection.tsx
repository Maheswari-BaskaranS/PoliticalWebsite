
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { X } from "lucide-react";
import logo from "../assets/icons/logo.jpg";

import FB_IMG_1732455484933 from "../assets/TMK/FB_IMG_1732455484933.jpg";
import FB_IMG_1732455515910 from "../assets/TMK/FB_IMG_1732455515910.jpg";
import FB_IMG_1732455553370 from "../assets/TMK/FB_IMG_1732455553370.jpg";
import FB_IMG_1743321016386 from "../assets/TMK/FB_IMG_1743321016386.jpg";
import FB_IMG_1743321024849 from "../assets/TMK/bg2.jpg";
import FB_IMG_1745844100759 from "../assets/TMK/FB_IMG_1745844100759.jpg";
import IMG_20241216_WA0057 from "../assets/TMK/IMG-20241216-WA0057.jpg";
import IMG_20241217_WA0000 from "../assets/TMK/IMG-20241217-WA0000.jpg";
import IMG_20241224_WA0067 from "../assets/TMK/IMG-20241224-WA0067.jpg";
import IMG_20241230_WA0027 from "../assets/TMK/IMG-20241230-WA0027.jpg";
import IMG_20241230_WA0038 from "../assets/TMK/IMG-20241230-WA0038.jpg";
import IMG_20250228_WA0105 from "../assets/TMK/IMG-20250228-WA0105.jpg";
import IMG_20250301_WA0035 from "../assets/TMK/IMG-20250301-WA0035.jpg";
import IMG_20250301_WA0046 from "../assets/TMK/IMG-20250301-WA0046.jpg";
import IMG_20250313_WA0055 from "../assets/TMK/IMG-20250313-WA0055.jpg";
import IMG_20250313_WA0061 from "../assets/TMK/IMG-20250313-WA0061.jpg";
import IMG_20250327_WA0104 from "../assets/TMK/IMG-20250327-WA0104.jpg";
import IMG_20250330_WA0409 from "../assets/TMK/IMG-20250330-WA0409.jpg";
import IMG_20250417_WA0070 from "../assets/TMK/IMG-20251111-WA0033.jpg";
import IMG_20250426_WA0057 from "../assets/TMK/IMG-20250426-WA0057.jpg";
import IMG_20250427_WA0123 from "../assets/TMK/IMG-20250427-WA0123.jpg";
import IMG_20250428_WA0005 from "../assets/TMK/IMG-20250428-WA0005.jpg";
import IMG_20250428_WA0007 from "../assets/TMK/IMG-20250428-WA0007.jpg";
import IMG_20250428_WA0008 from "../assets/TMK/IMG-20250428-WA0008.jpg";
import IMG_20250428_WA0009 from "../assets/TMK/IMG-20250428-WA0009.jpg";
import IMG_20250429_WA0016 from "../assets/TMK/IMG-20250429-WA0016.jpg";
import IMG_20250429_WA0058 from "../assets/TMK/IMG-20250429-WA0058.jpg";
import IMG_20250501_WA0070 from "../assets/TMK/FB_IMG_1732455484933.jpg";

interface AboutSectionProps {
  language: "ta" | "en";
}

const AboutSection = ({ language }: AboutSectionProps) => {
  const [currentImageSet, setCurrentImageSet] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // About content state
  const [aboutData, setAboutData] = useState<any>(null);
  const [aboutLoading, setAboutLoading] = useState(true);

  // Fetch AboutPage data from API
  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/AboutPage/GetAllAboutPage`);
        if (Array.isArray(res.data)) {
          setAboutData(res.data.find((a: any) => a.IsActive));
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          setAboutData(res.data.data.find((a: any) => a.IsActive));
        } else {
          setAboutData(null);
        }
      } catch (e) {
        setAboutData(null);
      } finally {
        setAboutLoading(false);
      }
    };
    fetchAbout();
  }, []);

  // TMK Images array
  const tmkImages = [
    FB_IMG_1732455484933,
    FB_IMG_1732455515910,
    FB_IMG_1732455553370,
    FB_IMG_1743321016386,
    FB_IMG_1743321024849,
    FB_IMG_1745844100759,
    IMG_20241216_WA0057,
    IMG_20241217_WA0000,
    IMG_20241224_WA0067,
    IMG_20241230_WA0027,
    IMG_20241230_WA0038,
    IMG_20250228_WA0105,
    IMG_20250301_WA0035,
    IMG_20250301_WA0046,
    IMG_20250313_WA0055,
    IMG_20250313_WA0061,
    IMG_20250327_WA0104,
    IMG_20250330_WA0409,
    IMG_20250417_WA0070,
    IMG_20250426_WA0057,
    IMG_20250427_WA0123,
    IMG_20250428_WA0005,
    IMG_20250428_WA0007,
    IMG_20250428_WA0008,
    IMG_20250428_WA0009,
    IMG_20250429_WA0016,
    IMG_20250429_WA0058,
    IMG_20250501_WA0070,
  ];

  // Group images into sets of 5
  const imageGroups = [];
  for (let i = 0; i < tmkImages.length; i += 5) {
    imageGroups.push(tmkImages.slice(i, i + 5));
  }

  // Auto-advance slideshow every 1 minute (60000ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageSet((prev) => (prev + 1) % imageGroups.length);
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [imageGroups.length]);

  const currentImages = imageGroups[currentImageSet] || [];

  // Handle scroll to Goals section
  const scrollToGoals = () => {
    const goalsSection = document.getElementById('goals');
    if (goalsSection) {
      goalsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle image click
  const handleImageClick = (imageSrc: string) => {
    setSelectedImage(imageSrc);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseModal();
      }
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  const content = aboutData
    ? {
        ta: {
          title: aboutData.AboutTitleTam,
          text: aboutData.AboutDescTam,
          cta: "மேலும் அறிக",
        },
        en: {
          title: aboutData.AboutTitleEng,
          text: aboutData.AboutDescEng,
          cta: "Learn More",
        },
      }
    : {
        ta: { title: "", text: "", cta: "மேலும் அறிக" },
        en: { title: "", text: "", cta: "Learn More" },
      };

  return (
    <section id="about" className="py-4 md:py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12 animate-fade-in">
          {aboutLoading ? (
            <div className="text-primary-foreground">Loading...</div>
          ) : !aboutData ? (
            <div className="text-primary-foreground">No about data available</div>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary/20 mb-4 bg-white shadow">
                  <img
                    src={logo}
                    alt="TMK Party Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-primary ${language === "ta" ? "tamil-font" : ""}`}>
                {content[language].title}
              </h2>
              <p className={`text-base md:text-lg text-foreground leading-relaxed mb-4 ${language === "ta" ? "tamil-font" : ""}`}>
                {content[language].text}
              </p>
              <Button 
                size="lg" 
                className="shadow-elevated hover:scale-105 transition-transform mb-0"
                onClick={scrollToGoals}
              >
                {content[language].cta}
              </Button>
            </>
          )}
        </div>

        {/* TMK Image Grid - Shows 5 images at a time */}
        {/* <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mt-12 max-w-6xl mx-auto">
          {currentImages.map((src, index) => (
            <Card
              key={`${currentImageSet}-${index}`}
              className="overflow-hidden group cursor-pointer shadow-card hover:shadow-elevated transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => handleImageClick(src)}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={src}
                  alt={`TMK Community ${currentImageSet * 5 + index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
            </Card>
          ))}
        </div> */}

        {/* Image Set Indicator */}
        {/* <div className="flex justify-center mt-6 space-x-2">
          {imageGroups.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageSet(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentImageSet
                  ? 'bg-primary scale-125'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Show image set ${index + 1}`}
            />
          ))}
        </div> */}

        {/* Image Preview Modal */}
        {/* {selectedImage && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
              
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Close image preview"
              >
                <X className="w-6 h-6" />
              </button>
              
          
              <img
                src={selectedImage}
                alt="TMK Community Preview"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )} */}
      </div>
    </section>
  );
};

export default AboutSection;
