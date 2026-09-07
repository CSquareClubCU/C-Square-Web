"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2, Users, Key, Copy, CheckCircle2, Link as LinkIcon, Share2 } from "lucide-react";
import { createTeam, joinTeam, leaveTeam } from "@/lib/api";
import { Registration, Team } from "@/types";

interface TeamStatusWidgetProps {
  registration: Registration;
  eventSlug?: string;
  eventTitle?: string;
  initialJoinCode?: string;
  onTeamUpdated: (team: Team | null) => void;
}

export default function TeamStatusWidget({ 
  registration, 
  eventSlug,
  eventTitle,
  initialJoinCode = "",
  onTeamUpdated 
}: TeamStatusWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"idle" | "create" | "join">(
    initialJoinCode && !registration.team ? "join" : "idle"
  );
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState(initialJoinCode || "");
  const [copiedType, setCopiedType] = useState<"code" | "link" | null>(null);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const team = registration.team;

  useEffect(() => {
    if (initialJoinCode && !registration.team) {
      setJoinCode(initialJoinCode.toUpperCase());
      setMode("join");
    }
  }, [initialJoinCode, registration.team]);

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

  const getInviteUrl = () => {
    if (typeof window === "undefined" || !team?.join_code) return "";
    const origin = window.location.origin;
    const path = eventSlug ? `/events/${eventSlug}` : window.location.pathname;
    return `${origin}${path}?team=${team.join_code}`;
  };

  const copyCode = async () => {
    if (team?.join_code) {
      await navigator.clipboard.writeText(team.join_code);
      setCopiedType("code");
      setTimeout(() => setCopiedType(null), 2000);
      setSuccessMsg("Join code copied!");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const copyLink = async () => {
    const inviteUrl = getInviteUrl();
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedType("link");
      setTimeout(() => setCopiedType(null), 2000);
      setSuccessMsg("Invite link copied!");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const shareTeam = async () => {
    const inviteUrl = getInviteUrl();
    if (!inviteUrl) return;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Join team ${team?.name}`,
          text: `Join my team "${team?.name}" for ${eventTitle || "the event"} on C-Square!`,
          url: inviteUrl,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          await copyLink();
        }
      }
    } else {
      await copyLink();
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
          
          {team.join_code && (
            <>
              <div className="flex items-center gap-2 mt-4 p-2 bg-[#ffffff] border border-[#e5e7eb] rounded-[8px]">
                <Key className="w-4 h-4 text-[#6b7280] shrink-0 ml-1" />
                <span className="text-[14px] font-mono text-[#111111] font-semibold flex-1 tracking-wider">{team.join_code}</span>
                <div className="flex items-center gap-1">
                  <button 
                    type="button"
                    onClick={copyCode}
                    className="p-1.5 hover:bg-[#f3f4f6] rounded-[6px] transition-colors flex items-center gap-1 text-[12px] font-medium text-[#4b5563]"
                    title="Copy Join Code"
                  >
                    {copiedType === "code" ? (
                      <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#6b7280]" />
                    )}
                    <span className="hidden sm:inline">Code</span>
                  </button>
                  <button 
                    type="button"
                    onClick={copyLink}
                    className="p-1.5 hover:bg-[#f3f4f6] rounded-[6px] transition-colors flex items-center gap-1 text-[12px] font-medium text-[#4b5563]"
                    title="Copy Invite Link"
                  >
                    {copiedType === "link" ? (
                      <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                    ) : (
                      <LinkIcon className="w-4 h-4 text-[#6b7280]" />
                    )}
                    <span className="hidden sm:inline">Link</span>
                  </button>
                  <button 
                    type="button"
                    onClick={shareTeam}
                    className="p-1.5 hover:bg-[#f3f4f6] rounded-[6px] transition-colors flex items-center gap-1 text-[12px] font-medium text-[#3b82f6]"
                    title="Share Team"
                  >
                    <Share2 className="w-4 h-4 text-[#3b82f6]" />
                  </button>
                </div>
              </div>
              <p className="text-[12px] text-[#6b7280] mt-2">Share this code or invite link with teammates to let them join.</p>
            </>
          )}
        </div>

        {team.members && team.members.length > 0 && (
          <div className="space-y-2">
            {team.members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-[#ffffff] border border-[#e5e7eb] rounded-[8px]">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-6 h-6 rounded-full bg-[#e5e7eb] flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-medium text-[#6b7280] uppercase">
                      {(member.user_full_name || member.email || "?").charAt(0)}
                    </span>
                  </div>
                  <span className="text-[14px] text-[#374151] truncate">{member.user_full_name || member.email || "Team Member"}</span>
                </div>
                {(member.email === team.leader_email || member.user_full_name === team.leader_full_name) && (
                  <span className="text-[10px] font-semibold text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                    Leader
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

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
            <Button type="submit" disabled={loading || !teamName.trim()} className="flex-1 bg-[#111111] text-white hover:bg-[#242424]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </Button>
          </div>
        </form>
      )}

      {mode === "join" && (
        <form onSubmit={handleJoinTeam} className="space-y-3">
          <input
            className="flex h-10 w-full rounded-md border border-[#e5e7eb] bg-transparent px-3 py-2 text-sm placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#111111] disabled:cursor-not-allowed disabled:opacity-50 font-mono uppercase placeholder:normal-case"
            placeholder="Enter 8-character join code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={10}
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
            <Button type="submit" disabled={loading || !joinCode.trim()} className="flex-1 bg-[#111111] text-white hover:bg-[#242424]">
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
