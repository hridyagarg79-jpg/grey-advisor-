"use client";

import { GitCompare, Plus } from "lucide-react";

export default function ComparePage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
      <div className="text-center w-full max-w-5xl">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 mb-5">
          <GitCompare size={24} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4">
          Compare <span className="text-gradient">Areas & Properties</span>
        </h1>
        <p className="text-stone-500 max-w-2xl mx-auto text-lg mb-12">
          Select up to 3 properties or neighbourhoods to view a side-by-side data comparison.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border-2 border-dashed border-stone-200 rounded-3xl w-full max-w-sm aspect-[3/4] flex flex-col items-center justify-center hover:border-amber-400 hover:bg-amber-50 transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-amber-100 group-hover:text-amber-700 transition-all">
                <Plus size={22} />
              </div>
              <p className="mt-4 text-sm font-medium text-stone-400 group-hover:text-amber-700 transition-colors">Add to Compare</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
