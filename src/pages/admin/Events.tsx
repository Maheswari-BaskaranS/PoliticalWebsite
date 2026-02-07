import { useEffect, useState, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

const Events = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Refactored fetchEvents to be reusable
  const fetchEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/Events/GetAllEvents`);
      const json = await res.json();
      if (json && json.Status && Array.isArray(json.data)) {
        setEvents(json.data);
      } else {
        setError("No events found");
      }
    } catch (e) {
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEdit = async (event: any) => {
    // Fetch event details by id
    try {
      const res = await fetch(`${API_BASE_URL}/api/Events/GetEventsById?EventId=${event.EventId}`);
      const json = await res.json();
      if (json && json.Status && json.data) {
        setEditingEvent(json.data);
        setIsDialogOpen(true);
      } else {
        alert("Failed to fetch event details");
      }
    } catch (err) {
      alert("Failed to fetch event details");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/Events/DeleteEvents?EventId=${id}`, {
        method: "PUT"
      });
      const json = await res.json();
      if (json && json.Status) {
        await fetchEvents();
      } else {
        setError(json?.Message || "Failed to delete event");
      }
    } catch (err) {
      setError("Failed to delete event");
    } finally {
      setLoading(false);
    }
  };



  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePath, setImagePath] = useState("");
  const [imageError, setImageError] = useState("");
  // Compress image before converting to base64 (smaller size, lower quality, check base64 length)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError("");
    setImageFile(null);
    setImagePath("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 768000) {
      setImageError("Please upload an image of 750KB or below.");
      return;
    }
    setImageFile(file);
    // Compress image using canvas
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
          setImageError("Failed to process image");
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to JPEG, quality 0.5
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setImageError("Failed to compress image");
              return;
            }
            if (blob.size > 768000) {
              setImageError("Compressed image is still over 750KB. Please choose a smaller image.");
              return;
            }
            const compressedReader = new FileReader();
            compressedReader.onloadend = () => {
              const base64 = compressedReader.result as string;
              // Check base64 string length (safe limit: 750,000 chars)
              if (base64.length > 750000) {
                setImageError("Image is too large after compression (over 750KB). Please choose a smaller image or lower quality.");
                setImagePath("");
                return;
              }
              setImagePath(base64); // base64 string
            };
            compressedReader.readAsDataURL(blob);
          },
          "image/jpeg",
          0.5
        );
      };
      img.onerror = () => {
        setImageError("Invalid image file");
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setImageError("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    setSubmitting(true);
    setImageError("");
    const fd = new FormData(formRef.current);
    // Get OrgId and CreatedBy from localStorage
    const OrgId = Number(localStorage.getItem("tmk_orgId")) || 1;
    const CreatedBy = Number(localStorage.getItem("tmk_userId")) || 1;
    const now = new Date().toISOString();

    // Format EventDate as ISO string (with time)
    let eventDateRaw = fd.get("date")?.toString() || "";
    let eventDateISO = eventDateRaw ? new Date(eventDateRaw + "T00:00:00.000Z").toISOString() : "";

    // Format EventTime as 12-hour with AM/PM
    function to12Hour(time24: string) {
      if (!time24) return "";
      const [h, m] = time24.split(":");
      let hour = parseInt(h, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      hour = hour % 12;
      if (hour === 0) hour = 12;
      return `${hour.toString().padStart(2, "0")}:${m} ${ampm}`;
    }
    let eventTime12 = to12Hour(fd.get("time")?.toString() || "");

    // Location mapping: if Tamil script detected, assign to Tam, else Eng
let EventLocationEng = fd.get("location")?.toString() || "";
let EventLocationTam = fd.get("locationTa")?.toString() || "";

    let payload: any = {
      OrgId,
      TitleTam: fd.get("titleTa")?.toString() || "",
      TitleEng: fd.get("titleEn")?.toString() || "",
      EventDescTam: fd.get("descTa")?.toString() || "",
      EventDescEng: fd.get("descEn")?.toString() || "",
      EventDate: eventDateISO,
      EventTime: eventTime12,
      EventLocationTam,
      EventLocationEng,
      // If editing, and no new image selected, use the existing image from editingEvent
      EventImage: imagePath || (editingEvent && editingEvent.EventImage) || "",
      IsActive: true,
      CreatedBy
    };
    let url = `${API_BASE_URL}/api/Events/AddEvents`;
    let method = "POST";
    // If editing, add event id and update fields
    if (editingEvent && editingEvent.EventId) {
      payload = {
        ...payload,
        EventId: editingEvent.EventId,
        CreatedOn: editingEvent.CreatedOn,
        ModifiedBy: CreatedBy,
        ModifiedOn: now
      };
      url = `${API_BASE_URL}/api/Events/UpdateEvents`;
      method = "PUT";
    }
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json && json.Status) {
        setIsDialogOpen(false);
        setEditingEvent(null);
        setImageFile(null);
        setImagePath("");
        // Reset form fields
        if (formRef.current) {
          formRef.current.reset();
        }
        // Refetch events after closing popup
        setTimeout(() => {
          fetchEvents();
        }, 0);
      } else {
        alert(json?.Message || (editingEvent ? "Failed to update event" : "Failed to add event"));
      }
    } catch (err) {
      alert(editingEvent ? "Failed to update event" : "Failed to add event");
    } finally {
      setSubmitting(false);
    }
  };

     // Helper to format event date as yyyy-mm-dd
      function formatEventDate(iso: string) {
        if (!iso) return "";
        const d = new Date(iso);
        return d.toLocaleDateString("en-CA");
      }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Events Management</h1>
            <p className="text-muted-foreground">Create and manage party events</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingEvent(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
              </DialogHeader>
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="titleTa">Title (Tamil)</Label>
                    <Input id="titleTa" name="titleTa" defaultValue={editingEvent?.TitleTam} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titleEn">Title (English)</Label>
                    <Input id="titleEn" name="titleEn" defaultValue={editingEvent?.TitleEng} required />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="descTa">Description (Tamil)</Label>
                    <Textarea id="descTa" name="descTa" defaultValue={editingEvent?.EventDescTam} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descEn">Description (English)</Label>
                    <Textarea id="descEn" name="descEn" defaultValue={editingEvent?.EventDescEng} required />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" name="date" type="date" defaultValue={editingEvent?.EventDate ? editingEvent.EventDate.slice(0,10) : ""} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      name="time"
                      type="time"
                      defaultValue={editingEvent?.EventTime ? (() => {
                        // Convert '05:00 PM' to '17:00' for input type="time"
                        const t = editingEvent.EventTime.trim();
                        if (/AM|PM/i.test(t)) {
                          let [time, period] = t.split(" ");
                          let [h, m] = time.split(":");
                          let hour = parseInt(h, 10);
                          if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
                          if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
                          return `${hour.toString().padStart(2, "0")}:${m}`;
                        }
                        return t;
                      })() : ""}
                      required
                    />
                  </div>
                <div className="space-y-2">
  <Label htmlFor="location">Location (English)</Label>
  <Input id="location" name="location" defaultValue={editingEvent?.EventLocationEng} required />
</div>
<div className="space-y-2">
  <Label htmlFor="locationTa">Location (Tamil)</Label>
  <Input id="locationTa" name="locationTa" defaultValue={editingEvent?.EventLocationTam} />
</div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Event Image</Label>
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                  {imageError && <div className="text-xs text-red-500">{imageError}</div>}
                  {(imagePath || editingEvent?.EventImage) && (
                    <img
                      src={imagePath || editingEvent?.EventImage}
                      alt="Event Preview"
                      className="w-32 h-32 object-cover rounded mt-2 border"
                    />
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : editingEvent ? "Update" : "Create"} Event
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-3 text-center py-8">Loading...</div>
          ) : error ? (
            <div className="col-span-3 text-center text-red-500 py-8">{error}</div>
          ) : events.length === 0 ? (
            <div className="col-span-3 text-center text-muted-foreground py-8">No events found</div>
          ) : (
            events.map((event) => (
              <Card key={event.EventId}>
                <CardHeader className="p-0">
                  <img
                    src={event.EventImage ? event.EventImage : "/placeholder.svg"}
                    alt={event.TitleEng}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="mb-2">{event.TitleEng}</CardTitle>
                  <p className="text-sm text-muted-foreground mb-4 tamil-font">{event.TitleTam}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-primary" />
                      <span>{formatEventDate(event.EventDate)} at {event.EventTime}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-muted-foreground">{event.EventLocationEng}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(event)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(event.EventId)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>


   
      </div>
    </AdminLayout>
  );
};

export default Events;
