// Script hỗ trợ migrate danh sách thành viên cũ lên Firebase Database
// Bạn có thể chạy script này một lần bằng Node.js (cần cài firebase-admin sdk)

/*
Danh sách cũ trong code:
const memberList = [
    "8501091017577725160", "3706931116048822880",
    "8238478985986168389", "5163894976803610296",
    "8501091017577725160", "3227439752531646171",
    "4499434538963877728", "8381055013453744990",
    "7251355754441520560", "366075136541843717",
    "1506600698618940665", "5640126963832781652",
    "4515192710655305656"
];
*/

const oldMembers = [
    "8501091017577725160", "3706931116048822880",
    "8238478985986168389", "5163894976803610296",
    "8501091017577725160", "3227439752531646171",
    "4499434538963877728", "8381055013453744990",
    "7251355754441520560", "366075136541843717",
    "1506600698618940665", "5640126963832781652",
    "4515192710655305656"
];

// Cấu trúc JSON để Import vào Firebase Realtime Database
const exportData = {};
oldMembers.forEach(id => {
    exportData[id] = true;
});

console.log(JSON.stringify(exportData, null, 2));

/*
HƯỚNG DẪN IMPORT:
1. Copy nội dung JSON in ra màn hình.
2. Vào Firebase Console -> Realtime Database.
3. Tạo (nếu chưa có) hoặc chọn node `vip_members`.
4. Chọn "Import JSON" và paste nội dung vào.
*/
