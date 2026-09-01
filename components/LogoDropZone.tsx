'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { LOGO_MIME_TYPES, MAX_LOGO_BYTES, LOGO_RULES_MESSAGE, LOGO_SIZE_MESSAGE } from '@/lib/logo-shared';
import styles from './LogoDropZone.module.css';

interface LogoDropZoneProps {
  /** Imagen actual a previsualizar: data URL o ruta pública (/uploads/...). */
  value: string | null;
  /** Recibe el data URL del archivo válido, o null cuando se quita el logo. */
  onChange: (dataUrl: string | null) => void;
  /** Recibe mensajes de validación (tipo o tamaño inválidos). */
  onError?: (message: string) => void;
}

export default function LogoDropZone({ value, onChange, onError }: LogoDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = (file: File | undefined) => {
    if (!file) return;

    if (!LOGO_MIME_TYPES.includes(file.type)) {
      onError?.(LOGO_RULES_MESSAGE);
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      onError?.(LOGO_SIZE_MESSAGE);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    loadFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
      >
        {value ? (
          <div className={styles.logoPreview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Logo" />
            <button
              type="button"
              className={styles.logoRemove}
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              aria-label="Quitar logo"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <ImagePlus size={26} />
            <span>Arrastra tu logo aquí o haz clic para seleccionarlo</span>
            <small>PNG, JPG, WEBP o SVG · máx. 2 MB</small>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={LOGO_MIME_TYPES.join(',')}
        style={{ display: 'none' }}
        onChange={(e) => { loadFile(e.target.files?.[0]); e.target.value = ''; }}
      />
    </div>
  );
}
