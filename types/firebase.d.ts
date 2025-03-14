declare module 'firebase/app' {
  export interface FirebaseApp {
    name: string;
    options: object;
  }
  
  export function initializeApp(options: object, name?: string): FirebaseApp;
}

declare module 'firebase/auth' {
  import { FirebaseApp } from 'firebase/app';
  
  export interface Auth {
    app: FirebaseApp;
    currentUser: User | null;
  }
  
  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    isAnonymous: boolean;
    metadata: {
      creationTime?: string;
      lastSignInTime?: string;
    };
    providerData: any[];
  }
  
  export interface UserCredential {
    user: User;
    providerId: string | null;
    operationType?: string;
  }
  
  export function getAuth(app?: FirebaseApp): Auth;
  export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function signOut(auth: Auth): Promise<void>;
  export function sendPasswordResetEmail(auth: Auth, email: string): Promise<void>;
  export function onAuthStateChanged(auth: Auth, nextOrObserver: (user: User | null) => void, error?: (error: Error) => void): () => void;
  export function updateProfile(user: User, profile: { displayName?: string; photoURL?: string }): Promise<void>;
}

declare module 'firebase/firestore' {
  import { FirebaseApp } from 'firebase/app';
  
  export class Timestamp {
    seconds: number;
    nanoseconds: number;
    constructor(seconds: number, nanoseconds: number);
    toDate(): Date;
    toMillis(): number;
    static now(): Timestamp;
    static fromDate(date: Date): Timestamp;
    static fromMillis(milliseconds: number): Timestamp;
  }
  
  export interface DocumentData {
    [field: string]: any;
  }
  
  export interface QueryDocumentSnapshot<T = DocumentData> {
    id: string;
    exists(): boolean;
    data(): T;
  }
  
  export interface QuerySnapshot<T = DocumentData> {
    docs: QueryDocumentSnapshot<T>[];
    empty: boolean;
    size: number;
    forEach(callback: (result: QueryDocumentSnapshot<T>) => void): void;
  }
  
  export interface DocumentReference<T = DocumentData> {
    id: string;
    path: string;
  }
  
  export interface CollectionReference<T = DocumentData> {
    id: string;
    path: string;
  }
  
  export interface Query<T = DocumentData> {
    where(fieldPath: string, opStr: string, value: any): Query<T>;
    orderBy(fieldPath: string, directionStr?: 'asc' | 'desc'): Query<T>;
    limit(limit: number): Query<T>;
  }
  
  export function getFirestore(app?: FirebaseApp): any;
  export function collection(firestore: any, path: string): CollectionReference;
  export function doc(firestore: any, path: string, ...pathSegments: string[]): DocumentReference;
  export function setDoc(reference: DocumentReference, data: any): Promise<void>;
  export function getDoc(reference: DocumentReference): Promise<any>;
  export function updateDoc(reference: DocumentReference, data: any): Promise<void>;
  export function getDocs(query: Query): Promise<QuerySnapshot>;
  export function query(collection: CollectionReference, ...queryConstraints: any[]): Query;
  export function where(fieldPath: string, opStr: string, value: any): any;
  export function orderBy(fieldPath: string, directionStr?: 'asc' | 'desc'): any;
  export function limit(limit: number): any;
  export function increment(n: number): any;
  export function arrayUnion(...elements: any[]): any;
}

declare module 'firebase/storage' {
  import { FirebaseApp } from 'firebase/app';
  
  export interface StorageReference {
    bucket: string;
    fullPath: string;
    name: string;
  }
  
  export function getStorage(app?: FirebaseApp): any;
  export function ref(storage: any, path?: string): StorageReference;
  export function uploadBytes(ref: StorageReference, data: Blob | Uint8Array | ArrayBuffer): Promise<any>;
  export function getDownloadURL(ref: StorageReference): Promise<string>;
}

declare module 'firebase/analytics' {
  import { FirebaseApp } from 'firebase/app';
  
  export interface Analytics {
    app: FirebaseApp;
  }
  
  export function getAnalytics(app?: FirebaseApp): Analytics;
  export function logEvent(analytics: Analytics, eventName: string, eventParams?: Record<string, any>): void;
}