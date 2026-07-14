"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { fetchTeam } from "@/lib/api";
import { FadeUp, StaggerContainer, StaggerItem, TiltCard } from "@/components/animations/MotionElements";
import { TeamHeroBackground } from "@/components/animations/TeamHeroBackground";
import type { CoreTeamMemberPublic } from "@/types";
import { useCategoryFilter } from "@/hooks/useCategoryFilter";

export default function TeamPage() {
  const [team, setTeam] = useState<CoreTeamMemberPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeCategory: activeFilter, filterBarRef, handleFilterClick } = useCategoryFilter<string>("All");

  const categories = [
    "All",
    "Leadership",
    "Technical",
    "Design",
    "Media",
    "Marketing",
    "Volunteers",
    "Faculty",
  ];

  const filteredTeam = useMemo(() => {
    if (activeFilter === "All") return team;
    
    return team.filter((member) => {
      const desig = (member.designation || "").toLowerCase();
      
      switch (activeFilter) {
        case "Leadership":
          return desig.includes("president") || desig.includes("lead") || desig.includes("head") || desig.includes("secretary") || desig.includes("director") || desig.includes("founder") || desig.includes("manager");
        case "Technical":
          return desig.includes("tech") || desig.includes("dev") || desig.includes("web") || desig.includes("app") || desig.includes("software") || desig.includes("code") || desig.includes("engineer");
        case "Design":
          return desig.includes("design") || desig.includes("ui") || desig.includes("ux") || desig.includes("creative") || desig.includes("art");
        case "Media":
          return desig.includes("media") || desig.includes("content") || desig.includes("video") || desig.includes("photo") || desig.includes("edit");
        case "Marketing":
          return desig.includes("market") || desig.includes("pr ") || desig.includes("public relation") || desig.includes("social") || desig.includes("outreach");
        case "Volunteers":
          return desig.includes("volunteer") || desig.includes("member");
        case "Faculty":
          return desig.includes("faculty") || desig.includes("mentor") || desig.includes("professor") || desig.includes("advisor") || desig.includes("guide");
        default:
          return false;
      }
    });
  }, [team, activeFilter]);

  useEffect(() => {
    fetchTeam()
      .then((data) => {
        setTeam(data);
      })
      .catch((error) => {
        console.error("Failed to fetch team:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);



  return (
    <div className="w-full">
      {/* Page Header */}
      <section className="relative w-full h-[calc(100vh-240px)] min-h-[400px] bg-white flex items-center justify-center overflow-hidden">
        <TeamHeroBackground />
        <div className="relative z-20 text-center px-5 flex flex-col items-center gap-4 mt-8">
          <FadeUp>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tighter text-[#111] drop-shadow-sm max-w-4xl mx-auto">
              Meet the Core Team
            </h1>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="text-lg md:text-xl text-black/60 max-w-2xl mx-auto font-medium">
              The passionate individuals driving C Square Club forward. 
              We're a diverse group of creators, developers, and designers.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Team Grid */}
      <section className="max-w-[1200px] mx-auto px-5 md:px-10 pb-16 md:pb-24">
        
        {/* Scroll Anchor */}
        <div ref={filterBarRef} className="scroll-mt-24 pt-8 md:pt-12" />

        {/* Filter Bar */}
        {!loading && team.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center mb-16"
          >
            <div className="flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-x-auto no-scrollbar max-w-full">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleFilterClick(category)}
                  className={`px-5 py-2 rounded-[12px] text-[13px] font-semibold transition-colors whitespace-nowrap ${
                    activeFilter === category
                      ? "bg-black text-white"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.div>
        )}

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
        ) : filteredTeam.length === 0 ? (
          <FadeUp className="text-center py-20">
            <p className="text-xl font-semibold text-[var(--c-secondary-text)]">No core team members found</p>
            <p className="text-sm text-[var(--c-muted-text)] mt-2">Check back later as we update our roster.</p>
          </FadeUp>
        ) : (
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filteredTeam.map((member) => (
              <StaggerItem key={member.id}>
                <TiltCard className="flex flex-col items-center text-center group cursor-default bg-white rounded-[32px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-8 border border-black/[0.04] h-full">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-[#F5F5F5] mb-5 overflow-hidden relative transition-transform duration-500 group-hover:scale-110 flex items-center justify-center">
                    {member.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.photo_url}
                        alt={member.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-[#999]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="font-semibold tracking-tight text-[#111] text-lg mb-1">{member.full_name}</h3>
                  <p className="text-sm text-[#777] font-medium mb-6">
                    {member.designation}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-auto">
                    {member.twitter_url && (
                      <a href={member.twitter_url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-black transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                      </a>
                    )}
                    {member.github_url && (
                      <a href={member.github_url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-black transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                      </a>
                    )}
                    {member.linkedin_url && (
                      <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-black transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      </a>
                    )}
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>
    </div>
  );
}
