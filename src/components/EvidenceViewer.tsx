import React, { useState, useEffect } from 'react';
import { MediaStore } from '../lib/mediaStore';
import { Video, Image as ImageIcon, Play, AlertCircle } from 'lucide-react';

interface EvidenceViewerProps {
  evidenceUrl?: string | null;
  thumbnailUrl?: string | null;
  evidenceType?: 'video' | 'foto' | 'none' | string;
  className?: string;
  autoPlay?: boolean;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  evidenceUrl,
  thumbnailUrl,
  evidenceType = 'video',
  className = 'w-full max-h-72 object-contain',
  autoPlay = false
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    setHasError(false);

    if (!evidenceUrl) {
      setResolvedUrl(thumbnailUrl || null);
      return;
    }

    if (evidenceUrl.startsWith('idb://')) {
      setLoading(true);
      MediaStore.getMediaUrl(evidenceUrl).then((url) => {
        if (active) {
          setResolvedUrl(url);
          setLoading(false);
        }
      }).catch(() => {
        if (active) {
          setResolvedUrl(thumbnailUrl || null);
          setLoading(false);
        }
      });
    } else {
      setResolvedUrl(evidenceUrl);
    }

    return () => {
      active = false;
    };
  }, [evidenceUrl, thumbnailUrl]);

  if (!evidenceUrl && !thumbnailUrl) {
    return null;
  }

  const isVideo = evidenceType === 'video' || (!evidenceType && (evidenceUrl?.endsWith('.mp4') || evidenceUrl?.includes('video')));

  if (isVideo) {
    // Jika ada video yang siap diputar dan pengguna sudah menekan putar (atau autoplay)
    if (resolvedUrl && (!resolvedUrl.startsWith('data:image') || !thumbnailUrl || isPlaying)) {
      return (
        <div className="relative w-full bg-black rounded-2xl overflow-hidden flex items-center justify-center">
          <video
            src={resolvedUrl}
            controls
            playsInline
            autoPlay={autoPlay}
            onError={() => setHasError(true)}
            className={className}
          />
          {hasError && (
            <div className="absolute inset-0 bg-slate-900/90 text-white flex flex-col items-center justify-center p-4 text-center">
              <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-xs font-semibold">Video tersimpan di perangkat penilai.</p>
              {thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt="Cuplikan Gerakan"
                  className="mt-2 max-h-32 rounded-lg border border-slate-700"
                />
              )}
            </div>
          )}
        </div>
      );
    }

    // Jika menampilkan thumbnail video dengan tombol play
    return (
      <div className="relative w-full bg-slate-900 rounded-2xl overflow-hidden group">
        <img
          src={thumbnailUrl || resolvedUrl || ''}
          alt="Cuplikan Video Gerakan"
          className={className}
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-transform transform hover:scale-105"
            title="Putar Video"
          >
            <Play className="w-6 h-6 ml-0.5 fill-current" />
          </button>
          <span className="text-[11px] font-semibold text-white/90 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1">
            <Video className="w-3.5 h-3.5 text-emerald-400" />
            Putar Video Bukti Gerakan
          </span>
        </div>
      </div>
    );
  }

  // Foto bukti gerakan
  return (
    <div className="w-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center">
      <img
        src={resolvedUrl || thumbnailUrl || ''}
        alt="Bukti Foto Gerakan"
        referrerPolicy="no-referrer"
        className={className}
      />
    </div>
  );
};
