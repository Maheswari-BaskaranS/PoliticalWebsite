// --- Transliteration logic from JoinSection ---
const googleTransliterate = async (text: string) => {
  const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=ta-t-i0-und&num=1`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data?.[1]?.[0]?.[1]?.[0] || text;
  } catch {
    return text;
  }
};

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
  const vowelSigns = {
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
    const uyirIndex = "அஆஇஈஉஊஎஏஐஒஓஔ".indexOf(ch);
    if (uyirIndex !== -1) {
      result += uyir[uyirIndex];
      continue;
    }
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
    if (ch === "்") continue;
    result += ch;
  }
  return result.replace(/்/g, "");
};

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { Users } from "lucide-react";
type SwitchableFormProps = {
  language: 'ta' | 'en';
  onLanguageChange?: (lang: 'ta' | 'en') => void;
};

// Switchable bilingual form component (Table-style government form + Modern form)
// Image (form sample) is loaded from the local path provided by the user.

export default function SwitchableForm({ language, onLanguageChange }: SwitchableFormProps) {

  const [layout, setLayout] = useState<'table' | 'modern'>('modern');
  const [isSaving, setIsSaving] = useState(false);
  // State/city/area dropdowns and image upload state

  const [icImage, setIcImage] = useState<string>("");
  const [imageError, setImageError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: 'தெலுங்கினர் முன்னேற்ற கழகம்',
    memberNo: '',
    registrationNo: '',
    chairmanName: '',
    fatherName: '',
    dob: '',
    age: '',
    qualification: '',
    legislativeAssembly: '',
    voterId: '',
    pollingBooth: '',
    mobileNo: '',
    whatsappNo: '',
    address: '',
    stateId: '',
    cityId: '',
    areaId: '',
    doorNo: '',
    district: '',
    village: '',
    icImage: '',
    email: '',
  });

  // Required fields for Next button (must be after form is defined)
  const requiredFields = [
    'chairmanName', 'fatherName', 'dob', 'age', 'qualification', 'voterId',
    'legislativeAssembly', 'pollingBooth', 'mobileNo', 'whatsappNo',
    'address', 'stateId', 'cityId', 'areaId', 'email'
  ];
  const isFormValid = requiredFields.every(
    (key) => {
      if (key === 'email') {
        // Simple email regex validation
        return form.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
      }
      return form[key] && String(form[key]).toString().trim() !== '';
    }
  );

  // Fetch states from API (hooks must be at the top)
  const [states, setStates] = useState<any[]>([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [statesError, setStatesError] = useState("");
  // Auto-calculate age from dob
  React.useEffect(() => {
    if (form.dob) {
      const dobDate = new Date(form.dob);
      if (!isNaN(dobDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - dobDate.getFullYear();
        const m = today.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
          age--;
        }
        if (String(age) !== form.age) {
          setForm(prev => ({ ...prev, age: String(age) }));
        }
      }
    }
  }, [form.dob]);
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
    if (!form.stateId) {
      setCities([]);
      return;
    }
    setCitiesLoading(true);
    setCitiesError("");
    fetch(`${API_BASE_URL}/api/City/GetAllCity`)
      .then(res => res.json())
      .then(json => {
        if (json && json.Status && Array.isArray(json.data)) {
          setCities(json.data.filter((c: any) => c.StateId === form.stateId));
        } else {
          setCitiesError("No cities found");
        }
      })
      .catch(() => setCitiesError("Failed to load cities"))
      .finally(() => setCitiesLoading(false));
  }, [form.stateId]);

  // Fetch areas from API
  const [areas, setAreas] = useState<any[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [areasError, setAreasError] = useState("");

  React.useEffect(() => {
    if (!form.stateId || !form.cityId) {
      setAreas([]);
      return;
    }
    setAreasLoading(true);
    setAreasError("");
    fetch(`${API_BASE_URL}/api/Area/GetAllArea`)
      .then(res => res.json())
      .then(json => {
        if (json && json.Status && Array.isArray(json.data)) {
          setAreas(json.data.filter((a: any) => a.StateId === form.stateId && a.CityId === form.cityId));
        } else {
          setAreasError("No areas found");
        }
      })
      .catch(() => setAreasError("Failed to load areas"))
      .finally(() => setAreasLoading(false));
  }, [form.stateId, form.cityId]);

    // Image upload handler
    // Compress image to JPEG and limit to 750KB
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setImageError("");
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 750 * 1024) {
        setImageError(language === "ta" ? "750KB-ஐ விட குறைவாக ஒரு படத்தை பதிவேற்றவும்" : "Please upload an image below 750KB.");
        setIcImage("");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const img = new window.Image();
        img.onload = async () => {
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setImageError('Canvas not supported');
            return;
          }
          ctx.drawImage(img, 0, 0);
          // Try compressing to JPEG, quality 0.7
          let quality = 0.7;
          let dataUrl = '';
          for (let i = 0; i < 5; i++) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
            // Check size (base64 size is about 4/3 of actual bytes)
            const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
            const byteLength = Math.floor(base64Length * 3 / 4);
            if (byteLength <= 750 * 1024) break;
            quality -= 0.15;
            if (quality < 0.3) break;
          }
          // Final check
          const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
          const byteLength = Math.floor(base64Length * 3 / 4);
          if (byteLength > 750 * 1024) {
            setImageError(language === "ta" ? "படத்தை 750KB-க்கு குறைக்கவும்" : "Please reduce image size below 750KB.");
            setIcImage("");
            return;
          }
          setIcImage(dataUrl);
        };
        img.onerror = () => {
          setImageError('Invalid image');
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    };

  const content: any = {
    ta: {
      header: 'தெலுங்கினர் முன்னேற்ற கழகம்',
      memberNo: 'உறுப்பினர் எண்',
      regLabel: 'பதிவு எண்',
      chairman: 'பெயர்',
      father: 'தந்தை பெயர்',
      dob: 'பிறந்த தேதி (MM/DD/YYYY)',
      age: 'வயது',
      qualification: 'கல்வி தகுதி',
      legislativeAssembly: 'சட்டமன்றம்',
      voterId: 'வாக்காளர் அடையாள எண்',
      pollingBooth: 'வாக்குச்சாவடி',
      mobileNo: 'மொபைல் எண்',
      whatsappNo: 'வாட்ஸ்அப் எண்',
      emergencyContactNo: 'அவசர தொடர்பு எண்',
      needAssociationSupport: 'உங்களுக்குச் சங்கத்தின் உதவி தேவையா?',
      wantToHelp: 'நீங்கள் நமது சங்கத்திற்கு உதவ விரும்புகிறீர்களா?',
      wantResponsibility: 'நீங்கள் சங்கத்தின் பொறுப்பில் வகிக்க விரும்புகிறீர்களா?',
      address: 'முகவரி',
      state: 'மாநிலம்',
      city: 'நகரம்',
      area: 'பகுதி',
      street: 'தெரு',
      doorNo: 'அஞ்சல் எண்',
      district: 'மாவட்டம்',
      village: 'ஊர்',
      membersTitle: 'குடும்ப உறுப்பினர்கள்',
      save: 'சேமிக்க',
      edit: 'மாற்றம்',
      delete: 'நீக்கி',
      modernTitle: 'நீங்கள் இணைய விரும்புவது',
      yes: 'ஆம்',
      no: 'இல்லை',
    },
    en: {
      header: 'Teluginar Munetra Kazhagam',
      memberNo: 'Member No',
      regLabel: 'Registration No',
      chairman: "Name",
      father: 'Father Name',
      dob: 'Date of Birth (MM/DD/YYYY)',
      age: 'Age',
      qualification: 'Qualification',
      legislativeAssembly: 'Legislative Assembly',
      voterId: 'Voter Id No',
      pollingBooth: 'Polling Booth Name',
      mobileNo: 'Mobile No',
      whatsappNo: 'Whatsapp No',
      emergencyContactNo: 'Emergency Contact No',
      needAssociationSupport: 'Do you need the support of the association?',
      wantToHelp: 'Would you like to help our association?',
      wantResponsibility: 'Would you like to take responsibility in the association?',
      address: 'Address',
      state: 'State',
      city: 'City',
      area: 'Area',
      street: 'Street',
      doorNo: 'Postal Code',
      district: 'District',
      village: 'Village',
      membersTitle: 'Family Members',
      save: 'SAVE',
      edit: 'EDIT',
      delete: 'DELETE',
      modernTitle: 'Join Section',
      yes: 'Yes',
      no: 'No',
    },
  };

  const t = content[language];

    const contents = {
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



  async function handlePincodeBlur() {
    const pin = form.doorNo;
    if (!pin || pin.length < 4) return;
    try {
      const response = await axios.get(`https://api.postalpincode.in/pincode/${pin}`);
      const data = response.data?.[0]?.PostOffice?.[0];
      if (data) {
        setForm(prev => ({
          ...prev,
          stateId: data.State || '',
          cityId: data.District || '',
          areaId: data.Name || '',
          district: data.District || '',
          legislativeAssembly: data.Block || '',
        }));
      }
    } catch (e) {
      // ignore errors
    }
  }

  function updateField<K extends keyof typeof form>(key: K, value: any) {
    setForm(prev => ({ ...prev, [key]: value }));
  }



  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Transliterate fields as in JoinSection
      let nameTam = "";
      let nameEng = "";
      let fatherNameTam = "";
      let fatherNameEng = "";
      let addressTam = "";
      let addressEng = "";
      let pollingBoothTam = "";
      let pollingBoothEng = "";
      let legislativeAssemblyTam = "";
      let legislativeAssemblyEng = "";

      if (language === "ta") {
        nameTam = form.chairmanName;
        nameEng = tamilToEnglish(form.chairmanName);
        fatherNameTam = form.fatherName;
        fatherNameEng = tamilToEnglish(form.fatherName);
        addressTam = form.address;
        addressEng = tamilToEnglish(form.address);
        pollingBoothTam = form.pollingBooth;
        pollingBoothEng = tamilToEnglish(form.pollingBooth);
        legislativeAssemblyTam = form.legislativeAssembly;
        legislativeAssemblyEng = tamilToEnglish(form.legislativeAssembly);
      } else {
        nameEng = form.chairmanName;
        nameTam = await googleTransliterate(form.chairmanName);
        fatherNameEng = form.fatherName;
        fatherNameTam = await googleTransliterate(form.fatherName);
        addressEng = form.address;
        addressTam = await googleTransliterate(form.address);
        pollingBoothEng = form.pollingBooth;
        pollingBoothTam = await googleTransliterate(form.pollingBooth);
        legislativeAssemblyEng = form.legislativeAssembly;
        legislativeAssemblyTam = await googleTransliterate(form.legislativeAssembly);
      }

      // Convert state, city, area to Tamil for payload
      let stateTam = form.stateId;
      let cityTam = form.cityId;
      let areaTam = form.areaId;
      if (language !== "ta") {
        stateTam = await googleTransliterate(form.stateId);
        cityTam = await googleTransliterate(form.cityId);
        areaTam = await googleTransliterate(form.areaId);
      }
      // Only send base64 part (after comma) for PhotoImage, but prefix with 'data:image/jpeg;base64,'
      const payload = {
        EmailId: form.email || '',
        NameTam: nameTam || '',
        NameEng: nameEng || '',
        FatherNameTam: fatherNameTam || '',
        FatherNameEng: fatherNameEng || '',
        DOB: form.dob || "",
        Age: form.age ? Number(form.age) : 0,
        Qualification: form.qualification || '',
        DoorNo: form.doorNo || '',
        AddressTam: addressTam || '',
        AddressEng: addressEng || '',
        StreetTam: '',
        StreetEng: '',
        AreaTam: areaTam || '',
        AreaEng: form.areaId || '',
        CityTam: cityTam || '',
        CityEng: form.cityId || '',
        StateTam: stateTam || '',
        StateEng: form.stateId || '',
        VoterIdNo: form.voterId || '',
        PollingBothTam: pollingBoothTam || '',
        PollingBothEng: pollingBoothEng || '',
        LegislativeAssemblyTam: legislativeAssemblyTam || '',
        LegislativeAssemblyEng: legislativeAssemblyEng || '',
        MobileNo: form.mobileNo || '',
        WhatsAppNo: form.whatsappNo || '',
        EmergencyContactNo: '',
        NeedSupport: false,
        HelpToAssociation: false,
        ResponsibilityToAssociation: false,
        PhotoImage: icImage ? ('data:image/jpeg;base64,' + (icImage.split(',')[1] || icImage)) : "",
        IdCardImagePath: "",
        IsActive: true,
        CreatedBy: 0,
        FamilyDetails:[],
      };

      try {
        const res = await fetch(`${API_BASE_URL}/api/Members/AddMembers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (res.ok && json.Status) {
          alert(language === 'ta' ? 'சேமிக்கப்பட்டது' : 'Saved');
          setForm({
            title: 'தமிழ்நாடு அகமுடையார் சமூக கூட்டமைப்பு',
            memberNo: '',
            registrationNo: '',
            chairmanName: '',
            fatherName: '',
            dob: '',
            age: '',
            qualification: '',
            legislativeAssembly: '',
            voterId: '',
            pollingBooth: '',
            mobileNo: '',
            whatsappNo: '',
            address: '',
            stateId: '',
            cityId: '',
            areaId: '',
            doorNo: '',
            district: '',
            village: '',
            icImage: '',
            email: '',
          });
          setIcImage("");
          if (fileInputRef.current) fileInputRef.current.value = "";
          setLayout('modern');
        } else {
          const errorMsg = language === 'ta' 
            ? 'பிழை: சேமிக்க முடியவில்லை\n\nதயவுசெய்து 750KB-க்கும் குறைவான புகைப்படத்தை பதிவேற்றவும்' 
            : 'Error: Save failed\n\nPlease upload an image with less KB (Below 750KB)';
          alert(errorMsg);
        }
      } catch (err) {
        const errorMsg = language === 'ta' 
          ? 'பிழை: சேமிக்க முடியவில்லை\n\nதயவுசெய்து 750KB-க்கும் குறைவான புகைப்படத்தை பதிவேற்றவும்' 
          : 'Error: Save failed\n\nPlease upload an image with less KB (Below 750KB)';
        alert(errorMsg);
      }
    } finally {
      setIsSaving(false);
    }
  }

  const sampleImageUrl = '/mnt/data/cec8f1e5-fd7f-452b-8788-7d97038b8f39.png';

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      {/* Controls */}
      <div className="text-center mb-12 animate-fade-in" id="join">
        <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
          <Users className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-primary ${language === "ta" ? "tamil-font" : ""}`}>
          {contents[language].title}
        </h2>
        <p className="text-base md:text-lg text-muted-foreground">
          {contents[language].subtitle}
        </p>
      </div>
      <div className="flex items-center justify-end mb-4">
        <div className="text-sm text-muted">
          <strong>{t.header}</strong>
        </div>
      </div>

      {/* Main area: switch layouts */}
      {layout === 'table' ? (
        <div className="border border-black p-4 bg-white">
          {/* Top banner + small photo box */}
          <div className="flex justify-between items-center mb-3">
            <div className="text-center flex-1">
              <div className="bg-yellow-300 py-1 px-2 border border-black">{t.header}</div>
              <div className="text-xs mt-1">{language === 'ta' ? 'பதிவு படிவம்' : 'Registration Form (Sample)'}</div>
              <div className="text-xs mt-1">{language === 'ta' ? 'இது உறுப்பினருக்கு நிரப்பப்பட்ட பார்க்கக்கூடிய படிவம்' : 'This is a viewable form filled in for the member'}</div>
            </div>
            <div className="w-35 h-35 border border-black ml-4 flex items-center justify-center text-xs">
              {icImage ? (
                <img src={icImage} alt="ID Card" className="w-full h-full object-cover rounded" style={{ maxHeight: '180px', minHeight: '128px', height: 'auto' }} />
              ) : (
                language === 'ta' ? 'போட்டோ' : 'PHOTO'
              )}
            </div>
          </div>

          {/* Member No and Registration No */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
            <div className="border border-black p-2">
              <div className="text-xs text-gray-600">{t.chairman}</div>
              <div className="w-full min-h-[28px] flex items-center truncate">{form.chairmanName || <span className="text-gray-400">-</span>}</div>
            </div>
            <div className="border border-black p-2">
              <div className="text-xs text-gray-600">{t.dob}</div>
              <div className="w-full min-h-[28px] flex items-center">
                {form.dob ? (() => {
                  let d = new Date(form.dob.replace(/-/g, '/'));
                  if (!isNaN(d.getTime())) {
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    const yyyy = d.getFullYear();
                    return `${mm}/${dd}/${yyyy}`;
                  }
                  const match = form.dob.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
                  if (match) {
                    return `${match[2]}/${match[3]}/${match[1]}`;
                  }
                  return form.dob;
                })() : <span className="text-gray-400">-</span>}
              </div>
            </div>
            <div className="border border-black p-2 md:col-span-2">
              <div className="text-xs text-gray-600">{language === 'ta' ? 'மின்னஞ்சல்' : 'Email'}</div>
              <div className="w-full min-h-[28px] flex items-center break-all text-sm" style={{wordBreak: 'break-all'}}>
                {form.email || <span className="text-gray-400">-</span>}
              </div>
            </div>
          </div>
          {/* Personal Details Box */}
          <div className="border-2 border-blue-400 rounded bg-blue-50 p-3 mb-2">
            <div className="font-semibold mb-2 text-blue-700">{language === 'ta' ? 'தனிப்பட்ட விவரங்கள்' : 'Personal Details'}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-600">{t.chairman}</div>
                <div className="w-full min-h-[28px] flex items-center">{form.chairmanName || <span className="text-gray-400">-</span>}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">{t.father}</div>
                <div className="w-full min-h-[28px] flex items-center">{form.fatherName || <span className="text-gray-400">-</span>}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">{t.age}</div>
                <div className="w-full min-h-[28px] flex items-center">{form.age || <span className="text-gray-400">-</span>}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">{t.qualification}</div>
                <div className="w-full min-h-[28px] flex items-center">{form.qualification || <span className="text-gray-400">-</span>}</div>
              </div>
            </div>
          </div>

          {/* Address block */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
            <div className="border border-black p-2 md:col-span-5">
              <div className="text-xs text-gray-600">{t.address}</div>
              <div className="w-full min-h-[28px] flex items-center">{form.address || <span className="text-gray-400">-</span>}</div>
            </div>
            <div className="border border-black p-2">
              <div className="text-xs text-gray-600">{t.doorNo}</div>
              <div className="w-full min-h-[28px] flex items-center">{form.doorNo || <span className="text-gray-400">-</span>}</div>
            </div>
            <div className="border border-black p-2">
              <div className="text-xs text-gray-600">{t.area}</div>
              <div className="w-full min-h-[28px] flex items-center">{form.areaId || <span className="text-gray-400">-</span>}</div>
            </div>
            <div className="border border-black p-2 md:col-span-2">
              <div className="text-xs text-gray-600">{t.city}</div>
              <div className="w-full min-h-[28px] flex items-center">{form.cityId || <span className="text-gray-400">-</span>}</div>
            </div>
            <div className="border border-black p-2">
              <div className="text-xs text-gray-600">{t.state}</div>
              <div className="w-full min-h-[28px] flex items-center">{form.stateId || <span className="text-gray-400">-</span>}</div>
            </div>
          </div>

          {/* Legislative Assembly, Voter Id, Polling Booth */}
          <div className="grid grid-cols-3 gap-2 mb-2">
             <div className="border border-black p-2">
              <div className="text-xs text-gray-600">{t.voterId}</div>
              <input value={form.voterId} onChange={e => updateField('voterId', e.target.value)} className="w-full outline-none" />
            </div>

           
            <div className="border border-black p-2">
              <div className="text-xs text-gray-600">{t.pollingBooth}</div>
              <input value={form.pollingBooth} onChange={e => updateField('pollingBooth', e.target.value)} className="w-full outline-none" />
            </div>
          </div>

          {/* Mobile, Whatsapp, Emergency Contact */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="border border-black p-2">
              <div className="text-xs text-gray-600">{t.mobileNo}</div>
              <input value={form.mobileNo} onChange={e => updateField('mobileNo', e.target.value)} className="w-full outline-none" />
            </div>
            <div className="border border-black p-2">
              <div className="text-xs text-gray-600">{t.whatsappNo}</div>
              <input value={form.whatsappNo} onChange={e => updateField('whatsappNo', e.target.value)} className="w-full outline-none" />
            </div>
            {/* EmergencyContactNo removed */}
          </div>





          {/* ID image and note, Back/Save buttons */}
          <div className="flex gap-4 items-start">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded border border-gray-400 hover:bg-gray-300"
              onClick={() => setLayout('modern')}
            >
              {language === 'ta' ? 'மீண்டும்' : 'Back'}
            </button>
            <div className="flex-1">
              <div className="text-sm text-gray-600">{language === 'ta' ? 'குறிப்பு: இது மாதிரி வடிவம் ஆகும்' : 'Note: This is a sample layout'}</div>
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#BF1E1E] text-white rounded flex items-center justify-center min-w-[90px]"
              disabled={isSaving}
            >
              {isSaving && (
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              )}
              {isSaving ? (language === 'ta' ? 'சேமிக்கிறது...' : 'Saving...') : t.save}
            </button>
          </div>
        </div>
      ) : (
        // Modern layout
        <div className="bg-white border p-6 rounded shadow">
          <h3 className="text-xl font-bold mb-3">{t.header}</h3>
          <p className="text-sm text-muted mb-4">{t.modernTitle}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
         {/*    <label className="space-y-1">
              <div className="text-xs">{t.memberNo}</div>
              <input value={form.memberNo} disabled readOnly className="w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed" />
            </label>
            <label className="space-y-1">
              <div className="text-xs">{t.regLabel}</div>
              <input value={form.registrationNo} disabled readOnly className="w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed" />
            </label> */}
            <label className="space-y-1">
              <div className="text-xs">{t.chairman} <span className="text-red-600">*</span></div>
              <input value={form.chairmanName} onChange={e => updateField('chairmanName', e.target.value)} className="w-full border rounded px-2 py-1" />
            </label>
            <label className="space-y-1">
              <div className="text-xs">{t.father} <span className="text-red-600">*</span></div>
              <input value={form.fatherName} onChange={e => updateField('fatherName', e.target.value)} className="w-full border rounded px-2 py-1" />
            </label>
            <label className="space-y-1">
              <div className="text-xs">{t.dob} <span className="text-red-600">*</span></div>
              <input type="date" value={form.dob} onChange={e => updateField('dob', e.target.value)} className="w-full border rounded px-2 py-1" />
            </label>
            <label className="space-y-1">
              <div className="text-xs">{t.age} <span className="text-red-600">*</span></div>
              <input value={form.age} readOnly className="w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed" />
            </label>
            <label className="space-y-1">
              <div className="text-xs">{t.qualification} <span className="text-red-600">*</span></div>
              <select
                value={form.qualification}
                onChange={e => updateField('qualification', e.target.value)}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">{language === 'ta' ? 'தேர்வு செய்யவும்' : 'Select'}</option>
                <option value="SSLC">SSLC</option>
                <option value="HSC">HSC</option>
                <option value="UG">UG</option>
                <option value="PG">PG</option>
              </select>
            </label>
             <label className="space-y-1">
              <div className="text-xs">{t.voterId} <span className="text-red-600">*</span></div>
              <input value={form.voterId} onChange={e => updateField('voterId', e.target.value)} className="w-full border rounded px-2 py-1" />
            </label>
            <label className="space-y-1">
              <div className="text-xs">{t.legislativeAssembly} <span className="text-red-600">*</span></div>
              <input value={form.legislativeAssembly} onChange={e => updateField('legislativeAssembly', e.target.value)} className="w-full border rounded px-2 py-1" />
            </label>
           
            <label className="space-y-1">
              <div className="text-xs">{t.pollingBooth} <span className="text-red-600">*</span></div>
              <input value={form.pollingBooth} onChange={e => updateField('pollingBooth', e.target.value)} className="w-full border rounded px-2 py-1" />
            </label>
            <label className="space-y-1">
              <div className="text-xs">{t.mobileNo} <span className="text-red-600">*</span></div>
              <input value={form.mobileNo} onChange={e => {
                const v = e.target.value.replace(/[^0-9]/g, '');
                if (v.length <= 15) updateField('mobileNo', v);
              }} minLength={6} maxLength={15} className="w-full border rounded px-2 py-1" inputMode="numeric" pattern="[0-9]*" />
              {form.mobileNo && (form.mobileNo.length < 6 || form.mobileNo.length > 15) && <div className="text-xs text-red-600">{language==='ta' ? '6-15 இலக்க எண்' : '6-15 digit number'}</div>}
            </label>
            <label className="space-y-1">
              <div className="text-xs">{t.whatsappNo} <span className="text-red-600">*</span></div>
              <input value={form.whatsappNo} onChange={e => {
                const v = e.target.value.replace(/[^0-9]/g, '');
                if (v.length <= 15) updateField('whatsappNo', v);
              }} minLength={6} maxLength={15} className="w-full border rounded px-2 py-1" inputMode="numeric" pattern="[0-9]*" />
              {form.whatsappNo && (form.whatsappNo.length < 6 || form.whatsappNo.length > 15) && <div className="text-xs text-red-600">{language==='ta' ? '6-15 இலக்க எண்' : '6-15 digit number'}</div>}
            </label>
            <label className="space-y-1">
              <div className="text-xs">{t.address} <span className="text-red-600">*</span></div>
              <textarea
                value={form.address}
                onChange={e => updateField('address', e.target.value)}
                className="w-full border rounded px-2 py-1 resize-none"
                rows={2}
                style={{ minWidth: '100%', maxWidth: '100%', minHeight: '48px' }}
                placeholder={language === 'ta' ? 'முகவரி' : 'Address'}
              />
            </label>
            <label className="space-y-1">
              <div className="text-xs">{t.doorNo} <span className="text-red-600">*</span></div>
              <input
                value={form.doorNo}
                onChange={e => updateField('doorNo', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                onBlur={handlePincodeBlur}
                className="w-full border rounded px-2 py-1"
                maxLength={6}
                placeholder={language === 'ta' ? 'அஞ்சல் குறியீடு' : 'Postal Code'}
              />
            </label>
            <label className="space-y-1">
              <div className="text-xs">{t.state} <span className="text-red-600">*</span></div>
              <input
                value={form.stateId || ''}
                readOnly
                className="w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed"
                placeholder={language === 'ta' ? 'மாநிலம்' : 'State'}
              />
            </label>
            <label className="space-y-1">
              <div className="text-xs">{t.city} <span className="text-red-600">*</span></div>
              <input
                value={form.cityId || ''}
                readOnly
                className="w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed"
                placeholder={language === 'ta' ? 'பிராந்தியம்' : 'Region'}
              />
            </label>
            <label className="space-y-1">
              <div className="text-xs">{t.area} <span className="text-red-600">*</span></div>
              <input
                value={form.areaId}
                onChange={e => updateField('areaId', e.target.value)}
                className="w-full border rounded px-2 py-1"
                placeholder={language === 'ta' ? 'பகுதி' : 'Area'}
              />
            </label>
           
                        {/* Image upload for icImage */}
                        
                          <label className="space-y-1 ">
                            <div className="text-xs">{language === "ta" ? "அடையாள அட்டை படம் (750KB-ஐ விட குறைவாக)" : "ID Card Image (Below 750KB)"} <span className="text-red-600">*</span></div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              ref={fileInputRef}
                              className="w-full border rounded px-2 py-1"
                            />
                            {imageError && <div className="text-xs text-red-500">{imageError}</div>}
                            {icImage && !imageError && (
                              <img
                                src={icImage}
                                alt="ID Preview"
                                className="w-32 h-32 object-cover rounded mt-2 border"
                              />
                            )}
                          </label>
                          <label className="space-y-1">
                            <div className="text-xs">{language === "ta" ? "மின்னஞ்சல்" : "Email"} <span className="text-red-600">*</span></div>
                            <input
                              type="email"
                              value={form.email}
                              onChange={e => updateField('email', e.target.value)}
                              className="w-full border rounded px-2 py-1"
                              placeholder={language === 'ta' ? 'உங்கள் மின்னஞ்சல்' : 'Your email'}
                            />
                            {form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && (
                              <div className="text-xs text-red-500">{language === 'ta' ? 'சரியான மின்னஞ்சலை உள்ளிடவும்' : 'Enter a valid email'}</div>
                            )}
                          </label>
                      

          </div>



          <div className="flex items-center gap-4">
            <div className="flex-1" />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className={`px-4 py-2 rounded ${isFormValid ? 'bg-[#BF1E1E] text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                onClick={() => isFormValid && setLayout('table')}
                disabled={!isFormValid}
              >
                {language === 'ta' ? 'அடுத்தது' : 'Next'}
              </button>
            </div>
          </div>

        </div>
      )}

    
    </div>
  );
}
