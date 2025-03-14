// This file provides mock implementations of Firebase services
// for environments where Firebase isn't directly available

// Firestore Timestamp mock
export class Timestamp {
  constructor(seconds, nanoseconds = 0) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  toDate() {
    return new Date(this.seconds * 1000);
  }

  toMillis() {
    return this.seconds * 1000;
  }

  static now() {
    return new Timestamp(Math.floor(Date.now() / 1000));
  }

  static fromDate(date) {
    return new Timestamp(Math.floor(date.getTime() / 1000));
  }
}

// Mock Firebase Auth
export const auth = {
  currentUser: null,
  signInWithEmailAndPassword: async (email, password) => {
    // Simulate authentication
    const mockUser = {
      uid: 'mock-uid-' + Math.random().toString(36).substring(2, 9),
      email: email,
      displayName: email.split('@')[0],
      photoURL: null,
      emailVerified: true,
    };
    auth.currentUser = mockUser;
    return { user: mockUser };
  },
  createUserWithEmailAndPassword: async (email, password) => {
    // Simulate user creation
    const mockUser = {
      uid: 'mock-uid-' + Math.random().toString(36).substring(2, 9),
      email: email,
      displayName: email.split('@')[0],
      photoURL: null,
      emailVerified: false,
    };
    auth.currentUser = mockUser;
    return { user: mockUser };
  },
  signOut: async () => {
    auth.currentUser = null;
  },
  sendPasswordResetEmail: async (email) => {
    // Simulate sending password reset email
    console.log(`Mock: Password reset email sent to ${email}`);
  },
  onAuthStateChanged: (callback) => {
    // Immediately call with current user
    callback(auth.currentUser);
    
    // Return unsubscribe function
    return () => {};
  },
  updateProfile: async (user, profile) => {
    if (auth.currentUser && auth.currentUser.uid === user.uid) {
      if (profile.displayName) auth.currentUser.displayName = profile.displayName;
      if (profile.photoURL) auth.currentUser.photoURL = profile.photoURL;
    }
  }
};

// Mock data store
const mockDatabase = { users: {}, referrals: {} };

// Mock Firestore
export const db = {
  collection: (collectionPath) => ({
    doc: (docId) => ({
      id: docId,
      set: async (data) => {
        if (!mockDatabase[collectionPath]) mockDatabase[collectionPath] = {};
        mockDatabase[collectionPath][docId] = { ...data };
      },
      update: async (data) => {
        if (!mockDatabase[collectionPath]) mockDatabase[collectionPath] = {};
        if (!mockDatabase[collectionPath][docId]) mockDatabase[collectionPath][docId] = {};
        mockDatabase[collectionPath][docId] = { 
          ...mockDatabase[collectionPath][docId], 
          ...data 
        };
      },
      get: async () => ({
        exists: mockDatabase[collectionPath] && mockDatabase[collectionPath][docId] ? true : false,
        data: () => mockDatabase[collectionPath] && mockDatabase[collectionPath][docId] ? 
          { ...mockDatabase[collectionPath][docId] } : null,
      }),
    }),
    where: () => ({
      get: async () => ({
        docs: Object.entries(mockDatabase[collectionPath] || {}).map(([id, data]) => ({
          id,
          data: () => ({ ...data }),
        })),
        forEach: (callback) => {
          Object.entries(mockDatabase[collectionPath] || {}).forEach(([id, data]) => {
            callback({
              id,
              data: () => ({ ...data }),
            });
          });
        }
      }),
    }),
  }),
  doc: (collectionPath, docId) => ({
    id: docId,
    set: async (data) => {
      if (!mockDatabase[collectionPath]) mockDatabase[collectionPath] = {};
      mockDatabase[collectionPath][docId] = { ...data };
    },
    update: async (data) => {
      if (!mockDatabase[collectionPath]) mockDatabase[collectionPath] = {};
      if (!mockDatabase[collectionPath][docId]) mockDatabase[collectionPath][docId] = {};
      mockDatabase[collectionPath][docId] = { 
        ...mockDatabase[collectionPath][docId], 
        ...data 
      };
    },
    get: async () => ({
      exists: mockDatabase[collectionPath] && mockDatabase[collectionPath][docId] ? true : false,
      data: () => mockDatabase[collectionPath] && mockDatabase[collectionPath][docId] ? 
        { ...mockDatabase[collectionPath][docId] } : null,
    }),
  }),
};

// Mock Firebase Storage
export const storage = {
  ref: (path) => ({
    put: async (file) => ({ ref: { getDownloadURL: async () => `https://mock-storage.com/${path}` } }),
    putString: async (data) => ({ ref: { getDownloadURL: async () => `https://mock-storage.com/${path}` } }),
    getDownloadURL: async () => `https://mock-storage.com/${path}`,
  }),
};

// Mock Firebase Analytics
export const analytics = {
  logEvent: (eventName, eventParams) => {
    console.log(`Mock Analytics: ${eventName}`, eventParams);
  },
};

// Helper functions
export function getAuth() {
  return auth;
}

export function getFirestore() {
  return db;
}

export function getStorage() {
  return storage;
}

export function getAnalytics() {
  return analytics;
}

// Mock Firestore helper methods
export function setDoc(docRef, data) {
  return docRef.set(data);
}

export function updateDoc(docRef, data) {
  return docRef.update(data);
}

export function getDoc(docRef) {
  return docRef.get();
}

export function collection(db, path) {
  return db.collection(path);
}

export function doc(db, path, id) {
  return id ? db.doc(path, id) : db.doc(path);
}

export function query(collectionRef) {
  return collectionRef;
}

export function where() {
  return {};
}

export function getDocs(query) {
  return query.get();
}

export function increment(n) {
  return { __increment: n };
}

export function arrayUnion(...items) {
  return { __arrayUnion: items };
}

// Mock Firebase Storage helper methods
export function ref(storage, path) {
  return storage.ref(path);
}

export function uploadBytes(ref, data) {
  return ref.put(data);
}

export function getDownloadURL(ref) {
  return ref.getDownloadURL();
}

// Mock Firebase Analytics helper methods
export function logEvent(analytics, eventName, eventParams) {
  return analytics.logEvent(eventName, eventParams);
}

// Initialize Mock Firebase
export function initializeApp(config) {
  console.log('Mock Firebase initialized with config:', config);
  return { name: 'mock-app' };
}

export function signInWithEmailAndPassword(auth, email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

export function createUserWithEmailAndPassword(auth, email, password) {
  return auth.createUserWithEmailAndPassword(email, password);
}

export function signOut(auth) {
  return auth.signOut();
}

export function sendPasswordResetEmail(auth, email) {
  return auth.sendPasswordResetEmail(email);
}

export function onAuthStateChanged(auth, callback, errorCallback) {
  return auth.onAuthStateChanged(callback, errorCallback);
}

export function updateProfile(user, profile) {
  return auth.updateProfile(user, profile);
}