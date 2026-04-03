import { CheckCircle2, ImageIcon, UploadIcon } from 'lucide-react';
import React, { useState, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { PROGRESS_INCREMENT, PROGRESS_INTERVAL_MS, REDIRECT_DELAY_MS } from '../lib/constants';
// AuthContext type imported via useOutletContext

interface UploadData {
  base64: string;
  name: string;
}

interface UploadProps {
  onComplete: (data: UploadData) => void;
}

const Upload: React.FC<UploadProps> = ({ onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const uploadRef = useRef<HTMLDivElement>(null);
  const { isSignedIn } = useOutletContext<AuthContext>();

  const resetStates = useCallback(() => {
    setFile(null);
    setProgress(0);
    setIsDragging(false);
  }, []);

  const processFile = useCallback((selectedFile: File) => {
    if (!isSignedIn) {
      console.warn('User not signed in. Upload blocked.');
      return;
    }

    // Validate file: image, ~10MB
    if (!selectedFile.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG).');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Start progress simulation
      let prog = 0;
      const interval = setInterval(() => {
        prog = Math.min(prog + PROGRESS_INCREMENT, 100);
        setProgress(prog);
        if (prog >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete({ base64, name: selectedFile.name });
            // Optionally reset after complete
            // resetStates();
          }, REDIRECT_DELAY_MS);
        }
      }, PROGRESS_INTERVAL_MS);
    };
    reader.readAsDataURL(selectedFile);
  }, [isSignedIn, onComplete]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) return;
    setIsDragging(true);
  }, [isSignedIn]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) return;
    setIsDragging(true);
  }, [isSignedIn]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) return;
    setIsDragging(false);
  }, [isSignedIn]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!isSignedIn || !e.dataTransfer.files?.[0]) return;
    processFile(e.dataTransfer.files[0]);
  }, [isSignedIn, processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      e.target.value = ''; // Reset input
      processFile(selectedFile);
    }
  }, [processFile]);

  return (
    <div className='upload'>
      {!file ? (
        <>
          <div
            ref={uploadRef}
            className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
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
                : 'Please log in to upload your floor plan.'}
            </p>
            <p className='help'>maximum File size 10 MB</p>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;

