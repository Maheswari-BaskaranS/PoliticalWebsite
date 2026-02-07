import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { apiFetch, apiUrl } from "@/lib/api";

const Banners = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Banner form state
  const [form, setForm] = useState({
    BannerTitleTam: "",
    BannerTitleEng: "",
    BannerDescTam: "",
    BannerDescEng: "",
    ButtonURL: "",
    BannerImage: "",
    BannerDisplayOrder: 1,
    IsActive: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSizeWarning, setImageSizeWarning] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Preview state
  const [previewBanner, setPreviewBanner] = useState<any>(null);

  // Utility to fetch banners (shared)
  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(apiUrl("/api/Banners/GetAllBanners"), { method: "GET" });
      const data = await res.json();
      setBanners(data.data || []);
    } catch (err: any) {
      setError("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Fetch banner by id for edit
  const fetchBannerById = async (bannerId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(apiUrl(`/api/Banners/GetBannersById?BannerId=${bannerId}`), { method: "GET" });
      const data = await res.json();
      if (data && data.data) {
        setEditingBanner(data.data);
        setForm({
          BannerTitleTam: data.data.BannerTitleTam || "",
          BannerTitleEng: data.data.BannerTitleEng || "",
          BannerDescTam: data.data.BannerDescTam || "",
          BannerDescEng: data.data.BannerDescEng || "",
          ButtonURL: data.data.ButtonURL || "",
          BannerImage: data.data.BannerImage || "",
          BannerDisplayOrder: data.data.BannerDisplayOrder || 1,
          IsActive: data.data.IsActive ?? true,
        });
      }
    } catch (err) {
      setError("Failed to fetch banner details");
    } finally {
      setLoading(false);
    }
  };

  // Populate form on edit
  useEffect(() => {
    if (editingBanner) {
      setForm({
        BannerTitleTam: editingBanner.BannerTitleTam || editingBanner.titleTa || "",
        BannerTitleEng: editingBanner.BannerTitleEng || editingBanner.titleEn || "",
        BannerDescTam: editingBanner.BannerDescTam || "",
        BannerDescEng: editingBanner.BannerDescEng || "",
        ButtonURL: editingBanner.ButtonURL || "",
        BannerImage: editingBanner.BannerImage || "",
        BannerDisplayOrder: editingBanner.BannerDisplayOrder || editingBanner.order || 1,
        IsActive: editingBanner.IsActive ?? true,
      });
    } else {
      setForm({
        BannerTitleTam: "",
        BannerTitleEng: "",
        BannerDescTam: "",
        BannerDescEng: "",
        ButtonURL: "",
        BannerImage: "",
        BannerDisplayOrder: 1,
        IsActive: true,
      });
      setImageFile(null);
    }
  }, [editingBanner, isDialogOpen]);

  // Handle form field changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    let checked = false;
    if (type === "checkbox") {
      checked = (e.target as HTMLInputElement).checked;
    }
    setForm((prev) => ({
      ...prev,
      [id === "btnTa" ? "BannerDescTam" : id === "btnEn" ? "BannerDescEng" : id]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle image file
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setImageSizeWarning("");
  setImageFile(null);
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    // File size check (750KB max)
    if (file.size > 768000) {
      setImageSizeWarning("Only images below 750KB can be uploaded. Please choose a smaller file.");
      setForm((prev) => ({ ...prev, BannerImage: "" }));
      return;
    }
    // Compress image using canvas (like Events)
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Set max width/height (smaller)
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
          setImageSizeWarning("Failed to process image");
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to JPEG, quality 0.5
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setImageSizeWarning("Failed to compress image");
              return;
            }
            if (blob.size > 768000) {
              setImageSizeWarning("Compressed image is still over 750KB. Please choose a smaller image.");
              return;
            }
            const compressedReader = new FileReader();
            compressedReader.onloadend = () => {
              const base64 = compressedReader.result as string;
              // Check base64 string length (safe limit: 750,000 chars)
              if (base64.length > 750000) {
                setImageSizeWarning("Image is too large after compression (over 750KB). Please choose a smaller image or lower quality.");
                setForm((prev) => ({ ...prev, BannerImage: "" }));
                return;
              }
              setImageFile(file);
              setForm((prev) => ({ ...prev, BannerImage: base64 }));
            };
            compressedReader.readAsDataURL(blob);
          },
          "image/jpeg",
          0.5
        );
      };
      img.onerror = () => {
        setImageSizeWarning("Invalid image file");
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setImageSizeWarning("Failed to read image file");
    };
    reader.readAsDataURL(file);
  }
};


  // Handle switch
  const handleSwitch = (checked: boolean) => {
    setForm((prev) => ({ ...prev, IsActive: checked }));
  };

  // Add/Update Banner submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Check for duplicate display order
      const duplicate = banners.find(b => b.BannerDisplayOrder == form.BannerDisplayOrder && b.BannerId !== editingBanner?.BannerId);
      if (duplicate) {
        alert(`Display order ${form.BannerDisplayOrder} already given`);
        setSubmitting(false);
        return;
      }
      // Always send the base64 data URL as BannerImage
      let imageUrl = form.BannerImage;

      const orgId = Number(localStorage.getItem("tmk_orgId")) || 0;
      const userId = Number(localStorage.getItem("tmk_userId")) || 0;
      const now = new Date().toISOString();
      let payload: any = {
        OrgId: orgId,
        BannerTitleTam: form.BannerTitleTam,
        BannerTitleEng: form.BannerTitleEng,
        BannerDescTam: form.BannerDescTam,
        BannerDescEng: form.BannerDescEng,
        ButtonURL: form.ButtonURL,
        BannerImage: imageUrl, // base64 data URL only
        BannerDisplayOrder: Number(form.BannerDisplayOrder) || 1,
        IsActive: form.IsActive,
        CreatedBy: userId,
        CreatedOn: editingBanner?.CreatedOn || now,
        ModifiedBy: userId,
        ModifiedOn: now,
      };
      if (editingBanner && editingBanner.BannerId) {
        // Update
        payload = { ...payload, BannerId: editingBanner.BannerId };
        await apiFetch(apiUrl("/api/Banners/UpdateBanners"), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Add
        await apiFetch(apiUrl("/api/Banners/AddBanners"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setIsDialogOpen(false);
      setEditingBanner(null);
      alert(editingBanner ? "Banner updated successfully" : "Banner created successfully");
      await fetchBanners();
    } catch (err: any) {
      alert("Failed to save banner: " + (err.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (banner: any) => {
    if (banner.BannerId) {
      fetchBannerById(banner.BannerId);
    } else {
      setEditingBanner(banner);
      setIsDialogOpen(true);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch(apiUrl(`/api/Banners/DeleteBanners?BannerId=${id}`), { method: "PUT" });
      alert("Banner deleted successfully");
      await fetchBanners();
    } catch (err) {
      alert("Failed to delete banner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Banner Management</h1>
            <p className="text-muted-foreground">Manage homepage hero banners</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingBanner(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-full w-[95%] sm:w-auto sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto mx-auto" onPointerDownOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>{editingBanner ? "Edit Banner" : "Add New Banner"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="titleTa">Title (Tamil) *</Label>
                    <Textarea id="BannerTitleTam" value={form.BannerTitleTam} onChange={handleFormChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titleEn">Title (English) *</Label>
                    <Textarea id="BannerTitleEng" value={form.BannerTitleEng} onChange={handleFormChange} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="btnTa">Button Text (Tamil) *</Label>
                    <Input id="BannerDescTam" value={form.BannerDescTam} onChange={handleFormChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="btnEn">Button Text (English) *</Label>
                    <Input id="BannerDescEng" value={form.BannerDescEng} onChange={handleFormChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ButtonURL">Button URL</Label>
                  <Input id="ButtonURL" value={form.ButtonURL} onChange={handleFormChange} placeholder="https://example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Banner Image *</Label>
                  <div className="text-sm text-muted-foreground">
                    Allowed image:<br />
                    • Max size: 60KB
                  </div>
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                  {imageSizeWarning && (
                    <div className="text-sm text-red-600 mt-1">{imageSizeWarning}</div>
                  )}
                  {form.BannerImage && !imageSizeWarning && (
                    <div className="mt-2 flex justify-center">
                      <img
                        src={form.BannerImage}
                        alt="Banner Preview"
                        className="w-64 h-36 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="order">Display Order *</Label>
                    <Input id="BannerDisplayOrder" type="number" min="1" value={form.BannerDisplayOrder} onChange={handleFormChange} required />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Switch id="active" checked={form.IsActive} onCheckedChange={handleSwitch} />
                    <Label htmlFor="active">Active</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {editingBanner ? "Update" : "Create"} Banner
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="text-center py-8">Loading banners...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : banners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No banners found.</div>
          ) : (
            banners.map((banner) => (
              <Card key={banner.BannerId}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <img src={banner.BannerImage} alt={banner.BannerTitleEng} className="w-full md:w-48 h-32 object-cover rounded-lg" />
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row items-start justify-between mb-2 gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{banner.BannerTitleEng}</h3>
                          <p className="text-sm text-muted-foreground tamil-font">{banner.BannerTitleTam}</p>
                          <p className="text-xs text-muted-foreground mt-1">{banner.BannerDescEng}</p>
                          <p className="text-xs text-muted-foreground tamil-font">{banner.BannerDescTam}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                          <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${banner.IsActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {banner.IsActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="px-2 py-1 bg-muted rounded text-xs whitespace-nowrap">
                            Order: {banner.BannerDisplayOrder}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(banner)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPreviewBanner(banner)}>
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(banner.BannerId)}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Preview Dialog */}
        <Dialog open={!!previewBanner} onOpenChange={() => setPreviewBanner(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Banner Preview</DialogTitle>
            </DialogHeader>
            {previewBanner && (
              <div className="flex flex-col items-center gap-4">
                <img
                  src={previewBanner.BannerImage}
                  alt={previewBanner.BannerTitleEng}
                  className="w-full max-w-md h-48 object-cover rounded-lg"
                />
                <div className="text-center">
                  <h2 className="font-bold text-xl mb-1">{previewBanner.BannerTitleEng}</h2>
                  <h3 className="font-bold text-lg tamil-font mb-2">{previewBanner.BannerTitleTam}</h3>
                  <div className="mb-2">
                    <span className="block text-base font-medium">{previewBanner.BannerDescEng}</span>
                    <span className="block text-base font-medium tamil-font">{previewBanner.BannerDescTam}</span>
                  </div>
                {/*   <div className="flex flex-col gap-2 mt-2">
                    <Button variant="default" className="w-full" disabled>
                      {previewBanner.BannerDescEng}
                    </Button>
                    <Button variant="default" className="w-full tamil-font" disabled>
                      {previewBanner.BannerDescTam}
                    </Button>
                  </div> */}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Banners;
