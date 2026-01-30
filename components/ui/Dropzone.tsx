import React, { useState, useRef, useEffect } from 'react';

interface DropzoneProps {
  label: string;
  accept: string;
  onFileSelect: (base64: string, originalFile?: File) => void;
  subLabel?: string;
  placeholder?: string;
  value?: string;
  onTextChange?: (val: string) => void;
  isUploading?: boolean;
  maxSizeMB?: number;
}

export const Dropzone: React.FC<DropzoneProps> = ({ 
  label, 
  accept, 
  onFileSelect, 
  subLabel,
  placeholder,
  value,
  onTextChange,
  isUploading,
  maxSizeMB = 10
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear error when value changes (e.g. valid file loaded or url typed)
  useEffect(() => {
    if (value) setError(null);
  }, [value]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const getAcceptedTypes = () => {
    if (!accept || accept === '*') return [];
    return accept.split(',').map(t => t.trim().toLowerCase());
  };

  const validateFile = (file: File): boolean => {
      const acceptedTypes = getAcceptedTypes();
      if (acceptedTypes.length === 0) return true;
      
      const fileType = file.type.toLowerCase();
      
      const isValid = acceptedTypes.some(type => {
          if (type.endsWith('/*')) {
              const category = type.slice(0, -2);
              return fileType.startsWith(category + '/');
          }
          return fileType === type;
      });
      
      return isValid;
  };

  const processFile = (file: File) => {
    setError(null);
    
    if (!validateFile(file)) {
        const extensions = getAcceptedTypes()
            .map(t => t.replace('image/', '').replace('video/', '').replace('/*', '').toUpperCase())
            .join(' / ');
        setError(`INVALID TYPE. REQUIRED: ${extensions}`);
        return;
    }

    // Size check (default 10MB)
    if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`FILE TOO LARGE (MAX ${maxSizeMB}MB)`);
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Pass both result (preview) and original file (for upload)
      onFileSelect(result, file);
    };
    reader.onerror = () => {
        setError("DATA READ ERROR");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!isUploading && e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    if (e.target) e.target.value = '';
  };

  const isBase64 = value?.startsWith('data:');
  const isUrl = value?.startsWith('http');

  return (
    <div className="space-y-2">
      <label className="block text-xs font-mono text-orange-500 mb-1 tracking-widest uppercase flex justify-between">
          <span>{label}</span>
          {error && <span className="text-red-500 font-bold animate-pulse">{error}</span>}
          {isUploading && <span className="text-orange-400 font-bold animate-pulse">UPLOADING TO CLOUD...</span>}
      </label>
      
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`relative border-2 border-dashed p-4 text-center transition-all cursor-pointer group overflow-hidden min-h-[120px] flex flex-col items-center justify-center ${
            error 
            ? 'border-red-600 bg-red-900/10' 
            : isUploading
            ? 'border-orange-500 bg-orange-900/10 cursor-wait'
            : isDragging 
            ? 'border-orange-500 bg-orange-900/20' 
            : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-800'
        }`}
      >
        <input 
            type="file" 
            ref={inputRef} 
            className="hidden" 
            accept={accept} 
            onChange={handleFileChange}
            disabled={isUploading}
        />
        
        {/* Corner Decorators */}
        <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${error ? 'border-red-600' : 'border-zinc-500 group-hover:border-orange-500'} transition-colors`}></div>
        <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${error ? 'border-red-600' : 'border-zinc-500 group-hover:border-orange-500'} transition-colors`}></div>
        <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${error ? 'border-red-600' : 'border-zinc-500 group-hover:border-orange-500'} transition-colors`}></div>
        <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${error ? 'border-red-600' : 'border-zinc-500 group-hover:border-orange-500'} transition-colors`}></div>

        {isBase64 || isUrl ? (
             <div className="flex items-center justify-center gap-4 w-full px-4">
                 <div className="relative group/preview">
                    {value?.startsWith('data:image') || value?.match(/\.(jpeg|jpg|png|webp)$/i) ? (
                        <img src={value} className={`h-20 w-20 object-cover border border-orange-500/50 bg-black ${isUploading ? 'opacity-50' : ''}`} alt="Preview" />
                    ) : (
                        <div className="h-20 w-20 bg-zinc-950 border border-orange-500/50 flex items-center justify-center text-xs text-orange-500 font-bold">
                            ASSET
                        </div>
                    )}
                    {!isUploading && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[10px] text-white font-mono">CHANGE</span>
                        </div>
                    )}
                    {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="animate-spin h-6 w-6 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}
                 </div>
                 
                 <div className="flex-1 text-left overflow-hidden">
                     <div className={`text-xs font-mono uppercase font-bold flex items-center gap-2 mb-1 ${isUploading ? 'text-orange-500' : 'text-green-500'}`}>
                        <span className={`w-2 h-2 rounded-full animate-pulse ${isUploading ? 'bg-orange-500' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`}></span>
                        {isUploading ? 'SYNCING_STORAGE...' : 'READY'}
                     </div>
                     <div className="text-[10px] text-zinc-500 font-mono truncate">
                        {isUploading ? 'Uploading to Supabase bucket...' : (value || '').substring(0, 40) + '...'}
                     </div>
                     {!isUploading && isUrl && (
                        <div className="mt-1 text-[10px] text-orange-500 font-mono">
                            CLOUD LINK SECURED
                        </div>
                     )}
                 </div>
             </div>
        ) : (
            <div className="py-2 w-full">
                <div className={`text-zinc-500 transition-colors mb-3 ${error ? 'text-red-500' : 'group-hover:text-orange-400'}`}>
                   {error ? (
                       <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                   ) : (
                       <svg className="w-8 h-8 mx-auto opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                   )}
                </div>
                <div className={`text-xs font-bold uppercase tracking-wider ${error ? 'text-red-400' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                    {error ? error : "Click or Drag to Upload"}
                </div>
                {!error && subLabel && <p className="text-[10px] text-zinc-600 font-mono mt-1">{subLabel}</p>}
            </div>
        )}
      </div>

      {/* URL Input */}
      <div className={`flex bg-zinc-950 border transition-colors ${error ? 'border-red-900/50' : 'border-zinc-800 focus-within:border-orange-500/50'}`}>
         <div className="flex items-center px-3 border-r border-zinc-800 text-zinc-600 bg-zinc-900/50">
             <span className="text-[10px] font-mono font-bold">URL</span>
         </div>
         <input 
            type="text" 
            value={isBase64 ? 'Binary Data' : value || ''} 
            onChange={(e) => {
                setError(null);
                onTextChange && onTextChange(e.target.value);
            }}
            className="w-full bg-transparent py-2 px-3 text-xs text-zinc-300 focus:outline-none font-mono placeholder-zinc-700"
            placeholder={isUploading ? "Uploading..." : "https://..."}
            disabled={!!isBase64 || isUploading}
         />
         {(isBase64 || isUrl) && (
             <button 
                type="button"
                onClick={() => {
                    setError(null);
                    onTextChange && onTextChange('');
                }}
                disabled={isUploading}
                className="px-4 text-[10px] text-red-500 hover:bg-red-900/20 uppercase font-bold transition-colors border-l border-zinc-800 disabled:opacity-50"
             >
                CLR
             </button>
         )}
      </div>
    </div>
  );
};
