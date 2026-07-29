/**
 * Diccionario de equipos Yupoo + curación CMS (`data/yupoo-curation.json`).
 * aliases: nombres en EN/ES/otros; match por palabra completa (case-insensitive).
 */

import fs from "node:fs/promises";
import path from "node:path";

const CURATION_PATH = path.join(process.cwd(), "data", "yupoo-curation.json");

/** Fallback si no existe el JSON de curación. */
export const YUPOO_TEAMS_FALLBACK = [
  { id: "spain", name: "España", aliases: ["spain", "españa", "espana", "spanish national"] },
  { id: "brazil", name: "Brasil", aliases: ["brazil", "brasil"] },
  { id: "argentina", name: "Argentina", aliases: ["argentina"] },
  { id: "real-madrid", name: "Real Madrid", aliases: ["real madrid"] },
  { id: "barcelona", name: "FC Barcelona", aliases: ["fc barcelona", "barcelona", "barça", "barca"] },
];

function parseAliases(raw) {
  if (Array.isArray(raw)) {
    return raw.map((a) => String(a).trim().toLowerCase()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

export function normalizeCurationTeam(raw, index = 0) {
  const id = String(raw?.id || "").trim() || `team-${index + 1}`;
  return {
    id,
    name: String(raw?.name || id).trim() || id,
    aliases: parseAliases(raw?.aliases),
    hidden: raw?.hidden === true,
    featured: raw?.featured === true,
    sortOrder: Number.isFinite(Number(raw?.sortOrder)) ? Number(raw.sortOrder) : index + 1,
  };
}

function asStringList(raw, key) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const v = item[key] ?? item.word ?? item.id ?? item.value;
        return v != null ? String(v).trim() : "";
      }
      return "";
    })
    .filter(Boolean);
}

export function normalizeCuration(raw) {
  const teamsRaw = Array.isArray(raw?.teams) ? raw.teams : [];
  const teams = (teamsRaw.length ? teamsRaw : YUPOO_TEAMS_FALLBACK).map(normalizeCurationTeam);
  return {
    teams,
    hideTitleContains: asStringList(raw?.hideTitleContains, "word").map((s) => s.toLowerCase()),
    hideGroupIds: asStringList(raw?.hideGroupIds, "id"),
    featuredGroupIds: asStringList(raw?.featuredGroupIds, "id"),
  };
}

/** @type {ReturnType<typeof normalizeCuration> | null} */
let cachedCuration = null;

export async function loadCuration({ force = false } = {}) {
  if (cachedCuration && !force) return cachedCuration;
  try {
    const text = await fs.readFile(CURATION_PATH, "utf8");
    cachedCuration = normalizeCuration(JSON.parse(text));
  } catch {
    cachedCuration = normalizeCuration({ teams: YUPOO_TEAMS_FALLBACK });
  }
  return cachedCuration;
}

/** Lista plana alias → team, ordenada por longitud de alias desc. */
export function buildAliasIndex(teams) {
  const rows = [];
  for (const team of teams || []) {
    if (team.hidden) continue;
    for (const alias of team.aliases || []) {
      const a = String(alias).trim().toLowerCase();
      if (!a) continue;
      rows.push({ alias: a, team });
    }
  }
  rows.sort((a, b) => b.alias.length - a.alias.length || a.alias.localeCompare(b.alias));
  return rows;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Devuelve el equipo cuyo alias más largo aparece como token en el título. */
export function matchTeamFromTitle(title, aliasIndex) {
  const t = String(title || "");
  if (!t || !aliasIndex?.length) return null;
  const lower = t.toLowerCase();
  for (const { alias, team } of aliasIndex) {
    const re = new RegExp(`(?:^|[^a-zà-ÿ0-9])${escapeRegExp(alias)}(?:[^a-zà-ÿ0-9]|$)`, "i");
    if (re.test(lower)) return team;
  }
  return null;
}

export function isHiddenByCuration(group, curation) {
  if (!group || !curation) return false;
  const id = String(group.id || "");
  if (id && curation.hideGroupIds.includes(id)) return true;
  const hay = `${group.title || ""} ${group.haystack || ""}`.toLowerCase();
  for (const needle of curation.hideTitleContains || []) {
    if (needle && hay.includes(needle)) return true;
  }
  if (group.teamId) {
    const team = (curation.teams || []).find((t) => t.id === group.teamId);
    if (team?.hidden) return true;
  }
  return false;
}

/** Compat: export viejo para imports que esperan YUPOO_TEAMS estático. */
export const YUPOO_TEAMS = YUPOO_TEAMS_FALLBACK;
