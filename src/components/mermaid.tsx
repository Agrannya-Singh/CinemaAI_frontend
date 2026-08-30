"use client";
import React, { useEffect, useRef, useState } from "react";

// Load mermaid from CDN at runtime — avoids SSR/build issues entirely
function loadMermaidCDN(): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).mermaid) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
        script.onload = () => {
            (window as any).mermaid.initialize({
                startOnLoad: false,
                theme: "dark",
                securityLevel: "loose",
                fontFamily: "monospace",
            });
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export function MermaidDiagram({ chart }: { chart: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        loadMermaidCDN()
            .then(async () => {
                if (cancelled || !ref.current) return;
                try {
                    const id = "mmd-" + Math.random().toString(36).slice(2, 9);
                    const { svg } = await (window as any).mermaid.render(id, chart);
                    if (!cancelled && ref.current) ref.current.innerHTML = svg;
                } catch {
                    if (!cancelled) setError(true);
                }
            })
            .catch(() => { if (!cancelled) setError(true); });
        return () => { cancelled = true; };
    }, [chart]);

    if (error) return <p className="text-red-400 font-mono text-xs">Diagram failed to render.</p>;

    return (
        <div
            className="flex justify-center w-full overflow-auto p-4"
            ref={ref}
        />
    );
}
