const TMDB_BASE = "https://api.themoviedb.org/3"
const OMDB_BASE = "https://www.omdbapi.com/"

function getTmdbKey() {
  const key = process.env.TMDB_API_KEY
  if (!key) throw new Error("Missing TMDB_API_KEY")
  return key
}

function getOmdbKey() {
  const key = process.env.OMDB_API_KEY
  if (!key) throw new Error("Missing OMDB_API_KEY")
  return key
}

async function tmdbFetch(path, params = {}) {
  const key = getTmdbKey()
  const qs = new URLSearchParams({ api_key: key, language: "en-US", ...params })
  const res = await fetch(`${TMDB_BASE}${path}?${qs.toString()}`)
  if (!res.ok) throw new Error("TMDB request failed")
  return res.json()
}

async function omdbByTitle(title, type, year) {
  const key = getOmdbKey()
  const qs = new URLSearchParams({ apikey: key, t: title })
  if (type) qs.set("type", type)
  if (year) qs.set("y", year)
  const res = await fetch(`${OMDB_BASE}?${qs.toString()}`)
  if (!res.ok) throw new Error("OMDB request failed")
  return res.json()
}

function mapTmdbItem(item, type) {
  const title = item.title || item.name || ""
  const date = item.release_date || item.first_air_date || ""
  const year = date ? date.slice(0, 4) : ""
  return {
    title,
    type,
    year,
    poster: item.poster_path || "",
    popularity: item.popularity || 0
  }
}

function send(res, status, data) {
  res.status(status).json(data)
}

module.exports = { tmdbFetch, omdbByTitle, mapTmdbItem, send }
