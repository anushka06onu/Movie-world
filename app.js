const movies = MOVIES

const genreListEl = document.getElementById("genre-list")
const typeListEl = document.getElementById("type-list")
const searchEl = document.getElementById("search")
const searchResultsEl = document.getElementById("search-results")
const searchCountEl = document.getElementById("search-count")
const trendingEl = document.getElementById("trending")
const forYouMoviesEl = document.getElementById("for-you-movies")
const forYouMoreMoviesEl = document.getElementById("for-you-more-movies")
const forYouSeriesEl = document.getElementById("for-you-series")
const forYouMoreSeriesEl = document.getElementById("for-you-more-series")
const watchedEl = document.getElementById("watched")
const watchedCountEl = document.getElementById("watched-count")
const clearWatchedEl = document.getElementById("clear-watched")
const refreshEl = document.getElementById("refresh")
const searchBtn = document.getElementById("search-btn")
const moreBtn = document.getElementById("more")

const state = {
  selectedGenres: new Set(),
  selectedTypes: new Set(["movie", "tv"]),
  watched: new Map(),
  forYouMovies: [],
  forYouSeries: [],
  showMore: false
}

function getStorage() {
  try {
    const testKey = "__watch_test__"
    localStorage.setItem(testKey, "1")
    localStorage.removeItem(testKey)
    return localStorage
  } catch {
    try {
      sessionStorage.setItem("__watch_test__", "1")
      sessionStorage.removeItem("__watch_test__")
      return sessionStorage
    } catch {
      return null
    }
  }
}

const storage = getStorage()

function typeLabel(type) {
  return type === "tv" ? "Series" : "Movie"
}

function normalizeType(item) {
  if (!item.type) return "movie"
  return item.type.toLowerCase() === "series" ? "tv" : item.type.toLowerCase()
}

function imdbValue(item) {
  if (item.imdbRating && item.imdbRating !== "N/A") return item.imdbRating
  if (typeof item.avgRating === "number") return item.avgRating.toFixed(1)
  return "N/A"
}

function posterUrl(item) {
  if (item.poster && item.poster.trim() !== "") return item.poster
  const title = item.title || "Title"
  const initials = title
    .split(" ")
    .slice(0, 2)
    .map(w => w[0] || "")
    .join("")
    .toUpperCase()
  const bg = normalizeType(item) === "tv" ? "1f2937" : "111827"
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#${bg}"/>
          <stop offset="100%" stop-color="#0b0b0f"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <text x="50%" y="45%" text-anchor="middle" fill="#ffffff" font-size="80" font-family="Arial">${initials}</text>
      <text x="50%" y="58%" text-anchor="middle" fill="#9ca3af" font-size="26" font-family="Arial">${title.slice(0, 24)}</text>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function watchedKey(item) {
  return `${normalizeType(item)}:${item.title.toLowerCase()}`
}

function isWatched(item) {
  return state.watched.has(watchedKey(item))
}

function setWatched(item, value) {
  const key = watchedKey(item)
  if (value) {
    state.watched.set(key, item)
  } else {
    state.watched.delete(key)
  }
  watchedCountEl.textContent = `${state.watched.size} watched`
}

function renderChips(container, items, selected, onChange) {
  container.innerHTML = ""
  for (const item of items) {
    const label = document.createElement("label")
    label.className = "chip"
    const input = document.createElement("input")
    input.type = "checkbox"
    input.checked = selected.has(item.value)
    input.addEventListener("change", () => {
      if (input.checked) {
        selected.add(item.value)
        label.classList.add("active")
      } else {
        selected.delete(item.value)
        label.classList.remove("active")
      }
      onChange()
    })
    const span = document.createElement("span")
    span.textContent = item.label
    label.appendChild(input)
    label.appendChild(span)
    if (input.checked) label.classList.add("active")
    container.appendChild(label)
  }
}

function cardHTML(item, rank) {
  const imdb = imdbValue(item)
  const meta = `${typeLabel(normalizeType(item))} • IMDb ${imdb}`
  const watchText = isWatched(item) ? "Watched" : "Mark watched"
  const rankEl = rank ? `<div class="rank">${rank}</div>` : ""
  return `
    <div class="card" data-title="${item.title}" data-type="${normalizeType(item)}">
      ${rankEl}
      <div class="card-title">${item.title}</div>
      <div class="card-meta">${meta}</div>
      <div class="card-actions">
        <button class="primary" data-action="watch">${watchText}</button>
        <button class="ghost" data-action="details">Details</button>
      </div>
    </div>
  `
}

function renderShelf(container, items, showRank) {
  if (!items.length) {
    container.innerHTML = "<div class=\"empty\">No titles yet.</div>"
    return
  }
  container.innerHTML = items
    .map((item, idx) => cardHTML(item, showRank ? idx + 1 : null))
    .join("")
}

function renderGrid(container, items) {
  if (!items.length) {
    container.innerHTML = "<div class=\"empty\">No matches found.</div>"
    return
  }
  container.innerHTML = items.map(item => cardHTML(item)).join("")
}

function filterByType(item) {
  return state.selectedTypes.has(normalizeType(item))
}

function filterByGenres(item) {
  if (state.selectedGenres.size === 0) return true
  return item.genres.some(g => state.selectedGenres.has(g))
}

function genreScore(item) {
  if (state.selectedGenres.size === 0) return 0.4
  const sel = Array.from(state.selectedGenres)
  const hits = sel.filter(g => item.genres.includes(g)).length
  return hits / sel.length
}

function similarityScore(item) {
  if (state.watched.size === 0) return 0
  const watchedItems = Array.from(state.watched.values())
  let total = 0
  for (const w of watchedItems) {
    const inter = w.genres.filter(g => item.genres.includes(g)).length
    const union = new Set([...w.genres, ...item.genres]).size
    total += union === 0 ? 0 : inter / union
  }
  return total / watchedItems.length
}

function popularityScore(item) {
  const countScore = Math.log(1 + (item.ratingCount || 0))
  const avgScore = item.avgRating || 0
  return 0.6 * avgScore + 0.4 * countScore
}

function scoreForYou(item) {
  return 0.5 * genreScore(item) + 0.3 * similarityScore(item) + 0.2 * popularityScore(item)
}

function loadTrending() {
  const filtered = movies.filter(filterByType)
  const sorted = [...filtered].sort((a, b) => {
    if ((b.ratingCount || 0) !== (a.ratingCount || 0)) return (b.ratingCount || 0) - (a.ratingCount || 0)
    return (b.avgRating || 0) - (a.avgRating || 0)
  })
  renderShelf(trendingEl, sorted.slice(0, 10), true)
}

function loadForYou() {
  const filtered = movies
    .filter(filterByGenres)
    .filter(item => !isWatched(item))
  const scored = filtered.map(item => ({ item, score: scoreForYou(item) }))
  scored.sort((a, b) => b.score - a.score)

  const moviesOnly = scored.filter(s => normalizeType(s.item) === "movie").map(s => s.item)
  const seriesOnly = scored.filter(s => normalizeType(s.item) === "tv").map(s => s.item)

  state.forYouMovies = moviesOnly
  state.forYouSeries = seriesOnly

  renderShelf(forYouMoviesEl, state.forYouMovies.slice(0, 10), true)
  renderShelf(forYouSeriesEl, state.forYouSeries.slice(0, 10), true)

  if (state.showMore) {
    renderGrid(forYouMoreMoviesEl, state.forYouMovies)
    renderGrid(forYouMoreSeriesEl, state.forYouSeries)
  } else {
    forYouMoreMoviesEl.innerHTML = ""
    forYouMoreSeriesEl.innerHTML = ""
  }
}

let searchTimer
function runSearch() {
  const q = searchEl.value.trim().toLowerCase()
  if (!q) {
    searchResultsEl.innerHTML = "<div class=\"empty\">Type to search titles.</div>"
    searchCountEl.textContent = "Type to search"
    return
  }
  const results = movies
    .filter(filterByType)
    .filter(item => item.title.toLowerCase().includes(q))
  searchCountEl.textContent = `${results.length} results`
  renderGrid(searchResultsEl, results.slice(0, 24))
  searchResultsEl.scrollIntoView({ behavior: "smooth", block: "start" })
}

function renderWatched() {
  const items = Array.from(state.watched.values())
  if (!items.length) {
    watchedEl.innerHTML = "<div class=\"empty\">No watched titles yet.</div>"
    return
  }
  watchedEl.innerHTML = items.map(item => cardHTML(item)).join("")
}

function openDetails(title) {
  const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, "_"))}`
  window.open(url, "_blank")
}

function readItemFromCard(card) {
  const title = card.dataset.title
  const type = card.dataset.type
  const found = movies.find(m => m.title === title && normalizeType(m) === type)
  if (found) return found
  return { title, type, genres: [], avgRating: 0, ratingCount: 0 }
}

function refreshAll() {
  renderWatched()
  loadTrending()
  loadForYou()
  runSearch()
}

function saveWatched() {
  const items = Array.from(state.watched.values())
  if (!storage) return
  storage.setItem("watched_list", JSON.stringify(items))
}

function loadWatched() {
  if (!storage) return
  const raw = storage.getItem("watched_list")
  if (!raw) return
  try {
    const items = JSON.parse(raw)
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item?.title) state.watched.set(watchedKey(item), item)
      }
    }
  } catch {}
}

document.addEventListener("click", e => {
  const btn = e.target.closest("button[data-action]")
  if (!btn) return
  const card = btn.closest(".card")
  if (!card) return
  const item = readItemFromCard(card)
  if (btn.dataset.action === "watch") {
    setWatched(item, !isWatched(item))
    saveWatched()
    refreshAll()
  }
  if (btn.dataset.action === "details") {
    openDetails(item.title)
  }
})

searchEl.addEventListener("input", () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(runSearch, 300)
})

clearWatchedEl.addEventListener("click", () => {
  state.watched.clear()
  watchedCountEl.textContent = "0 watched"
  if (storage) storage.removeItem("watched_list")
  refreshAll()
})

refreshEl.addEventListener("click", () => loadForYou())
searchBtn.addEventListener("click", () => runSearch())
moreBtn.addEventListener("click", () => {
  state.showMore = !state.showMore
  moreBtn.textContent = state.showMore ? "Less" : "More"
  loadForYou()
})

renderChips(
  typeListEl,
  [
    { label: "Movie", value: "movie" },
    { label: "Series", value: "tv" }
  ],
  state.selectedTypes,
  () => {
    loadTrending()
    loadForYou()
    runSearch()
  }
)

const genres = Array.from(new Set(movies.flatMap(m => m.genres))).filter(g => g !== "unknown").sort()
renderChips(
  genreListEl,
  genres.map(g => ({ label: g, value: g })),
  state.selectedGenres,
  () => loadForYou()
)

watchedCountEl.textContent = "0 watched"
loadWatched()
watchedCountEl.textContent = `${state.watched.size} watched`
loadTrending()
loadForYou()
runSearch()

window.addEventListener("beforeunload", () => {
  saveWatched()
})
