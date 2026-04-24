import { useMemo, useState } from "react";
import "./App.css";

type Tab = "notFollowingBack" | "mutuals" | "youDontFollowBack";

type Result = {
  followers: Set<string>;
  following: Set<string>;
  notFollowingBack: string[];
  youDontFollowBack: string[];
  mutuals: string[];
};

const tabLabels: Record<Tab, string> = {
  notFollowingBack: "Ghosts",
  mutuals: "Mutuals",
  youDontFollowBack: "Fans",
};

const emptyMessages: Record<Tab, string> = {
  notFollowingBack: "Everyone follows you back. Suspiciously wholesome.",
  mutuals: "No mutuals found. This is either tragic or the wrong file.",
  youDontFollowBack: "You follow everyone back. Diplomatic behaviour.",
};

const roastMessages = [
  "Audit complete. Some of these relationships were one-sided.",
  "You follow them. They don’t follow you. Reflect.",
  "This list is longer than your dignity.",
  "Mutual respect was not found.",
  "You’re investing emotionally. They’re not.",
  "Ghosted. At scale.",
];

function extractFollowers(data: any): string[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => item?.string_list_data?.[0]?.value)
    .filter(Boolean);
}

function extractFollowing(data: any): string[] {
  const list = data?.relationships_following;

  if (!Array.isArray(list)) return [];

  return list
    .map((item) => item?.title || item?.string_list_data?.[0]?.value)
    .filter(Boolean);
}

async function readJsonFile(file: File): Promise<any> {
  const text = await file.text();
  return JSON.parse(text);
}

export default function App() {
  const [followersFile, setFollowersFile] = useState<File | null>(null);
  const [followingFile, setFollowingFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("notFollowingBack");
  const [search, setSearch] = useState("");
  const [roastMode, setRoastMode] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function handleAnalyze() {
    setError("");
    setResult(null);
    setSearch("");
    setActiveTab("notFollowingBack");
    setIsAnalyzing(true);

    if (!followersFile || !followingFile) {
      setError("Upload both followers_1.json and following.json first.");
      setIsAnalyzing(false);
      return;
    }

    try {
      const followersJson = await readJsonFile(followersFile);
      const followingJson = await readJsonFile(followingFile);

      const followers = new Set(extractFollowers(followersJson));
      const following = new Set(extractFollowing(followingJson));

      const notFollowingBack = [...following]
        .filter((user) => !followers.has(user))
        .sort();

      const youDontFollowBack = [...followers]
        .filter((user) => !following.has(user))
        .sort();

      const mutuals = [...following]
        .filter((user) => followers.has(user))
        .sort();

      setResult({
        followers,
        following,
        notFollowingBack,
        youDontFollowBack,
        mutuals,
      });

      setTimeout(() => {
        document.querySelector(".results")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch {
      setError(
        "Could not read those files. Make sure they are valid Instagram JSON exports."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function getActiveList() {
    if (!result) return [];

    return result[activeTab].filter((user) =>
      user.toLowerCase().includes(search.toLowerCase())
    );
  }

  function copyList() {
    const list = getActiveList();
    if (list.length === 0) return;
    navigator.clipboard.writeText(list.join("\n"));
  }

  const csv = useMemo(() => {
    if (!result) return "";

    return [
      "username,type",
      ...result.notFollowingBack.map((u) => `${u},not_following_back`),
      ...result.youDontFollowBack.map((u) => `${u},you_dont_follow_back`),
      ...result.mutuals.map((u) => `${u},mutual`),
    ].join("\n");
  }, [result]);

  function downloadCsv() {
    if (!csv) return;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "ghostcheck-results.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  const activeList = getActiveList();

  const roast =
    result && roastMode
      ? roastMessages[result.notFollowingBack.length % roastMessages.length]
      : null;

  return (
    <main className="app">
      <div className="orb orb-one" />
      <div className="orb orb-two" />

      <section className="hero">
        <div className="logo-mark">👻</div>

        <p className="eyebrow">Privacy-first Instagram audit</p>

        <h1>GhostCheck</h1>

        <p className="subtitle">
          Upload your Instagram data export and expose who doesn’t follow you
          back. No login. No backend. No mercy.
        </p>

        <div className="trust-row">
          <span>✓ Runs locally</span>
          <span>✓ No data uploaded</span>
          <span>✓ CSV export</span>
        </div>
      </section>

      <section className="card upload-card">
        <div className="card-top">
          <div>
            <h2>Upload your files</h2>
            <p>Use Instagram’s JSON export: followers_1.json + following.json</p>
          </div>

          <button
            type="button"
            className={`toggle ${roastMode ? "toggle-on" : ""}`}
            onClick={() => setRoastMode((value) => !value)}
          >
            Roast Mode {roastMode ? "On" : "Off"}
          </button>
        </div>

        <div className="upload-grid">
          <label>
            <span>Followers JSON</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => setFollowersFile(e.target.files?.[0] ?? null)}
            />
            {followersFile && <small>{followersFile.name}</small>}
          </label>

          <label>
            <span>Following JSON</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => setFollowingFile(e.target.files?.[0] ?? null)}
            />
            {followingFile && <small>{followingFile.name}</small>}
          </label>
        </div>

        <button
          type="button"
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? "Analyzing..." : "Run Audit"}
        </button>

        {error && <p className="error">{error}</p>}
      </section>

      {result && (
        <section className="results">
          {roast && <div className="roast-banner">{roast}</div>}

          <div className="stats">
            <div>
              <strong>{result.followers.size}</strong>
              <span>Followers</span>
            </div>
            <div>
              <strong>{result.following.size}</strong>
              <span>Following</span>
            </div>
            <div className="danger-stat">
              <strong>{result.notFollowingBack.length}</strong>
              <span>Ghosts found</span>
            </div>
            <div>
              <strong>{result.mutuals.length}</strong>
              <span>Mutuals</span>
            </div>
          </div>

          <div className="list-card">
            <div className="tabs">
              {(Object.keys(tabLabels) as Tab[]).map((tab) => (
                <button
                  type="button"
                  key={tab}
                  className={activeTab === tab ? "active" : ""}
                  onClick={() => setActiveTab(tab)}
                >
                  {tabLabels[tab]}
                  <span>{result[tab].length}</span>
                </button>
              ))}
            </div>

            <div className="list-header">
              <input
                placeholder="Search usernames..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <button type="button" className="secondary" onClick={copyList}>
                Copy
              </button>

              <button
                type="button"
                className="secondary"
                onClick={downloadCsv}
              >
                Export CSV
              </button>
            </div>

            {activeList.length === 0 ? (
              <div className="empty-state">
                <div>✨</div>
                <h3>{emptyMessages[activeTab]}</h3>
                <p>
                  {search
                    ? "No matches. Try a different username."
                    : "Switch tabs or upload another export."}
                </p>
              </div>
            ) : (
              <ul>
                {activeList.map((user, index) => (
                  <li key={user}>
                    <div>
                      <span className="rank">#{index + 1}</span>
                      <span className="username">@{user}</span>
                    </div>

                    <a
                      href={`https://instagram.com/${user}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open profile
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <footer>
        <p>
          Built by Paarth •{" "}
          <a href="https://github.com/PaarthSh4rma/ghostcheck" target="_blank">
            GitHub
          </a>
        </p>
        <p>Your data never leaves your browser.</p>
      </footer>
    </main>
  );
}