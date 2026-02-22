import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  saveAddress: boolean;
  address: {
    street: string;
    building: string;
    city: string;
    region: string;
  };
}

interface ProfileState {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  updateField: (field: keyof UserProfile, value: string | boolean) => void;
}

const defaultProfile: UserProfile = {
  name: '',
  email: '',
  phone: '',
  saveAddress: false,
  address: {
    street: '',
    building: '',
    city: '',
    region: '',
  },
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      setProfile: (profile) => set({ profile }),
      updateField: (field, value) =>
        set((state) => ({ profile: { ...state.profile, [field]: value } })),
    }),
    { name: 'skmei-profile' }
  )
);
