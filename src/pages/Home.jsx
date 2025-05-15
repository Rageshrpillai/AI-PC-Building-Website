import React from "react";

import Hero from "../components/Hero";
import Navabar from "../components/Navabar";

export default function Home() {
  return (
    <>
      <Navabar />

      {/* Hero */}
      <Hero />

      {/* Two blank placeholder cards below Hero */}
      <div className="px-8 md:px-16 py-12 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900">
        <div className="h-48 bg-gray-800 rounded-lg" />
        <div className="h-48 bg-gray-800 rounded-lg" />
      </div>

      {/* Prebuilt PCs Section */}
      <section className="px-8 md:px-16 py-12 bg-gray-900 space-y-6">
        <h2 className="text-2xl font-semibold text-white">Prebuilt PCs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div className="col-span-2 h-64 bg-gray-800 rounded-lg" />
          <div className="h-32 bg-gray-800 rounded-lg" />
          <div className="h-32 bg-gray-800 rounded-lg" />
          <div className="h-32 bg-gray-800 rounded-lg" />
        </div>
      </section>
    </>
  );
}
