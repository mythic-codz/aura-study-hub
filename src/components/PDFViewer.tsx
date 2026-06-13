import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/useUser';
import { proxyUrl } from '@/lib/contentProxy';

interface PDFViewerProps {
  src: string;
  title: string;
  onProgress?: (percent: number) => void;
}

export function PDFViewer({ src, title, onProgress }: PDFViewerProps) {
  const { user } = useUser();
  const [downloading, setDownloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1); // In a real implementation, get from PDF
  const [zoom, setZoom] = useState(100);

  // Serve the PDF through the secure content proxy (hides the source URL)
  const proxiedSrc = useMemo(() => proxyUrl(src), [src]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    
    try {
      // Fetch the PDF (via proxy to avoid CORS / hide source)
      const response = await fetch(proxiedSrc);
      const blob = await response.blob();
      
      // Create branded filename
      const brandedFilename = `Aura_Study_${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = brandedFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Mark as complete and award XP
      onProgress?.(100);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  }, [src, title, onProgress]);

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));
  const handleZoomIn = () => setZoom(z => Math.min(200, z + 25));
  const handleZoomOut = () => setZoom(z => Math.max(50, z - 25));

  return (
    <div className="flex flex-col gap-4 content-protection">
      {/* Toolbar */}
      <div className="glass-card p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-semibold">{title}</h2>
            {user && (
              <p className="text-xs text-muted-foreground">
                Downloaded by: {user.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1 bg-secondary/50 rounded-lg">
            <button onClick={handleZoomOut} className="p-1 hover:bg-white/10 rounded">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm w-12 text-center">{zoom}%</span>
            <button onClick={handleZoomIn} className="p-1 hover:bg-white/10 rounded">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download PDF
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        <div 
          className="relative bg-secondary/20 min-h-[70vh] flex items-center justify-center"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          {/* Watermark overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
            <span className="text-6xl font-display font-bold rotate-[-30deg]">
              Aura Study
            </span>
          </div>

          {/* PDF embed */}
          <iframe
            src={`${proxiedSrc}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-[70vh] border-0"
            title={title}
          />
        </div>

        {/* Page navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 p-4 border-t border-white/10">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </motion.div>

      {/* Branding footer */}
      <div className="glass-card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          📚 This document is provided by <span className="gradient-text font-semibold">Aura Study</span>
        </p>
        <p className="text-xs text-muted-foreground/50 mt-1">
          Sharing or redistribution is prohibited
        </p>
      </div>
    </div>
  );
}
