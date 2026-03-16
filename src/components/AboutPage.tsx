import React from "react";
import { Check } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="flex-grow px-4 sm:px-6 lg:px-8 py-12 lg:py-16 max-w-4xl mx-auto w-full">
      <div className="space-y-12">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-6">
            GeostrateQ <span className="text-blue-600 dark:text-blue-500">:</span> Strategic Intelligence for Complex Decisions
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed mb-4">
            GeostrateQ is an advanced predictive intelligence platform designed to analyze complex
            environments where multiple actors, institutions, and incentives interact. By combining
            behavioral analytics, institutional dynamics, network relationships, and structural
            constraints, the platform converts fragmented signals into structured strategic insights.
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            GeostrateQ helps decision-makers understand who holds influence, how alliances evolve,
            where risks are emerging, and which scenarios are most likely to unfold. Through actor power
            mapping, scenario modeling, and impact analysis, the platform enables leaders to navigate
            uncertainty with greater clarity and foresight.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 tracking-tight border-b border-slate-200 dark:border-slate-700 pb-2">
            Who benefits from GeostrateQ
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mb-6">
            GeostrateQ is designed for organizations operating in complex and high-stakes environments, including:
          </p>
          <ul className="space-y-4">
            {[
              "Governments and public institutions seeking better geopolitical, policy, and national security insights",
              "Investors and financial institutions assessing market risks and global economic shifts",
              "Corporations and strategy teams navigating regulatory change, competition, and global expansion",
              "Think tanks and research institutions analyzing political, economic, and technological systems",
              "International organizations and policy advisors involved in negotiations, crisis response, and global governance",
            ].map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-800 p-4 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 tracking-tight border-b border-slate-200 dark:border-slate-700 pb-2">
            Key application areas
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mb-6">
            GeostrateQ supports strategic analysis across a wide range of domains, including:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "Geopolitical risk and election analysis",
              "Financial market and investment risk assessment",
              "Corporate strategy and regulatory forecasting",
              "Mergers and acquisitions coordination analysis",
              "Global negotiations and policy dynamics",
              "Crisis management and multi-agency coordination",
              "Technology governance and emerging policy environments",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-sm shadow-sm">
          <p className="text-base sm:text-lg text-blue-800 dark:text-blue-200 font-medium leading-relaxed">
            By transforming complex data into structured intelligence, GeostrateQ empowers leaders to
            anticipate change, understand power dynamics, and make more informed strategic decisions
            in an increasingly uncertain world.
          </p>
        </div>
      </div>
    </main>
  );
}
