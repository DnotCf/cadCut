import React, { useCallback, useState } from 'react';
import { Upload, FileCode, X, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ file, onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        const file = droppedFiles[0] as File;
        // Accept common CAD formats
        const validExtensions = ['.dxf', '.dwg', '.geo', '.json'];
        const isCad = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        
        // For demo purposes, we accept any file, but in prod we'd limit it
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        1. Upload CAD File (.dxf, .dwg)
      </label>
      
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer
            ${isDragging 
              ? 'border-cyan-400 bg-cyan-400/10 scale-[1.01]' 
              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50 bg-slate-800/20'
            }
          `}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileInput}
            accept=".dxf,.dwg"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className={`p-3 rounded-full ${isDragging ? 'bg-cyan-400/20' : 'bg-slate-700/50'}`}>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-cyan-400' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-200">
                Drop your CAD file here
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Supports DXF and DWG formats
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <FileCode className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="font-medium text-slate-200 truncate max-w-[200px] md:max-w-[300px]">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={() => onFileSelect(null)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};