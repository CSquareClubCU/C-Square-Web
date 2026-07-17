"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2, Users, Key, Copy, CheckCircle2 } from "lucide-react";
import { createTeam, joinTeam, leaveTeam } from "@/lib/api";
import { Registration, Team } from "@/types";

interface TeamStatusWidgetProps {
  registration: Registration;
  onTeamUpdated: (team: Team | null) => void;
}

export default function TeamStatusWidget({ registration, onTeamUpdated }: TeamStatusWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"idle" | "create" | "join">("idle");
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const team = registration.team;

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const newTeam = await createTeam(registration.id, teamName.trim());
      onTeamUpdated(newTeam);
      setSuccessMsg("Team created successfully!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create team.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const newTeam = await joinTeam(registration.id, joinCode.trim().toUpperCase());
      onTeamUpdated(newTeam);
      setSuccessMsg("Joined team successfully!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to join team.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLeaveTeam() {
    if (!leaveConfirm) {
      setLeaveConfirm(true);
      setTimeout(() => setLeaveConfirm(false), 3000);
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await leaveTeam(registration.id);
      onTeamUpdated(null);
      setSuccessMsg("Left team successfully.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to leave team.");
    } finally {
      setLoading(false);
      setLeaveConfirm(false);
    }
  }

  const copyCode = () => {
    if (team?.join_code) {
      navigator.clipboard.writeText(team.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setSuccessMsg("Join code copied!");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  if (team) {
    return (
      <div className="mt-6 border-t border-[#e5e7eb] pt-6">
        <h3 className="text-[16px] font-semibold text-[#111111] mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#3b82f6]" /> My Team
        </h3>
        
        <div className="bg-[#f8f9fa] border border-[#e5e7eb] rounded-[12px] p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-medium text-[#111111]">{team.name}</span>
            <span className="text-[11px] font-semibold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {team.members.length} Members
            </span>
          </div>
          
          <div className="flex items-center gap-2 mt-4 p-2 bg-[#ffffff] border border-[#e5e7eb] rounded-[8px]">
            <Key className="w-4 h-4 text-[#6b7280] shrink-0 ml-1" />
            <span className="text-[14px] text-[#6b7280] flex-1 font-mono">{team.join_code}</span>
            <button 
              onClick={copyCode}
              className="p-1.5 hover:bg-[#f3f4f6] rounded-[6px] transition-colors"
              title="Copy Join Code"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-[#10b981]" /> : <Copy className="w-4 h-4 text-[#6b7280]" />}
            </button>
          </div>
          <p className="text-[12px] text-[#6b7280] mt-2">Share this code with your teammates to let them join.</p>
        </div>

        <div className="space-y-2">
          {team.members.map(member => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-[#ffffff] border border-[#e5e7eb] rounded-[8px]">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-6 h-6 rounded-full bg-[#e5e7eb] flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-medium text-[#6b7280] uppercase">
                    {member.email.charAt(0)}
                  </span>
                </div>
                <span className="text-[14px] text-[#374151] truncate">{member.email}</span>
              </div>
              {member.email === team.leader_email && (
                <span className="text-[10px] font-semibold text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  Leader
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
          <Button
            onClick={handleLeaveTeam}
            disabled={loading}
            variant="outline"
            className="w-full border-[#ef4444]/20 text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ef4444] transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (leaveConfirm ? "Confirm Leave Team" : "Leave Team")}
          </Button>
          {errorMsg && <p className="text-[13px] text-[#ef4444] mt-3 font-medium text-center">{errorMsg}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-[#e5e7eb] pt-6">
      <h3 className="text-[16px] font-semibold text-[#111111] mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-[#3b82f6]" /> Team Registration
      </h3>
      <p className="text-[13px] text-[#6b7280] mb-4">
        This is a team event. You must create or join a team to participate.
      </p>

      {mode === "idle" && (
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => setMode("create")}
            className="w-full bg-[#111111] text-white hover:bg-[#242424]"
          >
            Create a Team
          </Button>
          <Button 
            onClick={() => setMode("join")}
            variant="outline"
            className="w-full"
          >
            Join a Team
          </Button>
        </div>
      )}

      {mode === "create" && (
        <form onSubmit={handleCreateTeam} className="space-y-3">
          <input
            className="flex h-10 w-full rounded-md border border-[#e5e7eb] bg-transparent px-3 py-2 text-sm placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#111111] disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setMode("idle")}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-[#111111] text-white hover:bg-[#242424]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </Button>
          </div>
        </form>
      )}

      {mode === "join" && (
        <form onSubmit={handleJoinTeam} className="space-y-3">
          <input
            className="flex h-10 w-full rounded-md border border-[#e5e7eb] bg-transparent px-3 py-2 text-sm placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#111111] disabled:cursor-not-allowed disabled:opacity-50 font-mono uppercase placeholder:normal-case"
            placeholder="Enter 6-character join code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            disabled={loading}
            autoFocus
          />
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setMode("idle")}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-[#111111] text-white hover:bg-[#242424]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
            </Button>
          </div>
        </form>
      )}

      {errorMsg && <p className="text-[13px] text-[#ef4444] mt-3 font-medium">{errorMsg}</p>}
      {successMsg && <p className="text-[13px] text-[#10b981] mt-3 font-medium">{successMsg}</p>}
    </div>
  );
}
