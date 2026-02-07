import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface JoinSectionProps {
  language: "ta" | "en";
}


const JoinSection = ({ language }: JoinSectionProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    state: "",
    city: "",
    ward: "",
    message: "",
  });
  const [idImage, setIdImage] = useState<string>("");
  const [imageError, setImageError] = useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch states from API (hooks must be at the top)
  const [states, setStates] = useState<any[]>([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [statesError, setStatesError] = useState("");

  React.useEffect(() => {
    const fetchStates = async () => {
      setStatesLoading(true);
      setStatesError("");
      try {
        const res = await fetch(`${API_BASE_URL}/api/State/GetAllState`);
        const json = await res.json();
        if (json && json.Status && Array.isArray(json.data)) {
          setStates(json.data);
        } else {
          setStatesError("No states found");
        }
      } catch (e) {
        setStatesError("Failed to load states");
      } finally {
        setStatesLoading(false);
      }
    };
    fetchStates();
  }, []);

  // Fetch cities from API
  const [cities, setCities] = useState<any[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState("");

  React.useEffect(() => {
    if (!formData.state) {
      setCities([]);
      return;
    }
    const selectedState = states.find(s => (language === "ta" ? s.StateNameTam === formData.state : s.StateNameEng === formData.state));
    if (!selectedState) {
      setCities([]);
      return;
    }
    setCitiesLoading(true);
    setCitiesError("");
    fetch(`${API_BASE_URL}/api/City/GetAllCity`)
      .then(res => res.json())
      .then(json => {
        if (json && json.Status && Array.isArray(json.data)) {
          // Filter cities by selected state id
          setCities(json.data.filter((c: any) => c.StateId === selectedState.StateId));
        } else {
          setCitiesError("No cities found");
        }
      })
      .catch(() => setCitiesError("Failed to load cities"))
      .finally(() => setCitiesLoading(false));
  }, [formData.state, language, states]);

  // Fetch areas from API
  const [areas, setAreas] = useState<any[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [areasError, setAreasError] = useState("");

  React.useEffect(() => {
    if (!formData.state || !formData.city) {
      setAreas([]);
      return;
    }
    const selectedState = states.find(s => (language === "ta" ? s.StateNameTam === formData.state : s.StateNameEng === formData.state));
    const selectedCity = cities.find(c => (language === "ta" ? c.CityNameTam === formData.city : c.CityNameEng === formData.city));
    if (!selectedState || !selectedCity) {
      setAreas([]);
      return;
    }
    setAreasLoading(true);
    setAreasError("");
    fetch(`${API_BASE_URL}/api/Area/GetAllArea`)
      .then(res => res.json())
      .then(json => {
        if (json && json.Status && Array.isArray(json.data)) {
          setAreas(json.data.filter((a: any) => a.StateId === selectedState.StateId && a.CityId === selectedCity.CityId));
        } else {
          setAreasError("No areas found");
        }
      })
      .catch(() => setAreasError("Failed to load areas"))
      .finally(() => setAreasLoading(false));
  }, [formData.state, formData.city, language, states, cities]);

  // Filtered cities are now in cities state
  // Filtered areas are now in areas state

  const content = {
    ta: {
      title: "TMK இல் இணையுங்கள்",
      subtitle: "இயக்கத்தில் சேர்ந்து மாற்றத்தின் பகுதியாகுங்கள்",
      name: "பெயர்",
      email: "மின்னஞ்சல்",
      phone: "தொலைபேசி எண்",
      state: "மாநிலம்",
      city: "நகரம்",
      ward: "வார்டு",
      message: "செய்தி (விரும்பினால்)",
      submit: "இயக்கத்தில் சேரவும்",
      successTitle: "வெற்றி!",
      successMessage: "உங்கள் விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது",
    },
    en: {
      title: "Join TMK",
      subtitle: "Be part of the movement and create change",
      name: "Name",
      email: "Email",
      phone: "Phone Number",
      state: "State",
      city: "City",
      ward: "Ward",
      message: "Message (Optional)",
      submit: "Join the Movement",
      successTitle: "Success!",
      successMessage: "Your application has been submitted successfully",
    },
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 60 * 1024) {
      setImageError(language === "ta" ? "60KB-ஐ விட குறைவாக ஒரு படத்தை பதிவேற்றவும்" : "Please upload an image below 60KB.");
      setIdImage("");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setIdImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

const googleTransliterate = async (text: string) => {
  const url = `https://inputtools.google.com/request?text=${encodeURIComponent(
    text
  )}&itc=ta-t-i0-und&num=1`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return data?.[1]?.[0]?.[1]?.[0] || text;
  } catch {
    return text;
  }
};

// Full Tamil → English transliteration (high accuracy)
const tamilToEnglish = (input: string) => {
  const uyir = [
    "a","aa","i","ii","u","uu","e","ee","ai","o","oo","au"
  ];

  const mei = [
    "k","ng","ch","nj","t","nn","th","n","p","m",
    "y","r","l","v","zh","ll","rr","nnn"
  ];

  const uyirmei = [
    ["k","ka","kaa","ki","kee","ku","kuu","ke","kee","kai","ko","koo","kau"],
    ["ng","nga","ngaa","ngi","ngee","ngu","nguu","nge","ngee","ngai","ngo","ngoo","ngau"],
    ["ch","cha","chaa","chi","chee","chu","chuu","che","chee","chai","cho","choo","chau"],
    ["nj","nja","njaa","nji","njee","nju","njuu","nje","njee","njai","njo","njoo","njau"],
    ["t","ta","taa","ti","tee","tu","tuu","te","tee","tai","to","too","tau"],
    ["nn","nna","nnaa","nni","nnee","nnu","nnuu","nne","nnee","nnai","nno","nnoo","nnau"],
    ["th","tha","thaa","thi","thee","thu","thuu","the","thee","thai","tho","thoo","thau"],
    ["n","na","naa","ni","nee","nu","nuu","ne","nee","nai","no","noo","nau"],
    ["p","pa","paa","pi","pee","pu","puu","pe","pee","pai","po","poo","pau"],
    ["m","ma","maa","mi","mee","mu","muu","me","mee","mai","mo","moo","mau"],
    ["y","ya","yaa","yi","yee","yu","yuu","ye","yee","yai","yo","yoo","yau"],
    ["r","ra","raa","ri","ree","ru","ruu","re","ree","rai","ro","roo","rau"],
    ["l","la","laa","li","lee","lu","luu","le","lee","lai","lo","loo","lau"],
    ["v","va","vaa","vi","vee","vu","vuu","ve","vee","vai","vo","voo","vau"],
    ["zh","zha","zhaa","zhi","zhee","zhu","zhuu","zhe","zhee","zhai","zho","zhoo","zhau"],
    ["ll","lla","llaa","lli","llee","llu","lluu","lle","llee","llai","llo","lloo","llau"],
    ["rr","rra","rraa","rri","rree","rru","rruu","rre","rree","rrai","rro","rroo","rrau"],
    ["nnn","nnna","nnnaa","nnni","nnnee","nnnu","nnnuu","nnne","nnnee","nnnai","nnno","nnnoo","nnnau"],
  ];

  const vowelSigns: any = {
    "ா": 1, "ி": 2, "ீ": 3, "ு": 4, "ூ": 5,
    "ெ": 6, "ே": 7, "ை": 8, "ொ": 9, "ோ": 10, "ௌ": 11
  };

  const base = [
    "க","ங","ச","ஞ","ட","ண","த","ந","ப","ம",
    "ய","ர","ல","வ","ழ","ள","ற","ன"
  ];

  let result = "";
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    // Uyir letters
    const uyirIndex = "அஆஇஈஉஊஎஏஐஒஓஔ".indexOf(ch);
    if (uyirIndex !== -1) {
      result += uyir[uyirIndex];
      continue;
    }

    // Mei or Uyirmei resolution
    const meiIndex = base.indexOf(ch);
    if (meiIndex !== -1) {
      const next = input[i + 1];
      if (next && vowelSigns[next] !== undefined) {
        result += uyirmei[meiIndex][vowelSigns[next]];
        i++;
      } else {
        result += mei[meiIndex];
      }
      continue;
    }

    // Other characters (skip standalone pulli)
    if (ch === "்") continue;

    result += ch;
  }

  // Remove leftover pulli if any
  return result.replace(/்/g, "");
};




const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Basic validation
  if (!formData.name || !formData.email || !formData.phone) {
    toast({
      title: language === "ta" ? "பிழை" : "Error",
      description:
        language === "ta"
          ? "அனைத்து தேவையான துறைகளையும் நிரப்பவும்"
          : "Please fill all required fields",
      variant: "destructive",
    });
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    toast({
      title: language === "ta" ? "மின்னஞ்சல் பிழை" : "Invalid Email",
      description:
        language === "ta"
          ? "சரியான மின்னஞ்சலை உள்ளிடவும்"
          : "Please enter a valid email",
      variant: "destructive",
    });
    return;
  }

  // Phone validation
  const phone = formData.phone.replace(/\D/g, "");
  if (phone.length < 6 || phone.length > 15) {
    toast({
      title: language === "ta" ? "தொலைபேசி பிழை" : "Invalid Phone",
      description:
        language === "ta"
          ? "தொலைபேசி எண் 6 முதல் 15 இலக்கங்கள் இருக்க வேண்டும்"
          : "Phone must be 6–15 digits",
      variant: "destructive",
    });
    return;
  }

  if (!idImage) {
    toast({
      title: language === "ta" ? "படம் தேவை" : "Image Required",
      description:
        language === "ta"
          ? "அடையாள அட்டை படத்தை பதிவேற்றவும்"
          : "Upload ID Card image",
      variant: "destructive",
    });
    return;
  }

  // Resolve State / City / Area
  const selectedState = states.find((s) =>
    language === "ta"
      ? s.StateNameTam === formData.state
      : s.StateNameEng === formData.state
  );

  const selectedCity = cities.find((c) =>
    language === "ta"
      ? c.CityNameTam === formData.city
      : c.CityNameEng === formData.city
  );

  const selectedArea = areas.find((a) =>
    language === "ta"
      ? a.AreaNameTam === formData.ward
      : a.AreaNameEng === formData.ward
  );

  // 💥 HIGH ACCURACY NAME TRANSLITERATION FIXED HERE
  let nameTam = "";
  let nameEng = "";

if (language === "ta") {
  nameTam = formData.name;
  nameEng = tamilToEnglish(formData.name); // HIGH ACCURACY
} else {
  nameEng = formData.name;
  nameTam = await googleTransliterate(formData.name); // EN → TA
}


  // Payload
  const payload = {
    OrgId: 1,
    MemberNo: "",
    NameTam: nameTam,
    NameEng: nameEng,
    EmailId: formData.email,
    StateId: selectedState?.StateId || 0,
    CityId: selectedCity?.CityId || 0,
    AreaId: selectedArea?.AreaId || 0,
    StateNameTam: selectedState?.StateNameTam || "",
    CityNameTam: selectedCity?.CityNameTam || "",
    AreaNameTam: selectedArea?.AreaNameTam || "",
    StateNameEng: selectedState?.StateNameEng || "",
    CityNameEng: selectedCity?.CityNameEng || "",
    AreaNameEng: selectedArea?.AreaNameEng || "",
    IdCardImg: idImage,
    IsActive: true,
    CreatedBy: 1,
    PhoneNo: formData.phone,
    Message: formData.message,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/Members/AddMembers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (json?.Status) {
      toast({
        title: content[language].successTitle,
        description: content[language].successMessage,
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        state: "",
        city: "",
        ward: "",
        message: "",
      });
      setIdImage("");
      setImageError("");

      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      toast({
        title: "Error",
        description: json?.Message || "Submission failed",
        variant: "destructive",
      });
    }
  } catch (err) {
    toast({
      title: "Error",
      description: "Submission failed",
      variant: "destructive",
    });
  }
};



  return (
    <section id="join" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-primary ${language === "ta" ? "tamil-font" : ""}`}>
              {content[language].title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground">
              {content[language].subtitle}
            </p>
          </div>

          <Card className="shadow-elevated animate-scale-in">
            <CardHeader>
              <CardTitle className={language === "ta" ? "tamil-font" : ""}>
                {content[language].title}
              </CardTitle>
              <CardDescription className={language === "ta" ? "tamil-font" : ""}>
                {content[language].subtitle}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className={language === "ta" ? "tamil-font" : ""}>
                      {content[language].name} *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className={language === "ta" ? "tamil-font" : ""}>
                      {content[language].email} *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className={language === "ta" ? "tamil-font" : ""}>
                      {content[language].phone} *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className={language === "ta" ? "tamil-font" : ""}>
                      {content[language].state}
                    </Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData({ ...formData, state: value, city: "", ward: "" })}
                      disabled={statesLoading || !!statesError}
                    >
                      <SelectTrigger id="state" className="bg-background">
                        <SelectValue placeholder={statesLoading ? (language === "ta" ? "ஏற்றுகிறது..." : "Loading...") : (language === "ta" ? "தேர்ந்தெடுக்கவும்" : "Select State")} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {statesError ? (
                          <div className="text-red-500 px-4 py-2">{statesError}</div>
                        ) : (
                          states.map((state) => (
                            <SelectItem key={state.StateId} value={language === "ta" ? state.StateNameTam : state.StateNameEng}>
                              {language === "ta" ? state.StateNameTam : state.StateNameEng}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className={language === "ta" ? "tamil-font" : ""}>
                      {content[language].city}
                    </Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) => setFormData({ ...formData, city: value, ward: "" })}
                      disabled={!formData.state || citiesLoading || !!citiesError}
                    >
                      <SelectTrigger id="city" className="bg-background">
                        <SelectValue placeholder={citiesLoading ? (language === "ta" ? "ஏற்றுகிறது..." : "Loading...") : (language === "ta" ? "தேர்ந்தெடுக்கவும்" : "Select City")} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {citiesError ? (
                          <div className="text-red-500 px-4 py-2">{citiesError}</div>
                        ) : cities.length === 0 ? (
                          <div className="text-muted-foreground px-4 py-2">
                            {language === "ta" ? "நகரம் இல்லை" : "No city found"}
                          </div>
                        ) : (
                          cities.map((city) => (
                            <SelectItem key={city.CityId} value={language === "ta" ? city.CityNameTam : city.CityNameEng}>
                              {language === "ta" ? city.CityNameTam : city.CityNameEng}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ward" className={language === "ta" ? "tamil-font" : ""}>
                      {content[language].ward}
                    </Label>
                    <Select
                      value={formData.ward}
                      onValueChange={(value) => setFormData({ ...formData, ward: value })}
                      disabled={!formData.city || areasLoading || !!areasError}
                    >
                      <SelectTrigger id="ward" className="bg-background">
                        <SelectValue placeholder={areasLoading ? (language === "ta" ? "ஏற்றுகிறது..." : "Loading...") : (language === "ta" ? "தேர்ந்தெடுக்கவும்" : "Select Area")} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {areasError ? (
                          <div className="text-red-500 px-4 py-2">{areasError}</div>
                        ) : areas.length === 0 ? (
                          <div className="text-muted-foreground px-4 py-2">
                            {language === "ta" ? "பகுதி இல்லை" : "No area found"}
                          </div>
                        ) : (
                          areas.map((area) => (
                            <SelectItem key={area.AreaId} value={language === "ta" ? area.AreaNameTam : area.AreaNameEng}>
                              {language === "ta" ? area.AreaNameTam : area.AreaNameEng}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>


                <div className="space-y-2">
                  <Label htmlFor="idimage" className={language === "ta" ? "tamil-font" : ""}>
                    {language === "ta" ? "அடையாள அட்டை படம் (60KB-ஐ விட குறைவாக)" : "ID Card Image (Below 60KB)"} *
                  </Label>
                  <Input
                    id="idimage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                  />
                  {imageError && <div className="text-xs text-red-500">{imageError}</div>}
                  {idImage && !imageError && (
                    <img
                      src={idImage}
                      alt="ID Preview"
                      className="w-32 h-32 object-cover rounded mt-2 border"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className={language === "ta" ? "tamil-font" : ""}>
                    {content[language].message}
                  </Label>
                  <Textarea
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <Button type="submit" size="lg" className="w-full shadow-elevated">
                  {content[language].submit}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default JoinSection;
