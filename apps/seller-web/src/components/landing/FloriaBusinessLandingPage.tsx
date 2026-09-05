"use client";

import React from "react";
import { BusinessNavbar } from "./BusinessNavbar";
import { HeroSection } from "./HeroSection";
import { PlatformStats } from "./PlatformStats";
import { WhyFloria } from "./WhyFloria";
import { BusinessCategories } from "./BusinessCategories";
import { HowItWorks } from "./HowItWorks";
import { TopBusinesses } from "./TopBusinesses";
import { BusinessWorkspacePreview } from "./BusinessWorkspacePreview";
import { SellerFAQ } from "./SellerFAQ";
import { FinalBusinessCTA } from "./FinalBusinessCTA";
import { BusinessFooter } from "./BusinessFooter";

export function FloriaBusinessLandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-ink-900 selection:bg-forest-200 selection:text-forest-900">
      {/* 1. Public Navbar with Mobile Drawer */}
      <BusinessNavbar />

      <main className="flex-1 w-full">
        {/* 2. Hero Section with responsive typography and category strip */}
        <HeroSection />

        {/* 3. Live Platform Statistics & Proof */}
        <PlatformStats />

        {/* 4. Why Floria Business (Outcome-oriented value props) */}
        <WhyFloria />

        {/* 5. Business Categories (Broad ecosystem showcase) */}
        <BusinessCategories />

        {/* 6. How It Works (4-Step horizontal & stacked progression) */}
        <HowItWorks />

        {/* 7. Top Businesses (Dynamic ranking & social proof) */}
        <TopBusinesses />

        {/* 8. Seller Workspace Preview (Interactive tools demo) */}
        <BusinessWorkspacePreview />

        {/* 9. Practical Seller FAQs */}
        <SellerFAQ />

        {/* 10. Final High-Converting CTA */}
        <FinalBusinessCTA />
      </main>

      {/* 11. Structured Floria Footer */}
      <BusinessFooter />
    </div>
  );
}
