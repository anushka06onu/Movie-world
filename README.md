# Anushka's Movie World

A Netflix‑style mini recommender made with plain HTML, CSS and JavaScript. I built this as a student project to practice recommendation logic, UI design, and data handling.

## What this project does
- Shows **Top 10 Trending** from a local dataset
- Shows **Top 10 For You** separately for **Movies** and **Series**
- Lets me **mark watched** so they never show again in recommendations
- Lets me **search** any title and see its rating
- Opens a **Wikipedia page** for details when I click a card
- Saves watched list in the browser so it stays after refresh

## Tech I used
- HTML
- CSS
- JavaScript (Vanilla)

## Dataset
- Movie list is built from the MovieLens 100K dataset (top 1200 by popularity)
- Series list is added manually to the dataset file
- All data is stored locally in `data.js`

## How I built it 
1. **Created a basic recommender** in Python first to understand similarity and scoring.
2. **Moved to a web app** so it can be published on Vercel as a static site.
3. **Designed the UI** in HTML + CSS to look like a streaming service.
4. **Built the core logic in JavaScript**:
   - filter by genre
   - exclude watched titles
   - score with a simple mix of genre match + similarity + popularity
5. **Added search** so I can find any title quickly.
6. **Added watched memory** using `localStorage` so my list stays after refresh.
7. **Split recommendations** into Movies and Series rows.
8. **Added the credit line** with my name at the bottom.

## Run locally
```
python3 -m http.server 8000
```
Open `http://localhost:8000`

## File guide
- `index.html` — page structure
- `style.css` — full UI styling
- `app.js` — recommendation logic + UI behavior
- `data.js` — local dataset (movies + series)

## Credits
Made by **Fateha Hossain Anushka**.
