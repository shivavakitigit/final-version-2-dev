import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import { toast } from "sonner-native";

// Import real Firebase instead of mock
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  increment,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAnalytics, logEvent } from "firebase/analytics";

import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyB-Mz8nPVqfm8n9_XlLSqU7IfozsstNrLg",
  authDomain: "devgnan-referral.firebaseapp.com",
  projectId: "devgnan-referral",
  storageBucket: "devgnan-referral.firebasestorage.app",
  messagingSenderId: "220304207566",
  appId: "1:220304207566:web:105c600291fdb6b01c6a9f",
  measurementId: "G-YY1SE6XBHB",
};

// Initialize real Firebase
console.log("Initializing Firebase");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Analytics only works on web and certain platforms
let analytics = null;
if (Platform.OS === "web") {
  analytics = getAnalytics(app);
}

export { auth, db, storage, analytics };

// User types
export const USER_TYPES = {
  STUDENT: "student",
  PROFESSIONAL: "professional",
};

const AuthContext = createContext({
  user: null,
  userProfile: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updateUserProfile: async (data: {
    userType?: string;
    displayName?: string;
    role?: string;
    company?: string;
  }) => {},

  uploadProfileImage: async (uri: string) => "",
  createReferral: async (
    referralEmail: string,
    referralName: string,
    referralJobType: string
  ) => "",
  getReferrals: async () => [],
  trackEvent: (eventName: string, eventParams?: any) => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track a custom event with Firebase Analytics
  const trackEvent = (eventName, eventParams) => {
    if (analytics) {
      logEvent(analytics, eventName, eventParams);
    }
  };

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    if (!uid) {
      console.error("Attempted to fetch profile with undefined UID");
      return null;
    }
  
    try {      
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Ensure uid is always included in the profile
        const completeUserData = {
          ...userData,
          uid: uid  // Explicitly set the UID
        };
        
        setUserProfile(completeUserData);
        return completeUserData;
      } else {
        console.warn(`No user profile found for UID: ${uid}`);
        setUserProfile(null);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching user profile for UID ${uid}:`, error);
      setUserProfile(null);
      return null;
    }
  };
  useEffect(() => {
    let unsubscribe = () => {};

    // Monitor authentication state
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (currentUser) => {
          console.log("Auth state changed:", currentUser);

          // Log more detailed information about the current user
          if (currentUser) {
            console.log("Current User Details:", {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
            });
          }

          setUser(currentUser);

          if (currentUser) {
            try {
              trackEvent("login", { method: "auto" });
              const profileData = await fetchUserProfile(currentUser.uid);

              // Additional logging for profile data
              console.log("Fetched User Profile:", profileData);
            } catch (profileError) {
              console.error("Error fetching user profile:", profileError);
              // Ensure user profile is set to null if fetching fails
              setUserProfile(null);
            }
          } else {
            setUserProfile(null);
          }

          setIsLoading(false);
        },
        (error) => {
          console.error("Auth state error:", error);
          setUser(null);
          setUserProfile(null);
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error("Auth state monitoring failed:", error);
      setUser(null);
      setUserProfile(null);
      setIsLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Generate a unique referral code
  const generateReferralCode = (name) => {
    const prefix = "DEVGNAN";
    const namePrefix = name ? name.substring(0, 3).toUpperCase() : "";
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${namePrefix}${randomPart}`;
  };

  const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));

      trackEvent("login_success", { method: "email" });
      toast.success("Successfully logged in");

      // Fetch user profile after login
      await fetchUserProfile(userCredential.user.uid);
    } catch (error) {
      trackEvent("login_error", { error: error.message });
      toast.error("Login failed: " + error.message);
      throw error;
    }
  };

  const signUp = async (email, password, userType, additionalData = {}) => {
    if (!Object.values(USER_TYPES).includes(userType)) {
      throw new Error("Invalid user type");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Generate a referral code
      const referralCode = generateReferralCode(email.split("@")[0]);

      // Create base user profile
      const baseProfile = {
        uid: user.uid,
        email: user.email || email,
        userType: userType,
        createdAt: Timestamp.now(),
        referralCode,
        referralsGenerated: 0,
        activeReferrals: 0,
        successfulReferrals: 0,
        totalRewards: 0,
        displayName: additionalData.displayName || "",
        photoURL: additionalData.photoURL || "",
      };

      // Add type-specific fields based on user type
      const userProfile = { ...baseProfile };

      if (userType === USER_TYPES.STUDENT) {
        // Add student-specific fields
        userProfile.institution = additionalData.institution || "";
        userProfile.major = additionalData.major || "";
        userProfile.graduationYear = additionalData.graduationYear || "";
        userProfile.studentId = additionalData.studentId || "";
        userProfile.currentSemester = additionalData.currentSemester || "";
      } else if (userType === USER_TYPES.PROFESSIONAL) {
        // Add professional-specific fields
        userProfile.company = additionalData.company || "";
        userProfile.jobTitle = additionalData.jobTitle || "";
        userProfile.experience = additionalData.experience || "";
        userProfile.skills = additionalData.skills || [];
        userProfile.industry = additionalData.industry || "";
      }

      // Save to Firestore
      await setDoc(doc(db, "users", user.uid), userProfile);
      setUserProfile(userProfile);

      // Update display name in auth profile if provided
      if (additionalData.displayName) {
        await updateProfile(user, {
          displayName: additionalData.displayName,
          photoURL: additionalData.photoURL || "",
        });
      }

      trackEvent("sign_up", { method: "email", user_type: userType });
      toast.success("Account created successfully");
    } catch (error) {
      trackEvent("sign_up_error", { error: error.message });
      toast.error("Signup failed: " + error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      trackEvent("logout");
      await firebaseSignOut(auth);
      setUserProfile(null);
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Logout failed: " + error.message);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      trackEvent("password_reset_email_sent");
      toast.success("Password reset email sent");
    } catch (error) {
      trackEvent("password_reset_error", { error: error.message });
      toast.error("Password reset failed: " + error.message);
      throw error;
    }
  };

  // Update user profile in Firestore
  const updateUserProfile = async (data) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, data);

      // Update local state
      setUserProfile((prev) => (prev ? { ...prev, ...data } : null));

      // Update auth profile if displayName or photoURL changes
      if (data.displayName || data.photoURL) {
        await updateProfile(user, {
          displayName: data.displayName || user.displayName,
          photoURL: data.photoURL || user.photoURL,
        });
      }

      trackEvent("profile_updated");
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Profile update failed: " + error.message);
      throw error;
    }
  };

  // Upload profile image to Firebase Storage
  const uploadProfileImage = async (uri) => {
    if (!user) throw new Error("User not authenticated");

    try {
      // Convert URI to Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create a storage reference
      const storageRef = ref(
        storage,
        `profile_images/${user.uid}_${Date.now()}.jpg`
      );

      // Upload the image
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update user profile with new image URL
      await updateUserProfile({ photoURL: downloadURL });

      trackEvent("profile_image_uploaded");
      return downloadURL;
    } catch (error) {
      toast.error("Image upload failed: " + error.message);
      throw error;
    }
  };

  // Create a new referral
  const createReferral = async (refereeEmail, refereeName, jobType) => {
    if (!user || !userProfile) throw new Error("User not authenticated");

    try {
      // Create referral document
      const referralsCollection = collection(db, "referrals");
      const referralId = `${user.uid}_${Date.now()}`;
      const referralData = {
        id: referralId,
        referrerId: user.uid,
        referrerType: userProfile.userType, // Include referrer type
        refereeEmail,
        refereeName,
        jobType,
        status: "pending",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(db, "referrals", referralId), referralData);

      // Update user's referral stats
      await updateDoc(doc(db, "users", user.uid), {
        referralsGenerated: increment(1),
      });

      // Update local state
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              referralsGenerated: (prev.referralsGenerated || 0) + 1,
            }
          : null
      );

      trackEvent("referral_created", {
        job_type: jobType,
        user_type: userProfile.userType,
      });

      toast.success("Referral created successfully");
      return referralId;
    } catch (error) {
      toast.error("Referral creation failed: " + error.message);
      throw error;
    }
  };

  // Get all referrals created by the user
  const getReferrals = async () => {
    if (!user) throw new Error("User not authenticated");

    try {
      const referralsQuery = query(
        collection(db, "referrals"),
        where("referrerId", "==", user.uid)
      );

      const querySnapshot = await getDocs(referralsQuery);
      const referrals = [];

      querySnapshot.forEach((doc) => {
        referrals.push(doc.data());
      });

      // Sort by created date (newest first)
      return referrals.sort(
        (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
      );
    } catch (error) {
      toast.error("Failed to fetch referrals: " + error.message);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
    uploadProfileImage,
    createReferral,
    getReferrals,
    trackEvent,
    USER_TYPES,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
