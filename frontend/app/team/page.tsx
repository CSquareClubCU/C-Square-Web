"use client";

import { useEffect, useState } from "react";
import { fetchTeam } from "@/lib/api";
import { FadeUp, StaggerContainer, StaggerItem, TiltCard } from "@/components/animations/MotionElements";

interface TeamMember {
  id: string;
  full_name: string;
  designation: string;
  photo_url: string | null;
}

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam().then((data) => {
      setTeam(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="w-full">
      {/* Page Header */}
      <section className="w-full bg-[var(--c-surface)] dot-grid py-16 md:py-24 border-b border-[var(--c-border)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 text-center">
          <FadeUp>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--c-muted-text)] mb-4 inline-block">
              Our People
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
              Meet the Team
            </h1>
            <p className="text-lg text-[var(--c-secondary-text)] max-w-[600px] mx-auto">
              The passionate individuals working behind the scenes to bring you the best events at Chandigarh University.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Team Grid */}
      <section className="max-w-[1200px] mx-auto px-5 md:px-10 py-16 md:py-24">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center animate-pulse">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-100 mb-6" />
                <div className="h-4 bg-gray-100 rounded w-24 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-16" />
              </div>
            ))}
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {team.map((member) => (
              <StaggerItem key={member.id}>
                <TiltCard className="flex flex-col items-center text-center group cursor-default">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[var(--c-surface)] border-2 border-[var(--c-border)] mb-6 overflow-hidden relative transition-all duration-500 group-hover:border-[var(--c-accent)]/20 group-hover:shadow-lg">
                    {member.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.photo_url}
                        alt={member.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl md:text-4xl text-[var(--c-muted-text)] font-bold bg-gradient-to-br from-gray-50 to-gray-100">
                        {member.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{member.full_name}</h3>
                  <p className="text-sm text-[var(--c-secondary-text)]">
                    {member.designation}
                  </p>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>
    </div>
  );
}
