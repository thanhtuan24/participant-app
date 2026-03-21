import { AppError } from "@dts";
import debounce from "lodash.debounce";
import { StateCreator } from "zustand";
import { getAppConfig } from "@service/services"; // Import service lấy config

// 1. Mở rộng interface để chứa state của title
export interface AppSlice {
  error?: AppError;
  setError: (error?: AppError) => void;

  mainTitle: string; // State để lưu title
  configStatus: 'idle' | 'loading' | 'succeeded' | 'failed'; // State để theo dõi trạng thái API
  fetchAppConfig: () => Promise<void>; // Action để gọi API
}

const appSlice: StateCreator<AppSlice, [], [], AppSlice> = (set, get) => ({
  // --- Phần code cũ của bạn ---
  error: undefined,
  setError: (error?: AppError) => {
    set({ error });
    // Gọi hàm debounce ngay lập tức
    debounce(() => {
      if (get().error) {
        set({ error: undefined });
      }
    }, 5000)();
  },

  mainTitle: 'Sân Cầu Lông G7', // Title mặc định
  configStatus: 'idle',
  
  // Action để fetch title từ API
  fetchAppConfig: async () => {
    // Không gọi lại API nếu đang trong quá trình tải
    if (get().configStatus === 'loading') {
      return;
    }

    set({ configStatus: 'loading' });
    try {
      const configData = await getAppConfig();
      // Khi thành công, cập nhật state với title mới
      set({ mainTitle: configData.mainTitle, configStatus: 'succeeded' });
    } catch (error) {
      console.error("Lỗi khi fetch app config:", error);
      set({ configStatus: 'failed' });
    }
  },
});

export default appSlice;