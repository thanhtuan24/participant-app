# Hướng Dẫn Sử Dụng Discord Alert EA (Version 2.0)

EA này cung cấp tính năng cảnh báo giá qua **Discord** (hỗ trợ TTS, Mention) và **Mobile Push Notification** khi:
1.  Giá đi vào một vùng cố định (Zone).
2.  Giá chạm vào đường Trendline bạn vẽ.

## 1. Cài Đặt (Như phiên bản trước)
*   Copy `DiscordAlertEA.mq5` vào thư mục `Experts`.
*   Cấp quyền WebRequest cho `https://discord.com` trong **Tools -> Options -> Expert Advisors**.
*   **MỚI:** Để nhận thông báo điện thoại, vào **Tools -> Options -> Notifications**, tích vào **Enable Push Notifications** và nhập **MetaQuotes ID** (lấy trong App MT5 trên điện thoại: Settings -> Chat and Messages).

## 2. Các Tính Năng Mới và Input

### Group: Discord Settings
*   **DiscordWebhookUrl**: Link Webhook Discord của bạn.
*   **DiscordMention**: Chọn chế độ tag tên:
    *   `None`: Không tag ai.
    *   `@everyone`: Tag tất cả mọi người (Warning: Rất phiền nếu spam).
    *   `@here`: Tag người đang online.
*   **UseDiscordTTS**: `true` để Discord **đọc to** nội dung cảnh báo.
*   **AlertMessage**: Tin nhắn cơ bản (Ví dụ: "Giá đã chạm cản!").

### Group: Alert Settings
*   **UpperPrice / LowerPrice**: (Tùy chọn) Vùng giá cố định. Để `0.0` nếu không dùng.
*   **UseTrendlineAlert**: `true` để bật tính năng cảnh báo theo đường kẻ vẽ.
*   **TrendlinePrefix**: Tiền tố tên đường Trendline cần theo dõi. Mặc định là `AlertLine`.
    *   *Cách dùng:* Vẽ một đường Trendline bất kỳ, sau đó đổi tên (Properties -> Name) thành `AlertLine1`, `AlertLine_Resistance`, v.v... miễn là bắt đầu bằng `AlertLine`. EA sẽ tự động phát hiện.
*   **AlertCooldown**: Thời gian trễ giữa 2 lần báo (giây).

### Group: Mobile Settings
*   **UsePushNotification**: `true` để gửi thông báo về App MT5 trên điện thoại.

## 3. Cách Dùng Trendline Alert
1.  Kéo EA vào chart. Bật `UseTrendlineAlert = true`.
2.  Vẽ Trendline.
3.  Vào Properties của Trendline (chuột phải vào đường kẻ -> Properties).
4.  Đổi **Name** thành tên bắt đầu bằng `AlertLine` (Ví dụ: `AlertLineTP`).
5.  Khi giá chạm vào đường này, EA sẽ báo ngay lập tức.
