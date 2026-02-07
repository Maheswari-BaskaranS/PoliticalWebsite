import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, User } from "lucide-react";
import { apiUrl } from "@/lib/api";
import logo from "../../assets/icons/logo.jpg"

const AdminLogin = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);


    const loginUrl = apiUrl("/api/UserMaster/UserLogin");


    try {
      setLoading(true);
      const res = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          UserName: userName,
          Password: password,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Login failed (${res.status})`);
      }

      const payload = await res.json().catch(() => ({}));
      const userData = payload?.data;

      // Only proceed if login is successful (Status true)
      if (payload?.Status === true) {
        // Persist token/user if provided (legacy fields) and new userId
        if (payload?.token) {
          localStorage.setItem("tmk_token", payload.token);
        }
        if (payload?.user) {
          localStorage.setItem("tmk_user", JSON.stringify(payload.user));
        }
        // Store full user data object if present
        if (userData) {
          localStorage.setItem("tmk_user", JSON.stringify(userData));
          if (userData?.UserId) {
            localStorage.setItem("tmk_userId", String(userData.UserId));
          }
          // OrgId may be array or single value
          const orgRaw = (userData as any).OrgId;
          if (Array.isArray(orgRaw)) {
            if (orgRaw.length) {
              localStorage.setItem("tmk_orgId", String(orgRaw[0]));
            }
            localStorage.setItem("tmk_orgIds", JSON.stringify(orgRaw));
          } else if (orgRaw !== undefined && orgRaw !== null) {
            localStorage.setItem("tmk_orgId", String(orgRaw));
          }
        }
        navigate("/admin/dashboard");
      } else {
        setError(payload?.Message || "Invalid username or password");
      }
    } catch (err: any) {
      setError(err?.message || "Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 overflow-hidden">
            <img
              src={logo}
              alt="TMK Logo"
              className="w-16 h-16 rounded-full object-cover"
            />
          </div>
          <CardTitle className="text-2xl">TMK Admin Panel</CardTitle>
          <CardDescription>Sign in to manage your party website</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">User Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="userName"
                  type="text"
                  placeholder="admin@tmk.com"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
