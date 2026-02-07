import { useEffect, useState } from "react";
import { apiFetch, apiUrl } from "@/lib/api";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, FileDown, Pencil, Trash2, Mail, IdCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { API_BASE_URL } from "@/lib/api";
// @ts-ignore
import autoTable from "jspdf-autotable";

// Transliteration functions (from SwitchableForm)
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

const Members = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [wardFilter, setWardFilter] = useState("all");
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get unique states, cities, and wards from members

  // Edit member dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMemberId, setEditMemberId] = useState<number | null>(null);
  const [editMemberLoading, setEditMemberLoading] = useState(false);
  const [editMemberError, setEditMemberError] = useState<string | null>(null);
  // Preview state for Photo
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  // Download dialog state
  const [downloadDialog, setDownloadDialog] = useState<{ open: boolean, eng?: string, tamil?: string } | null>(null);
  // Mail sending state
  const [mailLoadingId, setMailLoadingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({
    NameEng: '',
    NameTam: '',
    FatherNameEng: '',
    FatherNameTam: '',
    DOB: '',
    Age: '',
    Qualification: '',
    DoorNo: '',
    AddressEng: '',
    AddressTam: '',
    StreetEng: '',
    StreetTam: '',
    AreaEng: '',
    AreaTam: '',
    CityEng: '',
    CityTam: '',
    StateEng: '',
    StateTam: '',
    VoterIdNo: '',
    PollingBothEng: '',
    PollingBothTam: '',
    LegislativeAssemblyEng: '',
    LegislativeAssemblyTam: '',
    MobileNo: '',
    WhatsAppNo: '',
    EmergencyContactNo: '',
    NeedSupport: false,
    HelpToAssociation: false,
    ResponsibilityToAssociation: false,
    PhotoImage: '',
    IdCardImagePath: '',
    IdCardImagePathENg: '',
    IsActive: true,
    CreatedBy: '',
    FamilyDetails: [],
    EmailId: '',
    MemberNo: '',
    StateId: '',
    CityId: '',
    AreaId: '',
    IdCardImg: '',
    IdCardFile: null,
  });
  const [editFormLanguage, setEditFormLanguage] = useState<'en' | 'ta'>('en');

  // Content translations for form labels
  const content = {
    en: {
      name: 'Name',
      fatherName: 'Father Name',
      address: 'Address',
      pollingBooth: 'Polling Booth',
      legislativeAssembly: 'Legislative Assembly',
      state: 'State',
      city: 'City',
      ward: 'Ward',
      dob: 'Date of Birth',
      age: 'Age',
      qualification: 'Qualification',
      voterId: 'Voter ID No',
      mobile: 'Mobile No',
      whatsapp: 'WhatsApp No',
      postalCode: 'Postal Code',
      email: 'Email Id',
      memberNo: 'Member No',
      active: 'Active',
      idCardEng: 'ID Card (English)',
      idCardTam: 'ID Card (Tamil)',
      photo: 'Photo',
    },
    ta: {
      name: 'பெயர்',
      fatherName: 'தந்தை பெயர்',
      address: 'முகவரி',
      pollingBooth: 'வாக்குச்சாவடி',
      legislativeAssembly: 'சட்டமன்றம்',
      state: 'மாநிலம்',
      city: 'நகரம்',
      ward: 'வார்டு',
      dob: 'பிறந்த தேதி',
      age: 'வயது',
      qualification: 'கல்வி தகுதி',
      voterId: 'வாக்காளர் அடையாள எண்',
      mobile: 'மொபைல் எண்',
      whatsapp: 'வாட்ஸ்அப் எண்',
      postalCode: 'அஞ்சல் குறியீடு',
      email: 'மின்னஞ்சல்',
      memberNo: 'உறுப்பினர் எண்',
      active: 'செயல்பாட்டில் உள்ளது',
      idCardEng: 'ஐடி கார்டு (ஆங்கிலம்)',
      idCardTam: 'ஐடி கார்டு (தமிழ்)',
      photo: 'புகைப்படம்',
    },
  };

  const t = content[editFormLanguage];

  // No dropdowns for state/city/area in edit dialog



  // Fetch member by id and open dialog (no dropdowns, map names directly)
  // Map all fields from API response to editForm, fallback to default if not present
  const handleEditMember = async (memberId: number) => {
    setEditDialogOpen(true);
    setEditMemberId(memberId);
    setEditMemberLoading(true);
    setEditMemberError(null);
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/Members/GetMembersById?MemberId=${memberId}`, { method: "GET" });
      const data = await res.json();
      if (data && data.data) {
        const member = data.data;
        setEditForm((prev: any) => ({
          ...prev,
          NameTam: member.NameTam ?? prev.NameTam ?? '',
          NameEng: member.NameEng ?? prev.NameEng ?? '',
          FatherNameTam: member.FatherNameTam ?? prev.FatherNameTam ?? '',
          FatherNameEng: member.FatherNameEng ?? prev.FatherNameEng ?? '',
          DOB: member.DOB ?? prev.DOB ?? '',
          Age: member.Age ?? prev.Age ?? 0,
          Qualification: member.Qualification ?? prev.Qualification ?? '',
          DoorNo: member.DoorNo ?? prev.DoorNo ?? '',
          AddressTam: member.AddressTam ?? prev.AddressTam ?? '',
          AddressEng: member.AddressEng ?? prev.AddressEng ?? '',
          StreetTam: member.StreetTam ?? prev.StreetTam ?? '',
          StreetEng: member.StreetEng ?? prev.StreetEng ?? '',
          AreaTam: member.AreaTam ?? prev.AreaTam ?? '',
          AreaEng: member.AreaEng ?? prev.AreaEng ?? '',
          CityTam: member.CityTam ?? prev.CityTam ?? '',
          CityEng: member.CityEng ?? prev.CityEng ?? '',
          StateTam: member.StateTam ?? prev.StateTam ?? '',
          StateEng: member.StateEng ?? prev.StateEng ?? '',
          VoterIdNo: member.VoterIdNo ?? prev.VoterIdNo ?? '',
          PollingBothTam: member.PollingBothTam ?? prev.PollingBothTam ?? '',
          PollingBothEng: member.PollingBothEng ?? prev.PollingBothEng ?? '',
          LegislativeAssemblyTam: member.LegislativeAssemblyTam ?? prev.LegislativeAssemblyTam ?? '',
          LegislativeAssemblyEng: member.LegislativeAssemblyEng ?? prev.LegislativeAssemblyEng ?? '',
          EmailId: member.EmailId ?? prev.EmailId ?? '',
          MobileNo: member.MobileNo ?? prev.MobileNo ?? '',
          WhatsAppNo: member.WhatsAppNo ?? prev.WhatsAppNo ?? '',
          EmergencyContactNo: member.EmergencyContactNo ?? prev.EmergencyContactNo ?? '',
          NeedSupport: member.NeedSupport ?? prev.NeedSupport ?? false,
          HelpToAssociation: member.HelpToAssociation ?? prev.HelpToAssociation ?? false,
          ResponsibilityToAssociation: member.ResponsibilityToAssociation ?? prev.ResponsibilityToAssociation ?? false,
          PhotoImage: member.PhotoImage ?? prev.PhotoImage ?? '',
          IdCardImagePath: member.IdCardImagePath ?? prev.IdCardImagePath ?? '',
          IsActive: member.IsActive ?? prev.IsActive ?? true,
          CreatedBy: member.CreatedBy ?? prev.CreatedBy ?? '',
          CreatedOn: member.CreatedOn ?? prev.CreatedOn ?? '',
          FamilyDetails: member.FamilyDetails ?? prev.FamilyDetails ?? [],
          MemberNo: member.MemberNo ?? prev.MemberNo ?? '',
          IdCardImg: member.IdCardImg ?? prev.IdCardImg ?? '',
          IdCardFile: null,
          RegistrationNO: member.RegistrationNO ?? prev.RegistrationNO ?? '',
          MemberId: member.MemberId ?? prev.MemberId ?? 0,
          IdCardImagePathENg: member.IdCardImagePathENg ?? prev.IdCardImagePathENg ?? '',
          StateId: member.StateId ?? prev.StateId ?? '',
          CityId: member.CityId ?? prev.CityId ?? '',
          AreaId: member.AreaId ?? prev.AreaId ?? '',
        }));
      } else {
        setEditMemberError('Failed to load member details');
      }
    } catch (err) {
      setEditMemberError('Failed to load member details');
    } finally {
      setEditMemberLoading(false);
    }
  };
  const handleDeleteMember = async (memberId: number) => {
    if (!window.confirm("Are you sure you want to delete this member?")) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`${API_BASE_URL}/api/Members/DeleteMembers?MemberId=${memberId}`, { method: "PUT" });   
      setMembers((prev) => prev.filter((m) => m.MemberId !== memberId));
    } catch (err) {
      setError("Failed to delete member");
    } finally {
      setLoading(false);
    }
  };
  const stateOptions = Array.from(new Set(members.map(m => m.StateEng).filter(Boolean)));
  const cityOptions = Array.from(new Set(members.filter(m => stateFilter === "all" || m.StateEng === stateFilter).map(m => m.CityEng).filter(Boolean)));
  const wardOptions = Array.from(new Set(members.filter(m => (stateFilter === "all" || m.StateEng === stateFilter) && (cityFilter === "all" || m.CityEng === cityFilter)).map(m => m.AreaEng).filter(Boolean)));

  // Filter members by search and filters
  const filteredMembers = members.filter((member) => {
      const matchesSearch =
      searchTerm.trim() === "" ||
      member.NameEng?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          // Email removed from search
      member.MemberNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(apiUrl("/api/Members/GetAllMembers"), { method: "GET" });
        const data = await res.json();
        setMembers(data.data || []);
      } catch (err) {
        setError("Failed to load members");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const handleExportExcel = () => {
    // Prepare data for Excel
    const exportData = members.map((member) => ({
      "Name (Eng)": member.NameEng || '-',
      "Name (Tam)": member.NameTam || '-',
      // Email removed from export
      "Registration No": member.RegistrationNO || '-',
        "Age": member.Age || '-',
      "Qualification": member.Qualification || '-',
      "VoterIdNo": member.VoterIdNo || '-',
      "WhatsAppNo": member.WhatsAppNo || '-',
    "MobileNo": member.MobileNo || '-',
      "EmergencyContactNo": member.EmergencyContactNo || '-',
      "LegislativeAssemblyEng": member.LegislativeAssemblyEng || '-',
      "PollingBothEng": member.PollingBothEng || '-',
      "Member No": member.MemberNo || '-',
      "State": member.StateEng || '-',
      "City": member.CityEng || '-',
      "Area": member.AreaEng || '-',
      "Joined Date": member.CreatedOn ? member.CreatedOn.split("T")[0] : "-",
      "Active": member.IsActive ? "Yes" : "No",
    }));
    const headers = Object.keys(exportData[0]);
    const rows = exportData.map(obj => headers.map(h => obj[h]));
    const data = [
      ["TMK Party"],
      ["Members list"],
      [],
      headers,
      ...rows
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    // Highlight header row
    for (let i = 0; i < headers.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 3, c: i });
      if (!ws[cellRef]) ws[cellRef] = {};
      ws[cellRef].s = {
        fill: { fgColor: { rgb: "D3D3D3" } },
        font: { bold: true }
      };
    }
    // Set column widths
    ws['!cols'] = headers.map(() => ({ wch: 15 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, "members.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({
      // Use utf-8 encoding for Unicode support
      orientation: "landscape",
      unit: "pt",
      format: "A4",
    });
    // Set font to helvetica (default) for Unicode, or use a Tamil font if available
    doc.setFont("helvetica", "normal");
    // If you have a Tamil font, you can add it here and setFont to it
    // doc.addFileToVFS("NotoSansTamil-Regular.ttf", notoTamilFontBase64);
    // doc.addFont("NotoSansTamil-Regular.ttf", "NotoSansTamil", "normal");
    // doc.setFont("NotoSansTamil");

    // Add header
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(18);
    const titleWidth = doc.getTextWidth("TMK Party");
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text("TMK Party", titleX, 20);
    doc.setFontSize(14);
    const subtitleWidth = doc.getTextWidth("Members list");
    const subtitleX = (pageWidth - subtitleWidth) / 2;
    doc.text("Members list", subtitleX, 35);

    const columns = [
      "Name",
      "Member No",
      "Reg No",
      "Age",
      "Polling",
      "VoterIdNo",
      "WhatsAppNo",
      "Qualification",
      "State",
      "City",
      "Area",
      "Joined Date",
    ];
    const rows = members.map((member) => [
      member.NameEng || '-',
      // Email removed from PDF rows
      member.MemberNo || '-',
      member.RegistrationNO || '-',
      member.Age || '-',
      member.PollingBothEng || '-',
      member.VoterIdNo || '-',
      member.WhatsAppNo || '-',
      member.Qualification || '-',
      member.StateEng || '-',
      member.CityEng || '-',
      member.AreaEng || '-',
      member.CreatedOn ? member.CreatedOn.split("T")[0] : "-",
    ]);
    // @ts-ignore
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 50, // Start below the header
      styles: {
        font: "helvetica",
        cellPadding: 4,
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
    doc.output('dataurlnewwindow');
  };


  // Handle input changes for edit form with auto-translation
  const handleEditInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    // Fields that have both Eng and Tam versions and should be auto-translated
    const translatableFields = ['NameEng', 'NameTam', 'FatherNameEng', 'FatherNameTam', 'AddressEng', 'AddressTam', 'PollingBothEng', 'PollingBothTam', 'LegislativeAssemblyEng', 'LegislativeAssemblyTam', 'StateEng', 'StateTam', 'CityEng', 'CityTam', 'AreaEng', 'AreaTam'];
    
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      setEditForm((prev: any) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      // Update the field that was changed
      setEditForm((prev: any) => ({
        ...prev,
        [name]: value,
      }));

      // Auto-translate to the other language if this is a translatable field
      if (translatableFields.includes(name) && value.trim()) {
        let counterpartField = '';
        let translatedValue = '';

        // Determine which field to update based on current field
        if (name.endsWith('Eng')) {
          counterpartField = name.replace('Eng', 'Tam');
          // Translate English to Tamil using Google Transliterate
          translatedValue = await googleTransliterate(value);
        } else if (name.endsWith('Tam')) {
          counterpartField = name.replace('Tam', 'Eng');
          // Translate Tamil to English using local function
          translatedValue = tamilToEnglish(value);
        }

        // Update the counterpart field
        if (counterpartField) {
          setEditForm((prev: any) => ({
            ...prev,
            [counterpartField]: translatedValue,
          }));
        }
      }
    }
  };

  // Handle Photo upload (up to 750KB, compress, and set PhotoImage as base64 with prefix)
  const handleEditIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 768000) {
      alert("Please upload an image of 750KB or below.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          alert("Failed to process image");
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              alert("Failed to compress image");
              return;
            }
            if (blob.size > 768000) {
              alert("Compressed image is still over 750KB. Please choose a smaller image.");
              return;
            }
            const compressedReader = new FileReader();
            compressedReader.onloadend = () => {
              let base64 = compressedReader.result as string;
              // Always send with 'data:image/jpeg;base64,' prefix
              if (base64.startsWith('data:image/jpeg;base64,')) {
                // already correct
              } else if (base64.startsWith('data:')) {
                base64 = 'data:image/jpeg;base64,' + (base64.split(',')[1] || base64);
              } else {
                base64 = 'data:image/jpeg;base64,' + base64;
              }
              if (base64.length > 750000) {
                alert("Image is too large after compression (over 750KB). Please choose a smaller image or lower quality.");
                return;
              }
              setEditForm((prev: any) => ({
                ...prev,
                PhotoImage: base64,
                IdCardFile: file,
              }));
            };
            compressedReader.readAsDataURL(blob);
          },
          "image/jpeg",
          0.5
        );
      };
      img.onerror = () => {
        alert("Invalid image file");
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      alert("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  // Handle update (call API)
  // Only send changed values, otherwise send the original value from the loaded member
  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMemberId) return;
    setEditMemberLoading(true);
    setEditMemberError(null);
    try {
      // Get ModifiedBy from localStorage (e.g., user id or name)
      const modifiedBy = localStorage.getItem('tmk_userId') || 0;
      // Prepare payload as per new API structure
      const payload = {
        MemberId: editMemberId,
        RegistrationNO: editForm.RegistrationNO || '',
        MemberNo: editForm.MemberNo || '',
        NameTam: editForm.NameTam,
        NameEng: editForm.NameEng,
        FatherNameTam: editForm.FatherNameTam,
        FatherNameEng: editForm.FatherNameEng,
        DOB: editForm.DOB,
        Age: editForm.Age,
        Qualification: editForm.Qualification,
        DoorNo: editForm.DoorNo,
        AddressTam: editForm.AddressTam,
        AddressEng: editForm.AddressEng,
        StreetTam: editForm.StreetTam,
        StreetEng: editForm.StreetEng,
        AreaTam: editForm.AreaTam,
        AreaEng: editForm.AreaEng,
        CityTam: editForm.CityTam,
        CityEng: editForm.CityEng,
        StateTam: editForm.StateTam,
        StateEng: editForm.StateEng,
        VoterIdNo: editForm.VoterIdNo,
        PollingBothTam: editForm.PollingBothTam,
        PollingBothEng: editForm.PollingBothEng,
        LegislativeAssemblyTam: editForm.LegislativeAssemblyTam,
        LegislativeAssemblyEng: editForm.LegislativeAssemblyEng,
        MobileNo: editForm.MobileNo,
        WhatsAppNo: editForm.WhatsAppNo,
        EmergencyContactNo: editForm.EmergencyContactNo,
        NeedSupport: editForm.NeedSupport,
        HelpToAssociation: editForm.HelpToAssociation,
        ResponsibilityToAssociation: editForm.ResponsibilityToAssociation,
        PhotoImage: editForm.PhotoImage,
        IdCardImagePath: editForm.IdCardImagePath,
        IsActive: editForm.IsActive,
        CreatedBy: editForm.CreatedBy,
        CreatedOn: editForm.CreatedOn,
        ModifiedBy: modifiedBy,
        FamilyDetails: Array.isArray(editForm.FamilyDetails) ? editForm.FamilyDetails.map((f: any) => ({
          NameTam: f.NameTam,
          NameEng: f.NameEng,
          RelationshipTam: f.RelationshipTam,
          RelationshipEng: f.RelationshipEng,
          Age: f.Age,
          IsActive: f.IsActive,
         
        })) : [],
         ModifiedOn: new Date().toISOString(),
         EmailId: editForm.EmailId,
         IdCardImagePathENg: editForm.IdCardImagePathENg,
      };
      await apiFetch(`${API_BASE_URL}/api/Members/UpdateMembers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setEditDialogOpen(false);
      // Show success toast
      toast({
        title: "Success!",
        description: "Member updated successfully.",
        duration: 3000,
      });
      // Optionally refresh members list
      const res = await apiFetch(apiUrl("/api/Members/GetAllMembers"), { method: "GET" });
      const data = await res.json();
      setMembers(data.data || []);
    } catch (err) {
      setEditMemberError('Failed to update member');
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to update member. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setEditMemberLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Member Management</h1>
            <p className="text-muted-foreground">View and manage registered party members</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <FileDown className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
             {/*  <Select value={stateFilter} onValueChange={value => {
                setStateFilter(value);
                setCityFilter("all");
                setWardFilter("all");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {stateOptions.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={cityFilter} onValueChange={value => {
                setCityFilter(value);
                setWardFilter("all");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cityOptions.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={wardFilter} onValueChange={setWardFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Ward" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  {wardOptions.map((ward) => (
                    <SelectItem key={ward} value={ward}>{ward}</SelectItem>
                  ))}
                </SelectContent>
              </Select> */}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                    <TableHead className="whitespace-nowrap">Name</TableHead>
                    {/* Email column removed */}
                    <TableHead className="whitespace-nowrap">Member No</TableHead>
                    <TableHead className="hidden md:table-cell whitespace-nowrap">Registration No</TableHead>
                    <TableHead className="hidden lg:table-cell whitespace-nowrap">Age</TableHead>
                    <TableHead className="hidden lg:table-cell whitespace-nowrap">Qualification</TableHead>
                    <TableHead className="hidden sm:table-cell whitespace-nowrap">Joined Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">Loading members...</TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-red-500 py-8">{error}</TableCell>
                    </TableRow>
                  ) : filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No members found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                    <TableRow key={member.MemberId}>
                      <TableCell>
                        <div className="flex gap-1 items-center flex-wrap">
                          {/* Edit */}
                          <Button size="sm" variant="ghost" title="Edit" onClick={() => handleEditMember(member.MemberId)} className="h-8 w-8 p-0">
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                          {/* Download */}
                          <Button size="sm" variant="ghost" title="Download ID Card" onClick={() => setDownloadDialog({ open: true, eng: member.IdCardImagePathENg, tamil: member.IdCardImagePath })} className="h-8 w-8 p-0">
                            <Download className="h-4 w-4 text-green-700 hover:text-green-900" />
                          </Button>
                          {/* Mail */}
                          <Button size="sm" variant="ghost" title="Send Mail" onClick={async () => {
                            setMailLoadingId(member.MemberId);
                            try {
                              await apiFetch(`https://tmkdev.appxes-erp.in/api/Members/SendmailToMember?MemberId=${member.MemberId}`, { method: 'GET' });
                              alert('Mail sent!');
                            } catch {
                              alert('Failed to send mail');
                            } finally {
                              setMailLoadingId(null);
                            }
                          }} disabled={mailLoadingId === member.MemberId} className="h-8 w-8 p-0">
                            {mailLoadingId === member.MemberId ? (
                              <svg className="animate-spin h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                            ) : (
                              <Mail className="h-4 w-4 text-blue-700 hover:text-blue-900" />
                            )}
                          </Button>
                          {/* Delete */}
                          <Button size="sm" variant="ghost" title="Delete" onClick={() => handleDeleteMember(member.MemberId)} className="h-8 w-8 p-0">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{member.NameEng}</TableCell>
                      <TableCell className="text-sm">{member.MemberNo}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{member.RegistrationNO}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{member.Age}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{member.Qualification}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{member.CreatedOn ? member.CreatedOn.split("T")[0] : ""}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        {/* Download Dialog for ID Card PDFs (global, not inside table row) */}
        <Dialog open={!!downloadDialog?.open} onOpenChange={() => setDownloadDialog(null)}>
          <DialogContent className="max-w-xs" onPointerDownOutside={e => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Download ID Card PDF</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              <Button asChild disabled={!downloadDialog?.tamil} variant="outline">
                <a href={downloadDialog?.tamil || '#'} download target="_blank" rel="noopener noreferrer">
                  Tamil ID Card
                </a>
              </Button>
              <Button asChild disabled={!downloadDialog?.eng} variant="outline">
                <a href={downloadDialog?.eng || '#'} download target="_blank" rel="noopener noreferrer">
                  English ID Card
                </a>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Member Dialog (global, only when pencil is clicked) */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-full w-[100%] sm:w-auto sm:max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto mx-auto" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle>Edit Member</DialogTitle>
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setEditFormLanguage(editFormLanguage === 'en' ? 'ta' : 'en')}
                  className="relative w-24 h-8 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden"
                >
                  <div
                    className={`absolute top-1 left-1 h-6 w-11 rounded-full bg-white shadow transition-all duration-300 ${
                      editFormLanguage === 'ta' ? "translate-x-0" : "translate-x-12"
                    }`}
                  ></div>

                  <div className="absolute inset-0 flex text-xs font-medium items-center justify-between px-3">
                    <span className={editFormLanguage === 'ta' ? "text-black" : "text-gray-500"}>தமிழ்</span>
                    <span className={editFormLanguage === 'ta' ? "text-gray-500" : "text-black"}>EN</span>
                  </div>
                </button>
              </div>
            </DialogHeader>
            {editMemberLoading ? (
              <div className="text-center py-8">Saving...</div>
            ) : editMemberError ? (
              <div className="text-center text-red-500 py-8">{editMemberError}</div>
            ) : (
              <form className="space-y-4" onSubmit={handleUpdateMember}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.name}</label>
                    <Input name={editFormLanguage === 'en' ? 'NameEng' : 'NameTam'} value={editFormLanguage === 'en' ? editForm.NameEng : editForm.NameTam} onChange={handleEditInputChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.fatherName}</label>
                    <Input name={editFormLanguage === 'en' ? 'FatherNameEng' : 'FatherNameTam'} value={editFormLanguage === 'en' ? editForm.FatherNameEng : editForm.FatherNameTam} onChange={handleEditInputChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.address}</label>
                    <Input name={editFormLanguage === 'en' ? 'AddressEng' : 'AddressTam'} value={editFormLanguage === 'en' ? editForm.AddressEng : editForm.AddressTam} onChange={handleEditInputChange} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.pollingBooth}</label>
                    <Input name={editFormLanguage === 'en' ? 'PollingBothEng' : 'PollingBothTam'} value={editFormLanguage === 'en' ? editForm.PollingBothEng : editForm.PollingBothTam} onChange={handleEditInputChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.legislativeAssembly}</label>
                    <Input name={editFormLanguage === 'en' ? 'LegislativeAssemblyEng' : 'LegislativeAssemblyTam'} value={editFormLanguage === 'en' ? editForm.LegislativeAssemblyEng : editForm.LegislativeAssemblyTam} onChange={handleEditInputChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.state}</label>
                    <Input name={editFormLanguage === 'en' ? 'StateEng' : 'StateTam'} value={editFormLanguage === 'en' ? editForm.StateEng : editForm.StateTam} onChange={handleEditInputChange}  />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.city}</label>
                    <Input name={editFormLanguage === 'en' ? 'CityEng' : 'CityTam'} value={editFormLanguage === 'en' ? editForm.CityEng : editForm.CityTam} onChange={handleEditInputChange}  />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.ward}</label>
                    <Input name={editFormLanguage === 'en' ? 'AreaEng' : 'AreaTam'} value={editFormLanguage === 'en' ? editForm.AreaEng : editForm.AreaTam} onChange={handleEditInputChange}  />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.dob}</label>
                    <Input name="DOB" type="date" value={editForm.DOB ? editForm.DOB.split('T')[0] : ''} onChange={(e) => {
                      handleEditInputChange(e);
                      // Calculate age from DOB
                      if (e.target.value) {
                        const dob = new Date(e.target.value);
                        const today = new Date();
                        let age = today.getFullYear() - dob.getFullYear();
                        const monthDiff = today.getMonth() - dob.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                          age--;
                        }
                        setEditForm((prev: any) => ({
                          ...prev,
                          Age: age,
                        }));
                      }
                    }} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.age}</label>
                    <Input name="Age" value={editForm.Age} onChange={handleEditInputChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.qualification}</label>
                    <Input name="Qualification" value={editForm.Qualification} onChange={handleEditInputChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.voterId}</label>
                    <Input name="VoterIdNo" value={editForm.VoterIdNo} onChange={handleEditInputChange} disabled />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.mobile}</label>
                    <Input name="MobileNo" value={editForm.MobileNo} onChange={handleEditInputChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.whatsapp}</label>
                    <Input name="WhatsAppNo" value={editForm.WhatsAppNo} onChange={handleEditInputChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.postalCode}</label>
                    <Input name="DoorNo" value={editForm.DoorNo} onChange={handleEditInputChange} onBlur={async () => {
                      if (editForm.DoorNo && editForm.DoorNo.length >= 4) {
                        try {
                          const res = await fetch(`https://api.postalpincode.in/pincode/${editForm.DoorNo}`);
                          const data = await res.json();
                          const post = data?.[0]?.PostOffice?.[0];
                          if (post) {
                            // Translate English values to Tamil
                            const stateTam = await googleTransliterate(post.State || '');
                            const cityTam = await googleTransliterate(post.District || '');
                            const areaTam = await googleTransliterate(post.Name || '');
                            const assemblyTam = await googleTransliterate(post.Block || '');
                            
                            setEditForm((prev: any) => ({
                              ...prev,
                              StateEng: post.State || '',
                              StateTam: stateTam,
                              CityEng: post.District || '',
                              CityTam: cityTam,
                              AreaEng: post.Name || '',
                              AreaTam: areaTam,
                              district: post.District || '',
                              LegislativeAssemblyEng: post.Block || '',
                              LegislativeAssemblyTam: assemblyTam,
                              Country: post.Country || '',
                            }));
                          }
                        } catch {}
                      }
                    }} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.email}</label>
                    <Input name="EmailId" value={editForm.EmailId} onChange={handleEditInputChange} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.memberNo}</label>
                    <Input name="MemberNo" value={editForm.MemberNo} onChange={handleEditInputChange} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.active}</label>
                    <input type="checkbox" name="IsActive" checked={editForm.IsActive} onChange={handleEditInputChange} className="ml-2 mt-2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t.idCardEng}</label>
                  {editForm.IdCardImagePathENg ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <a
                        href={editForm.IdCardImagePathENg}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-left border rounded px-3 py-2 bg-gray-50 hover:bg-gray-100 cursor-pointer block text-blue-700 hover:underline text-sm truncate"
                      >
                        {editForm.IdCardImagePathENg.split('/').pop() || 'Download PDF'}
                      </a>
                      <a
                        href={editForm.IdCardImagePathENg}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Download English ID Card"
                      >
                        <Download className="h-5 w-5 text-green-700 hover:text-green-900 flex-shrink-0" />
                      </a>
                    </div>
                  ) : (
                    <Input name="IdCardImagePathENg" value={editForm.IdCardImagePathENg || ''} onChange={handleEditInputChange} disabled />
                  )}
                  <label className="block text-sm font-medium mt-2">{t.idCardTam}</label>
                  {editForm.IdCardImagePath ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <a
                        href={editForm.IdCardImagePath}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-left border rounded px-3 py-2 bg-gray-50 hover:bg-gray-100 cursor-pointer block text-blue-700 hover:underline text-sm truncate"
                      >
                        {editForm.IdCardImagePath.split('/').pop() || 'Download PDF'}
                      </a>
                      <a
                        href={editForm.IdCardImagePath}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Download Tamil ID Card"
                      >
                        <Download className="h-5 w-5 text-green-700 hover:text-green-900 flex-shrink-0" />
                      </a>
                    </div>
                  ) : (
                    <Input name="IdCardImagePath" value={editForm.IdCardImagePath || ''} onChange={handleEditInputChange} disabled />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t.photo}</label>
                  <input type="file" accept="image/*" onChange={handleEditIdCardChange} className="w-full" />
                  <div className="text-xs text-muted-foreground">Please upload an image below 750KB.</div>
                  {editForm.PhotoImage && (
                    <div className="flex flex-col items-center mt-2">
                      <img src={editForm.PhotoImage} alt="ID Card" className="w-full max-w-xs h-40 object-cover rounded border" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={editMemberLoading}>Cancel</Button>
                  <Button type="submit" disabled={editMemberLoading}>
                    {editMemberLoading ? 'Saving...' : 'Update Member'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Members;
