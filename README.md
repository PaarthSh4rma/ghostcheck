# GhostCheck

**Privacy-first Instagram follower audit.**
Upload your Instagram data export and instantly see who doesn’t follow you back.

Live: https://ghostcheck-eight.vercel.app/

---

## Features

* Find users who **don’t follow you back**
* See your **mutuals**
* Discover who **you don’t follow back**
* Search usernames instantly
* Copy results with one click
* Export results as CSV
* **100% client-side — your data never leaves your browser**

---

## Tech Stack

* React + TypeScript
* Vite
* Tailwind/CSS
* Vercel (deployment)

---

## How to Use

1. Request your Instagram data:

   * Go to Instagram → Settings → Accounts Center → Your Information → Download your data
   * Choose **JSON format**

2. After downloading, locate:

   ```txt
   followers_1.json
   following.json
   ```

3. Upload both files into GhostCheck

4. Click **Analyze**

---

## How It Works

The app parses your Instagram export and compares:

```txt
following - followers → people who don’t follow you back
followers - following → people you don’t follow back
intersection → mutuals
```

All processing happens locally in your browser.

---

## Development

```bash
git clone https://github.com/your-username/ghostcheck.git
cd ghostcheck
npm install
npm run dev
```

---

## ⚠️ Disclaimer

This tool is not affiliated with Instagram.
All data processing is done locally — no data is uploaded or stored.
