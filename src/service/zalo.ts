import {
    getUserInfo,
    getUserID,
    getSetting,
    authorize,
    openPermissionSetting,
    getAccessToken,
    followOA,
    openWebview,
} from "zmp-sdk/apis";
import { User } from "@dts";
import { openMediaPicker, saveImageToGallery } from "zmp-sdk";
import { ImageType } from "zmp-ui/image-viewer";

// Lấy name/avatar từ getUserInfo, trả về { name, avatar, idByOA }
const fetchUserInfoFields = async (): Promise<Pick<User, "name" | "avatar" | "idByOA">> => {
    const { userInfo } = await getUserInfo({ avatarType: "large", autoRequestPermission: true });
    console.log("[getZaloUserInfo] raw userInfo:", JSON.stringify(userInfo));
    return {
        name: userInfo.name ?? "",
        avatar: userInfo.avatar ?? "",
        idByOA: userInfo.idByOA,
    };
};

export const getZaloUserInfo = async (): Promise<User> => {
    // getUserID không cần permission, luôn trả về id
    const id = await getUserID();

    let name = "";
    let avatar = "";
    let idByOA: string | undefined;

    try {
        ({ name, avatar, idByOA } = await fetchUserInfoFields());
    } catch (err: any) {
        const code = err?.code;
        console.log(`[getZaloUserInfo] getUserInfo lỗi code=${code}:`, err?.message);

        if (code === -1401) {
            // Chưa cấp quyền → gọi authorize rồi retry
            console.log("[getZaloUserInfo] -1401: Yêu cầu cấp quyền scope.userInfo...");
            try {
                await authorize({ scopes: ["scope.userInfo"] });
                ({ name, avatar, idByOA } = await fetchUserInfoFields());
            } catch (authErr: any) {
                console.log("[getZaloUserInfo] authorize ERR:", authErr?.code, authErr?.message);
                if (authErr?.code === -2002 || authErr?.code === -202) {
                    // User từ chối → mở màn hình cài đặt quyền
                    await openPermissionSetting();
                }
            }
        } else if (code === -2002 || code === -202) {
            // User từ chối (lần đầu hoặc vĩnh viễn) → mở cài đặt
            console.log("[getZaloUserInfo] User từ chối quyền, mở cài đặt...");
            await openPermissionSetting();
        } else if (code === -1403) {
            // App chưa được cấp quyền ở cấp OA Management → không fix được trong code
            console.error("[getZaloUserInfo] -1403: App chưa được cấp quyền. Cần cấu hình trong Zalo OA Management.");
        } else if (code === -1404) {
            console.warn("[getZaloUserInfo] -1404: Zalo chưa hỗ trợ API này, yêu cầu user cập nhật Zalo.");
        }
    }

    // Nếu name vẫn rỗng sau tất cả → kiểm tra setting xem scope đã được grant chưa
    if (!name) {
        try {
            const settings = await getSetting();
            const granted = settings.authSetting["scope.userInfo"];
            console.log(`[getZaloUserInfo] scope.userInfo granted=${granted}, name vẫn rỗng sau khi đã xử lý`);
            if (granted) {
                // Đã có quyền nhưng name rỗng → thử lấy lại lần cuối
                ({ name, avatar, idByOA } = await fetchUserInfoFields());
            }
        } catch {
            // ignore
        }
    }

    return { id, name, avatar, idByOA };
};

export const getToken = async (): Promise<string> => {
    try {
        // "ACCESS_TOKEN" for development, remove it before deploy
        const token = (await getAccessToken({})) || "ACCESS_TOKEN";
        return Promise.resolve(token);
    } catch (err) {
        return Promise.reject(err);
    }
};

export const followOfficialAccount = async ({
    id,
}: {
    id: string;
}): Promise<void> => {
    try {
        await followOA({ id });
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
};

export const openWebView = async (link: string): Promise<void> => {
    try {
        await openWebview({ url: link });
        return Promise.resolve();
    } catch (err) {
        throw err;
    }
};

export const saveImage = async (img: string): Promise<void> => {
    try {
        await saveImageToGallery({ imageBase64Data: img });
        return Promise.resolve();
    } catch (err) {
        throw err;
    }
};

export interface PickImageParams {
    maxItemSize?: number;
    maxSelectItem?: number;
    serverUploadUrl: string;
}

export interface UploadImageResponse {
    domain: string;
    images: string[];
}

export const pickImages = async (
    params: PickImageParams,
): Promise<(ImageType & { name: string })[]> => {
    try {
        const res = await openMediaPicker({
            type: "photo",
            maxItemSize: params.maxItemSize || 1024 * 1024,
            maxSelectItem: params.maxSelectItem || 1,
            serverUploadUrl: params.serverUploadUrl,
        });
        const { data } = res;
        const result = JSON.parse(data);
        const { domain, images } = result.data as UploadImageResponse;
        const uploadedImgUrls = images.map(img => ({
            src: domain + img,
            name: img,
        }));
        return uploadedImgUrls;
    } catch (err) {
        return Promise.reject(err);
    }
};
