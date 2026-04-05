import { CheckCircle2, ImageIcon, UploadIcon, X } from 'lucide-react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { PROGRESS_INCREMENT, PROGRESS_INTERVAL_MS, REDIRECT_DELAY_MS } from '../lib/constants';

interface UploadData {
  base64: string;
  name: string;
}

interface UploadProps {
  onComplete: (data: UploadData) => void;
}

interface AuthContextType {
  isSignedIn: boolean;
}

const Upload: React.FC<UploadProps> = ({ onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn } = useOutletContext<AuthContextType>();

  const timersRef = useRef<{ interval?: NodeJS.Timeout; timeout?: NodeJS.Timeout }>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup timers and abort on unmount/new file
  useEffect(() => {
    return () => {
      if (timersRef.current.interval) clearInterval(timersRef.current.interval);
      if (timersRef.current.timeout) clearTimeout(timersRef.current.timeout);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  useEffect(() => {
    // Cleanup on new file selection
    if (file) return;
    if (timersRef.current.interval) clearInterval(timersRef.current.interval);
    if (timersRef.current.timeout) clearTimeout(timersRef.current.timeout);
    setProgress(0);
    setError(null);
  }, [file]);

  const clearError = useCallback(() => setError(null), []);

  const processFile = useCallback((selectedFile: File) => {
    if (!isSignedIn) {
      setError('Please sign in to upload files.');
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG).');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setProgress(0);

    abortControllerRef.current = new AbortController();
    const reader = new FileReader();
    reader.onload = () => {
      if (abortControllerRef.current?.signal.aborted) return;
      const base64 = reader.result as string;

      let prog = 0;
      timersRef.current.interval = setInterval(() => {
        if (abortControllerRef.current?.signal.aborted) {
          clearInterval(timersRef.current.interval!);
          return;
        }
        prog = Math.min(prog + PROGRESS_INCREMENT, 100);
        setProgress(prog);
        if (prog >= 100) {
          clearInterval(timersRef.current.interval!);
          timersRef.current.timeout = setTimeout(() => {
            onComplete({ base64, name: selectedFile.name });
          }, REDIRECT_DELAY_MS);
        }
      }, PROGRESS_INTERVAL_MS);
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsDataURL(selectedFile);
  }, [isSignedIn, onComplete]);

  const handleRemoveFile = useCallback(() => {
    if (timersRef.current.interval) clearInterval(timersRef.current.interval);
    if (timersRef.current.timeout) clearTimeout(timersRef.current.timeout);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setFile(null);
    setProgress(0);
    setError(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.effectAllowed = 'copy';
    if (!isSignedIn) return;
    setIsDragging(true);
  }, [isSignedIn]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isSignedIn) return;
    setIsDragging(true);
  }, [isSignedIn]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Only reset if leaving the dropzone entirely
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (!isSignedIn || !droppedFile) return;
    processFile(droppedFile);
  }, [isSignedIn, processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      e.target.value = '';
      processFile(selectedFile);
    }
  }, [processFile]);

  const dropzoneClasses = `dropzone ${isDragging ? 'is-dragging' : ''} ${!isSignedIn ? 'disabled' : ''}`;

  return (
    <div className='upload'>
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={clearError} className="error-dismiss">×</button>
        </div>
      )}
      {!file ? (
        <>
          <div
            className={dropzoneClasses}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            tabIndex={isSignedIn ? 0 : -1}
          >
            <input
              type="file"
              className='drop-input'
              accept='.jpg,.jpeg,.png'
              disabled={!isSignedIn}
              onChange={handleFileChange}
            />
          </div>
          <div className='drop-content'>
            <div className='drop-icon'>
              <UploadIcon size={20} />
            </div>
            <p>
              {isSignedIn
                ? 'Drag and drop your floor plan here, or click to select a file.'
                : 'Upload disabled. Please log in to continue.'}
            </p>
            <p className='help'>Maximum file size 10 MB (JPG, PNG)</p>
          </div>
        </>
      ) : (
        <div className='upload-status'>
          <div className='status-content'>
            <div className='status-icon'>
              {progress === 100 ? (
                <CheckCircle2 className='check' />
              ) : (
                <ImageIcon className='image' />
              )}
            </div>
            <h3>{file.name}</h3>
            <div className='progress'>
              <div className='bar' style={{ width: `${progress}%` }} />
              <p className='status-text'>
                {progress < 100 ? 'Analyzing floor plan...' : 'Redirecting...'}
              </p>
            </div>
            <button onClick={handleRemoveFile} className="remove-file" disabled={progress === 100}>
              <X size={16} /> Change file
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
