import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Target, Users, Award, Scale } from "lucide-react";
import axios from "axios";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";

interface GoalsSectionProps {
  language: "ta" | "en";
}

const GoalsSection = ({ language }: GoalsSectionProps) => {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  // Optionally, you can add subtitle/quote as API fields if available
  const subtitle = language === "ta"
    ? "தமிழகத்தில் 40% அதிகமான தெலுங்கு பேசக்கூடிய மக்கள் வாழ்கிறார்கள்"
    : "More than 40% Telugu-speaking people live in Tamil Nadu";
  const quote = language === "ta"
    ? "நாம் வாழும் மண்ணில் நாமாக வாழமுடியவில்லையெனில் சுதந்திரம் கண்டு என்ன பயன்?"
    : "If we cannot live as ourselves in the land we live in, what is the use of finding freedom?";

  // Icon mapping for first 4 cards, fallback to Target
  const icons = [Target, Users, Scale, Award];

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/GoalsPage/GetAllGoalsPage`);
        let data = [];
        if (Array.isArray(res.data)) {
          data = res.data.filter((g: any) => g.IsActive);
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          data = res.data.data.filter((g: any) => g.IsActive);
        }
        setGoals(data);
        if (data.length > 0) {
          setTitle(language === "ta" ? data[0].GoalTitleTam : data[0].GoalTitleEng);
        }
      } catch (e) {
        setGoals([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  return (
    <section id="goals" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 max-w-4xl mx-auto animate-fade-in">
          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-primary ${language === "ta" ? "tamil-font" : ""}`}>
            {title}
          </h2>
          <p className={`text-base md:text-lg text-muted-foreground mb-6 ${language === "ta" ? "tamil-font" : ""}`}>
            {subtitle}
          </p>
          <blockquote className={`text-lg md:text-xl font-semibold text-foreground italic border-l-4 border-secondary pl-4 py-2 ${language === "ta" ? "tamil-font" : ""}`}>
            "{quote}"
          </blockquote>
        </div>

        {loading ? (
          <div className="text-center text-primary-foreground">Loading...</div>
        ) : goals.length === 0 ? (
          <div className="text-center text-primary-foreground">No goals available</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
            {goals.map((goal, index) => {
              const Icon = icons[index] || Target;
              return (
                <Card
                  key={goal.GoalPageId || index}
                  className="shadow-card hover:shadow-elevated transition-all duration-300 border-2 hover:border-primary/20 group animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <CardTitle className={`text-xl md:text-2xl ${language === "ta" ? "tamil-font" : ""}`}>
                      {language === "ta" ? goal.GoalItemTam : goal.GoalItemEng}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-muted-foreground leading-relaxed ${language === "ta" ? "tamil-font" : ""}`}>
                      {language === "ta" ? goal.GoalDescTam : goal.GoalDescEng}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default GoalsSection;
