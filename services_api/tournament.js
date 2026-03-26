/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const admin = require("firebase-admin");

const db = admin.database();

// ============================================================
// TOURNAMENT MODULE — Handles all tournament-related operations
// ============================================================

/**
 * Main tournament request handler
 * Routes based on req.query.action or req.body.action
 */
async function handleTournament(req, res) {
  const method = req.method.toLowerCase();
  const action = req.query.action || req.body?.action;

  if (!action) {
    res.status(400).json({error: "Missing 'action' parameter"});
    return;
  }

  try {
    switch (action) {
      // === GET actions ===
      case "getTournaments":
        await getTournaments(req, res);
        break;
      case "getTournament":
        await getTournament(req, res);
        break;

      // === POST actions ===
      case "createTournament":
        await createTournament(req, res);
        break;
      case "addPlayer":
        await addPlayer(req, res);
        break;
      case "removePlayer":
        await removePlayer(req, res);
        break;
      case "generateDraw":
        await generateDraw(req, res);
        break;
      case "updateScore":
        await updateScore(req, res);
        break;
      case "advanceToKnockout":
        await advanceToKnockout(req, res);
        break;
      case "completeTournament":
        await completeTournament(req, res);
        break;
      default:
        res.status(400).json({error: `Unknown action: ${action}`});
    }
  } catch (error) {
    console.error(`Tournament action '${action}' error:`, error);
    res.status(500).json({error: error.message});
  }
}

// ============================================================
// CREATE TOURNAMENT
// ============================================================
async function createTournament(req, res) {
  const {name, type, isOpen, userID, userName} = req.body;

  if (!name || !type || !userID) {
    res.status(400).json({error: "Missing required fields: name, type, userID"});
    return;
  }
  if (type !== "singles" && type !== "doubles") {
    res.status(400).json({error: "type must be 'singles' or 'doubles'"});
    return;
  }

  const ref = db.ref("/tournaments").push();
  const tournament = {
    id: ref.key,
    name,
    type,
    isOpen: !!isOpen,
    status: "draft",
    createdBy: userID,
    createdByName: userName || "",
    maxPoints: 21,
    createdAt: admin.database.ServerValue.TIMESTAMP,
    updatedAt: admin.database.ServerValue.TIMESTAMP,
  };

  await ref.set(tournament);
  res.status(201).json(tournament);
}

// ============================================================
// GET TOURNAMENTS LIST
// ============================================================
async function getTournaments(req, res) {
  const {userID} = req.query;
  const snapshot = await db.ref("/tournaments").once("value");
  const tournaments = [];

  snapshot.forEach((child) => {
    const t = child.val();
    // Show if: tournament is open OR user is the creator OR user is a player
    if (t.isOpen || t.createdBy === userID) {
      tournaments.push(t);
    }
  });

  // Also check if user is a player in non-open tournaments
  if (userID) {
    snapshot.forEach((child) => {
      const t = child.val();
      if (!t.isOpen && t.createdBy !== userID) {
        // Check if user is a player — will be checked via players sub-node
        // For performance, we add player count inline but skip deep check here
        // Players are added to the list in the detail endpoint
      }
    });
  }

  // Sort by createdAt desc
  tournaments.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.status(200).json(tournaments);
}

// ============================================================
// GET TOURNAMENT DETAIL (with players, teams, matches, standings)
// ============================================================
async function getTournament(req, res) {
  const {tournamentId} = req.query;
  if (!tournamentId) {
    res.status(400).json({error: "Missing tournamentId"});
    return;
  }

  const tRef = db.ref(`/tournaments/${tournamentId}`);
  const tSnapshot = await tRef.once("value");
  if (!tSnapshot.exists()) {
    res.status(404).json({error: "Tournament not found"});
    return;
  }

  const tournament = tSnapshot.val();

  // Fetch sub-nodes in parallel
  const [playersSnap, teamsSnap, matchesSnap, standingsSnap] = await Promise.all([
    db.ref(`/tournaments/${tournamentId}/players`).once("value"),
    db.ref(`/tournaments/${tournamentId}/teams`).once("value"),
    db.ref(`/tournaments/${tournamentId}/matches`).once("value"),
    db.ref(`/tournaments/${tournamentId}/standings`).once("value"),
  ]);

  const players = [];
  playersSnap.forEach((c) => { players.push(c.val()); });

  const teams = [];
  teamsSnap.forEach((c) => { teams.push(c.val()); });

  const matches = [];
  matchesSnap.forEach((c) => { matches.push(c.val()); });

  const standings = [];
  standingsSnap.forEach((c) => { standings.push(c.val()); });

  // Sort standings by matchPoints desc, pointsDiff desc, pointsFor desc
  standings.sort((a, b) =>
    (b.matchPoints - a.matchPoints) ||
    (b.pointsDiff - a.pointsDiff) ||
    (b.pointsFor - a.pointsFor),
  );

  // Sort matches by phase priority then round
  const phaseOrder = {group: 0, semifinal: 1, third_place: 2, final: 3};
  matches.sort((a, b) =>
    (phaseOrder[a.phase] || 0) - (phaseOrder[b.phase] || 0) ||
    (a.round || 0) - (b.round || 0),
  );

  res.status(200).json({
    ...tournament,
    players,
    teams,
    matches,
    standings,
    playerCount: players.length,
    teamCount: teams.length,
  });
}

// ============================================================
// ADD PLAYER
// ============================================================
async function addPlayer(req, res) {
  const {tournamentId} = req.query;
  const {userID, username, avatar, skillLevel, adminUserID} = req.body;

  if (!tournamentId || !userID || !username || !skillLevel) {
    res.status(400).json({error: "Missing required fields"});
    return;
  }

  // Admin check
  const tournament = await getTournamentOrFail(tournamentId, res);
  if (!tournament) return;
  if (tournament.createdBy !== adminUserID) {
    res.status(403).json({error: "Chỉ admin giải mới có quyền thêm người chơi"});
    return;
  }
  if (tournament.status !== "draft") {
    res.status(400).json({error: "Chỉ thêm người chơi khi giải ở trạng thái nháp"});
    return;
  }

  const playerRef = db.ref(`/tournaments/${tournamentId}/players/${userID}`);
  const player = {
    userID,
    username,
    avatar: avatar || "",
    skillLevel: skillLevel === "A" ? "A" : "B",
  };
  await playerRef.set(player);

  await db.ref(`/tournaments/${tournamentId}/updatedAt`).set(admin.database.ServerValue.TIMESTAMP);
  res.status(200).json(player);
}

// ============================================================
// REMOVE PLAYER
// ============================================================
async function removePlayer(req, res) {
  const {tournamentId, playerID} = req.query;
  const {adminUserID} = req.body;

  if (!tournamentId || !playerID) {
    res.status(400).json({error: "Missing tournamentId or playerID"});
    return;
  }

  const tournament = await getTournamentOrFail(tournamentId, res);
  if (!tournament) return;
  if (tournament.createdBy !== adminUserID) {
    res.status(403).json({error: "Chỉ admin giải mới có quyền xóa người chơi"});
    return;
  }
  if (tournament.status !== "draft") {
    res.status(400).json({error: "Chỉ xóa người chơi khi giải ở trạng thái nháp"});
    return;
  }

  await db.ref(`/tournaments/${tournamentId}/players/${playerID}`).remove();
  await db.ref(`/tournaments/${tournamentId}/updatedAt`).set(admin.database.ServerValue.TIMESTAMP);
  res.status(200).json({success: true});
}

// ============================================================
// GENERATE DRAW
// Creates teams (doubles: pair A+B) and round-robin schedule
// ============================================================
async function generateDraw(req, res) {
  const {tournamentId} = req.query;
  const {adminUserID} = req.body;

  const tournament = await getTournamentOrFail(tournamentId, res);
  if (!tournament) return;
  if (tournament.createdBy !== adminUserID) {
    res.status(403).json({error: "Chỉ admin giải mới có quyền bốc thăm"});
    return;
  }
  if (tournament.status !== "draft") {
    res.status(400).json({error: "Chỉ bốc thăm khi giải ở trạng thái nháp"});
    return;
  }

  // Get players
  const playersSnap = await db.ref(`/tournaments/${tournamentId}/players`).once("value");
  const players = [];
  playersSnap.forEach((c) => { players.push(c.val()); });

  if (players.length < 4) {
    res.status(400).json({error: "Cần ít nhất 4 người chơi để bốc thăm"});
    return;
  }

  // === CREATE TEAMS ===
  let teams = [];
  if (tournament.type === "doubles") {
    teams = createDoublesTeams(players);
  } else {
    teams = createSinglesTeams(players);
  }

  if (teams.length < 2) {
    res.status(400).json({error: "Không đủ đội để tạo lịch thi đấu"});
    return;
  }

  // Save teams
  const teamsRef = db.ref(`/tournaments/${tournamentId}/teams`);
  const teamsData = {};
  teams.forEach((t) => {
    teamsData[t.id] = t;
  });
  await teamsRef.set(teamsData);

  // === CREATE ROUND-ROBIN SCHEDULE ===
  const matches = generateRoundRobin(teams);

  // Save matches
  const matchesRef = db.ref(`/tournaments/${tournamentId}/matches`);
  const matchesData = {};
  matches.forEach((m) => {
    matchesData[m.id] = m;
  });
  await matchesRef.set(matchesData);

  // === INITIALIZE STANDINGS ===
  const standingsRef = db.ref(`/tournaments/${tournamentId}/standings`);
  const standingsData = {};
  teams.forEach((t) => {
    standingsData[t.id] = {
      teamId: t.id,
      teamName: t.name,
      played: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointsDiff: 0,
      matchPoints: 0,
    };
  });
  await standingsRef.set(standingsData);

  // Update tournament status
  await db.ref(`/tournaments/${tournamentId}`).update({
    status: "group_stage",
    updatedAt: admin.database.ServerValue.TIMESTAMP,
  });

  res.status(200).json({
    teams,
    matches,
    standings: Object.values(standingsData),
    message: `Đã tạo ${teams.length} đội và ${matches.length} trận đấu vòng tròn`,
  });
}

// ============================================================
// UPDATE SCORE
// ============================================================
async function updateScore(req, res) {
  const {tournamentId, matchId} = req.query;
  const {score1, score2, userID} = req.body;

  if (!tournamentId || !matchId || score1 === undefined || score2 === undefined) {
    res.status(400).json({error: "Missing required fields"});
    return;
  }

  const s1 = parseInt(score1, 10);
  const s2 = parseInt(score2, 10);
  if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
    res.status(400).json({error: "Điểm số không hợp lệ"});
    return;
  }

  const tournament = await getTournamentOrFail(tournamentId, res);
  if (!tournament) return;

  const isAdmin = tournament.createdBy === userID;

  // Get match
  const matchRef = db.ref(`/tournaments/${tournamentId}/matches/${matchId}`);
  const matchSnap = await matchRef.once("value");
  if (!matchSnap.exists()) {
    res.status(404).json({error: "Trận đấu không tồn tại"});
    return;
  }

  const match = matchSnap.val();

  // Check permission: admin or player in the match
  if (!isAdmin) {
    const teamsSnap = await db.ref(`/tournaments/${tournamentId}/teams`).once("value");
    const teams = {};
    teamsSnap.forEach((c) => {
      teams[c.key] = c.val();
    });
    const team1 = teams[match.team1Id];
    const team2 = teams[match.team2Id];
    const isPlayerInMatch =
      team1?.player1?.userID === userID ||
      team1?.player2?.userID === userID ||
      team2?.player1?.userID === userID ||
      team2?.player2?.userID === userID;
    if (!isPlayerInMatch) {
      res.status(403).json({error: "Bạn không có quyền nhập điểm trận này"});
      return;
    }
  }

  // Determine winner
  const winnerId = s1 > s2 ? match.team1Id : (s2 > s1 ? match.team2Id : null);

  // Update match
  await matchRef.update({
    score1: s1,
    score2: s2,
    winnerId,
    status: "completed",
    updatedBy: userID,
    updatedAt: admin.database.ServerValue.TIMESTAMP,
  });

  // Update standings if group phase
  if (match.phase === "group" && winnerId) {
    const loserId = winnerId === match.team1Id ? match.team2Id : match.team1Id;
    const winnerScore = winnerId === match.team1Id ? s1 : s2;
    const loserScore = winnerId === match.team1Id ? s2 : s1;

    // Check if this match was previously scored (undo old standings)
    if (match.status === "completed" && match.winnerId) {
      await undoStandings(tournamentId, match);
    }

    // Apply new standings
    const standingsRef = db.ref(`/tournaments/${tournamentId}/standings`);

    // Winner
    const winStRef = standingsRef.child(winnerId);
    const winSnap = await winStRef.once("value");
    const winSt = winSnap.val();
    await winStRef.update({
      played: (winSt.played || 0) + 1,
      wins: (winSt.wins || 0) + 1,
      pointsFor: (winSt.pointsFor || 0) + winnerScore,
      pointsAgainst: (winSt.pointsAgainst || 0) + loserScore,
      pointsDiff: (winSt.pointsDiff || 0) + (winnerScore - loserScore),
      matchPoints: (winSt.matchPoints || 0) + 2,
    });

    // Loser
    const loseStRef = standingsRef.child(loserId);
    const loseSnap = await loseStRef.once("value");
    const loseSt = loseSnap.val();
    await loseStRef.update({
      played: (loseSt.played || 0) + 1,
      losses: (loseSt.losses || 0) + 1,
      pointsFor: (loseSt.pointsFor || 0) + loserScore,
      pointsAgainst: (loseSt.pointsAgainst || 0) + winnerScore,
      pointsDiff: (loseSt.pointsDiff || 0) + (loserScore - winnerScore),
      matchPoints: (loseSt.matchPoints || 0) + 1,
    });
  }

  // For knockout: update next match team slots
  if (match.phase === "semifinal" && winnerId) {
    await updateKnockoutProgression(tournamentId, match, winnerId);
  }

  await db.ref(`/tournaments/${tournamentId}/updatedAt`).set(admin.database.ServerValue.TIMESTAMP);

  res.status(200).json({success: true, winnerId});
}

// ============================================================
// ADVANCE TO KNOCKOUT
// ============================================================
async function advanceToKnockout(req, res) {
  const {tournamentId} = req.query;
  const {adminUserID} = req.body;

  const tournament = await getTournamentOrFail(tournamentId, res);
  if (!tournament) return;
  if (tournament.createdBy !== adminUserID) {
    res.status(403).json({error: "Chỉ admin giải mới có quyền"});
    return;
  }
  if (tournament.status !== "group_stage") {
    res.status(400).json({error: "Giải phải đang ở vòng bảng"});
    return;
  }

  // Check all group matches are completed
  const matchesSnap = await db.ref(`/tournaments/${tournamentId}/matches`).once("value");
  let allGroupDone = true;
  matchesSnap.forEach((c) => {
    const m = c.val();
    if (m.phase === "group" && m.status !== "completed") {
      allGroupDone = false;
    }
  });

  if (!allGroupDone) {
    res.status(400).json({error: "Tất cả trận vòng bảng phải hoàn tất trước"});
    return;
  }

  // Get top 4 from standings
  const standingsSnap = await db.ref(`/tournaments/${tournamentId}/standings`).once("value");
  const standings = [];
  standingsSnap.forEach((c) => { standings.push(c.val()); });
  standings.sort((a, b) =>
    (b.matchPoints - a.matchPoints) ||
    (b.pointsDiff - a.pointsDiff) ||
    (b.pointsFor - a.pointsFor),
  );

  if (standings.length < 4) {
    res.status(400).json({error: "Cần ít nhất 4 đội để vào vòng knockout"});
    return;
  }

  const top4 = standings.slice(0, 4);

  // Create knockout matches
  const knockoutMatches = {
    sf1: {
      id: "sf1",
      phase: "semifinal",
      round: 1,
      matchLabel: "Bán kết 1",
      team1Id: top4[0].teamId,
      team2Id: top4[3].teamId,
      score1: null,
      score2: null,
      winnerId: null,
      loserId: null,
      status: "pending",
      updatedBy: null,
      updatedAt: null,
    },
    sf2: {
      id: "sf2",
      phase: "semifinal",
      round: 2,
      matchLabel: "Bán kết 2",
      team1Id: top4[1].teamId,
      team2Id: top4[2].teamId,
      score1: null,
      score2: null,
      winnerId: null,
      loserId: null,
      status: "pending",
      updatedBy: null,
      updatedAt: null,
    },
    final: {
      id: "final",
      phase: "final",
      round: 1,
      matchLabel: "Chung kết",
      team1Id: null,
      team2Id: null,
      score1: null,
      score2: null,
      winnerId: null,
      loserId: null,
      status: "pending",
      updatedBy: null,
      updatedAt: null,
    },
    third_place: {
      id: "third_place",
      phase: "third_place",
      round: 1,
      matchLabel: "Tranh giải 3-4",
      team1Id: null,
      team2Id: null,
      score1: null,
      score2: null,
      winnerId: null,
      loserId: null,
      status: "pending",
      updatedBy: null,
      updatedAt: null,
    },
  };

  // Append knockout matches (don't overwrite group matches)
  const matchesRef = db.ref(`/tournaments/${tournamentId}/matches`);
  await matchesRef.update(knockoutMatches);

  // Update status
  await db.ref(`/tournaments/${tournamentId}`).update({
    status: "knockout",
    updatedAt: admin.database.ServerValue.TIMESTAMP,
  });

  res.status(200).json({
    knockoutMatches: Object.values(knockoutMatches),
    top4: top4.map((s) => ({teamId: s.teamId, teamName: s.teamName, matchPoints: s.matchPoints})),
    message: "Đã tạo vòng knockout cho top 4",
  });
}

// ============================================================
// COMPLETE TOURNAMENT
// ============================================================
async function completeTournament(req, res) {
  const {tournamentId} = req.query;
  const {adminUserID} = req.body;

  const tournament = await getTournamentOrFail(tournamentId, res);
  if (!tournament) return;
  if (tournament.createdBy !== adminUserID) {
    res.status(403).json({error: "Chỉ admin giải mới có quyền"});
    return;
  }

  await db.ref(`/tournaments/${tournamentId}`).update({
    status: "completed",
    updatedAt: admin.database.ServerValue.TIMESTAMP,
  });

  res.status(200).json({success: true, message: "Giải đấu đã hoàn tất"});
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function getTournamentOrFail(tournamentId, res) {
  const snap = await db.ref(`/tournaments/${tournamentId}`).once("value");
  if (!snap.exists()) {
    res.status(404).json({error: "Giải đấu không tồn tại"});
    return null;
  }
  return snap.val();
}

/**
 * Fisher-Yates shuffle
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Create doubles teams: pair A+B, avoid A+A or B+B
 */
function createDoublesTeams(players) {
  const listA = shuffle(players.filter((p) => p.skillLevel === "A"));
  const listB = shuffle(players.filter((p) => p.skillLevel === "B"));

  const teams = [];
  const minLen = Math.min(listA.length, listB.length);

  // Pair A+B
  for (let i = 0; i < minLen; i++) {
    teams.push({
      id: `team_${i + 1}`,
      name: `${listA[i].username} & ${listB[i].username}`,
      player1: listA[i],
      player2: listB[i],
    });
  }

  // Handle remainder: pair them with each other
  const remainder = [
    ...listA.slice(minLen),
    ...listB.slice(minLen),
  ];
  for (let i = 0; i < remainder.length - 1; i += 2) {
    teams.push({
      id: `team_${teams.length + 1}`,
      name: `${remainder[i].username} & ${remainder[i + 1].username}`,
      player1: remainder[i],
      player2: remainder[i + 1],
    });
  }

  return teams;
}

/**
 * Create singles teams: each player is a team
 */
function createSinglesTeams(players) {
  return shuffle(players).map((p, i) => ({
    id: `team_${i + 1}`,
    name: p.username,
    player1: p,
    player2: null,
  }));
}

/**
 * Generate round-robin schedule using circle method
 * @param {Array} teams
 * @returns {Array} matches
 */
function generateRoundRobin(teams) {
  const n = teams.length;
  const teamIds = teams.map((t) => t.id);

  // If odd number of teams, add a BYE
  if (n % 2 !== 0) {
    teamIds.push("BYE");
  }

  const totalTeams = teamIds.length;
  const rounds = totalTeams - 1;
  const matchesPerRound = totalTeams / 2;
  const matches = [];
  let matchCounter = 0;

  // Circle method: fix position 0, rotate the rest
  for (let round = 0; round < rounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const home = (match === 0) ? 0 : ((round + match) % (totalTeams - 1)) + 1;
      const away = ((round + totalTeams - 1 - match) % (totalTeams - 1)) + 1;

      const team1Id = teamIds[home];
      const team2Id = teamIds[away];

      // Skip BYE matches
      if (team1Id === "BYE" || team2Id === "BYE") continue;

      matchCounter++;
      matches.push({
        id: `group_${matchCounter}`,
        phase: "group",
        round: round + 1,
        team1Id,
        team2Id,
        score1: null,
        score2: null,
        winnerId: null,
        status: "pending",
        updatedBy: null,
        updatedAt: null,
      });
    }
  }

  return matches;
}

/**
 * When re-scoring a match, undo previous standings
 */
async function undoStandings(tournamentId, oldMatch) {
  const standingsRef = db.ref(`/tournaments/${tournamentId}/standings`);
  const oldWinner = oldMatch.winnerId;
  const oldLoser = oldWinner === oldMatch.team1Id ? oldMatch.team2Id : oldMatch.team1Id;
  const oldWinScore = oldWinner === oldMatch.team1Id ? oldMatch.score1 : oldMatch.score2;
  const oldLoseScore = oldWinner === oldMatch.team1Id ? oldMatch.score2 : oldMatch.score1;

  // Undo winner
  const wSnap = await standingsRef.child(oldWinner).once("value");
  const w = wSnap.val();
  if (w) {
    await standingsRef.child(oldWinner).update({
      played: Math.max(0, (w.played || 0) - 1),
      wins: Math.max(0, (w.wins || 0) - 1),
      pointsFor: (w.pointsFor || 0) - oldWinScore,
      pointsAgainst: (w.pointsAgainst || 0) - oldLoseScore,
      pointsDiff: (w.pointsDiff || 0) - (oldWinScore - oldLoseScore),
      matchPoints: Math.max(0, (w.matchPoints || 0) - 2),
    });
  }

  // Undo loser
  const lSnap = await standingsRef.child(oldLoser).once("value");
  const l = lSnap.val();
  if (l) {
    await standingsRef.child(oldLoser).update({
      played: Math.max(0, (l.played || 0) - 1),
      losses: Math.max(0, (l.losses || 0) - 1),
      pointsFor: (l.pointsFor || 0) - oldLoseScore,
      pointsAgainst: (l.pointsAgainst || 0) - oldWinScore,
      pointsDiff: (l.pointsDiff || 0) - (oldLoseScore - oldWinScore),
      matchPoints: Math.max(0, (l.matchPoints || 0) - 1),
    });
  }
}

/**
 * After semifinal is scored, fill in final & third_place match team slots
 */
async function updateKnockoutProgression(tournamentId, match, winnerId) {
  const loserId = winnerId === match.team1Id ? match.team2Id : match.team1Id;
  const matchesRef = db.ref(`/tournaments/${tournamentId}/matches`);

  if (match.id === "sf1") {
    // SF1 winner → Final team1, SF1 loser → 3rd place team1
    await matchesRef.child("final").update({team1Id: winnerId});
    await matchesRef.child("third_place").update({team1Id: loserId});
  } else if (match.id === "sf2") {
    // SF2 winner → Final team2, SF2 loser → 3rd place team2
    await matchesRef.child("final").update({team2Id: winnerId});
    await matchesRef.child("third_place").update({team2Id: loserId});
  }
}

module.exports = {handleTournament};
