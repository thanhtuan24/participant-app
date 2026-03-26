/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const admin = require("firebase-admin");

const db = admin.database();

// ============================================================
// CHALLENGE MODULE — "Tạo kèo" casual match challenges
// ============================================================

const CHALLENGE_ACTIONS = [
  "createChallenge", "getChallenges", "getChallenge",
  "acceptChallenge", "joinChallenge",
  "updateChallengeScore", "completeChallenge",
];

function isChallengeAction(action) {
  return CHALLENGE_ACTIONS.includes(action);
}

async function handleChallenge(req, res) {
  const action = req.query.action || req.body?.action;

  switch (action) {
    case "createChallenge":
      await createChallenge(req, res);
      break;
    case "getChallenges":
      await getChallenges(req, res);
      break;
    case "getChallenge":
      await getChallenge(req, res);
      break;
    case "acceptChallenge":
      await acceptChallenge(req, res);
      break;
    case "joinChallenge":
      await joinChallenge(req, res);
      break;
    case "updateChallengeScore":
      await updateChallengeScore(req, res);
      break;
    case "completeChallenge":
      await completeChallenge(req, res);
      break;
    default:
      res.status(400).json({error: `Unknown challenge action: ${action}`});
  }
}

// ============================================================
// CREATE CHALLENGE
// ============================================================
async function createChallenge(req, res) {
  const {
    name, type, betStake, maxPoints, bestOf,
    scheduledAt, userID, userName, userAvatar,
    mode, // "manual" or "open"
    team1Players, // Array of {userID, username, avatar} — manual mode only
    team2Players, // Array of {userID, username, avatar} — manual mode only
  } = req.body;

  if (!name || !type || !userID || !maxPoints || !bestOf) {
    res.status(400).json({error: "Missing required fields"});
    return;
  }
  if (type !== "singles" && type !== "doubles") {
    res.status(400).json({error: "type must be 'singles' or 'doubles'"});
    return;
  }
  if (![1, 3, 5].includes(bestOf)) {
    res.status(400).json({error: "bestOf must be 1, 3 or 5"});
    return;
  }

  const challengeMode = mode || "manual";
  const playersPerTeam = type === "doubles" ? 2 : 1;
  const ref = db.ref("/challenges").push();

  let team1;
  let team2;
  let status;

  if (challengeMode === "open") {
    // Open mode: creator auto-joins team1, rest are open slots
    team1 = {
      players: [{userID, username: userName || "", avatar: userAvatar || ""}],
    };
    team2 = null;
    status = "open";
  } else {
    // Manual mode: all players provided at creation
    team1 = {
      players: team1Players && team1Players.length > 0
        ? team1Players
        : [{userID, username: userName || "", avatar: userAvatar || ""}],
    };

    const hasTeam2 = team2Players && team2Players.length > 0;
    team2 = hasTeam2 ? {players: team2Players} : null;
    status = hasTeam2 ? "accepted" : "pending";
  }

  const challenge = {
    id: ref.key,
    name,
    type,
    mode: challengeMode,
    betStake: betStake || "",
    maxPoints: Number(maxPoints),
    bestOf: Number(bestOf),
    playersPerTeam,
    scheduledAt: scheduledAt ? Number(scheduledAt) : null,
    status,
    createdBy: userID,
    createdByName: userName || "",
    team1,
    team2,
    scores: [],
    winnerId: null,
    createdAt: admin.database.ServerValue.TIMESTAMP,
    updatedAt: admin.database.ServerValue.TIMESTAMP,
  };

  await ref.set(challenge);
  res.status(201).json(challenge);
}

// ============================================================
// GET CHALLENGES LIST
// ============================================================
async function getChallenges(req, res) {
  const {userID} = req.query;
  const snapshot = await db.ref("/challenges").orderByChild("createdAt").once("value");
  const challenges = [];

  snapshot.forEach((child) => {
    const c = child.val();
    challenges.push(c);
  });

  // Reverse for newest first
  challenges.reverse();

  // If userID provided, filter to relevant challenges
  // Show all for now (could filter to user's challenges + open ones)
  res.json(challenges);
}

// ============================================================
// GET SINGLE CHALLENGE DETAIL
// ============================================================
async function getChallenge(req, res) {
  const {challengeId} = req.query;
  if (!challengeId) {
    res.status(400).json({error: "Missing challengeId"});
    return;
  }

  const snapshot = await db.ref(`/challenges/${challengeId}`).once("value");
  if (!snapshot.exists()) {
    res.status(404).json({error: "Challenge not found"});
    return;
  }

  res.json(snapshot.val());
}

// ============================================================
// JOIN OPEN CHALLENGE (pick a team)
// ============================================================
async function joinChallenge(req, res) {
  const {challengeId, userID, userName, userAvatar, team} = req.body;

  if (!challengeId || !userID || !team) {
    res.status(400).json({error: "Missing challengeId, userID, or team"});
    return;
  }
  if (team !== "team1" && team !== "team2") {
    res.status(400).json({error: "team must be 'team1' or 'team2'"});
    return;
  }

  const ref = db.ref(`/challenges/${challengeId}`);
  const snapshot = await ref.once("value");
  if (!snapshot.exists()) {
    res.status(404).json({error: "Challenge not found"});
    return;
  }

  const challenge = snapshot.val();
  if (challenge.status !== "open") {
    res.status(400).json({error: "Challenge is not open for joining"});
    return;
  }
  if (challenge.mode !== "open") {
    res.status(400).json({error: "This challenge does not accept joins"});
    return;
  }

  const playersPerTeam = challenge.playersPerTeam || (challenge.type === "doubles" ? 2 : 1);
  const player = {userID, username: userName || "", avatar: userAvatar || ""};

  // Check if user already joined
  const t1Players = challenge.team1?.players || [];
  const t2Players = challenge.team2?.players || [];
  const alreadyJoined = [...t1Players, ...t2Players].some((p) => p.userID === userID);
  if (alreadyJoined) {
    res.status(400).json({error: "Bạn đã tham gia kèo này rồi"});
    return;
  }

  const updates = {updatedAt: admin.database.ServerValue.TIMESTAMP};

  if (team === "team1") {
    if (t1Players.length >= playersPerTeam) {
      res.status(400).json({error: "Đội 1 đã đủ người"});
      return;
    }
    t1Players.push(player);
    updates["team1"] = {players: t1Players};
  } else {
    if (t2Players.length >= playersPerTeam) {
      res.status(400).json({error: "Đội 2 đã đủ người"});
      return;
    }
    t2Players.push(player);
    updates["team2"] = {players: t2Players};
  }

  // Check if both teams are now full
  const newT1Len = (updates["team1"]?.players || t1Players).length;
  const newT2Len = (updates["team2"]?.players || t2Players).length;
  if (newT1Len >= playersPerTeam && newT2Len >= playersPerTeam) {
    updates["status"] = "accepted";
  }

  await ref.update(updates);
  const updated = (await ref.once("value")).val();
  res.json(updated);
}

// ============================================================
// ACCEPT CHALLENGE (opponent joins)
// ============================================================
async function acceptChallenge(req, res) {
  const {challengeId, userID, userName, userAvatar, team2Players} = req.body;

  if (!challengeId || !userID) {
    res.status(400).json({error: "Missing challengeId or userID"});
    return;
  }

  const ref = db.ref(`/challenges/${challengeId}`);
  const snapshot = await ref.once("value");
  if (!snapshot.exists()) {
    res.status(404).json({error: "Challenge not found"});
    return;
  }

  const challenge = snapshot.val();
  if (challenge.status !== "pending") {
    res.status(400).json({error: "Challenge is not in pending status"});
    return;
  }

  // Check creator is not accepting own challenge
  if (challenge.createdBy === userID) {
    res.status(400).json({error: "Cannot accept your own challenge"});
    return;
  }

  const team2 = {
    players: team2Players || [{userID, username: userName || "", avatar: userAvatar || ""}],
  };

  await ref.update({
    team2,
    status: "accepted",
    updatedAt: admin.database.ServerValue.TIMESTAMP,
  });

  const updated = (await ref.once("value")).val();
  res.json(updated);
}

// ============================================================
// UPDATE CHALLENGE SCORE (per set)
// ============================================================
async function updateChallengeScore(req, res) {
  const {challengeId, setNumber, score1, score2, userID} = req.body;

  if (!challengeId || setNumber === undefined || score1 === undefined || score2 === undefined || !userID) {
    res.status(400).json({error: "Missing required fields"});
    return;
  }

  const ref = db.ref(`/challenges/${challengeId}`);
  const snapshot = await ref.once("value");
  if (!snapshot.exists()) {
    res.status(404).json({error: "Challenge not found"});
    return;
  }

  const challenge = snapshot.val();

  // Must be accepted or in_progress
  if (!["accepted", "in_progress"].includes(challenge.status)) {
    res.status(400).json({error: "Challenge must be accepted or in progress to record scores"});
    return;
  }

  // Verify user is a participant
  const isTeam1 = challenge.team1?.players?.some((p) => p.userID === userID);
  const isTeam2 = challenge.team2?.players?.some((p) => p.userID === userID);
  if (!isTeam1 && !isTeam2 && challenge.createdBy !== userID) {
    res.status(403).json({error: "Only participants can update scores"});
    return;
  }

  // Update or add the set score
  const scores = challenge.scores || [];
  const setIndex = scores.findIndex((s) => s.set === Number(setNumber));

  const setData = {
    set: Number(setNumber),
    score1: Number(score1),
    score2: Number(score2),
    updatedBy: userID,
    updatedAt: Date.now(),
  };

  if (setIndex >= 0) {
    scores[setIndex] = setData;
  } else {
    scores.push(setData);
  }

  // Sort by set number
  scores.sort((a, b) => a.set - b.set);

  await ref.update({
    scores,
    status: "in_progress",
    updatedAt: admin.database.ServerValue.TIMESTAMP,
  });

  const updated = (await ref.once("value")).val();
  res.json(updated);
}

// ============================================================
// COMPLETE CHALLENGE (determine winner)
// ============================================================
async function completeChallenge(req, res) {
  const {challengeId, userID} = req.body;

  if (!challengeId || !userID) {
    res.status(400).json({error: "Missing challengeId or userID"});
    return;
  }

  const ref = db.ref(`/challenges/${challengeId}`);
  const snapshot = await ref.once("value");
  if (!snapshot.exists()) {
    res.status(404).json({error: "Challenge not found"});
    return;
  }

  const challenge = snapshot.val();
  if (challenge.status === "completed") {
    res.status(400).json({error: "Challenge already completed"});
    return;
  }

  const scores = challenge.scores || [];
  const bestOf = challenge.bestOf || 1;
  const winsNeeded = Math.ceil(bestOf / 2);

  let team1Wins = 0;
  let team2Wins = 0;

  for (const s of scores) {
    if (s.score1 > s.score2) team1Wins++;
    else if (s.score2 > s.score1) team2Wins++;
  }

  let winnerId = null;
  if (team1Wins >= winsNeeded) winnerId = "team1";
  else if (team2Wins >= winsNeeded) winnerId = "team2";

  await ref.update({
    winnerId,
    status: "completed",
    updatedAt: admin.database.ServerValue.TIMESTAMP,
  });

  const updated = (await ref.once("value")).val();
  res.json(updated);
}

module.exports = {handleChallenge, isChallengeAction};
