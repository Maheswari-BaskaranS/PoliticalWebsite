import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Calendar, Image } from "lucide-react";
import { apiFetch, apiUrl } from "@/lib/api";

const Dashboard = () => {
  const [stats, setStats] = useState([
    { icon: Users, label: "Total Members", value: "-", color: "text-primary" },
    { icon: Calendar, label: "Upcoming Events", value: "-", color: "text-secondary" },
    { icon: Image, label: "Active Banners", value: "-", color: "text-accent" },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState<{ Activity: string; ActivityTime: string }[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiFetch(apiUrl("/api/UserMaster/GetUserDashBoard"));
        const json = await res.json();
        if (json && json.Status && json.data && json.data[0]) {
          const d = json.data[0];
          setStats([
            { icon: Users, label: "Total Members", value: d.TotalMembers ?? "-", color: "text-primary" },
            { icon: Calendar, label: "Upcoming Events", value: d.UpcomingEvent ?? "-", color: "text-secondary" },
            { icon: Image, label: "Active Banners", value: d.TotalActiveBanner ?? "-", color: "text-accent" },
          ]);
        } else {
          setError("No dashboard data found");
        }
      } catch (e) {
        setError("Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    const fetchActivities = async () => {
      setActivityLoading(true);
      setActivityError("");
      try {
        const res = await apiFetch(apiUrl("/api/UserMaster/GetDashBoardRecentActivity"));
        const json = await res.json();
        if (json && json.Status && Array.isArray(json.data)) {
          setActivities(json.data);
        } else {
          setActivityError("No recent activity found");
        }
      } catch (e) {
        setActivityError("Failed to load recent activity");
      } finally {
        setActivityLoading(false);
      }
    };
    fetchStats();
    fetchActivities();
  }, []);

  // Helper to format activity time as relative (e.g., '2 hours ago')
function formatActivityTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  // Always use absolute value to avoid negative times
  const diff = Math.abs(Math.floor((now.getTime() - date.getTime()) / 1000)); // seconds
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back to TMK Admin Panel</p>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-3 text-center py-8">Loading...</div>
          ) : error ? (
            <div className="col-span-3 text-center text-red-500 py-8">{error}</div>
          ) : (
            stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="py-8 text-center">Loading...</div>
              ) : activityError ? (
                <div className="py-8 text-center text-red-500">{activityError}</div>
              ) : activities.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No recent activity</div>
              ) : (
                <div className="space-y-4">
                  {activities.map((a, i) => (
                    <div className="flex items-center" key={i}>
                      <div className={`w-2 h-2 rounded-full mr-3 ${i === 0 ? "bg-primary" : i === 1 ? "bg-accent" : "bg-secondary"}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{a.Activity}</p>
                        <p className="text-xs text-muted-foreground">{formatActivityTime(a.ActivityTime)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>



          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                onClick={() => navigate("/admin/events")}
              >
                <p className="font-medium">Add New Event</p>
                <p className="text-sm text-muted-foreground">Create and publish an event</p>
              </button>
              <button
                className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                onClick={() => navigate("/admin/banners")}
              >
                <p className="font-medium">Upload Banner</p>
                <p className="text-sm text-muted-foreground">Add a new hero banner</p>
              </button>
              <button
                className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                onClick={() => navigate("/admin/members")}
              >
                <p className="font-medium">View Members</p>
                <p className="text-sm text-muted-foreground">Browse registered members</p>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
