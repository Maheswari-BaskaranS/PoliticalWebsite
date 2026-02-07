import { useEffect, useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { API_BASE_URL } from "@/lib/api";

interface ContactSectionProps {
  language: "ta" | "en";
}

const ContactSection = ({ language }: ContactSectionProps) => {
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchContact = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE_URL}/api/ContactPage/GetAllContactPage`);
        const json = await res.json();
        if (json && json.Status && Array.isArray(json.data) && json.data.length > 0) {
          setContact(json.data[0]);
        } else {
          setError("No contact info found");
        }
      } catch (e) {
        setError("Failed to load contact info");
      } finally {
        setLoading(false);
      }
    };
    fetchContact();
  }, []);

  const content = {
    ta: {
      title: "தொடர்பு கொள்ள",
      subtitle: "எங்களை தொடர்பு கொள்ள தயங்க வேண்டாம்",
      address: "முகவரி",
      phone: "தொலைபேசி",
      email: "மின்னஞ்சல்",
    },
    en: {
      title: "Contact Us",
      subtitle: "Feel free to reach out to us",
      address: "Address",
      phone: "Phone",
      email: "Email",
    },
  };

  const contactInfo = contact
    ? [
        {
          icon: MapPin,
          label: content[language].address,
          value: language === "ta" ? contact.AddressTam : contact.AddressEng,
          color: "bg-primary",
        },
        {
          icon: Phone,
          label: content[language].phone,
          value: contact.PhoneNo,
          color: "bg-secondary",
        },
        {
          icon: Mail,
          label: content[language].email,
          value: contact.EMailId,
          color: "bg-primary",
        },
      ]
    : [];

  return (
    <section id="contact" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 max-w-4xl mx-auto animate-fade-in">
          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-primary ${language === "ta" ? "tamil-font" : ""}`}>
            {content[language].title}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            {content[language].subtitle}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {contactInfo.map((item, index) => (
                  <Card
                    key={index}
                    className="text-center shadow-card hover:shadow-elevated transition-all duration-300 animate-scale-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="pt-6">
                      <div className={`w-14 h-14 rounded-full ${item.color} flex items-center justify-center mx-auto mb-4`}>
                        <item.icon className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <h3 className={`font-semibold text-lg mb-2 ${language === "ta" ? "tamil-font" : ""}`}>
                        {item.label}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {item.value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Embedded Map */}
              {contact.GoogleMapUrl && (
                <Card className="overflow-hidden shadow-elevated animate-fade-in">
                  <div className="aspect-video w-full">
                    <iframe
                      src={contact.GoogleMapUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="TMK Party Office Location"
                    />
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
