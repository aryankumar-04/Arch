import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { useSettingsStore } from './useSettingsStore';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';

const HOBBY_OPTIONS = [
  'Coding',
  'Fitness',
  'Reading',
  'Movies',
  'Travel',
  'Gaming',
  'Finance',
  'Music',
  'AI',
  'Technology'
];

const REFERRAL_OPTIONS = [
  'GitHub',
  'LinkedIn',
  'Friend',
  'Google Search',
  'YouTube',
  'Other'
];

export const useOnboardingStore = create((set, get) => ({
  isOpen: false,
  hasCompletedOnboarding: false,
  step: 1,
  displayName: '',
  hobbies: [],
  referralSource: '',
  loading: false,

  hobbyOptions: HOBBY_OPTIONS,
  referralOptions: REFERRAL_OPTIONS,

  checkOnboardingStatus: async (user) => {
    if (!user || user.uid === 'guest' || user.uid === 'guest_user') {
      set({ isOpen: false, hasCompletedOnboarding: true, loading: false });
      return;
    }

    set({ loading: true });

    // 1. Fast local cache check
    const localProfile = getLocalUserBackup('profile', user.uid, null) || getLocalUserBackup('onboarding', user.uid, null);
    if (localProfile && localProfile.hasCompletedOnboarding) {
      set({
        hasCompletedOnboarding: true,
        isOpen: false,
        displayName: localProfile.displayName || '',
        hobbies: localProfile.hobbies || [],
        referralSource: localProfile.referralSource || '',
        loading: false
      });
      return;
    }

    // 2. Fetch from Firestore if local cache missing or incomplete
    try {
      // Check root user doc
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      // Check subcollection profile doc
      const profileRef = doc(db, 'users', user.uid, 'profile', 'info');
      const profileSnap = await getDoc(profileRef);

      const userData = userSnap.exists() ? userSnap.data() : null;
      const profileData = profileSnap.exists() ? profileSnap.data() : null;

      const isCompleted = Boolean(
        userData?.hasCompletedOnboarding || profileData?.hasCompletedOnboarding
      );

      if (isCompleted) {
        const merged = {
          hasCompletedOnboarding: true,
          displayName: profileData?.displayName || userData?.displayName || user.displayName || '',
          hobbies: profileData?.hobbies || [],
          referralSource: profileData?.referralSource || '',
          createdAt: profileData?.createdAt || new Date().toISOString()
        };

        saveLocalUserBackup('profile', user.uid, merged);
        saveLocalUserBackup('onboarding', user.uid, merged);

        set({
          hasCompletedOnboarding: true,
          isOpen: false,
          displayName: merged.displayName,
          hobbies: merged.hobbies,
          referralSource: merged.referralSource,
          loading: false
        });
      } else {
        // First time user or has completed onboarding is false
        set({
          hasCompletedOnboarding: false,
          isOpen: true,
          displayName: user.displayName || user.email?.split('@')[0] || '',
          loading: false
        });
      }
    } catch (err) {
      console.error('Failed to check onboarding status:', err);
      set({ loading: false });
    }
  },

  setDisplayName: (displayName) => set({ displayName }),

  toggleHobby: (hobby) => {
    const current = get().hobbies;
    if (current.includes(hobby)) {
      set({ hobbies: current.filter((h) => h !== hobby) });
    } else {
      set({ hobbies: [...current, hobby] });
    }
  },

  setReferralSource: (referralSource) => set({ referralSource }),

  setStep: (step) => set({ step }),

  nextStep: () => {
    const currentStep = get().step;
    if (currentStep < 3) {
      set({ step: currentStep + 1 });
    }
  },

  prevStep: () => {
    const currentStep = get().step;
    if (currentStep > 1) {
      set({ step: currentStep - 1 });
    }
  },

  submitOnboarding: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { displayName, hobbies, referralSource } = get();

    const profileData = {
      displayName: displayName.trim() || user.displayName || user.email?.split('@')[0] || 'Commander',
      hobbies: hobbies || [],
      referralSource: referralSource || 'Other',
      hasCompletedOnboarding: true,
      createdAt: new Date().toISOString()
    };

    // 1. Immediately cache locally for fast startup
    saveLocalUserBackup('profile', user.uid, profileData);
    saveLocalUserBackup('onboarding', user.uid, profileData);

    // Also update settings store username
    try {
      if (profileData.displayName) {
        useSettingsStore.getState().setUsername(profileData.displayName);
      }
    } catch (e) {
      console.warn('Could not update username in settings store:', e);
    }

    set({
      hasCompletedOnboarding: true,
      isOpen: false
    });

    // 2. Persist to Firestore
    if (user.uid !== 'guest' && user.uid !== 'guest_user') {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { hasCompletedOnboarding: true, displayName: profileData.displayName }, { merge: true });

        const profileRef = doc(db, 'users', user.uid, 'profile', 'info');
        await setDoc(profileRef, profileData, { merge: true });
      } catch (fbErr) {
        console.error('Failed to save onboarding data to Firestore:', fbErr);
      }
    }
  }
}));
