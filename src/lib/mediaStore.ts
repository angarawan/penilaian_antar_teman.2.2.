/**
 * IndexedDB Media Storage for PJOK Assessment Evidence
 *
 * Mengizinkan penyimpanan video & foto berukuran besar (hingga puluhan/ratusan MB)
 * secara instan (< 100ms) di browser tanpa membebani localStorage (limit 5MB)
 * dan tanpa memblokir Firestore document size (limit 1MB).
 */

const DB_NAME = 'pjok_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'evidence_media';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB tidak didukung pada browser ini'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const MediaStore = {
  /**
   * Menyimpan file/blob secara instan ke IndexedDB
   */
  async saveMedia(id: string, file: Blob | File): Promise<string> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(file, id);

        req.onsuccess = () => resolve(`idb://${id}`);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Gagal menyimpan ke IndexedDB, menggunakan ObjectURL fallback:', e);
      return URL.createObjectURL(file);
    }
  },

  /**
   * Mengambil file/blob dari IndexedDB dan mengembalikan Blob URL siap tonton
   */
  async getMediaUrl(id: string): Promise<string | null> {
    try {
      const key = id.replace(/^idb:\/\//, '');
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => {
          const blob = req.result;
          if (blob instanceof Blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      console.warn('Gagal mengambil media dari IndexedDB:', e);
      return null;
    }
  },

  /**
   * Mengekstrak cuplikan (thumbnail) frame video dalam ukuran kecil (~15-25 KB)
   * agar dapat langsung disimpan ke Firestore & dilihat guru/siswa secara instan
   * tanpa menunggu unduhan video 50MB.
   */
  async generateVideoThumbnail(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        const objectUrl = URL.createObjectURL(file);
        video.src = objectUrl;

        // Ambil frame pada detik ke 0.5 atau 1 agar tidak blank hitam
        video.onloadedmetadata = () => {
          video.currentTime = Math.min(1, Math.max(0.2, video.duration * 0.1));
        };

        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            // Batasi resolusi thumbnail maksimal lebar 480px untuk menjaga ukuran < 25KB
            const maxW = 480;
            const scale = Math.min(1, maxW / (video.videoWidth || 480));
            canvas.width = Math.round((video.videoWidth || 480) * scale);
            canvas.height = Math.round((video.videoHeight || 270) * scale);

            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              // Kualitas JPEG 0.6 sangat ringan (~15KB) dan jernih
              const thumbUrl = canvas.toDataURL('image/jpeg', 0.6);
              URL.revokeObjectURL(objectUrl);
              resolve(thumbUrl);
              return;
            }
          } catch (err) {
            console.warn('Thumbnail generation error:', err);
          }
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };

        video.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };

        // Timeout 3 detik jika video tidak bisa diputar
        setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        }, 3000);
      } catch {
        resolve(null);
      }
    });
  },

  /**
   * Mengompresi foto bukti gerakan jika diunggah dalam ukuran besar
   */
  async compressImage(file: File, maxWidth = 1000, quality = 0.7): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
            return;
          }
          resolve(e.target?.result as string);
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }
};
