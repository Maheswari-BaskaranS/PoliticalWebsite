import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, RefreshCcw } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface StateItem {
  id: number;
  nameTa: string;
  nameEn: string;
  code: string;
}

const States = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingState, setEditingState] = useState<StateItem | null>(null);
  const [states, setStates] = useState<StateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchStates = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await apiFetch("/api/State/GetAllState", { method: "GET" });
      if (!res.ok) throw new Error(`Failed to load states (${res.status})`);
      const data = await res.json();
      const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const isTamil = (txt: string) => /[\u0B80-\u0BFF]/.test(txt);
      const list: StateItem[] = raw.map((s: any) => {
        const rawTam = s.StateNameTam ?? s.StateNameTa ?? "";
        const rawEng = s.StateNameEng ?? s.StateName ?? "";
        let nameTa = rawTam;
        let nameEn = rawEng;
        // If one string has Tamil script and the other doesn't, assign accordingly
        const tamHasTamil = isTamil(rawTam);
        const engHasTamil = isTamil(rawEng);
        if (tamHasTamil && !engHasTamil) {
          // rawTam truly Tamil, rawEng non-Tamil: keep as-is
          nameTa = rawTam;
          nameEn = rawEng;
        } else if (!tamHasTamil && engHasTamil) {
          // rawEng is Tamil, rawTam is English: swap
          nameTa = rawEng;
          nameEn = rawTam;
        }
        return {
          id: s.StateId ?? s.id ?? 0,
          nameTa,
          nameEn,
          code: s.Code ?? s.StateCode ?? "",
        };
      });
      setStates(list);
    } catch (err: any) {
      setFetchError(err?.message || "Unable to load states");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchStateById = async (id: number) => {
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await apiFetch(`/api/State/GetStateById?StateId=${id}`, { method: "GET" });
      if (!res.ok) throw new Error(`Failed to get state (${res.status})`);
      const payload = await res.json();
      const s = payload?.data || {};
      const isTamil = (txt: string) => /[\u0B80-\u0BFF]/.test(txt);
      const rawTam = s.StateNameTam ?? s.StateNameTa ?? "";
      const rawEng = s.StateNameEng ?? s.StateName ?? "";
      let nameTa = rawTam;
      let nameEn = rawEng;
      const tamHasTamil = isTamil(rawTam);
      const engHasTamil = isTamil(rawEng);
      if (!tamHasTamil && engHasTamil) {
        nameTa = rawEng;
        nameEn = rawTam;
      }
      const mapped: StateItem = {
        id: s.StateId ?? s.id ?? 0,
        nameTa,
        nameEn,
        code: s.Code ?? s.StateCode ?? "",
      };
      setEditingState(mapped);
      setFormNameTa(mapped.nameTa);
      setFormNameEn(mapped.nameEn);
    } catch (err: any) {
      setEditError(err?.message || "Unable to load state details");
    } finally {
      setEditLoading(false);
    }
  };

  const handleEdit = (state: any) => {
    setIsDialogOpen(true);
    fetchStateById(state.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this state?")) return;
    setDeleteError(null);
    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/State/DeleteState?StateId=${id}`, { method: "PUT" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed to delete state (${res.status})`);
      }
      await fetchStates();
    } catch (err: any) {
      setDeleteError(err?.message || "Unable to delete state");
    } finally {
      setDeletingId(null);
    }
  };

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form field state (for create / edit)
  const [formNameTa, setFormNameTa] = useState("");
  const [formNameEn, setFormNameEn] = useState("");

  useEffect(() => {
    if (editingState) {
      setFormNameTa(editingState.nameTa);
      setFormNameEn(editingState.nameEn);
    } else {
      setFormNameTa("");
      setFormNameEn("");
    }
  }, [editingState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      const orgId = Number(localStorage.getItem("tmk_orgId") || 1);
      const userId = Number(localStorage.getItem("tmk_userId") || 1);
      const isUpdate = !!editingState;
      const endpoint = isUpdate ? "/api/State/UpdateState" : "/api/State/AddState";
      const body = isUpdate
        ? {
            StateId: editingState!.id,
            OrgId: orgId,
            StateNameTam: formNameTa,
            StateNameEng: formNameEn,
            IsCity: true,
            IsActive: true,
            ModifiedBy: userId,
          }
        : {
            OrgId: orgId,
            StateNameTam: formNameTa,
            StateNameEng: formNameEn,
            IsCity: true,
            IsActive: true,
            CreatedBy: userId,
          };

      const method = isUpdate ? "PUT" : "POST";
      const res = await apiFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed to ${isUpdate ? "update" : "save"} state (${res.status})`);
      }
      // After successful creation, refresh list
      await fetchStates();
      setIsDialogOpen(false);
      setEditingState(null);
      // Clear form fields after Add (not Edit)
      if (!isUpdate) {
        setFormNameTa("");
        setFormNameEn("");
      }
    } catch (err: any) {
      setSubmitError(err?.message || "Unable to save state");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">States Master</h1>
            <p className="text-muted-foreground">Manage states for member registration</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <div className="flex gap-2">
              <DialogTrigger asChild>
                <Button onClick={() => setEditingState(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add State
                </Button>
              </DialogTrigger>
              <Button variant="outline" onClick={fetchStates} disabled={loading}>
                {loading ? (
                  <span>Loading...</span>
                ) : (
                  <span className="flex items-center"><RefreshCcw className="w-4 h-4 mr-2" />Refresh</span>
                )}
              </Button>
            </div>
            <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>{editingState ? "Edit State" : "Add New State"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nameTa">Name (Tamil)</Label>
                  <Input
                    id="nameTa"
                    value={formNameTa}
                    onChange={(e) => setFormNameTa(e.target.value)}
                    required
                    className="tamil-font"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameEn">Name (English)</Label>
                  <Input
                    id="nameEn"
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    required
                  />
                </div>
                {/* <div className="space-y-2">
                  <Label htmlFor="code">State Code</Label>
                  <Input id="code" defaultValue={editingState?.code} maxLength={2} placeholder="TN" required />
                </div> */}
                <div className="flex items-center justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  {submitError && (
                    <span className="text-sm text-red-600 mr-auto" role="alert">{submitError}</span>
                  )}
                  <Button type="submit" disabled={submitLoading || editLoading}>
                    {submitLoading
                      ? (editingState ? "Updating..." : "Saving...")
                      : editingState
                      ? "Update State"
                      : "Create State"}
                  </Button>
                </div>
                {editLoading && (
                  <p className="text-sm text-muted-foreground">Loading state details...</p>
                )}
                {editError && (
                  <p className="text-sm text-red-600" role="alert">{editError}</p>
                )}
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name (English)</TableHead>
                  <TableHead>Name (Tamil)</TableHead>
                  {/* <TableHead>Code</TableHead> */}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deleteError && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-red-600">
                      {deleteError}
                    </TableCell>
                  </TableRow>
                )}
                {fetchError && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-red-600">
                      {fetchError}
                    </TableCell>
                  </TableRow>
                )}
                {loading && !states.length && !fetchError && (
                  <TableRow>
                    <TableCell colSpan={4}>Loading states...</TableCell>
                  </TableRow>
                )}
                {!loading && !fetchError && states.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>No states found.</TableCell>
                  </TableRow>
                )}
                {states.map((state) => (
                  <TableRow key={state.id}>
                    <TableCell className="font-medium">{state.nameEn}</TableCell>
                    <TableCell className="tamil-font">{state.nameTa}</TableCell>
                    {/* <TableCell>{state.code}</TableCell> */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(state)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(state.id)} disabled={deletingId === state.id}>
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

export default States;
