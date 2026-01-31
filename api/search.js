const { tmdbFetch, omdbByTitle, mapTmdbItem, send } = require("./_helpers")

module.exports = async (req, res) => {
  try {
    const query = (req.query.query || "").toString().trim()
    const types = (req.query.types || "movie,tv").toString().split(",")
    if (!query) {
      send(res, 200, { items: [] })
      return
    }
    const data = await tmdbFetch("/search/multi", { query, include_adult: false, page: 1 })
    const results = (data.results || []).filter(r => (r.media_type === "movie" || r.media_type === "tv") && types.includes(r.media_type))
    const items = []
    for (const item of results.slice(0, 12)) {
      const type = item.media_type
      const mapped = mapTmdbItem(item, type)
      let imdbRating = "N/A"
      try {
        const omdbType = type === "tv" ? "series" : "movie"
        const omdb = await omdbByTitle(mapped.title, omdbType, mapped.year)
        imdbRating = omdb?.imdbRating || "N/A"
      } catch {
        imdbRating = "N/A"
      }
      items.push({ ...mapped, imdbRating })
    }
    send(res, 200, { items })
  } catch (err) {
    send(res, 500, { error: err.message })
  }
}
