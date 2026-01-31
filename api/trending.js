const { tmdbFetch, omdbByTitle, mapTmdbItem, send } = require("./_helpers")

module.exports = async (req, res) => {
  try {
    const data = await tmdbFetch("/trending/all/day")
    const base = (data.results || []).filter(r => r.media_type === "movie" || r.media_type === "tv")
    const top = base.slice(0, 10)
    const items = []
    for (const item of top) {
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
