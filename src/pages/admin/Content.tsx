import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save } from "lucide-react";

const Content = () => {

  // State for active tab
  const [activeTab, setActiveTab] = useState("about");


  // State for About form and AboutPageId
  const [aboutForm, setAboutForm] = useState({
    AboutTitleTam: "",
    AboutTitleEng: "",
    AboutDescTam: "",
    AboutDescEng: "",
  });
  const [aboutPageId, setAboutPageId] = useState<number | null>(null);

  // State for Goals form and GoalPageId (supporting multiple goal items)
  const [goalsForm, setGoalsForm] = useState({
    GoalTitleTam: "",
    GoalTitleEng: "",
    items: [
      { GoalItemTam: "", GoalItemEng: "", GoalDescTam: "", GoalDescEng: "", GoalPageId: undefined },
    ],
  });
  const [goalPageId, setGoalPageId] = useState<number | null>(null);

  // State for Contact form and ContactPageId
  const [contactForm, setContactForm] = useState({
    AddressTam: "",
    AddressEng: "",
    PhoneNo: "",
    EMailId: "",
    GoogleMapUrl: "",
  });
  const [contactPageId, setContactPageId] = useState<number | null>(null);

  // State for Footer form and FooterPageId
  const [footerForm, setFooterForm] = useState({
    DescTam: "",
    DescEng: "",
    FBLink: "",
    InstaLink: "",
    YouTubeLink: "",
    TwitterLink: "",
  });
  const [footerPageId, setFooterPageId] = useState<number | null>(null);

  // Fetch about/goals/contact/footer data when tab is switched
  useEffect(() => {
    if (activeTab === "about") {
      axios.get(`${API_BASE_URL}/api/AboutPage/GetAllAboutPage`)
        .then(res => {
          if (res.data?.Status && res.data?.data?.length > 0) {
            const d = res.data.data[0];
            setAboutForm({
              AboutTitleTam: d.AboutTitleTam || "",
              AboutTitleEng: d.AboutTitleEng || "",
              AboutDescTam: d.AboutDescTam || "",
              AboutDescEng: d.AboutDescEng || "",
            });
            setAboutPageId(d.AboutPageId || null);
          }
        })
        .catch(() => {
          // Optionally handle error
        });
    } else if (activeTab === "goals") {
      axios.get(`${API_BASE_URL}/api/GoalsPage/GetAllGoalsPage`)
        .then(res => {
          if (res.data?.Status && res.data?.data?.length > 0) {
            const d = res.data.data[0];
              const arr = res.data.data;
              setGoalsForm({
                GoalTitleTam: d.GoalTitleTam || "",
                GoalTitleEng: d.GoalTitleEng || "",
                items: arr.map((g: any) => ({
                  GoalItemTam: g.GoalItemTam || "",
                  GoalItemEng: g.GoalItemEng || "",
                  GoalDescTam: g.GoalDescTam || "",
                  GoalDescEng: g.GoalDescEng || "",
                  GoalPageId: g.GoalPageId, // Save GoalPageId for each item
                })),
              });
            setGoalPageId(d.GoalPageId || null);
          }
        })
        .catch(() => {
          // Optionally handle error
        });
    } else if (activeTab === "contact") {
      axios.get(`${API_BASE_URL}/api/ContactPage/GetAllContactPage`)
        .then(res => {
          if (res.data?.Status && res.data?.data?.length > 0) {
            const d = res.data.data[0];
            setContactForm({
              AddressTam: d.AddressTam || "",
              AddressEng: d.AddressEng || "",
              PhoneNo: d.PhoneNo || "",
              EMailId: d.EMailId || "",
              GoogleMapUrl: d.GoogleMapUrl || "",
            });
            setContactPageId(d.ContactPageId || null);
          }
        })
        .catch(() => {
          // Optionally handle error
        });
    } else if (activeTab === "footer") {
      axios.get(`${API_BASE_URL}/api/FooterPage/GetAllFooterPage`)
        .then(res => {
          if (res.data?.Status && res.data?.data?.length > 0) {
            const d = res.data.data[0];
            setFooterForm({
              DescTam: d.DescTam || "",
              DescEng: d.DescEng || "",
              FBLink: d.FBLink || "",
              InstaLink: d.InstaLink || "",
              YouTubeLink: d.YouTubeLink || "",
              TwitterLink: d.TwitterLink || "",
            });
            setFooterPageId(d.FooterPageId || null);
          }
        })
        .catch(() => {
          // Optionally handle error
        });
    }
  }, [activeTab]);
      // Handle About form change
      const handleAboutChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setAboutForm(prev => ({ ...prev, [id]: value }));
      };
    // Handle Footer form change
    const handleFooterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;
      setFooterForm(prev => ({ ...prev, [id]: value }));
    };
  // Handle Contact form change
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setContactForm(prev => ({ ...prev, [id]: value }));
  };

  // Handle Goals section title change
  const handleGoalsTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setGoalsForm(prev => ({ ...prev, [id]: value }));
  };

  // Handle individual goal item change
  const handleGoalItemChange = (idx: number, field: string, value: string) => {
    setGoalsForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }));
  };

  // Add/remove goal item
  const addGoalItem = () => {
    setGoalsForm(prev => ({
      ...prev,
      items: prev.items.length < 4 ? [...prev.items, { GoalItemTam: "", GoalItemEng: "", GoalDescTam: "", GoalDescEng: "", GoalPageId: undefined }] : prev.items,
    }));
  };
  const removeGoalItem = async (idx: number) => {
    const item = goalsForm.items[idx];
    if (item.GoalPageId) {
      try {
        await axios.put(`${API_BASE_URL}/api/GoalsPage/DeleteGoalsPage?GoalPageId=${item.GoalPageId}`);
        // Fetch latest goals after delete
        const res = await axios.get(`${API_BASE_URL}/api/GoalsPage/GetAllGoalsPage`);
        if (res.data?.Status && res.data?.data?.length > 0) {
          const d = res.data.data[0];
          const arr = res.data.data;
          setGoalsForm({
            GoalTitleTam: d.GoalTitleTam || "",
            GoalTitleEng: d.GoalTitleEng || "",
            items: arr.map((g: any) => ({
              GoalItemTam: g.GoalItemTam || "",
              GoalItemEng: g.GoalItemEng || "",
              GoalDescTam: g.GoalDescTam || "",
              GoalDescEng: g.GoalDescEng || "",
              GoalPageId: g.GoalPageId,
            })),
          });
        } else {
          setGoalsForm({ GoalTitleTam: "", GoalTitleEng: "", items: [{ GoalItemTam: "", GoalItemEng: "", GoalDescTam: "", GoalDescEng: "", GoalPageId: undefined }] });
        }
      } catch {
        alert("Failed to delete goal item");
      }
    } else {
      setGoalsForm(prev => ({
        ...prev,
        items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== idx) : prev.items,
      }));
    }
  };

  const orgId = Number(localStorage.getItem("tmk_orgId") || 1);
  const userId = Number(localStorage.getItem("tmk_userId") || 1);

  // Save handler for About/Goals/Contact/Footer
  const handleSave = async (section: string) => {
    if (section === "about") {
      // Post to UpdateAboutPage API
      const payload = {
        AboutPageId: aboutPageId,
        OrgId: orgId,
        ...aboutForm,
        IsActive: true,
        CreatedBy: userId,
      };
      try {
        await axios.put(`${API_BASE_URL}/api/AboutPage/UpdateAboutPage`, payload);
        alert("About info saved successfully");
      } catch {
        alert("Failed to save about info");
      }
    } else if (section === "goals") {
      // For each item, call Add or Update API as appropriate
      const promises = goalsForm.items.map((item) => {
        const isEdit = !!item.GoalPageId;
        const payload = {
          OrgId: orgId,
          GoalTitleTam: goalsForm.GoalTitleTam,
          GoalTitleEng: goalsForm.GoalTitleEng,
          GoalItemTam: item.GoalItemTam,
          GoalItemEng: item.GoalItemEng,
          GoalDescTam: item.GoalDescTam,
          GoalDescEng: item.GoalDescEng,
          IsActive: true,
          CreatedBy: userId,
        };
        if (isEdit) {
          payload["GoalPageId"] = item.GoalPageId;
          return axios.put(`${API_BASE_URL}/api/GoalsPage/UpdateGoalsPage`, payload);
        } else {
          return axios.post(`${API_BASE_URL}/api/GoalsPage/AddGoalsPage`, payload);
        }
      });
      try {
        await Promise.all(promises);
        alert("Goals saved successfully");
      } catch {
        alert("Failed to save goals");
      }
    } else if (section === "contact") {
      // Post to UpdateContactPage API
      const payload = {
        ContactPageId: contactPageId,
        OrgId: orgId,
        ...contactForm,
        IsActive: true,
        CreatedBy: userId,
      };
      try {
        await axios.put(`${API_BASE_URL}/api/ContactPage/UpdateContactPage`, payload);
        alert("Contact info saved successfully");
      } catch {
        alert("Failed to save contact info");
      }
    } else if (section === "footer") {
      // Post to UpdateFooterPage API
      const payload = {
        FooterPageId: footerPageId,
        OrgId: orgId,
        ...footerForm,
        IsActive: true,
        CreatedBy: userId,
      };
      try {
        await axios.put(`${API_BASE_URL}/api/FooterPage/UpdateFooterPage`, payload);
        alert("Footer info saved successfully");
      } catch {
        alert("Failed to save footer info");
      }
    }

  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Content Management</h1>
          <p className="text-muted-foreground">Manage multilingual website content</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
          </TabsList>

          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="AboutTitleTam">Title (Tamil)</Label>
                    <Input id="AboutTitleTam" value={aboutForm.AboutTitleTam} onChange={handleAboutChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="AboutTitleEng">Title (English)</Label>
                    <Input id="AboutTitleEng" value={aboutForm.AboutTitleEng} onChange={handleAboutChange} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="AboutDescTam">Content (Tamil)</Label>
                    <Textarea 
                      id="AboutDescTam" 
                      rows={6}
                      value={aboutForm.AboutDescTam}
                      onChange={handleAboutChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="AboutDescEng">Content (English)</Label>
                    <Textarea 
                      id="AboutDescEng" 
                      rows={6}
                      value={aboutForm.AboutDescEng}
                      onChange={handleAboutChange}
                    />
                  </div>
                </div>
                <Button onClick={() => handleSave('about')}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals">
            <Card>
              <CardHeader>
                <CardTitle>Goals Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="GoalTitleTam">Section Title (Tamil)</Label>
                    <Input id="GoalTitleTam" value={goalsForm.GoalTitleTam} onChange={handleGoalsTitleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="GoalTitleEng">Section Title (English)</Label>
                    <Input id="GoalTitleEng" value={goalsForm.GoalTitleEng} onChange={handleGoalsTitleChange} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Goal Items</h3>
                  {goalsForm.items.map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-4 relative">
                      {goalsForm.items.length > 1 && (
                        <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => removeGoalItem(idx)}>
                          Remove
                        </Button>
                      )}
                      <Input placeholder="Goal Title (Tamil)" value={item.GoalItemTam} onChange={e => handleGoalItemChange(idx, "GoalItemTam", e.target.value)} />
                      <Input placeholder="Goal Title (English)" value={item.GoalItemEng} onChange={e => handleGoalItemChange(idx, "GoalItemEng", e.target.value)} />
                      <Textarea placeholder="Description (Tamil)" rows={3} value={item.GoalDescTam} onChange={e => handleGoalItemChange(idx, "GoalDescTam", e.target.value)} />
                      <Textarea placeholder="Description (English)" rows={3} value={item.GoalDescEng} onChange={e => handleGoalItemChange(idx, "GoalDescEng", e.target.value)} />
                    </div>
                  ))}
                  <Button type="button" onClick={addGoalItem} disabled={goalsForm.items.length >= 6}>
                    + Add Goal Item
                  </Button>
                </div>
                <Button onClick={() => handleSave('goals')}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="AddressTam">Address (Tamil)</Label>
                    <Textarea id="AddressTam" rows={3} value={contactForm.AddressTam} onChange={handleContactChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="AddressEng">Address (English)</Label>
                    <Textarea id="AddressEng" rows={3} value={contactForm.AddressEng} onChange={handleContactChange} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="PhoneNo">Phone</Label>
                    <Input id="PhoneNo" value={contactForm.PhoneNo} onChange={handleContactChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="EMailId">Email</Label>
                    <Input id="EMailId" type="email" value={contactForm.EMailId} onChange={handleContactChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="GoogleMapUrl">Google Maps Embed URL</Label>
                  <Input id="GoogleMapUrl" value={contactForm.GoogleMapUrl} onChange={handleContactChange} />
                </div>
                <Button onClick={() => handleSave('contact')}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="footer">
            <Card>
              <CardHeader>
                <CardTitle>Footer Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="DescTam">Description (Tamil)</Label>
                    <Textarea id="DescTam" rows={4} value={footerForm.DescTam} onChange={handleFooterChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="DescEng">Description (English)</Label>
                    <Textarea id="DescEng" rows={4} value={footerForm.DescEng} onChange={handleFooterChange} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Social Media Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="FBLink">Facebook URL</Label>
                      <Input id="FBLink" value={footerForm.FBLink} onChange={handleFooterChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="InstaLink">Instagram URL</Label>
                      <Input id="InstaLink" value={footerForm.InstaLink} onChange={handleFooterChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="YouTubeLink">YouTube URL</Label>
                      <Input id="YouTubeLink" value={footerForm.YouTubeLink} onChange={handleFooterChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="TwitterLink">Twitter URL</Label>
                      <Input id="TwitterLink" value={footerForm.TwitterLink} onChange={handleFooterChange} />
                    </div>
                  </div>
                </div>
                <Button onClick={() => handleSave('footer')}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Content;
