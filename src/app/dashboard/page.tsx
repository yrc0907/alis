"use client";

import { Card } from "@/components/ui/card";
import { ArrowUpRight, Users, CreditCard, Activity, BarChart, LineChart } from "lucide-react";

// Reusable stat card component for better maintainability
interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  positive?: boolean;
}

const StatCard = ({ title, value, change, icon: Icon, positive = true }: StatCardProps) => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
        <p className={`text-xs ${positive ? "text-green-500" : "text-red-500"} flex items-center mt-1`}>
          <ArrowUpRight className="h-3 w-3 mr-1" />
          {change}
        </p>
      </div>
      <div className="p-2 bg-primary/10 rounded-full">
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </div>
  </Card>
);

export default function DashboardPage() {
  return (
    // Added px-4 for extra padding on sides at all screen sizes
    <div className="space-y-6 px-4 sm:px-6 md:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your dashboard overview.</p>
      </div>

      {/* Responsive grid for stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value="2,853"
          change="+12.5%"
          icon={Users}
        />

        <StatCard
          title="Total Revenue"
          value="$45,231"
          change="+7.2%"
          icon={CreditCard}
        />

        <StatCard
          title="Active Sessions"
          value="1,274"
          change="+18.3%"
          icon={Activity}
        />

        <StatCard
          title="Conversion Rate"
          value="5.24%"
          change="+3.1%"
          icon={BarChart}
        />
      </div>

      {/* Responsive grid for larger sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Recent Activity</h3>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-4 border-b pb-4 last:border-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New user registered</p>
                  <p className="text-xs text-muted-foreground">John Doe</p>
                </div>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Analytics</h3>
          </div>
          <div className="h-[260px] flex items-center justify-center border rounded-md">
            <div className="text-center p-6">
              <LineChart className="h-12 w-12 mx-auto text-primary mb-2" />
              <h4 className="text-lg font-medium">Monthly Revenue</h4>
              <p className="text-sm text-muted-foreground mt-1">
                View detailed analytics in the Analytics section
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
