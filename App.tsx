import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { WktInput } from './components/WktInput';
import { ProgressBar } from './components/ProgressBar';
import { validateWktWithGemini } from './services/geminiService';
import { processDxfFile } from './services/dxfProcessor';
import { AppStatus, ValidationResponse } from './types';
import { Scissors, Download, RefreshCw, AlertTriangle, Layers, FileText } from 'lucide-react';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [wkt, setWkt] = useState<string>('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [progress, setProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResponse | undefined>(undefined);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [processedContent, setProcessedContent] = useState<string | null>(null);

  // Debounced WKT Validation
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (wkt.length > 10) {
        setValidationStatus('validating');
        const result = await validateWktWithGemini(wkt);
        setValidationResult(result);
        setValidationStatus(result.isValid ? 'valid' : 'invalid');
      } else {
        setValidationStatus('idle');
        setValidationResult(undefined);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [wkt]);

  const handleProcess = async () => {
    if (!file || !wkt) return;

    try {
      setStatus(AppStatus.UPLOADING);
      setProgress(0);

      // 1. Simulate Upload Phase
      // In a real app, we might upload to server here.
      // Since we are doing client-side processing for DXF, we just simulate the "read" time.
      await new Promise(r => setTimeout(r, 500));
      setProgress(20);
      setStatus(AppStatus.PROCESSING);

      // 2. Processing Phase
      if (file.name.toLowerCase().endsWith('.dxf')) {
        // --- REAL CLIENT-SIDE PROCESSING FOR DXF ---
        setProgress(30);
        
        // Start a small interval to make it look like work is happening while the async task runs
        const interval = setInterval(() => {
           setProgress(p => (p < 80 ? p + 5 : p));
        }, 100);

        try {
          const result = await processDxfFile(file, wkt);
          setProcessedContent(result);
          
          clearInterval(interval);
          setProgress(100);
          setStatus(AppStatus.COMPLETED);
        } catch (error) {
          clearInterval(interval);
          console.error(error);
          setStatus(AppStatus.ERROR);
        }

      } else {
        // --- MOCK FOR BINARY DWG (Requires backend) ---
        // Since we can't process binary DWG in pure JS easily without WASM
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(interval);
              return 90;
            }
            return prev + 5;
          });
        }, 200);

        setTimeout(() => {
          clearInterval(interval);
          setProcessedContent(`Mock Processed Content for ${file.name}. \n(Real DWG processing requires server-side libraries).`);
          setProgress(100);
          setStatus(AppStatus.COMPLETED);
        }, 3000);
      }

    } catch (e) {
      console.error(e);
      setStatus(AppStatus.ERROR);
    }
  };

  const handleDownload = () => {
    if (!file || !processedContent) return;
    
    const blob = new Blob([processedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cropped_${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setWkt('');
    setStatus(AppStatus.IDLE);
    setProgress(0);
    setValidationStatus('idle');
    setValidationResult(undefined);
    setProcessedContent(null);
  };

  const canProcess = file && wkt.length > 5 && validationStatus !== 'validating';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-10 space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20 mb-4">
          <Layers className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Smart CAD Cropper
        </h1>
        <p className="text-slate-400 max-w-lg mx-auto">
          Upload your CAD files and define a crop area using WKT geometry. 
          Powered by Gemini for intelligent geometry validation.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-2xl bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 md:p-8 space-y-8">
        
        {/* Step 1: File Upload */}
        <div className={status !== AppStatus.IDLE ? 'opacity-50 pointer-events-none transition-opacity' : ''}>
           <FileUpload file={file} onFileSelect={setFile} />
        </div>

        {/* Step 2: WKT Input */}
        <div className={status !== AppStatus.IDLE ? 'opacity-50 pointer-events-none transition-opacity' : ''}>
          <WktInput 
            value={wkt} 
            onChange={setWkt} 
            validationStatus={validationStatus}
            validationResult={validationResult}
          />
        </div>

        {/* Action Area */}
        <div className="pt-4 border-t border-slate-700/50">
          
          {status === AppStatus.IDLE && (
            <button
              onClick={handleProcess}
              disabled={!canProcess}
              className={`
                w-full py-4 rounded-xl flex items-center justify-center space-x-2 font-semibold text-lg transition-all duration-200
                ${canProcess 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transform hover:-translate-y-0.5' 
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              <Scissors className="w-5 h-5" />
              <span>Crop CAD File</span>
            </button>
          )}

          {(status === AppStatus.UPLOADING || status === AppStatus.PROCESSING) && (
            <div className="animate-in fade-in zoom-in duration-300">
               <ProgressBar progress={progress} status={status === AppStatus.UPLOADING ? 'Uploading...' : 'Processing Geometry...'} />
            </div>
          )}

          {status === AppStatus.COMPLETED && (
             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start space-x-3">
                  <div className="p-1 bg-green-500 rounded-full mt-0.5">
                    <Download className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-400">Cropping Successful!</h3>
                    <p className="text-sm text-green-300/80 mt-1">
                      Processed <strong>{file?.name}</strong> successfully.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownload}
                    className="py-3 px-4 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download Result</span>
                  </button>
                  <button
                    onClick={reset}
                    className="py-3 px-4 bg-slate-700 text-slate-200 rounded-xl font-semibold hover:bg-slate-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Process Another</span>
                  </button>
                </div>
             </div>
          )}

          {status === AppStatus.ERROR && (
             <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-300">
                <AlertTriangle className="w-6 h-6" />
                <span>An error occurred during processing. Please ensure the CAD file is valid DXF and the WKT is correct.</span>
                <button onClick={reset} className="underline ml-auto">Reset</button>
             </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-slate-600 text-sm">
        <p>&copy; 2024 CAD Cropper Pro. Powered by React & Gemini.</p>
      </footer>
    </div>
  );
};

export default App;