import React from "react";
 
export default function PageHeader({ title, subtitle, icon: Icon }) {
  return (
    <div className="sticky top-0 z-20 bg-[#151515]/80 backdrop-blur-md border-b border-white/[0.06] px-6 py-4">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-amber/15 border border-amber/25 flex items-center justify-center">
            <Icon size={16} className="text-amber" />
          </div>
        )}
        <div>
          <h1 className="font-display font-semibold text-xl text-white">{title}</h1>
          {subtitle && <p className="text-white/40 text-sm">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
 
