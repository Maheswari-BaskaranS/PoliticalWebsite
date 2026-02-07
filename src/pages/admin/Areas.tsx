import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

const Areas = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);
  const [search, setSearch] = useState("");

  // API data states
  const [states, setStates] = useState<any[]>([]);
  const [allCities, setAllCities] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [areasLoading, setAreasLoading] = useState(true);

  // Form states
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [areaNameEng, setAreaNameEng] = useState("");
  const [areaNameTam, setAreaNameTam] = useState("");

  // Fetch states
  useEffect(() => {
    const fetchStates = async () => {
      setStatesLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/State/GetAllState`);
        const json = await res.json();
        if (json && json.Status && Array.isArray(json.data)) {
          setStates(json.data);
        }
      } catch (e) {
        console.error("Failed to load states", e);
      } finally {
        setStatesLoading(false);
      }
    };
    fetchStates();
  }, []);

  // Fetch all cities
  useEffect(() => {
    const fetchAllCities = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/City/GetAllCity`);
        const json = await res.json();
        if (json && json.Status && Array.isArray(json.data)) {
          setAllCities(json.data);
        }
      } catch (e) {
        console.error("Failed to load all cities", e);
      }
    };
    fetchAllCities();
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    if (!selectedStateId) {
      setCities([]);
      return;
    }
    setCitiesLoading(true);
    setCities(allCities.filter((c: any) => c.StateId === parseInt(selectedStateId)));
    setCitiesLoading(false);
  }, [selectedStateId, allCities]);

  // Fetch areas
  useEffect(() => {
    const fetchAreas = async () => {
      setAreasLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/Area/GetAllArea`);
        const json = await res.json();
        if (json && json.Status && Array.isArray(json.data)) {
          setAreas(json.data);
        }
      } catch (e) {
        console.error("Failed to load areas", e);
      } finally {
        setAreasLoading(false);
      }
    };
    fetchAreas();
  }, []);

  const areasWithNames = areas.map(area => {
    const state = states.find(s => s.StateId === area.StateId);
    const city = allCities.find(c => c.CityId === area.CityId);
    return {
      ...area,
      CityNameEng: city?.CityNameEng || '',
      StateNameEng: state?.StateNameEng || '',
    };
  });

  const filteredAreas = areasWithNames.filter(area => {
    const searchLower = search.toLowerCase();
    return (
      area.AreaNameEng?.toLowerCase().includes(searchLower) ||
      area.AreaNameTam?.includes(search) ||
      area.CityNameEng?.toLowerCase().includes(searchLower) ||
      area.StateNameEng?.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (area: any) => {
    setEditingArea(area);
    setSelectedStateId(area.StateId ? area.StateId.toString() : "");
    setSelectedCityId(area.CityId ? area.CityId.toString() : "");
    setAreaNameEng(area.AreaNameEng || "");
    setAreaNameTam(area.AreaNameTam || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this area?")) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/Area/DeleteArea/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setAreas(areas.filter(a => a.AreaId !== id));
          alert("Area deleted successfully");
        } else {
          alert("Failed to delete area");
        }
      } catch (e) {
        alert("Error deleting area");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
const userId = Number(localStorage.getItem("tmk_userId")) || 0;
          const orgId = Number(localStorage.getItem("tmk_orgId")) || 0;
    if (!orgId) {
      alert("OrgId not found");
      return;
    }
    const payload = {
      OrgId: orgId,
      StateId: parseInt(selectedStateId),
      CityId: parseInt(selectedCityId),
      AreaNameTam: areaNameTam,
      AreaNameEng: areaNameEng,
      AreaDesc: "",
      IsActive: true,
      CreatedBy: userId,
    };
    try {
      const url = editingArea ? `${API_BASE_URL}/api/Area/UpdateArea` : `${API_BASE_URL}/api/Area/AddArea`;
      const method = editingArea ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.Status) {
        alert(editingArea ? "Area updated successfully" : "Area added successfully");
        setIsDialogOpen(false);
        setEditingArea(null);
        setSelectedStateId("");
        setSelectedCityId("");
        setAreaNameEng("");
        setAreaNameTam("");
        // Refresh areas
        const res2 = await fetch(`${API_BASE_URL}/api/Area/GetAllArea`);
        const json2 = await res2.json();
        if (json2 && json2.Status && Array.isArray(json2.data)) {
          setAreas(json2.data);
        }
      } else {
        alert("Failed to save area");
      }
    } catch (err) {
      alert("Error saving area");
    }
  };

  const handleAddClick = () => {
    setEditingArea(null);
    setSelectedStateId(states.length > 0 ? states[0].StateId.toString() : "");
    setSelectedCityId("");
    setAreaNameEng("");
    setAreaNameTam("");
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Areas Master</h1>
            <p className="text-muted-foreground">Manage areas/wards for member registration</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddClick}>
                <Plus className="w-4 h-4 mr-2" />
                Add Area
              </Button>
            </DialogTrigger>
            <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>{editingArea ? "Edit Area" : "Add New Area"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select value={selectedStateId} onValueChange={(value) => { setSelectedStateId(value); setSelectedCityId(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.StateId} value={state.StateId.toString()}>
                          {state.StateNameEng}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Select value={selectedCityId} onValueChange={setSelectedCityId} disabled={!selectedStateId || citiesLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.CityId} value={city.CityId.toString()}>
                          {city.CityNameEng}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameEn">Area Name (English)</Label>
                  <Input id="nameEn" value={areaNameEng} onChange={(e) => setAreaNameEng(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameTa">Area Name (Tamil)</Label>
                  <Input id="nameTa" value={areaNameTam} onChange={(e) => setAreaNameTam(e.target.value)} required className="tamil-font" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingArea ? "Update" : "Create"} Area
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="area-search">Search</Label>
              <Input
                id="area-search"
                placeholder="Search by area, city, or state name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area Name (English)</TableHead>
                  <TableHead>Area Name (Tamil)</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAreas.map((area) => (
                  <TableRow key={area.AreaId}>
                    <TableCell className="font-medium">{area.AreaNameEng}</TableCell>
                    <TableCell className="tamil-font">{area.AreaNameTam}</TableCell>
                    <TableCell>{area.CityNameEng}</TableCell>
                    <TableCell>{area.StateNameEng}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(area)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(area.AreaId)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Areas;

