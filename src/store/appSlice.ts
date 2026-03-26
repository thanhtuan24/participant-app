import { AppError } from "@dts";
import debounce from "lodash.debounce";
import { StateCreator } from "zustand";
import { getAppConfig, checkMemberAccess } from "@service/services";

export interface AppSlice {
  error?: AppError;
  setError: (error?: AppError) => void;

  mainTitle: string;
  enableRichFeatures: boolean;
  configStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  fetchAppConfig: () => Promise<void>;

  isAuthorizedMember: boolean | null; // null = chưa kiểm tra, true/false = kết quả
  checkingMember: boolean;
  checkMemberAccess: (userID: string) => Promise<void>;
}

const appSlice: StateCreator<AppSlice, [], [], AppSlice> = (set, get) => ({
  error: undefined,
  setError: (error?: AppError) => {
    set({ error });
    debounce(() => {
      if (get().error) {
        set({ error: undefined });
      }
    }, 5000)();
  },

  mainTitle: 'Sân Cầu Lông G7',
  enableRichFeatures: false,
  configStatus: 'idle',
  
  fetchAppConfig: async () => {
    if (get().configStatus === 'loading') {
      return;
    }

    set({ configStatus: 'loading' });
    try {
      const configData = await getAppConfig();
      set({ 
        mainTitle: configData.mainTitle, 
        enableRichFeatures: !!configData.enableRichFeatures,
        configStatus: 'succeeded' 
      });
    } catch (error) {
      console.error("Lỗi khi fetch app config:", error);
      set({ configStatus: 'failed' });
    }
  },

  isAuthorizedMember: null,
  checkingMember: false,

  checkMemberAccess: async (userID: string) => {
    if (get().checkingMember) return;
    set({ checkingMember: true });
    try {
      const isMember = await checkMemberAccess(userID);
      set({ isAuthorizedMember: isMember, checkingMember: false });
    } catch (error) {
      console.error("Lỗi khi kiểm tra quyền thành viên:", error);
      set({ isAuthorizedMember: false, checkingMember: false });
    }
  },
});

export default appSlice;