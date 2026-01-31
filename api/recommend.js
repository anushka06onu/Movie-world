const { tmdbFetch, omdbByTitle, mapTmdbItem, send } = require("./_helpers")

module.exports = async (req, res) => {
  try {
    const types = (req.query.types || "movie,tv").toString().split(",")
    const movieGenres = (req.query.movie_genres || "").toString().trim()
    const tvGenres = (req.query.tv_genres || "").toString().trim()

    const results = []

    if (types.includes("movie")) {
      const params = { sort_by: "popularity.desc", include_adult: false, page: 1 }
      if (movieGenres) params.with_genres = movieGenres
      const movie = await tmdbFetch("/discover/movie", params)
      results.push(...(movie.results || []).map(item => mapTmdbItem(item, "movie")))
    }

    if (types.includes("tv")) {
      const params = { sort_by: "popularity.desc", page: 1 }
      if (tvGenres) params.with_genres = tvGenres
      const tv = await tmdbFetch("/discover/tv", params)
      results.push(...(tv.results || []).map(item => mapTmdbItem(item, "tv")))
    }

    results.sort((a, b) => b.popularity - a.popularity)

    const items = []
    for (const item of results.slice(0, 12)) {
      let imdbRating = "N/A"
      try {
        const omdbType = item.type === "tv" ? "series" : "movie"
        const omdb = await omdbByTitle(item.title, omdbType, item.year)
        imdbRating = omdb?.imdbRating || "N/A"
      } catch {
        imdbRating = "N/A"
      }
      items.push({ ...item, imdbRating })
    }

    send(res, 200, { items })
  } catch (err) {
    send(res, 500, { error: err.message })
  }
}
