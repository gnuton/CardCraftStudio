import { useState, useRef } from 'react';
import { Card } from './components/Card';
import { Controls } from './components/Controls';
import { PrintLayout } from './components/PrintLayout';
import html2canvas from 'html2canvas';
import { toSvg } from 'html-to-image';
import jsPDF from 'jspdf';
import { Loader2 } from 'lucide-react';

interface CardConfig {
  borderColor: string;
  borderWidth: number;
  topLeftContent: string;
  bottomRightContent: string;
  centerImage: string | null;
  title: string;
  description: string;
}

function App() {
  const [config, setConfig] = useState<CardConfig>({
    borderColor: '#000000',
    borderWidth: 8,
    topLeftContent: 'A',
    bottomRightContent: 'A',
    centerImage: null,
    title: 'Card Title',
    description: 'This is a description of the card ability or effect.'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleGeneratePdf = async () => {
    if (!printRef.current) return;

    try {
      setIsGenerating(true);
      // Wait for images to render if any
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(printRef.current, {
        scale: 4, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794, // 210mm at 96 DPI
        height: 1123, // 297mm at 96 DPI
        windowWidth: 794,
        windowHeight: 1123
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = 210;
      const pdfHeight = 297;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('game-cards.pdf');
    } catch (error) {
      console.error('PDF Generation failed', error);
      alert('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSvg = async () => {
    if (!cardRef.current) return;

    try {
      setIsGenerating(true);
      const dataUrl = await toSvg(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff', // Correct handling for transparent backgrounds
        // filter: (node) => node.tagName !== 'i', // Example filter if icons caused issues, but verified working without
      });
      const link = document.createElement('a');
      link.download = 'card.svg';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('SVG Generation failed', error);
      alert('Failed to generate SVG');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Controls */}
      <div className="w-[400px] flex-shrink-0 h-full shadow-xl z-10">
        <Controls
          config={config}
          onChange={handleConfigChange}
          onGeneratePdf={handleGeneratePdf}
          onGenerateSvg={handleGenerateSvg}
          isGenerating={isGenerating}
        />
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 h-full flex items-center justify-center p-10 bg-slate-100 relative">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none"></div>

        <div className="flex flex-col items-center gap-6 z-0">
          <div className="text-sm font-medium text-slate-400">Preview (Poker Size)</div>
          <div className="transform transition-transform hover:scale-105 duration-300">
            <Card {...config} ref={cardRef} />
          </div>
        </div>
      </div>

      {/* Hidden Print Layout */}
      <PrintLayout config={config} ref={printRef} />

      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center flex-col gap-4 text-white">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="font-medium">Generating High-Res PDF...</p>
        </div>
      )}
    </div>
  );
}

export default App;
