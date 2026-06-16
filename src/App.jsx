import { useEffect, useMemo, useState } from "react";
import "./index.css";

const weaponOptions = [
  "Nameless Sword",
  "Strategic Sword",
  "Nameless Spear",
  "Stormbreaker",
  "Heavenquaker Spear",
  "Infernal Twinblades",
  "Panacea Fan",
  "Inkwell Fan",
  "Vernal Umbrella",
  "Soulshade Umbrella",
  "Thundercry Blade",
  "Mortal Rope Dart",
];

const roleOptions = ["Tank", "DPS", "Healer"];
const days = ["Saturday", "Sunday"];
const eventOptions = ["League Game", "Game 1", "Game 2", "Game 3", "Game 4"];
const DEFAULT_TEAMS = ["Offense 1", "Offense 2", "Offense 3", "Defense A", "Defense B", "Defense C"];
const STORAGE_KEY = "bear-guild-war-v8";
const TEAMS_STORAGE_KEY = "bear-guild-war-teams-v8";
const ADMIN_KEY = "bear-guild-war-admin-v8";

const starterRegistrations = [
  {
    id: 1,
    playerName: "Bear Player",
    discordName: "bearplayer",
    role: "Tank",
    weapon1: "Thundercry Blade",
    weapon2: "Stormbreaker",
    saturday: true,
    sunday: true,
    saturdayEvents: ["League Game"],
    sundayEvents: ["League Game"],
    notes: "Main tank",
    assignedDay: "",
    assignedTeam: "",
  },
];

function emptyForm() {
  return {
    playerName: "",
    discordName: "",
    role: "DPS",
    weapon1: "Nameless Sword",
    weapon2: "Strategic Sword",
    saturday: true,
    sunday: false,
    saturdayEvents: ["League Game"],
    sundayEvents: [],
    notes: "",
  };
}
function getRoleStyle(role) {
  if (role === "Tank") return "role tank";
  if (role === "Healer") return "role healer";
  return "role dps";
}

function normalizeEventName(eventName) {
  return eventName === "League" ? "League Game" : eventName;
}

function normalizeEventList(player, pluralField, legacyField, defaultList = []) {
  if (Array.isArray(player[pluralField])) {
    const cleaned = player[pluralField]
      .map(normalizeEventName)
      .filter((eventName) => eventOptions.includes(eventName));
    return cleaned.length ? [...new Set(cleaned)] : defaultList;
  }

  const legacyEvent = normalizeEventName(player[legacyField]);
  if (eventOptions.includes(legacyEvent)) return [legacyEvent];

  return defaultList;
}

function normalizePlayer(player) {
  return {
    id: player.id || Date.now() + Math.random(),
    playerName: player.playerName || "",
    discordName: player.discordName || "",
    role: player.role || "DPS",
    weapon1: player.weapon1 || "Nameless Sword",
    weapon2: player.weapon2 || "Strategic Sword",
    saturday: Boolean(player.saturday),
    sunday: Boolean(player.sunday),
    saturdayEvents: normalizeEventList(player, "saturdayEvents", "saturdayEvent", ["League Game"]),
    sundayEvents: normalizeEventList(player, "sundayEvents", "sundayEvent", []),
    notes: player.notes || "",
    assignedDay: player.assignedDay || "",
    assignedEvent: eventOptions.includes(normalizeEventName(player.assignedEvent)) ? normalizeEventName(player.assignedEvent) : "",
    assignedTeam: player.assignedTeam || "",
  };
}

function getInitialRegistrations() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.map(normalizePlayer);
    }
  } catch {
    // Use starter data if saved data is broken.
  }

  return starterRegistrations.map(normalizePlayer);
}

function getInitialTeams() {
  try {
    const saved = localStorage.getItem(TEAMS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.Saturday) && Array.isArray(parsed.Sunday)) {
        return {
          Saturday: parsed.Saturday.length ? parsed.Saturday : DEFAULT_TEAMS,
          Sunday: parsed.Sunday.length ? parsed.Sunday : DEFAULT_TEAMS,
        };
      }
    }
  } catch {
    // Use default teams if saved data is broken.
  }

  return {
    Saturday: DEFAULT_TEAMS,
    Sunday: DEFAULT_TEAMS,
  };
}

export default function App() {
  const [page, setPage] = useState("guild-war");
  const [activeDay, setActiveDay] = useState("Saturday");
  const [activeEvent, setActiveEvent] = useState("League Game");
  const [registrations, setRegistrations] = useState(getInitialRegistrations);
  const [teamsByDay, setTeamsByDay] = useState(getInitialTeams);
  const [newTeamName, setNewTeamName] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [adminUnlocked, setAdminUnlocked] = useState(() => localStorage.getItem(ADMIN_KEY) === "true");
  const [adminPassword, setAdminPassword] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
  }, [registrations]);

  useEffect(() => {
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teamsByDay));
  }, [teamsByDay]);

  useEffect(() => {
    localStorage.setItem(ADMIN_KEY, adminUnlocked ? "true" : "false");
  }, [adminUnlocked]);

  const activeTeamOptions = teamsByDay[activeDay] || DEFAULT_TEAMS;

  const activeEventField = activeDay === "Saturday" ? "saturdayEvents" : "sundayEvents";

  const visibleRegistrations = useMemo(() => {
    return registrations.filter((player) => {
      const available = activeDay === "Saturday" ? player.saturday : player.sunday;
      const eventList = Array.isArray(player[activeEventField]) ? player[activeEventField] : [];
      return available && eventList.includes(activeEvent);
    });
  }, [registrations, activeDay, activeEvent, activeEventField]);

  const dayEventField = activeDay === "Saturday" ? "saturdayEvents" : "sundayEvents";

  const dayRegistrations = useMemo(() => {
    return registrations.filter((player) => {
      const available = activeDay === "Saturday" ? player.saturday : player.sunday;
      const eventList = Array.isArray(player[dayEventField]) ? player[dayEventField] : [];
      return available && eventList.length > 0;
    });
  }, [registrations, activeDay, dayEventField]);

  const dayAssignedCount = dayRegistrations.filter(
    (player) => player.assignedDay === activeDay && player.assignedTeam
  ).length;
  const dayUnassignedCount = Math.max(0, dayRegistrations.length - dayAssignedCount);

  const unassigned = visibleRegistrations.filter(
    (player) => player.assignedDay !== activeDay || player.assignedEvent !== activeEvent || !player.assignedTeam
  );

  const assigned = visibleRegistrations.filter(
    (player) => player.assignedDay === activeDay && player.assignedEvent === activeEvent && player.assignedTeam
  );
  const assignedCount = assigned.length;
  const canAssignMorePlayers = assignedCount < 30;

  const duplicateNames = useMemo(() => {
    const counts = {};
    registrations.forEach((player) => {
      const name = player.playerName.trim().toLowerCase();
      if (!name) return;
      counts[name] = (counts[name] || 0) + 1;
    });

    return Object.keys(counts).filter((name) => counts[name] > 1);
  }, [registrations]);

  const weaponCounts = useMemo(() => {
    const counts = {};
    visibleRegistrations.forEach((player) => {
      [player.weapon1, player.weapon2].forEach((weapon) => {
        if (!weapon) return;
        counts[weapon] = (counts[weapon] || 0) + 1;
      });
    });

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [visibleRegistrations]);

  const roleCounts = useMemo(() => {
    return visibleRegistrations.reduce(
      (counts, player) => {
        counts[player.role] = (counts[player.role] || 0) + 1;
        return counts;
      },
      { Tank: 0, DPS: 0, Healer: 0 }
    );
  }, [visibleRegistrations]);

  function getTeamPlayers(teamName) {
    return assigned.filter((player) => player.assignedTeam === teamName);
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleFormEvent(dayField, eventName, checked) {
    setForm((current) => {
      const currentEvents = Array.isArray(current[dayField]) ? current[dayField] : [];
      const nextEvents = checked
        ? [...new Set([...currentEvents, eventName])]
        : currentEvents.filter((item) => item !== eventName);

      return { ...current, [dayField]: nextEvents };
    });
  }

  function togglePlayerEvent(playerId, dayField, eventName, checked) {
    const player = registrations.find((item) => item.id === playerId);
    if (!player) return;

    const currentEvents = Array.isArray(player[dayField]) ? player[dayField] : [];
    const nextEvents = checked
      ? [...new Set([...currentEvents, eventName])]
      : currentEvents.filter((item) => item !== eventName);

    updatePlayer(playerId, dayField, nextEvents);
  }

  function submitRegistration(event) {
    event.preventDefault();

    if (!form.playerName.trim()) {
      alert("Please enter your player name.");
      return;
    }

    if (!form.saturday && !form.sunday) {
      alert("Please choose at least Saturday or Sunday.");
      return;
    }

    if (form.saturday && form.saturdayEvents.length === 0) {
      alert("Please choose at least one Saturday option.");
      return;
    }

    if (form.sunday && form.sundayEvents.length === 0) {
      alert("Please choose at least one Sunday option.");
      return;
    }

    const newPlayer = {
      id: Date.now(),
      ...form,
      playerName: form.playerName.trim(),
      discordName: form.discordName.trim(),
      notes: form.notes.trim(),
      assignedDay: "",
      assignedEvent: "",
      assignedTeam: "",
    };

    setRegistrations((current) => [newPlayer, ...current]);
    setForm(emptyForm());
    setPage("guild-war");
    alert("Registration submitted.");
  }

  function loginAdmin(event) {
    event.preventDefault();

    if (adminPassword.trim() === "BEAR") {
      setAdminUnlocked(true);
      setAdminPassword("");
      return;
    }

    alert("Wrong password. Admin password is BEAR.");
  }

  function logoutAdmin() {
    setAdminUnlocked(false);
    setPage("guild-war");
  }

  function updatePlayer(id, field, value) {
    setRegistrations((current) =>
      current.map((player) => {
        if (player.id !== id) return player;
        const nextPlayer = { ...player, [field]: value };

        if (field === "saturday" && !value && player.assignedDay === "Saturday") {
          nextPlayer.assignedDay = "";
          nextPlayer.assignedEvent = "";
          nextPlayer.assignedTeam = "";
        }

        if (field === "sunday" && !value && player.assignedDay === "Sunday") {
          nextPlayer.assignedDay = "";
          nextPlayer.assignedEvent = "";
          nextPlayer.assignedTeam = "";
        }

        if (field === "saturdayEvents" && player.assignedDay === "Saturday" && !value.includes(player.assignedEvent)) {
          nextPlayer.assignedDay = "";
          nextPlayer.assignedEvent = "";
          nextPlayer.assignedTeam = "";
        }

        if (field === "sundayEvents" && player.assignedDay === "Sunday" && !value.includes(player.assignedEvent)) {
          nextPlayer.assignedDay = "";
          nextPlayer.assignedEvent = "";
          nextPlayer.assignedTeam = "";
        }

        return nextPlayer;
      })
    );
  }

  function assignPlayer(id, teamName, targetPlayerId = null) {
    const playerToAssign = registrations.find((player) => player.id === id);
    const alreadyAssignedThisDay =
      playerToAssign?.assignedDay === activeDay && playerToAssign?.assignedEvent === activeEvent && Boolean(playerToAssign?.assignedTeam);

    if (teamName && !alreadyAssignedThisDay && assignedCount >= 30) {
      alert("Maximum assigned players is 30 for this day.");
      return;
    }

    setRegistrations((current) => {
      const movingIndex = current.findIndex((player) => player.id === id);
      if (movingIndex < 0) return current;

      const movingPlayer = current[movingIndex];

      if (!teamName) {
        const movedPlayer = {
          ...movingPlayer,
          assignedDay: "",
          assignedEvent: "",
          assignedTeam: "",
        };

        const withoutMoving = current.filter((player) => player.id !== id);
        return [movedPlayer, ...withoutMoving];
      }

      const targetIndex = targetPlayerId
        ? current.findIndex((player) => player.id === targetPlayerId)
        : -1;

      if (targetIndex >= 0) {
        const targetPlayer = current[targetIndex];
        const movingIsAssigned =
          movingPlayer.assignedDay === activeDay && movingPlayer.assignedEvent === activeEvent && Boolean(movingPlayer.assignedTeam);
        const targetIsAssigned =
          targetPlayer.assignedDay === activeDay && targetPlayer.assignedEvent === activeEvent && Boolean(targetPlayer.assignedTeam);

        // If both players are already assigned on the active day, swap their exact positions.
        // This lets admin drag D onto B and have D/B trade places, even inside the same team.
        if (movingIsAssigned && targetIsAssigned) {
          const next = [...current];
          next[movingIndex] = {
            ...targetPlayer,
            assignedDay: movingPlayer.assignedDay,
            assignedEvent: movingPlayer.assignedEvent,
            assignedTeam: movingPlayer.assignedTeam,
          };
          next[targetIndex] = {
            ...movingPlayer,
            assignedDay: targetPlayer.assignedDay,
            assignedEvent: targetPlayer.assignedEvent,
            assignedTeam: targetPlayer.assignedTeam,
          };
          return next;
        }

        // If dragging from Unassigned onto a team player, add the dragged player above the target.
        const movedPlayer = {
          ...movingPlayer,
          assignedDay: activeDay,
          assignedEvent: activeEvent,
          assignedTeam: teamName,
        };
        const withoutMoving = current.filter((player) => player.id !== id);
        const newTargetIndex = withoutMoving.findIndex((player) => player.id === targetPlayerId);
        const next = [...withoutMoving];
        next.splice(Math.max(0, newTargetIndex), 0, movedPlayer);
        return next;
      }

      const movedPlayer = {
        ...movingPlayer,
        assignedDay: activeDay,
        assignedEvent: activeEvent,
        assignedTeam: teamName,
      };

      const withoutMoving = current.filter((player) => player.id !== id);
      let insertAfterIndex = -1;

      withoutMoving.forEach((player, index) => {
        if (player.assignedDay === activeDay && player.assignedEvent === activeEvent && player.assignedTeam === teamName) {
          insertAfterIndex = index;
        }
      });

      const next = [...withoutMoving];
      next.splice(insertAfterIndex + 1, 0, movedPlayer);
      return next;
    });
  }

  function handleDragStartPlayer(event, playerId) {
    if (!adminUnlocked) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(playerId));
    event.dataTransfer.setData("application/json", JSON.stringify({ playerId }));
  }

  function getDraggedPlayerId(event) {
    const jsonData = event.dataTransfer.getData("application/json");
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed?.playerId) return Number(parsed.playerId);
      } catch {
        // Fall back to text/plain below.
      }
    }

    const rawId = event.dataTransfer.getData("text/plain");
    return Number(rawId);
  }

  function handleDropPlayer(event, teamName, targetPlayerId = null) {
    if (!adminUnlocked) return;
    event.preventDefault();
    event.stopPropagation();
    const playerId = getDraggedPlayerId(event);
    if (!playerId) return;
    if (targetPlayerId && playerId === targetPlayerId) return;
    assignPlayer(playerId, teamName, targetPlayerId);
  }

  function handleDragOverPlayer(event) {
    if (!adminUnlocked) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function addTeam() {
    const cleanName = newTeamName.trim();
    const nextName = cleanName || `Team ${activeTeamOptions.length + 1}`;

    if (activeTeamOptions.includes(nextName)) {
      alert("A team with that name already exists for this day.");
      return;
    }

    setTeamsByDay((current) => ({
      ...current,
      [activeDay]: [...(current[activeDay] || []), nextName],
    }));
    setNewTeamName("");
  }

  function removeTeam(teamName) {
    const teamPlayers = getTeamPlayers(teamName);
    const answer = window.confirm(
      teamPlayers.length > 0
        ? `Remove ${teamName}? ${teamPlayers.length} players will become unassigned.`
        : `Remove ${teamName}?`
    );
    if (!answer) return;

    setTeamsByDay((current) => ({
      ...current,
      [activeDay]: (current[activeDay] || []).filter((team) => team !== teamName),
    }));

    setRegistrations((current) =>
      current.map((player) =>
        player.assignedDay === activeDay && player.assignedEvent === activeEvent && player.assignedTeam === teamName
          ? { ...player, assignedDay: "", assignedEvent: "", assignedTeam: "" }
          : player
      )
    );
  }

  function movePlayerToDay(id, day) {
    setRegistrations((current) =>
      current.map((player) => {
        if (player.id !== id) return player;
        const dayField = day === "Saturday" ? "saturdayEvents" : "sundayEvents";
        const eventList = Array.isArray(player[dayField]) ? player[dayField] : [];

        return {
          ...player,
          assignedDay: "",
          assignedEvent: "",
          assignedTeam: "",
          saturday: day === "Saturday" ? true : player.saturday,
          sunday: day === "Sunday" ? true : player.sunday,
          [dayField]: eventList.includes(activeEvent) ? eventList : [...eventList, activeEvent],
        };
      })
    );
    setActiveDay(day);
  }

  function removePlayer(id) {
    const answer = window.confirm("Remove this registration?");
    if (!answer) return;

    setRegistrations((current) => current.filter((player) => player.id !== id));
  }

  function resetDemoData() {
    const answer = window.confirm("Reset all local test data back to the starter sample?");
    if (!answer) return;
    setRegistrations(starterRegistrations.map(normalizePlayer));
    setTeamsByDay({ Saturday: DEFAULT_TEAMS, Sunday: DEFAULT_TEAMS });
  }

  function clearAssignmentsForDay() {
    const answer = window.confirm(`Clear all ${activeDay} ${activeEvent} team assignments?`);
    if (!answer) return;

    setRegistrations((current) =>
      current.map((player) =>
        player.assignedDay === activeDay
          ? { ...player, assignedDay: "", assignedEvent: "", assignedTeam: "" }
          : player
      )
    );
  }

  function copyDiscordPlan() {
    const lines = [`**BEAR Guild War - ${activeDay} ${activeEvent}**`, ""];

    activeTeamOptions.forEach((teamName) => {
      const teamPlayers = getTeamPlayers(teamName);
      if (teamPlayers.length === 0) return;

      lines.push(`**${teamName}**`);
      teamPlayers.forEach((player) => {
        lines.push(
          `- ${player.role}: ${player.playerName} (${player.weapon1} / ${player.weapon2})${
            player.notes ? ` - ${player.notes}` : ""
          }`
        );
      });
      lines.push("");
    });

    if (assigned.length === 0) {
      lines.push("No assigned teams yet.");
    }

    navigator.clipboard.writeText(lines.join("\n"));
    alert("Discord plan copied.");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">🐻 BEAR Guild War</div>
          <div className="subtitle">Where Winds Meet GvG registration and team planning</div>
        </div>

        <nav className="nav">
          <button
            className={page === "guild-war" ? "nav-btn active" : "nav-btn"}
            onClick={() => setPage("guild-war")}
          >
            Guild War
          </button>
          <button
            className={page === "register" ? "nav-btn active" : "nav-btn"}
            onClick={() => setPage("register")}
          >
            Registration Form
          </button>
          <button
            className={page === "admin" ? "nav-btn active" : "nav-btn"}
            onClick={() => setPage("admin")}
          >
            {adminUnlocked ? "Admin" : "Admin Login"}
          </button>
        </nav>
      </header>

      <main className="page">
        {page === "guild-war" && (
          <>
            <section className="hero-card">
              <div>
                <h1>Guild War</h1>
                <p>Members register themselves. Admin assigns teams and adjusts the plan.</p>
              </div>

              <div className="tab-stack">
                <div className="day-tabs">
                  {days.map((day) => (
                    <button
                      key={day}
                      className={activeDay === day ? "day-btn active" : "day-btn"}
                      onClick={() => setActiveDay(day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <div className="event-tabs">
                  {eventOptions.map((eventName) => (
                    <button
                      key={eventName}
                      className={activeEvent === eventName ? "event-btn active" : "event-btn"}
                      onClick={() => setActiveEvent(eventName)}
                    >
                      {eventName}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="summary-row">
              <SummaryBox title="Registered" value={visibleRegistrations.length} />
              <SummaryBox title="Unassigned" value={unassigned.length} />
              <SummaryBox title="Assigned" value={`${assignedCount}/30`} />
              <SummaryBox title="Tank" value={roleCounts.Tank} />
              <SummaryBox title="DPS" value={roleCounts.DPS} />
              <SummaryBox title="Healer" value={roleCounts.Healer} />
            </div>

            {duplicateNames.length > 0 && (
              <section className="warning-card">
                Duplicate player warning: {duplicateNames.join(", ")}
              </section>
            )}

            <div className="layout-grid wide">
              <section
                className="panel"
                onDragOver={handleDragOverPlayer}
                onDrop={(event) => handleDropPlayer(event, "")}
              >
                <div className="panel-title">
                  <h2>Unassigned</h2>
                  <span>{unassigned.length}</span>
                </div>
                {/* Unassigned drop area stays clean; drag/drop still works for admin. */}

                <div className="player-list">
                  {unassigned.length === 0 ? (
                    <div className="empty">No unassigned players for {activeDay}.</div>
                  ) : (
                    unassigned.map((player) => (
                      <PlayerCard
                        key={player.id}
                        player={player}
                        duplicateNames={duplicateNames}
                        draggable={adminUnlocked}
                        onDragStart={handleDragStartPlayer}
                      />
                    ))
                  )}
                </div>
              </section>

              <section className="panel team-panel-main">
                <div className="panel-title">
                  <h2>Assigned Teams</h2>
                  <span>{assignedCount}/30</span>
                </div>

                {adminUnlocked && <div className="drag-hint">Admin: drag players into teams, between teams, or drop on a player to swap position.</div>}

                <div className="team-grid">
                  {activeTeamOptions.map((teamName) => (
                    <TeamBox
                      key={teamName}
                      teamName={teamName}
                      players={getTeamPlayers(teamName)}
                      adminUnlocked={adminUnlocked}
                      onDragOver={handleDragOverPlayer}
                      onDropPlayer={handleDropPlayer}
                      onDragStartPlayer={handleDragStartPlayer}
                    />
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="panel-title">
                  <h2>Weapon Count</h2>
                  <span>{weaponCounts.length}</span>
                </div>

                {weaponCounts.length === 0 ? (
                  <div className="empty">No weapons selected.</div>
                ) : (
                  <div className="weapon-list">
                    {weaponCounts.map(([weapon, count]) => (
                      <div key={weapon} className="weapon-row">
                        <span>{weapon}</span>
                        <strong>{count}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}

        {page === "register" && (
          <section className="form-card">
            <h1>Registration Form</h1>
            <p>Members submit this form themselves. Admin can adjust later.</p>

            <form onSubmit={submitRegistration} className="form-grid">
              <label>
                Player name
                <input
                  value={form.playerName}
                  onChange={(event) => updateForm("playerName", event.target.value)}
                  placeholder="Your in-game name"
                />
              </label>

              <label>
                Discord name
                <input
                  value={form.discordName}
                  onChange={(event) => updateForm("discordName", event.target.value)}
                  placeholder="Your Discord name"
                />
              </label>

              <label>
                Main role
                <select
                  value={form.role}
                  onChange={(event) => updateForm("role", event.target.value)}
                >
                  {roleOptions.map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </label>

              <label>
                Weapon 1
                <select
                  value={form.weapon1}
                  onChange={(event) => updateForm("weapon1", event.target.value)}
                >
                  {weaponOptions.map((weapon) => (
                    <option key={weapon}>{weapon}</option>
                  ))}
                </select>
              </label>

              <label>
                Weapon 2
                <select
                  value={form.weapon2}
                  onChange={(event) => updateForm("weapon2", event.target.value)}
                >
                  {weaponOptions.map((weapon) => (
                    <option key={weapon}>{weapon}</option>
                  ))}
                </select>
              </label>

              <div className="availability-grid full">
                <div className="availability-card">
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={form.saturday}
                      onChange={(event) => updateForm("saturday", event.target.checked)}
                    />
                    Available Saturday
                  </label>
                  <div className="event-checkbox-list">
                    {eventOptions.map((eventName) => (
                      <label key={eventName} className="check-label compact event-check">
                        <input
                          type="checkbox"
                          checked={form.saturdayEvents.includes(eventName)}
                          disabled={!form.saturday}
                          onChange={(event) => toggleFormEvent("saturdayEvents", eventName, event.target.checked)}
                        />
                        {eventName}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="availability-card">
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={form.sunday}
                      onChange={(event) => updateForm("sunday", event.target.checked)}
                    />
                    Available Sunday
                  </label>
                  <div className="event-checkbox-list">
                    {eventOptions.map((eventName) => (
                      <label key={eventName} className="check-label compact event-check">
                        <input
                          type="checkbox"
                          checked={form.sundayEvents.includes(eventName)}
                          disabled={!form.sunday}
                          onChange={(event) => toggleFormEvent("sundayEvents", eventName, event.target.checked)}
                        />
                        {eventName}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <label className="full">
                Notes
                <textarea
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                  placeholder="Example: can shotcall, backup healer, late by 10 minutes"
                />
              </label>

              <button type="submit" className="primary-btn">
                Submit Registration
              </button>
            </form>
          </section>
        )}

        {page === "admin" && (
          <section className="form-card admin-card">
            <h1>Admin</h1>
            {!adminUnlocked ? (
              <form onSubmit={loginAdmin} className="admin-login">
                <p>Admin password:</p>
                <code>admin</code>
                <label>
                  Admin password
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                    placeholder="Enter password"
                  />
                </label>
                <button type="submit" className="primary-btn">
                  Login
                </button>
              </form>
            ) : (
              <>
                <div className="admin-header">
                  <div>
                    <h2>Manage Registrations</h2>
                    <p>Changes save automatically in this browser for now.</p>
                  </div>
                  <div className="admin-actions">
                    <div className="tab-stack compact-tabs">
                      <div className="day-tabs small">
                        {days.map((day) => (
                          <button
                            key={day}
                            className={activeDay === day ? "day-btn active" : "day-btn"}
                            onClick={() => setActiveDay(day)}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      <div className="event-tabs small">
                        {eventOptions.map((eventName) => (
                          <button
                            key={eventName}
                            className={activeEvent === eventName ? "event-btn active" : "event-btn"}
                            onClick={() => setActiveEvent(eventName)}
                          >
                            {eventName}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button type="button" className="secondary-btn" onClick={copyDiscordPlan}>
                      Copy Discord Plan
                    </button>
                    <button type="button" className="danger-btn padded" onClick={clearAssignmentsForDay}>
                      Clear {activeDay} {activeEvent}
                    </button>
                    <button type="button" className="secondary-btn" onClick={logoutAdmin}>
                      Logout
                    </button>
                  </div>
                </div>

                <div className="admin-overview-layout">
                  <section className="overview-card">
                    <div className="overview-head">
                      <div>
                        <h2>{activeDay} ({dayRegistrations.length} registrations)</h2>
                        <p className="small-muted">P = participating, A = assigned to a team. Use the selected match below when assigning a team.</p>
                      </div>
                      <div className="overview-pills">
                        <span>Assigned: {dayAssignedCount}</span>
                        <span>Unassigned: {dayUnassignedCount}</span>
                      </div>
                    </div>

                    <div className="overview-controls">
                      <div className="event-tabs small">
                        {eventOptions.map((eventName) => (
                          <button
                            key={eventName}
                            className={activeEvent === eventName ? "event-btn active" : "event-btn"}
                            onClick={() => setActiveEvent(eventName)}
                          >
                            {eventName}
                          </button>
                        ))}
                      </div>
                      <div className="legend-row">
                        <span>P = Participating</span>
                        <span>A = Assigned</span>
                      </div>
                    </div>

                    <div className="overview-table-wrap">
                      <table className="overview-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Primary Role</th>
                            <th>Team for {activeEvent}</th>
                            {eventOptions.map((eventName) => (
                              <th key={eventName}>{eventName}</th>
                            ))}
                            <th>Notes</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayRegistrations.length === 0 ? (
                            <tr>
                              <td colSpan={eventOptions.length + 5} className="empty-table-cell">
                                No registrations for {activeDay} yet.
                              </td>
                            </tr>
                          ) : (
                            dayRegistrations.map((player) => {
                              const eventList = Array.isArray(player[dayEventField]) ? player[dayEventField] : [];
                              const canAssignThisEvent = eventList.includes(activeEvent);
                              const assignedForActiveEvent =
                                player.assignedDay === activeDay && player.assignedEvent === activeEvent;
                              const teamValue = assignedForActiveEvent ? player.assignedTeam : "";
                              const isDuplicate = duplicateNames.includes(player.playerName.trim().toLowerCase());

                              return (
                                <tr key={player.id} className={isDuplicate ? "duplicate-row" : ""}>
                                  <td>
                                    <strong>{player.playerName}</strong>
                                    <small>@{player.discordName || "discord"}</small>
                                  </td>
                                  <td>
                                    <select
                                      value={player.role}
                                      onChange={(event) => updatePlayer(player.id, "role", event.target.value)}
                                    >
                                      {roleOptions.map((role) => (
                                        <option key={role}>{role}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td>
                                    <select
                                      value={teamValue}
                                      disabled={!canAssignThisEvent}
                                      onChange={(event) => assignPlayer(player.id, event.target.value)}
                                    >
                                      <option value="">Not assigned</option>
                                      {activeTeamOptions.map((teamName) => (
                                        <option key={teamName} value={teamName}>{teamName}</option>
                                      ))}
                                    </select>
                                    {!canAssignThisEvent && <small>Not registered for selected match</small>}
                                  </td>
                                  {eventOptions.map((eventName) => {
                                    const participating = eventList.includes(eventName);
                                    const assignedToEvent =
                                      player.assignedDay === activeDay &&
                                      player.assignedEvent === eventName &&
                                      player.assignedTeam;
                                    return (
                                      <td key={eventName} className={assignedToEvent ? "status assigned" : participating ? "status participating" : "status blank"}>
                                        {assignedToEvent ? "A" : participating ? "P" : ""}
                                      </td>
                                    );
                                  })}
                                  <td>
                                    <textarea
                                      value={player.notes}
                                      onChange={(event) => updatePlayer(player.id, "notes", event.target.value)}
                                      placeholder="Notes"
                                    />
                                  </td>
                                  <td>
                                    <button type="button" className="danger-btn small-btn" onClick={() => removePlayer(player.id)}>
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="panel team-manager-panel">
                    <div className="panel-title">
                      <h2>{activeDay} Teams</h2>
                      <span>{activeTeamOptions.length}</span>
                    </div>
                    <div className="add-team-row">
                      <input
                        value={newTeamName}
                        onChange={(event) => setNewTeamName(event.target.value)}
                        placeholder="New team name"
                      />
                      <button type="button" className="secondary-btn" onClick={addTeam}>
                        + Team
                      </button>
                    </div>
                    <div className="team-manage-list compact-team-list">
                      {activeTeamOptions.map((teamName) => (
                        <div key={teamName} className="team-manage-row">
                          <span>{teamName}</span>
                          <button type="button" className="danger-btn small-btn" onClick={() => removeTeam(teamName)}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </>
            )}
          </section>
        )}
      </main>

      <footer className="footer">© BEAR Guild War Planner</footer>
    </div>
  );
}

function SummaryBox({ title, value }) {
  return (
    <div className="summary-box">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PlayerCard({ player, duplicateNames = [], draggable = false, onDragStart }) {
  const isDuplicate = duplicateNames.includes(player.playerName.trim().toLowerCase());

  return (
    <div
      className={isDuplicate ? "player-card duplicate" : "player-card"}
      draggable={draggable}
      onDragStart={(event) => onDragStart?.(event, player.id)}
      title={draggable ? "Admin: drag to an assigned team" : undefined}
    >
      <div className="player-top">
        <strong>{player.playerName}</strong>
        <span className={getRoleStyle(player.role)}>{player.role}</span>
      </div>
      <div className="player-meta">@{player.discordName || "discord"}</div>
      <div className="player-weapons">
        <span>{player.weapon1}</span>
        <span>{player.weapon2}</span>
      </div>
      {player.notes && <div className="player-notes">{player.notes}</div>}
      {isDuplicate && <div className="duplicate-note">Duplicate name</div>}
    </div>
  );
}

function TeamBox({ teamName, players, adminUnlocked = false, onDragOver, onDropPlayer, onDragStartPlayer }) {
  return (
    <div
      className={adminUnlocked ? "team-box team-box-droppable" : "team-box"}
      onDragOver={onDragOver}
      onDrop={(event) => onDropPlayer?.(event, teamName)}
      title={adminUnlocked ? "Admin: drop player here. Drop on another player to swap position." : undefined}
    >
      <div className="team-box-title">
        <strong>{teamName}</strong>
        <span>{players.length}</span>
      </div>

      {players.length === 0 ? (
        <div className="team-empty">No players</div>
      ) : (
        players.map((player) => (
          <div
            key={player.id}
            className={adminUnlocked ? "team-player-line sortable" : "team-player-line"}
            draggable={adminUnlocked}
            onDragStart={(event) => onDragStartPlayer?.(event, player.id)}
            onDragOver={onDragOver}
            onDrop={(event) => onDropPlayer?.(event, teamName, player.id)}
            title={adminUnlocked ? "Drag to move. Drop another player here to swap positions." : undefined}
          >
            <span className={getRoleStyle(player.role)}>{player.role}</span>
            <strong>{player.playerName}</strong>
            <small>{player.weapon1} / {player.weapon2}</small>
          </div>
        ))
      )}
    </div>
  );
}

function AdminPlayerRow({
  player,
  activeDay,
  updatePlayer,
  togglePlayerEvent,
  assignPlayer,
  teamOptions,
  assignedCount,
  canAssignMorePlayers,
  movePlayerToDay,
  removePlayer,
  duplicateNames,
}) {
  const otherDay = activeDay === "Saturday" ? "Sunday" : "Saturday";
  const isDuplicate = duplicateNames.includes(player.playerName.trim().toLowerCase());

  return (
    <div className={isDuplicate ? "admin-player duplicate" : "admin-player"}>
      <div className="admin-player-main">
        <label>
          Player
          <input
            value={player.playerName}
            onChange={(event) => updatePlayer(player.id, "playerName", event.target.value)}
          />
        </label>

        <label>
          Discord
          <input
            value={player.discordName}
            onChange={(event) => updatePlayer(player.id, "discordName", event.target.value)}
          />
        </label>

        <label>
          Role
          <select
            value={player.role}
            onChange={(event) => updatePlayer(player.id, "role", event.target.value)}
          >
            {roleOptions.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        </label>

        <label>
          Weapon 1
          <select
            value={player.weapon1}
            onChange={(event) => updatePlayer(player.id, "weapon1", event.target.value)}
          >
            {weaponOptions.map((weapon) => (
              <option key={weapon}>{weapon}</option>
            ))}
          </select>
        </label>

        <label>
          Weapon 2
          <select
            value={player.weapon2}
            onChange={(event) => updatePlayer(player.id, "weapon2", event.target.value)}
          >
            {weaponOptions.map((weapon) => (
              <option key={weapon}>{weapon}</option>
            ))}
          </select>
        </label>

        <label>
          Team
          <select value={player.assignedTeam} onChange={(event) => assignPlayer(player.id, event.target.value)}>
            <option value="">Unassigned</option>
            {teamOptions.map((team) => (
              <option
                key={team}
                value={team}
                disabled={!canAssignMorePlayers && player.assignedDay !== activeDay}
              >
                {team}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-player-notes">
        <label>
          Notes
          <textarea
            value={player.notes}
            onChange={(event) => updatePlayer(player.id, "notes", event.target.value)}
          />
        </label>
      </div>

      <div className="admin-row-bottom">
        <label className="check-label compact">
          <input
            type="checkbox"
            checked={player.saturday}
            onChange={(event) => updatePlayer(player.id, "saturday", event.target.checked)}
          />
          Saturday
        </label>

        <label className="check-label compact">
          <input
            type="checkbox"
            checked={player.sunday}
            onChange={(event) => updatePlayer(player.id, "sunday", event.target.checked)}
          />
          Sunday
        </label>

        <div className="admin-event-checks">
          <strong>Saturday games</strong>
          {eventOptions.map((eventName) => (
            <label key={eventName} className="check-label compact event-check">
              <input
                type="checkbox"
                checked={player.saturdayEvents.includes(eventName)}
                disabled={!player.saturday}
                onChange={(event) => togglePlayerEvent(player.id, "saturdayEvents", eventName, event.target.checked)}
              />
              {eventName}
            </label>
          ))}
        </div>

        <div className="admin-event-checks">
          <strong>Sunday games</strong>
          {eventOptions.map((eventName) => (
            <label key={eventName} className="check-label compact event-check">
              <input
                type="checkbox"
                checked={player.sundayEvents.includes(eventName)}
                disabled={!player.sunday}
                onChange={(event) => togglePlayerEvent(player.id, "sundayEvents", eventName, event.target.checked)}
              />
              {eventName}
            </label>
          ))}
        </div>

        {isDuplicate && <span className="duplicate-pill">Duplicate</span>}

        <button type="button" className="secondary-btn" onClick={() => movePlayerToDay(player.id, otherDay)}>
          Add to {otherDay}
        </button>

        <button type="button" className="danger-btn padded" onClick={() => removePlayer(player.id)}>
          Remove
        </button>
      </div>
    </div>
  );
}
