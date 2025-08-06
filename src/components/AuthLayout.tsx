import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
      <div className="hidden items-center justify-center bg-zinc-100 p-8 dark:bg-zinc-900 lg:flex">
        <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow-2xl dark:bg-black">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-md bg-orange-400"></div>
              <span className="text-lg font-bold">Corinna AI</span>
            </div>
            <div className="h-1 w-6 rounded-full bg-gray-300"></div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-zinc-800">
            <h2 className="mb-2 text-xl font-bold">Dashboard</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              A detailed overview of your metrics, usage, customers and more.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-white p-4 dark:bg-zinc-700">
                <p className="text-sm text-muted-foreground">
                  Potential Clients
                </p>
                <p className="text-3xl font-bold">245,550</p>
              </div>
              <div className="rounded-lg bg-white p-4 dark:bg-zinc-700">
                <p className="text-sm text-muted-foreground">Money In</p>
                <p className="text-3xl font-bold">$5,083</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 