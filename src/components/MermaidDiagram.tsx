import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
    });

    let isMounted = true;
    const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

    const renderChart = async () => {
      try {
        setError(null);
        if (!chart || !chart.trim()) return;
        const { svg } = await mermaid.render(uniqueId, chart.trim());
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Mermaid rendering error:', err);
          setError(err.message || 'Diagram rendering failed');
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 my-4 bg-amber-50 border border-amber-200 rounded-lg text-xs font-mono text-amber-800 overflow-x-auto">
        <span className="font-semibold text-amber-900 block mb-1">Diagram Note:</span>
        <pre className="whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-wrapper my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto flex justify-center shadow-xs"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};
