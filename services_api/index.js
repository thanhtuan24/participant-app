/* eslint-disable eol-last */
/* eslint-disable comma-dangle */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.database();

// Danh sách member cứng đã được chuyển sang Database tại node "/vip_members"
// Để thêm member, hãy thêm record vào Firebase: vip_members/{userID}: true

exports.api = onRequest({region: "asia-southeast1", cors: true}, async (req, res) => {
  const method = req.method.toLowerCase();

  try {
    switch (method) {
      case "post":
        // Phân loại action dựa trên body
        if (req.body.action === "FINANCE") {
          await handleFinance(req, res);
        } else {
          await handlePost(req, res);
        }
        break;
      case "get":
        await handleGet(req, res);
        break;
        // Lưu ý: PUT không được hỗ trợ trực tiếp, POST được dùng cho cả tạo và cập nhật.
        // Logic `handleUpdate` gốc có vẻ không chính xác, logic tạo/cập nhật đã được tích hợp trong `handlePost`.
      default:
        res.status(405).send("Method Not Allowed");
        break;
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

async function handleFinance(req, res) {
  const { 
    subAction, // "ADD_TRANSACTION" | "GET_SUMMARY"
    amount, 
    type, 
    description, 
    relatedUserID, 
    targetMonth, 
    targetDate 
  } = req.body;

  if (subAction === "GET_SUMMARY") {
    // Lấy tổng quan tài chính (số dư quỹ, danh sách đã đóng tháng này)
    const summary = {
      totalFund: 0,
      paidMembers: []
    };

    // 1. Tính tổng quỹ từ transactions
    // Lưu ý: Đây là cách tính đơn giản, thực tế nên cache con số này lại
    const transRef = db.ref("/finances/transactions");
    const snapshot = await transRef.once("value");
    
    snapshot.forEach(child => {
      const t = child.val();
      if (t.type === "EXPENSE") {
        summary.totalFund -= (t.amount || 0);
      } else {
        summary.totalFund += (t.amount || 0);
      }
    });

    // 2. Lấy danh sách đóng tiền tháng này (nếu có targetMonth)
    if (targetMonth) {
       const monthRef = db.ref(`/finances/monthly_status/${targetMonth}`);
       const monthSnapshot = await monthRef.once("value");
       if (monthSnapshot.exists()) {
          summary.paidMembers = Object.keys(monthSnapshot.val());
       }
    }

    res.status(200).json(summary);
    return;
  }

  // Mặc định là ADD_TRANSACTION
  const newTransRef = db.ref("/finances/transactions").push();
  const transaction = {
    amount: Number(amount),
    type,
    description: description || "",
    relatedUserID: relatedUserID || null,
    targetMonth: targetMonth || null,
    targetDate: targetDate || null,
    createdAt: admin.database.ServerValue.TIMESTAMP
  };

  await newTransRef.set(transaction);

  // Nếu là đóng quỹ tháng -> Cập nhật index để lookup nhanh
  if (type === "MONTHLY_FEE" && relatedUserID && targetMonth) {
    const statusRef = db.ref(`/finances/monthly_status/${targetMonth}/${relatedUserID}`);
    await statusRef.set(true);
  }

  res.status(200).json({ id: newTransRef.key, ...transaction });
}

// Thay thế hoàn toàn hàm handlePost cũ bằng hàm này
async function handlePost(req, res) {
  const {userID, username, participantDate, status, avatar, isMember, type} = req.body;

  // 1. Kiểm tra VIP User từ Database thay vì code cứng
  const vipRef = db.ref(`/vip_members/${userID}`);
  const vipSnapshot = await vipRef.once("value");
  const isVip = vipSnapshot.exists();

  // Logic: Là thành viên nếu có trong bảng VIP HOẶC cờ isMember từ request là true
  const isUserMember = isVip || !!isMember;

  // 2. Cập nhật hoặc tạo User nếu có avatar
  if (avatar !== undefined) {
    const userRef = db.ref(`/users/${userID}`);
    const userAccount = {
      userID,
      username,
      isMember: isUserMember, // <-- Đã sửa lỗi
      avatar,
      status
    };
    await userRef.update(userAccount);
    console.log("Upserted user:", userID);
  }

  // 2. Tạo hoặc cập nhật Participant
  const participantData = {
    userID,
    username,
    participantDate,
    status,
    isMember: isUserMember, // <-- Đã sửa lỗi
    type: type || null,
    timestamp: admin.database.ServerValue.TIMESTAMP
  };

  // Tìm kiếm một bản ghi participant hiện có để cập nhật
  const query = db.ref("/participants").orderByChild("userID").equalTo(userID);
  const snapshot = await query.once("value");

  let existingParticipantKey = null;

  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      const childData = childSnapshot.val();
      // Điều kiện khớp để cập nhật: cùng `participantDate` và `type`
      const existingType = childData.type || null;
      const newType = participantData.type || null;
      if (childData.participantDate === participantDate && existingType === newType) {
        existingParticipantKey = childSnapshot.key;
      }
    });
  }

  if (existingParticipantKey) {
    // Cập nhật bản ghi đã có
    const participantRef = db.ref(`/participants/${existingParticipantKey}`);
    // === THAY ĐỔI Ở ĐÂY ===
    // Thêm timestamp vào để nó được cập nhật mỗi khi status thay đổi
    const updateData = {
      status: status,
      isMember: isUserMember,
      timestamp: admin.database.ServerValue.TIMESTAMP // <--- Thêm dòng này
    };
    await participantRef.update(updateData);
    // === KẾT THÚC THAY ĐỔI ===

    const updatedData = (await participantRef.once("value")).val();
    res.status(200).json(updatedData);
  } else {
    // Tạo bản ghi mới
    const newParticipantRef = db.ref("/participants").push();
    await newParticipantRef.set(participantData);
    const newData = (await newParticipantRef.once("value")).val();
    res.status(201).json({id: newParticipantRef.key, ...newData});
  }
}
// Thay thế hàm handleGet cũ bằng hàm này
// File backend (ví dụ: index.js của Firebase Functions)

async function handleGet(req, res) {
  const {userID, participantDate, type, getConfig} = req.query; // Thêm getConfig

  // === THÊM MỚI TẠI ĐÂY ===
  // Endpoint để lấy cấu hình chung
  if (getConfig === "true") {
    const configRef = db.ref("/config");
    const snapshot = await configRef.once("value");
    const configData = snapshot.val() || {mainTitle: "Lịch tham gia"}; // Giá trị mặc định
    res.status(200).json(configData);
    return; // Kết thúc hàm tại đây
  }
  // === KẾT THÚC PHẦN THÊM MỚI ===
  if (userID) {
    // Phần này đã đúng, không cần sửa
    const query = db.ref("/participants").orderByChild("userID").equalTo(userID);
    const snapshot = await query.once("value");
    const items = [];
    snapshot.forEach((child) => {
      const data = child.val();
      if (!type || (type && data.type === type)) {
        items.push({id: child.key, ...data});
      }
    });
    items.sort((a, b) => b.timestamp - a.timestamp);
    res.status(200).json(items);
  } else if (participantDate) { // Lấy danh sách tham gia theo ngày
    if (participantDate === "9999") { // Lấy danh sách đăng ký trong THÁNG HIỆN TẠI (thay vì toàn bộ)
      const usersSnapshot = await db.ref("/users").once("value");
      const users = usersSnapshot.val() || {};

      // Tính start/end date của tháng hiện tại (Vietnam Time UTC+7)
      const now = new Date();
      const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const year = vnTime.getUTCFullYear();
      const month = vnTime.getUTCMonth() + 1;
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      
      const startOfMonth = `${year}-${monthStr}-01`;
      const endOfMonth = `${year}-${monthStr}-31`;

      // Query range theo participantDate
      const query = db.ref("/participants")
        .orderByChild("participantDate")
        .startAt(startOfMonth)
        .endAt(endOfMonth);
      
      const participantsSnapshot = await query.once("value");
      const items = [];

      participantsSnapshot.forEach((child) => {
        const data = child.val();

        // === THAY ĐỔI Ở ĐÂY: Bỏ điều kiện if (data.status === "yes") ===
        const userItem = users[data.userID];
        items.push({
          ...data,
          avatar: userItem ? userItem.avatar : null,
        });
        // === KẾT THÚC THAY ĐỔI ===
      });
      res.status(200).json(items);
    } else { // Lấy theo một ngày cụ thể
      const query = db.ref("/participants").orderByChild("participantDate").equalTo(participantDate);
      const snapshot = await query.once("value");
      const items = [];
      snapshot.forEach((child) => {
        const data = child.val();

        // === THAY ĐỔI Ở ĐÂY: Bỏ điều kiện data.status === "yes" ===
        if (!type || data.type === type) {
          items.push({
            // Giữ nguyên các trường cần thiết
            ...data
          });
        }
        // === KẾT THÚC THAY ĐỔI ===
      });
      res.status(200).json(items);
    }
  } else {
    res.status(400).send("Invalid query parameters.");
  }
}