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

  async function handleAnalyze() {
    setError("");
    setResult(null);
    setSearch("");
    setActiveTab("notFollowingBack");

    if (!followersFile || !followingFile) {
      setError("Upload both followers_1.json and following.json first.");
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
    } catch {
      setError(
        "Could not read those files. Make sure they are valid Instagram JSON exports."
      );
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

  return (
    <main className="app">
      <section className="hero">
        <p className="eyebrow">Privacy-first Instagram audit</p>
        <h1>GhostCheck</h1>
        <p className="subtitle">
          Upload your Instagram followers and following JSON files to find who
          doesn’t follow you back. Your files never leave your browser.
        </p>
      </section>

      <section className="card">
        <div className="upload-grid">
          <label>
            <span>Followers JSON</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => setFollowersFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <label>
            <span>Following JSON</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => setFollowingFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <button onClick={handleAnalyze}>Analyze</button>

        {error && <p className="error">{error}</p>}
      </section>

      {result && (
        <section className="results">
          <div className="stats">
            <div>
              <strong>{result.followers.size}</strong>
              <span>Followers</span>
            </div>
            <div>
              <strong>{result.following.size}</strong>
              <span>Following</span>
            </div>
            <div>
              <strong>{result.notFollowingBack.length}</strong>
              <span>Don’t follow back</span>
            </div>
            <div>
              <strong>{result.mutuals.length}</strong>
              <span>Mutuals</span>
            </div>
          </div>

          <div className="list-card">
            <div className="tabs">
              <button
                className={activeTab === "notFollowingBack" ? "active" : ""}
                onClick={() => setActiveTab("notFollowingBack")}
              >
                ❌ Not following back
              </button>

              <button
                className={activeTab === "mutuals" ? "active" : ""}
                onClick={() => setActiveTab("mutuals")}
              >
                🔁 Mutuals
              </button>

              <button
                className={activeTab === "youDontFollowBack" ? "active" : ""}
                onClick={() => setActiveTab("youDontFollowBack")}
              >
                👀 You don’t follow back
              </button>
            </div>

            <div className="list-header">
              <input
                placeholder="Search usernames..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <button className="secondary" onClick={copyList}>
                Copy
              </button>

              <button className="secondary" onClick={downloadCsv}>
                Export CSV
              </button>
            </div>

            {activeList.length === 0 ? (
              <p className="empty">Nothing to show here.</p>
            ) : (
              <ul>
                {activeList.map((user) => (
                  <li key={user}>
                    <span>@{user}</span>
                    <a
                      href={`https://instagram.com/${user}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </main>
  );
}