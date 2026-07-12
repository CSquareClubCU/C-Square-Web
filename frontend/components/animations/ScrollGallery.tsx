"use client";

import { Rocket, Shield, Terminal, Zap, Code, Trophy, Cpu, Globe, Target } from "lucide-react";
import { FadeUp, StaggerContainer, StaggerItem } from "./MotionElements";

export function ScrollGallery() {
  const pastEvents = [
    { title: "CodeStorm 2024", icon: <Terminal className="w-5 h-5" /> },
    { title: "Web3 Summit", icon: <Globe className="w-5 h-5" /> },
    { title: "AI Horizons", icon: <Cpu className="w-5 h-5" /> },
    { title: "Cyber Sec", icon: <Shield className="w-5 h-5" /> },
    { title: "Hack to the Future", icon: <Rocket className="w-5 h-5" /> },
    { title: "Design Sprint", icon: <Target className="w-5 h-5" /> },
    { title: "Code Relay", icon: <Zap className="w-5 h-5" /> },
    { title: "Algorithm Quest", icon: <Code className="w-5 h-5" /> },
    { title: "Game Jam", icon: <Trophy className="w-5 h-5" /> },
  ];

  const EventCard = ({ event }: { event: any }) => (
    <div className="w-full h-[72px] bg-[#111] rounded-2xl border border-white/10 flex items-center px-4 gap-4 hover:bg-[#1a1a1a] hover:border-white/30 hover:scale-[1.02] transition-all duration-300 shadow-lg">
      <div className="w-10 h-10 rounded-[12px] bg-white/10 flex items-center justify-center text-white/90 shrink-0">
        {event.icon}
      </div>
      <h3 className="text-[14px] md:text-[15px] font-bold text-white truncate">
        {event.title}
      </h3>
    </div>
  );

  return (
    <section className="w-full pb-4 md:pb-8 pt-2 md:pt-4 bg-white">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10">
        <div className="relative bg-[#050505] rounded-[32px] md:rounded-[48px] overflow-hidden px-8 md:px-12 py-12 md:py-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 shadow-2xl">
          
          {/* Title Section */}
          <div className="lg:w-1/3 z-10 text-center lg:text-left">
             <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-pink-500 mb-4 inline-block">
               Our Legacy
             </span>
             <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.1]">
               Past <br className="hidden lg:block"/> Events.
             </h2>
             <p className="mt-4 text-white/60 text-[15px] md:text-[16px] leading-relaxed max-w-sm mx-auto lg:mx-0">
               A structured archive of the incredible events we&apos;ve organized over the years to build the community.
             </p>
          </div>

          {/* Static Grid */}
          <div className="lg:w-2/3 w-full relative z-10">
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {pastEvents.map((event, i) => (
                <StaggerItem key={i}>
                  <EventCard event={event} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
          
        </div>
      </div>
    </section>
  );
}
