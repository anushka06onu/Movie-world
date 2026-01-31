import numpy as np

data = [
    ("Ava", "Inception", 5),
    ("Ava", "Titanic", 3),
    ("Ava", "Matrix", 4),
    ("Ben", "Inception", 4),
    ("Ben", "Titanic", 2),
    ("Ben", "Matrix", 5),
    ("Ben", "Interstellar", 4),
    ("Cara", "Inception", 2),
    ("Cara", "Titanic", 5),
    ("Cara", "LaLaLand", 4),
    ("Dan", "Matrix", 4),
    ("Dan", "Interstellar", 5),
    ("Dan", "LaLaLand", 2),
    ("Eli", "Inception", 5),
    ("Eli", "Interstellar", 4),
    ("Eli", "Matrix", 4),
]

users = sorted({u for u, _, _ in data})
movies = sorted({m for _, m, _ in data})

user_index = {u: i for i, u in enumerate(users)}
movie_index = {m: i for i, m in enumerate(movies)}

ratings = np.zeros((len(users), len(movies)))

for u, m, r in data:
    ratings[user_index[u], movie_index[m]] = r

user_means = []
for i in range(ratings.shape[0]):
    count = (ratings[i] != 0).sum()
    if count == 0:
        user_means.append(0)
    else:
        user_means.append(ratings[i].sum() / count)
user_means = np.array(user_means)

normalized = ratings.copy()
for i in range(normalized.shape[0]):
    for j in range(normalized.shape[1]):
        if normalized[i, j] != 0:
            normalized[i, j] -= user_means[i]

sim = np.zeros((len(users), len(users)))
for i in range(len(users)):
    for j in range(len(users)):
        a = normalized[i]
        b = normalized[j]
        num = np.dot(a, b)
        den = np.linalg.norm(a) * np.linalg.norm(b)
        sim[i, j] = 0 if den == 0 else num / den


def predict(user, movie, k=2):
    if movie not in movie_index:
        return None
    u = user_index[user]
    m = movie_index[movie]
    if ratings[u, m] != 0:
        return ratings[u, m]
    sims = []
    for other in range(len(users)):
        if ratings[other, m] != 0 and other != u:
            sims.append((sim[u, other], other))
    sims.sort(reverse=True)
    sims = sims[:k]
    if not sims:
        return user_means[u]
    num = 0
    den = 0
    for s, other in sims:
        num += s * (ratings[other, m] - user_means[other])
        den += abs(s)
    return user_means[u] + (num / den if den != 0 else 0)


def recommend(user, top_n=3):
    scores = []
    for movie in movies:
        if ratings[user_index[user], movie_index[movie]] == 0:
            scores.append((predict(user, movie), movie))
    scores.sort(reverse=True)
    return scores[:top_n]


if __name__ == "__main__":
    target_user = "Ava"
    recs = recommend(target_user, top_n=3)
    print("Recommendations for", target_user)
    for score, movie in recs:
        print(movie, "->", round(score, 2))
