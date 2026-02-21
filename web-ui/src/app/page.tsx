"use client";

import { useState, useEffect } from "react";
import { ActionPanel, ProjectStatus, ReportsPanel, ProjectSelector } from "@/components/ActionPanel";

interface Report {
  name: string;
  type: string;
  status: "success" | "failed" | "pending";
  date: string;
  chain: string;
}

export default function Home() {
  const [project, setProject] = useState("evm-vault");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectStatus, setProjectStatus] = useState<"green" | "red" | "pending">("pending");
  const [lastMessage, setLastMessage] = useState("Ready");

  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/shell-run?project=${project}`);
      const data = await res.json();
      setReports(data.reports || []);
      
      // Determine status from latest test report
      const latestTest = data.reports?.find((r: Report) => r.type === "test");
      if (latestTest) {
        setProjectStatus(latestTest.status === "success" ? "green" : "red");
      }
    } catch (e) {
      console.error("Failed to fetch reports:", e);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [project]);

  const handleAction = async (action: string) => {
    setLoading(true);
    setLastMessage(`Running ${action}...`);
    
    try {
      const res = await fetch(`/api/shell-run?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, chain: "evm" }),
      });
      const data = await res.json();
      
      if (data.success) {
        setLastMessage(`${action} completed successfully!`);
        setProjectStatus("green");
      } else {
        setLastMessage(`${action} failed`);
        setProjectStatus("red");
      }
      
      setReports(data.reports || []);
    } catch (e) {
      setLastMessage(`Error: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Shell</h1>
          <p className="text-muted-foreground">Claude Code for Web3</p>
        </div>

        {/* Project Selector */}
        <ProjectSelector project={project} onChange={setProject} />

        {/* Status */}
        <ProjectStatus status={projectStatus} message={lastMessage} />

        {/* Actions */}
        <ActionPanel onAction={handleAction} />

        {/* Loading indicator */}
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground mt-2">Running...</p>
          </div>
        )}

        {/* Reports */}
        <ReportsPanel
          reports={reports}
          onSelect={(report) => console.log("Selected:", report)}
        />
      </div>
    </main>
  );
}
