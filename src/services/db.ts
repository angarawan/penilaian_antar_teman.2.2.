import {
  UserProfile,
  ClassItem,
  IndicatorItem,
  AssessmentTask,
  AssessmentRecord,
  AppConfig,
  QuizItem,
  QuizSubmission
} from '../types';
import {
  INITIAL_CLASSES,
  INITIAL_USERS,
  INITIAL_INDICATORS,
  INITIAL_TASKS,
  INITIAL_ASSESSMENTS,
  INITIAL_APP_CONFIG,
  INITIAL_QUIZZES
} from './seedData';
import { db, storage, isFirebaseConfigured } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage';
import { MediaStore } from '../lib/mediaStore';

// Local storage keys for hybrid/offline mode
const LS_USERS = 'pjok_data_users';
const LS_CLASSES = 'pjok_data_classes';
const LS_INDICATORS = 'pjok_data_indicators';
const LS_TASKS = 'pjok_data_tasks';
const LS_ASSESSMENTS = 'pjok_data_assessments';
const LS_APP_CONFIG = 'pjok_data_app_config';
const LS_QUIZZES = 'pjok_data_quizzes';
const LS_QUIZ_SUBMISSIONS = 'pjok_data_quiz_submissions';

// Event listener subscribers for reactive updates across the app
type ListenerCallback = () => void;
const listeners: Set<ListenerCallback> = new Set();

export const subscribeToDataChanges = (callback: ListenerCallback): (() => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

const notifySubscribers = () => {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('Listener callback error', e);
    }
  });
};

let realtimeListenersInitialized = false;

/**
 * Memasang pendengar real-time Firestore (onSnapshot)
 * agar semua perubahan data (pengaturan, logo, kelas, siswa, tugas, penilaian)
 * langsung sinkron detik itu juga antar Laptop dan HP tanpa perlu refresh.
 */
export const initRealtimeCloudSync = () => {
  if (realtimeListenersInitialized || !isFirebaseConfigured() || !db) return;
  realtimeListenersInitialized = true;

  try {
    // 1. Settings / App Config & Logo
    onSnapshot(
      doc(db, 'settings', 'app_config'),
      (snap) => {
        if (snap.exists()) {
          const cloudConfig = { ...INITIAL_APP_CONFIG, ...(snap.data() as AppConfig) };
          try {
            localStorage.setItem(LS_APP_CONFIG, JSON.stringify(cloudConfig));
          } catch {}
          notifySubscribers();
        }
      },
      (err) => console.warn('Realtime app_config sync notice:', err)
    );

    // 2. Classes (Kelas)
    onSnapshot(
      collection(db, 'classes'),
      (snap) => {
        if (!snap.empty) {
          const cloudClasses = snap.docs.map((d) => d.data() as ClassItem);
          try {
            localStorage.setItem(LS_CLASSES, JSON.stringify(cloudClasses));
          } catch {}
          notifySubscribers();
        }
      },
      (err) => console.warn('Realtime classes sync notice:', err)
    );

    // 3. Assessment Tasks (Tugas Penilaian)
    onSnapshot(
      collection(db, 'tasks'),
      (snap) => {
        if (!snap.empty) {
          const cloudTasks = snap.docs.map((d) => d.data() as AssessmentTask);
          try {
            localStorage.setItem(LS_TASKS, JSON.stringify(cloudTasks));
          } catch {}
          notifySubscribers();
        }
      },
      (err) => console.warn('Realtime tasks sync notice:', err)
    );

    // 4. Rubric Indicators (Indikator Penilaian)
    onSnapshot(
      collection(db, 'indicators'),
      (snap) => {
        if (!snap.empty) {
          const cloudIndicators = snap.docs
            .map((d) => d.data() as IndicatorItem)
            .sort((a, b) => a.urutan - b.urutan);
          try {
            localStorage.setItem(LS_INDICATORS, JSON.stringify(cloudIndicators));
          } catch {}
          notifySubscribers();
        }
      },
      (err) => console.warn('Realtime indicators sync notice:', err)
    );

    // 5. Users (Koleksi Pengguna / Guru & Murid)
    onSnapshot(
      collection(db, 'pengguna'),
      (snap) => {
        if (!snap.empty) {
          const cloudUsers = snap.docs.map((d) => d.data() as UserProfile);
          try {
            localStorage.setItem(LS_USERS, JSON.stringify(cloudUsers));
          } catch {}
          notifySubscribers();
        }
      },
      (err) => console.warn('Realtime pengguna sync notice:', err)
    );

    // 6. Assessments (Hasil Penilaian Antar Teman)
    onSnapshot(
      collection(db, 'assessments'),
      (snap) => {
        if (!snap.empty) {
          const cloudAssessments = snap.docs.map((d) => d.data() as AssessmentRecord);
          try {
            localStorage.setItem(LS_ASSESSMENTS, JSON.stringify(cloudAssessments));
          } catch {}
          notifySubscribers();
        }
      },
      (err) => console.warn('Realtime assessments sync notice:', err)
    );

    // 7. Quizzes (Kuis Link & Kunci Guru PJOK)
    onSnapshot(
      collection(db, 'quizzes'),
      (snap) => {
        if (!snap.empty) {
          const cloudQuizzes = snap.docs.map((d) => d.data() as QuizItem);
          try {
            localStorage.setItem(LS_QUIZZES, JSON.stringify(cloudQuizzes));
          } catch {}
          notifySubscribers();
        }
      },
      (err) => console.warn('Realtime quizzes sync notice:', err)
    );

    // 8. Quiz Submissions (Pengerjaan Kuis Siswa)
    onSnapshot(
      collection(db, 'quiz_submissions'),
      (snap) => {
        if (!snap.empty) {
          const cloudSubs = snap.docs.map((d) => d.data() as QuizSubmission);
          try {
            localStorage.setItem(LS_QUIZ_SUBMISSIONS, JSON.stringify(cloudSubs));
          } catch {}
          notifySubscribers();
        }
      },
      (err) => console.warn('Realtime quiz_submissions sync notice:', err)
    );
  } catch (err) {
    console.warn('Gagal memasang realtime listener Firestore:', err);
  }
};

// Helper to initialize local storage with initial seed data if not present
const getStored = <T>(key: string, defaultData: T[]): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error reading ${key}, falling back to default`, err);
    return defaultData;
  }
};

const setStored = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    notifySubscribers();
  } catch (err) {
    console.error(`Error saving ${key}`, err);
  }
};

export const DatabaseService = {
  // --- USERS / PENGGUNA ---
  async getUsers(): Promise<UserProfile[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snapPengguna = await getDocs(collection(db, 'pengguna'));
        if (!snapPengguna.empty) {
          const cloudUsers = snapPengguna.docs.map((d) => d.data() as UserProfile);
          try {
            localStorage.setItem(LS_USERS, JSON.stringify(cloudUsers));
          } catch {}
          return cloudUsers;
        }

        const snap = await getDocs(collection(db, 'users'));
        if (!snap.empty) {
          const cloudUsers = snap.docs.map((d) => d.data() as UserProfile);
          try {
            localStorage.setItem(LS_USERS, JSON.stringify(cloudUsers));
          } catch {}
          return cloudUsers;
        }

        // Jika Firestore masih kosong, unggah data pengguna lokal/awal ke cloud
        const localUsers = getStored<UserProfile>(LS_USERS, INITIAL_USERS);
        for (const u of localUsers) {
          await setDoc(doc(db, 'pengguna', u.uid), u, { merge: true });
        }
        return localUsers;
      } catch (err) {
        console.warn('Firestore getUsers failed, falling back to local:', err);
      }
    }
    return getStored<UserProfile>(LS_USERS, INITIAL_USERS);
  },

  async getUser(uid: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured() && db) {
      try {
        const docPengguna = await getDoc(doc(db, 'pengguna', uid));
        if (docPengguna.exists()) {
          return docPengguna.data() as UserProfile;
        }
        const docUser = await getDoc(doc(db, 'users', uid));
        if (docUser.exists()) {
          return docUser.data() as UserProfile;
        }
      } catch (err) {
        console.warn('Firestore getUser failed, falling back:', err);
      }
    }
    const all = await this.getUsers();
    return all.find((u) => u.uid === uid) || null;
  },

  async saveUser(user: UserProfile): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await Promise.all([
          setDoc(doc(db, 'pengguna', user.uid), user, { merge: true }),
          setDoc(doc(db, 'users', user.uid), user, { merge: true })
        ]);
      } catch (err) {
        console.warn('Firestore saveUser error:', err);
      }
    }
    const all = getStored<UserProfile>(LS_USERS, INITIAL_USERS);
    const idx = all.findIndex((u) => u.uid === user.uid);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...user };
    } else {
      all.push(user);
    }
    setStored(LS_USERS, all);
  },

  async deleteUser(uid: string): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await Promise.all([
          deleteDoc(doc(db, 'pengguna', uid)),
          deleteDoc(doc(db, 'users', uid))
        ]);
      } catch (err) {
        console.warn('Firestore deleteUser error:', err);
      }
    }
    const all = getStored<UserProfile>(LS_USERS, INITIAL_USERS);
    const filtered = all.filter((u) => u.uid !== uid);
    setStored(LS_USERS, filtered);
  },

  // --- CLASSES ---
  async getClasses(): Promise<ClassItem[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'classes'));
        if (!snap.empty) {
          const cloudClasses = snap.docs.map((d) => d.data() as ClassItem);
          try {
            localStorage.setItem(LS_CLASSES, JSON.stringify(cloudClasses));
          } catch {}
          return cloudClasses;
        }

        // Jika Firestore kosong, seed data kelas ke cloud
        const localClasses = getStored<ClassItem>(LS_CLASSES, INITIAL_CLASSES);
        for (const c of localClasses) {
          await setDoc(doc(db, 'classes', c.id), c, { merge: true });
        }
        return localClasses;
      } catch (err) {
        console.warn('Firestore getClasses failed:', err);
      }
    }
    return getStored<ClassItem>(LS_CLASSES, INITIAL_CLASSES);
  },

  async saveClass(item: ClassItem): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'classes', item.id), item, { merge: true });
      } catch (err) {
        console.warn('Firestore saveClass error:', err);
      }
    }
    const all = getStored<ClassItem>(LS_CLASSES, INITIAL_CLASSES);
    const idx = all.findIndex((c) => c.id === item.id);
    if (idx >= 0) {
      all[idx] = item;
    } else {
      all.push(item);
    }
    setStored(LS_CLASSES, all);
  },

  async deleteClass(id: string): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'classes', id));
      } catch (err) {
        console.warn('Firestore deleteClass error:', err);
      }
    }
    const all = getStored<ClassItem>(LS_CLASSES, INITIAL_CLASSES);
    const filtered = all.filter((c) => c.id !== id);
    setStored(LS_CLASSES, filtered);
  },

  // --- INDICATORS ---
  async getIndicators(): Promise<IndicatorItem[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'indicators'));
        if (!snap.empty) {
          const cloudIndicators = snap.docs
            .map((d) => d.data() as IndicatorItem)
            .sort((a, b) => a.urutan - b.urutan);
          try {
            localStorage.setItem(LS_INDICATORS, JSON.stringify(cloudIndicators));
          } catch {}
          return cloudIndicators;
        }

        // Jika Firestore kosong, seed data indikator ke cloud
        const localIndicators = getStored<IndicatorItem>(LS_INDICATORS, INITIAL_INDICATORS);
        for (const ind of localIndicators) {
          await setDoc(doc(db, 'indicators', ind.id), ind, { merge: true });
        }
        return localIndicators.sort((a, b) => a.urutan - b.urutan);
      } catch (err) {
        console.warn('Firestore getIndicators failed:', err);
      }
    }
    const list = getStored<IndicatorItem>(LS_INDICATORS, INITIAL_INDICATORS);
    return list.sort((a, b) => a.urutan - b.urutan);
  },

  async saveIndicator(item: IndicatorItem): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'indicators', item.id), item, { merge: true });
      } catch (err) {
        console.warn('Firestore saveIndicator error:', err);
      }
    }
    const all = getStored<IndicatorItem>(LS_INDICATORS, INITIAL_INDICATORS);
    const idx = all.findIndex((ind) => ind.id === item.id);
    if (idx >= 0) {
      all[idx] = item;
    } else {
      all.push(item);
    }
    setStored(LS_INDICATORS, all);
  },

  async deleteIndicator(id: string): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'indicators', id));
      } catch (err) {
        console.warn('Firestore deleteIndicator error:', err);
      }
    }
    const all = getStored<IndicatorItem>(LS_INDICATORS, INITIAL_INDICATORS);
    const filtered = all.filter((ind) => ind.id !== id);
    setStored(LS_INDICATORS, filtered);
  },

  // --- TASKS ---
  async getTasks(): Promise<AssessmentTask[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'tasks'));
        if (!snap.empty) {
          const cloudTasks = snap.docs.map((d) => d.data() as AssessmentTask);
          try {
            localStorage.setItem(LS_TASKS, JSON.stringify(cloudTasks));
          } catch {}
          return cloudTasks;
        }

        // Jika Firestore kosong, seed data tugas ke cloud
        const localTasks = getStored<AssessmentTask>(LS_TASKS, INITIAL_TASKS);
        for (const t of localTasks) {
          await setDoc(doc(db, 'tasks', t.id), t, { merge: true });
        }
        return localTasks;
      } catch (err) {
        console.warn('Firestore getTasks failed:', err);
      }
    }
    return getStored<AssessmentTask>(LS_TASKS, INITIAL_TASKS);
  },

  async getTask(id: string): Promise<AssessmentTask | null> {
    const tasks = await this.getTasks();
    return tasks.find((t) => t.id === id) || null;
  },

  async getTasksForClass(kelas: string): Promise<AssessmentTask[]> {
    const tasks = await this.getTasks();
    return tasks.filter(
      (t) =>
        t.status === 'aktif' &&
        (t.kelas.toLowerCase() === kelas.toLowerCase() || t.kelas === 'Semua')
    );
  },

  async saveTask(task: AssessmentTask): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'tasks', task.id), task, { merge: true });
      } catch (err) {
        console.warn('Firestore saveTask error:', err);
      }
    }
    const all = getStored<AssessmentTask>(LS_TASKS, INITIAL_TASKS);
    const idx = all.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      all[idx] = task;
    } else {
      all.push(task);
    }
    setStored(LS_TASKS, all);
  },

  async deleteTask(id: string): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (err) {
        console.warn('Firestore deleteTask error:', err);
      }
    }
    const all = getStored<AssessmentTask>(LS_TASKS, INITIAL_TASKS);
    const filtered = all.filter((t) => t.id !== id);
    setStored(LS_TASKS, filtered);
  },

  // --- ASSESSMENTS ---
  async getAssessments(): Promise<AssessmentRecord[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'assessments'));
        if (!snap.empty) {
          const cloudAssessments = snap.docs.map((d) => d.data() as AssessmentRecord);
          try {
            localStorage.setItem(LS_ASSESSMENTS, JSON.stringify(cloudAssessments));
          } catch {}
          return cloudAssessments;
        }
      } catch (err) {
        console.warn('Firestore getAssessments failed:', err);
      }
    }
    return getStored<AssessmentRecord>(LS_ASSESSMENTS, INITIAL_ASSESSMENTS);
  },

  async getAssessmentsByAssessor(assessorId: string): Promise<AssessmentRecord[]> {
    const all = await this.getAssessments();
    return all.filter((a) => a.assessorId === assessorId);
  },

  async getAssessmentsForTarget(targetId: string): Promise<AssessmentRecord[]> {
    const all = await this.getAssessments();
    return all.filter((a) => a.targetId === targetId);
  },

  async checkExistingAssessment(
    taskId: string,
    assessorId: string,
    targetId: string
  ): Promise<AssessmentRecord | null> {
    const all = await this.getAssessments();
    return (
      all.find(
        (a) =>
          a.taskId === taskId &&
          a.assessorId === assessorId &&
          a.targetId === targetId
      ) || null
    );
  },

  async saveAssessment(record: AssessmentRecord): Promise<void> {
    // Sanitasi record untuk Firestore & LocalStorage:
    // Jangan pernah memasukkan base64 video berukuran puluhan MB ke dokumen Firestore atau localStorage
    const recordToSave: AssessmentRecord = { ...record };
    if (
      recordToSave.evidenceUrl &&
      recordToSave.evidenceUrl.startsWith('data:video') &&
      recordToSave.evidenceUrl.length > 50000
    ) {
      // Ganti dengan idb:// ID jika belum disimpan di storage agar dokumen tetap ringan (<50KB)
      recordToSave.evidenceUrl = `idb://${record.id}`;
    }

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'assessments', recordToSave.id), recordToSave, { merge: true });
      } catch (err) {
        console.warn('Firestore saveAssessment error:', err);
      }
    }
    const all = getStored<AssessmentRecord>(LS_ASSESSMENTS, INITIAL_ASSESSMENTS);
    const idx = all.findIndex((a) => a.id === recordToSave.id);
    if (idx >= 0) {
      all[idx] = recordToSave;
    } else {
      all.push(recordToSave);
    }
    setStored(LS_ASSESSMENTS, all);
    notifySubscribers();
  },

  // --- EVIDENCE UPLOAD (IndexedDB + Firebase Storage + Ultra-Fast Thumbnail) ---
  async uploadEvidence(
    file: File,
    taskId: string,
    assessorId: string,
    onProgress?: (percent: number) => void
  ): Promise<{ url: string; path: string; thumbnailUrl?: string | null }> {
    const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = `assessment-evidence/${taskId}/${assessorId}/${safeFileName}`;

    // 1. Simpan segera ke IndexedDB dalam waktu < 50ms tanpa blocking
    const mediaId = `media_${taskId}_${assessorId}_${Date.now()}`;
    const idbUrl = await MediaStore.saveMedia(mediaId, file);

    // 2. Buat thumbnail ringkas (~15KB) secara instan agar guru & siswa langsung bisa melihat bukti
    let thumbnailUrl: string | null = null;
    if (file.type.startsWith('video/')) {
      try {
        thumbnailUrl = await MediaStore.generateVideoThumbnail(file);
      } catch (e) {
        console.warn('Gagal membuat thumbnail video:', e);
      }
    } else if (file.type.startsWith('image/')) {
      try {
        thumbnailUrl = await MediaStore.compressImage(file, 480, 0.65);
      } catch {}
    }

    // 3. Jika Firebase Storage aktif, lakukan upload dengan batas waktu timeout
    if (isFirebaseConfigured() && storage) {
      try {
        const fileRef = storageRef(storage, storagePath);
        const uploadTask = uploadBytesResumable(fileRef, file);

        const uploadPromise = new Promise<{ url: string; path: string }>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              if (snapshot.totalBytes > 0) {
                const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                onProgress?.(percent);
              }
            },
            (error) => reject(error),
            async () => {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({ url: downloadUrl, path: storagePath });
            }
          );
        });

        // Timeout 10 detik agar tidak membuat pengguna terhenti jika jaringan lambat
        const timeoutPromise = new Promise<{ url: string; path: string }>((_, reject) =>
          setTimeout(() => reject(new Error('Upload cloud timeout, beralih ke penyimpanan lokal super cepat.')), 10000)
        );

        const res = await Promise.race([uploadPromise, timeoutPromise]);
        return { ...res, thumbnailUrl };
      } catch (err) {
        console.warn('Firebase storage upload failed or timed out, using fast local media:', err);
      }
    }

    onProgress?.(100);
    return {
      url: idbUrl,
      path: storagePath,
      thumbnailUrl
    };
  },

  async uploadMedia(
    file: File,
    path?: string,
    onProgress?: (percent: number) => void
  ): Promise<{ url: string; path: string; thumbnailUrl?: string | null }> {
    return this.uploadEvidence(file, path || 'assessments', 'upload', onProgress);
  },

  // --- APP CONFIG & LOGO (Sinkron Multi-Device HP & Laptop) ---
  async getAppConfig(): Promise<AppConfig> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDoc(doc(db, 'settings', 'app_config'));
        if (snap.exists()) {
          const cloudConfig = { ...INITIAL_APP_CONFIG, ...(snap.data() as AppConfig) };
          try {
            localStorage.setItem(LS_APP_CONFIG, JSON.stringify(cloudConfig));
          } catch {}
          return cloudConfig;
        } else {
          // Jika di Firestore belum ada, periksa apakah di penyimpanan lokal ada kustomisasi untuk diunggah ke cloud
          const stored = localStorage.getItem(LS_APP_CONFIG);
          const configToUpload = stored
            ? { ...INITIAL_APP_CONFIG, ...JSON.parse(stored) }
            : INITIAL_APP_CONFIG;
          try {
            await setDoc(doc(db, 'settings', 'app_config'), configToUpload, { merge: true });
          } catch (e) {
            console.warn('Gagal mengunggah konfigurasi awal ke Firestore:', e);
          }
          return configToUpload;
        }
      } catch (err) {
        console.warn('Firestore getAppConfig error, using local:', err);
      }
    }
    const stored = localStorage.getItem(LS_APP_CONFIG);
    if (stored) {
      try {
        return { ...INITIAL_APP_CONFIG, ...JSON.parse(stored) };
      } catch {
        return INITIAL_APP_CONFIG;
      }
    }
    return INITIAL_APP_CONFIG;
  },

  async saveAppConfig(config: Partial<AppConfig>): Promise<AppConfig> {
    const current = await this.getAppConfig();
    const updated: AppConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'settings', 'app_config'), updated, { merge: true });
      } catch (err) {
        console.warn('Firestore saveAppConfig error:', err);
      }
    }

    try {
      localStorage.setItem(LS_APP_CONFIG, JSON.stringify(updated));
      notifySubscribers();
    } catch (err) {
      console.error('Error saving app config to local storage', err);
    }
    return updated;
  },

  async resetAppConfig(): Promise<AppConfig> {
    return this.saveAppConfig(INITIAL_APP_CONFIG);
  },

  // --- QUIZZES (Kuis PJOK Link & Kunci Guru-Murid) ---
  async getQuizzes(): Promise<QuizItem[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'quizzes'));
        if (!snap.empty) {
          const cloudQuizzes = snap.docs.map((d) => d.data() as QuizItem);
          try {
            localStorage.setItem(LS_QUIZZES, JSON.stringify(cloudQuizzes));
          } catch {}
          return cloudQuizzes;
        }
      } catch (err) {
        console.warn('Firestore getQuizzes error, using local fallback:', err);
      }
    }
    return getStored<QuizItem>(LS_QUIZZES, INITIAL_QUIZZES);
  },

  async getQuizzesForClass(kelas: string): Promise<QuizItem[]> {
    const quizzes = await this.getQuizzes();
    const cleanClass = (kelas || '').trim().toLowerCase();
    return quizzes.filter(
      (q) =>
        q.kelas === 'Semua Kelas' ||
        q.kelas === 'Semua' ||
        q.kelas.trim().toLowerCase() === cleanClass
    );
  },

  async getQuiz(id: string): Promise<QuizItem | null> {
    const quizzes = await this.getQuizzes();
    return quizzes.find((q) => q.id === id) || null;
  },

  async saveQuiz(quiz: QuizItem): Promise<void> {
    const cleanQuiz: any = {};
    for (const [key, value] of Object.entries(quiz)) {
      if (value !== undefined) {
        cleanQuiz[key] = value;
      }
    }

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'quizzes', quiz.id), cleanQuiz, { merge: true });
      } catch (err) {
        console.warn('Firestore saveQuiz error:', err);
      }
    }
    const all = getStored<QuizItem>(LS_QUIZZES, INITIAL_QUIZZES);
    const idx = all.findIndex((q) => q.id === quiz.id);
    if (idx >= 0) {
      all[idx] = cleanQuiz;
    } else {
      all.unshift(cleanQuiz);
    }
    setStored(LS_QUIZZES, all);
    notifySubscribers();
  },

  async toggleQuizStatus(id: string, status: 'buka' | 'kunci'): Promise<void> {
    const quiz = await this.getQuiz(id);
    if (!quiz) return;
    const updated: QuizItem = {
      ...quiz,
      status,
      updatedAt: new Date().toISOString()
    };
    await this.saveQuiz(updated);
  },

  async deleteQuiz(id: string): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'quizzes', id));
      } catch (err) {
        console.warn('Firestore deleteQuiz error:', err);
      }
    }
    const all = getStored<QuizItem>(LS_QUIZZES, INITIAL_QUIZZES);
    const filtered = all.filter((q) => q.id !== id);
    setStored(LS_QUIZZES, filtered);
    notifySubscribers();
  },

  // --- QUIZ SUBMISSIONS (Tracking pengerjaan murid) ---
  async getQuizSubmissions(quizId?: string): Promise<QuizSubmission[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'quiz_submissions'));
        if (!snap.empty) {
          const cloudSubs = snap.docs.map((d) => d.data() as QuizSubmission);
          try {
            localStorage.setItem(LS_QUIZ_SUBMISSIONS, JSON.stringify(cloudSubs));
          } catch {}
          if (quizId) return cloudSubs.filter((s) => s.quizId === quizId);
          return cloudSubs;
        }
      } catch (err) {
        console.warn('Firestore getQuizSubmissions error, using local:', err);
      }
    }
    const all = getStored<QuizSubmission>(LS_QUIZ_SUBMISSIONS, []);
    if (quizId) return all.filter((s) => s.quizId === quizId);
    return all;
  },

  async saveQuizSubmission(submission: QuizSubmission): Promise<void> {
    const cleanSub: any = {};
    for (const [key, value] of Object.entries(submission)) {
      if (value !== undefined) {
        cleanSub[key] = value;
      }
    }

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'quiz_submissions', submission.id), cleanSub, { merge: true });
      } catch (err) {
        console.warn('Firestore saveQuizSubmission error:', err);
      }
    }
    const all = getStored<QuizSubmission>(LS_QUIZ_SUBMISSIONS, []);
    const idx = all.findIndex((s) => s.id === submission.id);
    if (idx >= 0) {
      all[idx] = cleanSub;
    } else {
      all.unshift(cleanSub);
    }
    setStored(LS_QUIZ_SUBMISSIONS, all);
    notifySubscribers();
  },

  async resetToSeedData(): Promise<void> {
    this.resetToDefaults();
  },

  /**
   * Mengunggah seluruh data lokal (pengaturan, kelas, indikator, tugas, pengguna, kuis)
   * ke Firestore agar tersinkronisasi 100% antar laptop dan HP.
   */
  async syncAllLocalDataToCloud(): Promise<{ success: boolean; message: string }> {
    if (!isFirebaseConfigured() || !db) {
      return {
        success: false,
        message: 'Koneksi Firebase Cloud belum aktif di perangkat ini.'
      };
    }

    try {
      // 1. Sinkronkan Pengaturan Aplikasi & Logo
      const currentConfig = await this.getAppConfig();
      await setDoc(doc(db, 'settings', 'app_config'), currentConfig, { merge: true });

      // 2. Sinkronkan Pengguna / Murid & Guru
      const localUsers = getStored<UserProfile>(LS_USERS, INITIAL_USERS);
      for (const u of localUsers) {
        await setDoc(doc(db, 'pengguna', u.uid), u, { merge: true });
      }

      // 3. Sinkronkan Kelas
      const localClasses = getStored<ClassItem>(LS_CLASSES, INITIAL_CLASSES);
      for (const c of localClasses) {
        await setDoc(doc(db, 'classes', c.id), c, { merge: true });
      }

      // 4. Sinkronkan Indikator
      const localIndicators = getStored<IndicatorItem>(LS_INDICATORS, INITIAL_INDICATORS);
      for (const ind of localIndicators) {
        await setDoc(doc(db, 'indicators', ind.id), ind, { merge: true });
      }

      // 5. Sinkronkan Tugas
      const localTasks = getStored<AssessmentTask>(LS_TASKS, INITIAL_TASKS);
      for (const t of localTasks) {
        await setDoc(doc(db, 'tasks', t.id), t, { merge: true });
      }

      // 6. Sinkronkan Penilaian jika ada
      const localAssessments = getStored<AssessmentRecord>(LS_ASSESSMENTS, INITIAL_ASSESSMENTS);
      for (const a of localAssessments) {
        await setDoc(doc(db, 'assessments', a.id), a, { merge: true });
      }

      // 7. Sinkronkan Kuis
      const localQuizzes = getStored<QuizItem>(LS_QUIZZES, INITIAL_QUIZZES);
      for (const q of localQuizzes) {
        await setDoc(doc(db, 'quizzes', q.id), q, { merge: true });
      }

      notifySubscribers();
      return {
        success: true,
        message: 'Semua data (Logo, Pengaturan, Kelas, Siswa, Indikator, Tugas, & Kuis) berhasil disinkronkan ke Firebase Cloud. Sekarang laptop dan HP sinkron!'
      };
    } catch (error: any) {
      console.error('Error saat sinkronisasi ke cloud:', error);
      return {
        success: false,
        message: error?.message || 'Gagal menyinkronkan data ke cloud.'
      };
    }
  },

  async seedPenggunaToFirestoreIfEmpty(): Promise<void> {
    if (!isFirebaseConfigured() || !db) return;
    try {
      const snap = await getDocs(collection(db, 'pengguna'));
      if (snap.empty) {
        for (const user of INITIAL_USERS) {
          await setDoc(doc(db, 'pengguna', user.uid), user, { merge: true });
        }
      }
      // Pastikan app_config juga ada di Firestore
      const snapConfig = await getDoc(doc(db, 'settings', 'app_config'));
      if (!snapConfig.exists()) {
        const stored = localStorage.getItem(LS_APP_CONFIG);
        const cfg = stored ? JSON.parse(stored) : INITIAL_APP_CONFIG;
        await setDoc(doc(db, 'settings', 'app_config'), cfg, { merge: true });
      }
      // Pastikan initial kuis ada di Firestore jika kosong
      const snapQuiz = await getDocs(collection(db, 'quizzes'));
      if (snapQuiz.empty) {
        for (const q of INITIAL_QUIZZES) {
          await setDoc(doc(db, 'quizzes', q.id), q, { merge: true });
        }
      }
    } catch (e) {
      console.warn('seedPenggunaToFirestore notice:', e);
    }
  },

  // Reset database back to default seed data
  resetToDefaults() {
    localStorage.removeItem(LS_USERS);
    localStorage.removeItem(LS_CLASSES);
    localStorage.removeItem(LS_INDICATORS);
    localStorage.removeItem(LS_TASKS);
    localStorage.removeItem(LS_ASSESSMENTS);
    localStorage.removeItem(LS_APP_CONFIG);
    localStorage.removeItem(LS_QUIZZES);
    localStorage.removeItem(LS_QUIZ_SUBMISSIONS);
    localStorage.setItem(LS_USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(LS_CLASSES, JSON.stringify(INITIAL_CLASSES));
    localStorage.setItem(LS_INDICATORS, JSON.stringify(INITIAL_INDICATORS));
    localStorage.setItem(LS_TASKS, JSON.stringify(INITIAL_TASKS));
    localStorage.setItem(LS_ASSESSMENTS, JSON.stringify(INITIAL_ASSESSMENTS));
    localStorage.setItem(LS_APP_CONFIG, JSON.stringify(INITIAL_APP_CONFIG));
    localStorage.setItem(LS_QUIZZES, JSON.stringify(INITIAL_QUIZZES));
    localStorage.setItem(LS_QUIZ_SUBMISSIONS, JSON.stringify([]));
    notifySubscribers();
  }
};
