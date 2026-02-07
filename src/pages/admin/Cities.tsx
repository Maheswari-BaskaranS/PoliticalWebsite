import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface CityItem {
  id: number;
  nameTa: string;
  nameEn: string;
  stateId: number;
  stateNameEn: string;
}
interface StateOption {
  id: number;
  nameEn: string;
  nameTa: string;
}

const Cities = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityItem | null>(null);
  const [selectedState, setSelectedState] = useState("all");
  const [formStateId, setFormStateId] = useState<string>("");
  const [formNameTa, setFormNameTa] = useState<string>("");
  const [formNameEn, setFormNameEn] = useState<string>("");
  const [states, setStates] = useState<StateOption[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTamil = (txt: string) => /[\u0B80-\u0BFF]/.test(txt || "");

  const fetchStates = async () => {
    const res = await apiFetch("/api/State/GetAllState", { method: "GET" });
    if (!res.ok) throw new Error(`Failed states (${res.status})`);
    const payload = await res.json();
    const raw = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
    const list: StateOption[] = raw.map((s: any) => {
      const rawTa = s.StateNameTam ?? s.StateNameTa ?? "";
      const rawEn = s.StateNameEng ?? s.StateName ?? "";
      const taHas = isTamil(rawTa);
      const enHas = isTamil(rawEn);
      const nameTa = !taHas && enHas ? rawEn : rawTa;
      const nameEn = !taHas && enHas ? rawTa : rawEn;
      return { id: s.StateId ?? s.id ?? 0, nameEn, nameTa };
    });
    setStates(list);
    return list;
  };

  const fetchCities = async (stateLookup: Map<number, string>) => {
    const res = await apiFetch("/api/City/GetAllCity", { method: "GET" });
    if (!res.ok) throw new Error(`Failed cities (${res.status})`);
    const payload = await res.json();
    const raw = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
    const list: CityItem[] = raw.map((c: any, idx: number) => {
      const rawTa = c.CityNameTam ?? "";
      const rawEn = c.CityNameEng ?? "";
      const taHas = isTamil(rawTa);
      const enHas = isTamil(rawEn);
      const nameTa = !taHas && enHas ? rawEn : rawTa;
      const nameEn = !taHas && enHas ? rawTa : rawEn;
      const stateId = c.StateId ?? 0;
      const stateNameEn = stateLookup.get(stateId) || String(stateId);
      return {
        id: c.CityId ?? idx,
        nameTa,
        nameEn,
        stateId,
        stateNameEn,
      } as CityItem;
    });
    setCities(list);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const stateList = await fetchStates();
        const lookup = new Map<number, string>(stateList.map((s) => [s.id, s.nameEn]));
        await fetchCities(lookup);
      } catch (err: any) {
        setError(err?.message || "Unable to load cities");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredCities = useMemo(() => {
    if (selectedState === "all") return cities;
    return cities.filter((c) => c.stateNameEn === selectedState);
  }, [cities, selectedState]);

  const handleEdit = async (city: any) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch city by id
      const res = await apiFetch(`/api/City/GetCityById?CityId=${city.id}`, { method: "GET" });
      if (!res.ok) throw new Error(`Failed to fetch city (${res.status})`);
      const payload = await res.json();
      const c = payload?.data || {};
      setEditingCity({
        id: c.CityId,
        nameTa: c.CityNameTam ?? "",
        nameEn: c.CityNameEng ?? "",
        stateId: c.StateId ?? 0,
        stateNameEn: states.find(s => s.id === c.StateId)?.nameEn || String(c.StateId),
      });
      setFormStateId((c.StateId ?? "").toString());
      setFormNameTa(c.CityNameTam ?? "");
      setFormNameEn(c.CityNameEng ?? "");
      setIsDialogOpen(true);
    } catch (err: any) {
      setError(err?.message || "Unable to load city details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this city?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/City/DeleteCity?CityId=${id}`, { method: "PUT" });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Delete failed (${res.status}): ${msg}`);
      }
      // Refresh state/city lists
      const stateList = await fetchStates();
      const lookup = new Map<number, string>(stateList.map((s) => [s.id, s.nameEn]));
      await fetchCities(lookup);
    } catch (err: any) {
      setError(err?.message || "Unable to delete city");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const OrgId = Number(localStorage.getItem("tmk_orgId")) || 1;
      const userId = Number(localStorage.getItem("tmk_userId")) || 1;
      const StateId = Number(formStateId);
      const CityNameTam = formNameTa.trim();
      const CityNameEng = formNameEn.trim();
      if (!StateId || !CityNameTam || !CityNameEng) {
        setError("All fields are required.");
        setLoading(false);
        return;
      }
      let res;
      if (editingCity) {
        // Update City
        const payload = {
          CityId: editingCity.id,
          OrgId,
          StateId,
          CityNameTam,
          CityNameEng,
          IsArea: true,
          IsActive: true,
          ModifiedBy: userId,
        };
        res = await apiFetch("/api/City/UpdateCity", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(`Update failed (${res.status}): ${msg}`);
        }
      } else {
        // Add City
        const payload = {
          OrgId,
          StateId,
          CityNameTam,
          CityNameEng,
          IsArea: true,
          IsActive: true,
          CreatedBy: userId,
        };
        res = await apiFetch("/api/City/AddCity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(`Add failed (${res.status}): ${msg}`);
        }
      }
      // After add/update, always refresh states and cities to ensure mapping is up-to-date
      const stateList = await fetchStates();
      const lookup = new Map<number, string>(stateList.map((s) => [s.id, s.nameEn]));
      await fetchCities(lookup);
      setIsDialogOpen(false);
      setEditingCity(null);
      setFormStateId("");
      setFormNameTa("");
      setFormNameEn("");
    } catch (err: any) {
      setError(err?.message || "Unable to save city");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cities Master</h1>
            <p className="text-muted-foreground">Manage cities for member registration</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCity(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Add City
              </Button>
            </DialogTrigger>
            <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>{editingCity ? "Edit City" : "Add New City"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stateSelect">State</Label>
                  <Select
                    value={formStateId}
                    onValueChange={setFormStateId}
                  >
                    <SelectTrigger id="stateSelect" className="bg-background">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {states.map((state) => (
                        <SelectItem key={state.id} value={state.id.toString()}>
                          {state.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameTa">Name (Tamil)</Label>
                  <Input
                    id="nameTa"
                    value={formNameTa}
                    onChange={e => setFormNameTa(e.target.value)}
                    required
                    className="tamil-font"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameEn">Name (English)</Label>
                  <Input
                    id="nameEn"
                    value={formNameEn}
                    onChange={e => setFormNameEn(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingCity(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {editingCity ? "Update" : "Create"} City
                  </Button>
                </div>
                {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter by State</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-64 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All States</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state.id} value={state.nameEn}>
                    {state.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name (English)</TableHead>
                  <TableHead>Name (Tamil)</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {error && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-red-600">{error}</TableCell>
                  </TableRow>
                )}
                {loading && !error && (
                  <TableRow>
                    <TableCell colSpan={4}>Loading cities...</TableCell>
                  </TableRow>
                )}
                {!loading && !error && filteredCities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>No cities found.</TableCell>
                  </TableRow>
                )}
                {filteredCities.map((city) => (
                  <TableRow key={city.id}>
                    <TableCell className="font-medium">{city.nameEn}</TableCell>
                    <TableCell className="tamil-font">{city.nameTa}</TableCell>
                    <TableCell>{city.stateNameEn}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(city)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(city.id)}>
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

export default Cities;
