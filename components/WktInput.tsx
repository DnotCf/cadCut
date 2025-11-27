import React from 'react';
import { Map, AlertCircle, Check, Loader2 } from 'lucide-react';
import { ValidationResponse } from '../types';

interface WktInputProps {
  value: string;
  onChange: (val: string) => void;
  validationStatus: 'idle' | 'validating' | 'valid' | 'invalid';
  validationResult?: ValidationResponse;
}

export const WktInput: React.FC<WktInputProps> = ({ 
  value, 
  onChange, 
  validationStatus, 
  validationResult 
}) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <label className="block text-sm font-medium text-slate-300">
          2. Clipping Geometry (WKT)
        </label>
        {validationStatus === 'validating' && (
          <span className="text-xs text-cyan-400 flex items-center">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> checking geometry...
          </span>
        )}
        {validationStatus === 'valid' && (
          <span className="text-xs text-green-400 flex items-center">
            <Check className="w-3 h-3 mr-1" /> Valid {validationResult?.geometryType}
          </span>
        )}
        {validationStatus === 'invalid' && (
          <span className="text-xs text-red-400 flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" /> Invalid Geometry
          </span>
        )}
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))"
          className={`
            w-full h-32 px-4 py-3 bg-slate-800/50 text-slate-200 rounded-xl border
            focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all outline-none resize-none font-mono text-sm
            ${validationStatus === 'invalid' 
              ? 'border-red-500/50 focus:ring-red-500/50' 
              : validationStatus === 'valid'
                ? 'border-green-500/50 focus:ring-green-500/50'
                : 'border-slate-600 focus:border-cyan-500 focus:ring-cyan-500/50'
            }
          `}
        />
        <div className="absolute top-3 right-3 text-slate-500 pointer-events-none">
          <Map className="w-5 h-5 opacity-50" />
        </div>
      </div>
      
      {validationResult?.description && (
        <div className={`mt-2 text-xs px-3 py-2 rounded-lg border ${
          validationStatus === 'valid' 
            ? 'bg-green-500/10 border-green-500/20 text-green-300' 
            : 'bg-red-500/10 border-red-500/20 text-red-300'
        }`}>
          AI Analysis: {validationResult.description}
        </div>
      )}
    </div>
  );
};