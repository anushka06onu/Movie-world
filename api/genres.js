const { tmdbFetch, send } = require("./_helpers")

module.exports = async (req, res) => {
  try {
    const movie = await tmdbFetch("/genre/movie/list")
    const tv = await tmdbFetch("/genre/tv/list")
    const map = {}
    for (const g of movie.genres || []) {
      map[g.name] = { name: g.name, movieId: g.id, tvId: null }
    }
    for (const g of tv.genres || []) {
      if (!map[g.name]) {
        map[g.name] = { name: g.name, movieId: null, tvId: g.id }
      } else {
        map[g.name].tvId = g.id
      }
    }
    const genres = Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
    send(res, 200, { genres })
  } catch (err) {
    send(res, 500, { error: err.message })
  }
}
