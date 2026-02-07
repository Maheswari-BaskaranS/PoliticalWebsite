import { useEffect, useState } from "react";
import { Facebook, Instagram, Youtube, Twitter } from "lucide-react";
import logo from "../assets/icons/logo.jpg";
import { API_BASE_URL } from "@/lib/api";

interface FooterProps {
  language: "ta" | "en";
}

const Footer = ({ language }: FooterProps) => {
  const [footer, setFooter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFooter = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE_URL}/api/FooterPage/GetAllFooterPage`);
        const json = await res.json();
        if (json && json.Status && Array.isArray(json.data) && json.data.length > 0) {
          setFooter(json.data[0]);
        } else {
          setError("No footer info found");
        }
      } catch (e) {
        setError("Failed to load footer info");
      } finally {
        setLoading(false);
      }
    };
    fetchFooter();
  }, []);

  const content = {
    ta: {
      copyright: "© 2025 TMK கட்சி. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
      followUs: "எங்களை பின்பற்றுங்கள்",
    },
    en: {
      copyright: "© 2025 TMK Party. All rights reserved.",
      followUs: "Follow Us",
    },
  };

  const socialLinks = footer
    ? [
        { icon: Facebook, href: footer.FBLink, label: "Facebook" },
        { icon: Instagram, href: footer.InstaLink, label: "Instagram" },
        { icon: Youtube, href: footer.YouTubeLink, label: "YouTube" },
        { icon: Twitter, href: footer.TwitterLink, label: "Twitter" },
      ].filter(link => link.href && link.href.trim() !== "")
    : [];

  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                {/* Logo & Description */}
                <div className="text-center md:text-left">
                  <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-foreground/20">
                      <img
                        src={logo}
                        alt="TMK Party Logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-lg">
                        {language === "ta" ? "தெ.மு.க" : "TMK"}
                      </span>
                      <span className="text-xs opacity-90">
                        {language === "ta" ? "தெலுங்கினர் முன்னேற்ற கழகம்" : "Teluginar Munetra Kazhagam"}
                      </span>
                    </div>
                  </div>
                  <p className={`text-sm opacity-90 max-w-md ${language === "ta" ? "tamil-font" : ""}`}>
                    {language === "ta" ? (footer?.DescTam || "") : (footer?.DescEng || "")}
                  </p>
                </div>

                {/* Social Links */}
                <div className="text-center">
                  <h3 className={`font-semibold mb-4 ${language === "ta" ? "tamil-font" : ""}`}>
                    {content[language].followUs}
                  </h3>
                  <div className="flex gap-3 justify-center">
                    {socialLinks.map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        aria-label={social.label}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
                      >
                        <social.icon className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Copyright */}
              <div className="mt-8 pt-8 border-t border-primary-foreground/20 text-center">
                <p className={`text-sm opacity-80 ${language === "ta" ? "tamil-font" : ""}`}>
                  {content[language].copyright}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
