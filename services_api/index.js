/* eslint-disable eol-last */
/* eslint-disable comma-dangle */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.database();
const {handleTournament} = require("./tournament");
const {handleChallenge, isChallengeAction} = require("./challenge");

// Danh sách member cứng đã được chuyển sang Database tại node "/vip_members"
// Để thêm member, hãy thêm record vào Firebase: vip_members/{userID}: true

// ============================================================
// ADMIN ACTIONS
// ============================================================
const ADMIN_ACTIONS = ["getAdminConfig", "updateConfig", "setAdmin", "getMembers", "addMember", "removeMember"];

function isAdminAction(action) {
  return ADMIN_ACTIONS.includes(action);
}

async function isUserAdmin(userID) {
  const configSnap = await db.ref("/config/adminId").once("value");
  const adminId = configSnap.val();
  if (!adminId) return {isAdmin: false, noAdmin: true};
  return {isAdmin: adminId === userID, noAdmin: false};
}

async function handleAdmin(req, res) {
  const action = req.query.action || req.body?.action;

  switch (action) {
    case "getAdminConfig":
      await getAdminConfig(req, res);
      break;
    case "updateConfig":
      await updateConfigAction(req, res);
      break;
    case "setAdmin":
      await setAdminAction(req, res);
      break;
    case "getMembers":
      await getMembersAction(req, res);
      break;
    case "addMember":
      await addMemberAction(req, res);
      break;
    case "removeMember":
      await removeMemberAction(req, res);
      break;
    default:
      res.status(400).json({error: `Unknown admin action: ${action}`});
  }
}

// Get full config + admin info
async function getAdminConfig(req, res) {
  const {userID} = req.query;
  if (!userID) {
    res.status(400).json({error: "Missing userID"});
    return;
  }

  const configSnap = await db.ref("/config").once("value");
  const config = configSnap.val() || {};
  const adminId = config.adminId || null;
  const isAdmin = adminId === userID;
  const noAdmin = !adminId;

  res.json({
    config: {
      mainTitle: config.mainTitle || "Sân Cầu Lông G7",
      enableRichFeatures: !!config.enableRichFeatures,
      adminId,
    },
    isAdmin,
    noAdmin,
  });
}

// Update config values (admin only / or first-time claim)
async function updateConfigAction(req, res) {
  const {userID, mainTitle, enableRichFeatures} = req.body;
  if (!userID) {
    res.status(400).json({error: "Missing userID"});
    return;
  }

  const {isAdmin, noAdmin} = await isUserAdmin(userID);
  if (!isAdmin && !noAdmin) {
    res.status(403).json({error: "Chỉ admin mới có quyền thay đổi cấu hình"});
    return;
  }

  const updates = {};
  if (mainTitle !== undefined) updates.mainTitle = mainTitle;
  if (enableRichFeatures !== undefined) updates.enableRichFeatures = !!enableRichFeatures;
  updates.updatedAt = admin.database.ServerValue.TIMESTAMP;

  // If no admin, auto-set this user as admin
  if (noAdmin) {
    updates.adminId = userID;
  }

  await db.ref("/config").update(updates);
  const updated = (await db.ref("/config").once("value")).val();
  res.json({config: updated, isAdmin: true});
}

// Set admin (current admin or first claim)
async function setAdminAction(req, res) {
  const {userID, newAdminId} = req.body;
  if (!userID || !newAdminId) {
    res.status(400).json({error: "Missing userID or newAdminId"});
    return;
  }

  const {isAdmin, noAdmin} = await isUserAdmin(userID);
  // Allow: current admin transfers, or no admin exists and user claims
  if (!isAdmin && !noAdmin) {
    res.status(403).json({error: "Chỉ admin hiện tại mới có quyền chỉ định admin mới"});
    return;
  }

  await db.ref("/config/adminId").set(newAdminId);
  res.json({success: true, adminId: newAdminId});
}

// Get all members (from /vip_members + /users)
async function getMembersAction(req, res) {
  const {userID} = req.query;
  if (!userID) {
    res.status(400).json({error: "Missing userID"});
    return;
  }

  const {isAdmin, noAdmin} = await isUserAdmin(userID);
  if (!isAdmin && !noAdmin) {
    res.status(403).json({error: "Chỉ admin mới xem được danh sách thành viên"});
    return;
  }

  const [vipSnap, usersSnap] = await Promise.all([
    db.ref("/vip_members").once("value"),
    db.ref("/users").once("value"),
  ]);

  const vipMembers = vipSnap.val() || {};
  const users = usersSnap.val() || {};

  // Build member list: all users with their VIP status
  const members = [];
  for (const [uid, userData] of Object.entries(users)) {
    members.push({
      userID: uid,
      username: userData.username || "",
      avatar: userData.avatar || "",
      isMember: !!vipMembers[uid],
    });
  }

  // Sort: members first, then by name
  members.sort((a, b) => {
    if (a.isMember !== b.isMember) return a.isMember ? -1 : 1;
    return (a.username || "").localeCompare(b.username || "");
  });

  res.json({members});
}

// Add a member to VIP
async function addMemberAction(req, res) {
  const {userID, targetUserID} = req.body;
  if (!userID || !targetUserID) {
    res.status(400).json({error: "Missing userID or targetUserID"});
    return;
  }

  const {isAdmin, noAdmin} = await isUserAdmin(userID);
  if (!isAdmin && !noAdmin) {
    res.status(403).json({error: "Chỉ admin mới có quyền thêm thành viên"});
    return;
  }

  await db.ref(`/vip_members/${targetUserID}`).set(true);
  res.json({success: true});
}

// Remove a member from VIP
async function removeMemberAction(req, res) {
  const {userID, targetUserID} = req.body;
  if (!userID || !targetUserID) {
    res.status(400).json({error: "Missing userID or targetUserID"});
    return;
  }

  const {isAdmin, noAdmin} = await isUserAdmin(userID);
  if (!isAdmin && !noAdmin) {
    res.status(403).json({error: "Chỉ admin mới có quyền xóa thành viên"});
    return;
  }

  await db.ref(`/vip_members/${targetUserID}`).remove();
  res.json({success: true});
}

exports.api = onRequest({region: "asia-southeast1", cors: true}, async (req, res) => {
  const method = req.method.toLowerCase();

  try {
    // Route tournament actions to tournament module
    const action = req.query.action || req.body?.action;
    if (action && isChallengeAction(action)) {
      await handleChallenge(req, res);
      return;
    }
    if (action && isAdminAction(action)) {
      await handleAdmin(req, res);
      return;
    }
    if (action) {
      await handleTournament(req, res);
      return;
    }

    switch (method) {
      case "post":
        await handlePost(req, res);
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
  const {userID, participantDate, type, getConfig, checkMember} = req.query;

  // === Endpoint kiểm tra quyền truy cập thành viên ===
  if (checkMember === "true" && userID) {
    const vipRef = db.ref(`/vip_members/${userID}`);
    const vipSnapshot = await vipRef.once("value");
    const isMember = vipSnapshot.exists();
    res.status(200).json({ isMember });
    return;
  }

  // === Endpoint để lấy cấu hình chung ===
  if (getConfig === "true") {
    const configRef = db.ref("/config");
    const snapshot = await configRef.once("value");
    const configData = snapshot.val() || {
      mainTitle: "Lịch tham gia",
      enableRichFeatures: false
    }; 
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