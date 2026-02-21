"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Report {
  name: string;
  type: string;
  status: "success" | "failed" | "pending";
  date: string;
  chain: string;
}

export function ActionPanel({ onAction }: { onAction: (action: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-4">
        <Button onClick={() => onAction("test")} variant="default">
          ▶ Test
        </Button>
        <Button onClick={() => onAction("repair")} variant="secondary">
          🔧 Auto Repair
        </Button>
        <Button onClick={() => onAction("deploy")} variant="outline">
          🚀 Deploy
        </Button>
      </CardContent>
    </Card>
  );
}

export function ProjectStatus({ status, message }: { status: "green" | "red" | "pending"; message: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Project Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div
            className={`w-4 h-4 rounded-full ${
              status === "green"
                ? "bg-green-500"
                : status === "red"
                ? "bg-red-500"
                : "bg-yellow-500"
            }`}
          />
          <span className="font-medium">{message}</span>
          {status === "green" && <Badge variant="secondary">Passing</Badge>}
          {status === "red" && <Badge variant="destructive">Failing</Badge>}
          {status === "pending" && <Badge variant="outline">Pending</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportsPanel({ reports, onSelect }: { reports: Report[]; onSelect: (report: Report) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No reports yet. Run a test to generate reports.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow
                  key={report.name}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelect(report)}
                >
                  <TableCell className="font-medium">{report.type}</TableCell>
                  <TableCell>{report.chain}</TableCell>
                  <TableCell>
                    {report.status === "success" && <Badge variant="secondary">✓ Pass</Badge>}
                    {report.status === "failed" && <Badge variant="destructive">✗ Fail</Badge>}
                    {report.status === "pending" && <Badge variant="outline">Pending</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{report.date}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function ProjectSelector({ project, onChange }: { project: string; onChange: (path: string) => void }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Project</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            value={project}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/path/to/project"
            className="flex-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}
