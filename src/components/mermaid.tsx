"use client";
import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";

export function MermaidDiagram({ chart }: { chart: string }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'monospace'
        });
        
        if (ref.current) {
            // Render cleanly to avoid hydration/re-render issues
            mermaid.render('mermaid-' + Math.random().toString(36).substr(2, 9), chart).then(({ svg }) => {
                if (ref.current) {
                    ref.current.innerHTML = svg;
                }
            }).catch(e => console.error("Mermaid render error:", e));
        }
    }, [chart]);

    return (
        <div 
            className="flex justify-center w-full overflow-auto p-4 border border-cyan-500/20 bg-black/50 shadow-[0_0_15px_rgba(6,182,212,0.1)] rounded-sm" 
            ref={ref}
        ></div>
    );
}
