import {
  UserProfile,
  ClassItem,
  IndicatorItem,
  AssessmentTask,
  AssessmentRecord,
  AppConfig
} from '../types';
import {
  INITIAL_CLASSES,
  INITIAL_USERS,
  INITIAL_INDICATORS,
  INITIAL_TASKS,
  INITIAL_ASSESSMENTS,
  INITIAL_APP_CONFIG
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
  where
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';

// Local storage keys for hybrid/offline mode
const LS_USERS = 'pjok_data_users';
const LS_CLASSES = 'pjok_data_classes';
const LS_INDICATORS = 'pjok_data_indicators';
const LS_TASKS = 'pjok_data_tasks';
const LS_ASSESSMENTS = 'pjok_data_assessments';
const LS_APP_CONFIG = 'pjok_data_app_config';

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
          return snapPengguna.docs.map((d) => d.data() as UserProfile);
        }
        const snap = await getDocs(collection(db, 'users'));
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as UserProfile);
        }
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
          return snap.docs.map((d) => d.data() as ClassItem);
        }
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
          return snap.docs
            .map((d) => d.data() as IndicatorItem)
            .sort((a, b) => a.urutan - b.urutan);
        }
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
          return snap.docs.map((d) => d.data() as AssessmentTask);
        }
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
          return snap.docs.map((d) => d.data() as AssessmentRecord);
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
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'assessments', record.id), record, { merge: true });
      } catch (err) {
        console.warn('Firestore saveAssessment error:', err);
      }
    }
    const all = getStored<AssessmentRecord>(LS_ASSESSMENTS, INITIAL_ASSESSMENTS);
    const idx = all.findIndex((a) => a.id === record.id);
    if (idx >= 0) {
      all[idx] = record;
    } else {
      all.push(record);
    }
    setStored(LS_ASSESSMENTS, all);
  },

  // --- EVIDENCE UPLOAD (Firebase Storage with local fallback) ---
  async uploadEvidence(
    file: File,
    taskId: string,
    assessorId: string
  ): Promise<{ url: string; path: string }> {
    const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = `assessment-evidence/${taskId}/${assessorId}/${safeFileName}`;

    if (isFirebaseConfigured() && storage) {
      try {
        const fileRef = storageRef(storage, storagePath);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        return { url: downloadUrl, path: storagePath };
      } catch (err) {
        console.warn('Firebase storage upload failed, using local object URL fallback:', err);
      }
    }

    // Local / offline fallback: Create object URL or Base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          url: reader.result as string,
          path: storagePath
        });
      };
      reader.readAsDataURL(file);
    });
  },

  async uploadMedia(file: File, path?: string): Promise<{ url: string; path: string }> {
    return this.uploadEvidence(file, path || 'assessments', 'upload');
  },

  // --- APP CONFIG & LOGO ---
  async getAppConfig(): Promise<AppConfig> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDoc(doc(db, 'settings', 'app_config'));
        if (snap.exists()) {
          return { ...INITIAL_APP_CONFIG, ...(snap.data() as AppConfig) };
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

  async resetToSeedData(): Promise<void> {
    this.resetToDefaults();
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
    localStorage.setItem(LS_USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(LS_CLASSES, JSON.stringify(INITIAL_CLASSES));
    localStorage.setItem(LS_INDICATORS, JSON.stringify(INITIAL_INDICATORS));
    localStorage.setItem(LS_TASKS, JSON.stringify(INITIAL_TASKS));
    localStorage.setItem(LS_ASSESSMENTS, JSON.stringify(INITIAL_ASSESSMENTS));
    localStorage.setItem(LS_APP_CONFIG, JSON.stringify(INITIAL_APP_CONFIG));
    notifySubscribers();
  }
};
