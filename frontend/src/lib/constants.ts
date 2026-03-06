import type { PokemonType, Nature, StatusCondition, Weather, Field } from "./types"

// ============================================================
// タイプカラー
// ============================================================

export const TYPE_COLORS: Record<PokemonType, { bg: string; text: string; label: string }> = {
  Normal:   { bg: "#A8A878", text: "#fff", label: "ノーマル" },
  Fire:     { bg: "#F08030", text: "#fff", label: "ほのお" },
  Water:    { bg: "#6890F0", text: "#fff", label: "みず" },
  Electric: { bg: "#F8D030", text: "#1a1a1a", label: "でんき" },
  Grass:    { bg: "#78C850", text: "#fff", label: "くさ" },
  Ice:      { bg: "#98D8D8", text: "#1a1a1a", label: "こおり" },
  Fighting: { bg: "#C03028", text: "#fff", label: "かくとう" },
  Poison:   { bg: "#A040A0", text: "#fff", label: "どく" },
  Ground:   { bg: "#E0C068", text: "#1a1a1a", label: "じめん" },
  Flying:   { bg: "#A890F0", text: "#fff", label: "ひこう" },
  Psychic:  { bg: "#F85888", text: "#fff", label: "エスパー" },
  Bug:      { bg: "#A8B820", text: "#fff", label: "むし" },
  Rock:     { bg: "#B8A038", text: "#fff", label: "いわ" },
  Ghost:    { bg: "#705898", text: "#fff", label: "ゴースト" },
  Dragon:   { bg: "#7038F8", text: "#fff", label: "ドラゴン" },
  Dark:     { bg: "#705848", text: "#fff", label: "あく" },
  Steel:    { bg: "#B8B8D0", text: "#1a1a1a", label: "はがね" },
  Fairy:    { bg: "#EE99AC", text: "#1a1a1a", label: "フェアリー" },
  Stellar:  { bg: "#5A88C8", text: "#fff", label: "ステラ" },
}

export const ALL_TYPES: PokemonType[] = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice",
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy", "Stellar",
]

// ============================================================
// 性格 (25種)
// ============================================================

export interface NatureInfo {
  name: Nature
  boosted: keyof { attack: number; defense: number; spAttack: number; spDefense: number; speed: number } | null
  dropped: keyof { attack: number; defense: number; spAttack: number; spDefense: number; speed: number } | null
}

export const NATURES: NatureInfo[] = [
  { name: "Hardy",   boosted: null,        dropped: null },
  { name: "Lonely",  boosted: "attack",    dropped: "defense" },
  { name: "Brave",   boosted: "attack",    dropped: "speed" },
  { name: "Adamant", boosted: "attack",    dropped: "spAttack" },
  { name: "Naughty", boosted: "attack",    dropped: "spDefense" },
  { name: "Bold",    boosted: "defense",   dropped: "attack" },
  { name: "Docile",  boosted: null,        dropped: null },
  { name: "Relaxed", boosted: "defense",   dropped: "speed" },
  { name: "Impish",  boosted: "defense",   dropped: "spAttack" },
  { name: "Lax",     boosted: "defense",   dropped: "spDefense" },
  { name: "Timid",   boosted: "speed",     dropped: "attack" },
  { name: "Hasty",   boosted: "speed",     dropped: "defense" },
  { name: "Serious", boosted: null,        dropped: null },
  { name: "Jolly",   boosted: "speed",     dropped: "spAttack" },
  { name: "Naive",   boosted: "speed",     dropped: "spDefense" },
  { name: "Modest",  boosted: "spAttack",  dropped: "attack" },
  { name: "Mild",    boosted: "spAttack",  dropped: "defense" },
  { name: "Quiet",   boosted: "spAttack",  dropped: "speed" },
  { name: "Bashful", boosted: null,        dropped: null },
  { name: "Rash",    boosted: "spAttack",  dropped: "spDefense" },
  { name: "Calm",    boosted: "spDefense", dropped: "attack" },
  { name: "Gentle",  boosted: "spDefense", dropped: "defense" },
  { name: "Sassy",   boosted: "spDefense", dropped: "speed" },
  { name: "Careful", boosted: "spDefense", dropped: "spAttack" },
  { name: "Quirky",  boosted: null,        dropped: null },
]

// ============================================================
// 状態異常
// ============================================================

export const STATUS_OPTIONS: { value: StatusCondition; label: string }[] = [
  { value: "none",      label: "なし" },
  { value: "burn",      label: "やけど" },
  { value: "poison",    label: "どく" },
  { value: "paralysis", label: "まひ" },
  { value: "sleep",     label: "ねむり" },
  { value: "freeze",    label: "こおり" },
]

// ============================================================
// 天候
// ============================================================

export const WEATHER_OPTIONS: { value: Weather; label: string }[] = [
  { value: "none",         label: "なし" },
  { value: "sun",          label: "晴れ" },
  { value: "rain",         label: "雨" },
  { value: "sandstorm",    label: "砂嵐" },
  { value: "snow",         label: "雪" },
  { value: "harshSun",     label: "強い日差し" },
  { value: "heavyRain",    label: "大雨" },
  { value: "strongWinds",  label: "強い風" },
]

// ============================================================
// フィールド
// ============================================================

export const FIELD_OPTIONS: { value: Field; label: string }[] = [
  { value: "none",            label: "なし" },
  { value: "electricTerrain", label: "エレキフィールド" },
  { value: "grassyTerrain",   label: "グラスフィールド" },
  { value: "mistyTerrain",    label: "ミストフィールド" },
  { value: "psychicTerrain",  label: "サイコフィールド" },
]

// ============================================================
// ステータス名称
// ============================================================

export const STAT_LABELS: Record<string, string> = {
  hp:        "HP",
  attack:    "こうげき",
  defense:   "ぼうぎょ",
  spAttack:  "とくこう",
  spDefense: "とくぼう",
  speed:     "すばやさ",
}

export const STAT_KEYS = ["hp", "attack", "defense", "spAttack", "spDefense", "speed"] as const
export type StatKey = typeof STAT_KEYS[number]

// ============================================================
// API
// ============================================================

export const API_BASE = "https://k7jncd6nq5.execute-api.ap-northeast-1.amazonaws.com/v1"
