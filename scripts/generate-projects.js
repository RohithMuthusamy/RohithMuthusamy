import fs from "fs";
import fetch from "node-fetch";

const USER = "rohithmuthusamy";
const TOKEN = process.env.GITHUB_TOKEN;

const API = "https://api.github.com";

// Get all repos
async function getRepos() {
  const res = await fetch(
    `${API}/users/${USER}/repos?per_page=100&type=owner`,
    {
      headers: {
        Authorization: `token ${TOKEN}`,
      },
    }
  );

  return res.json();
}

// Get README
async function getReadme(repo) {
  const res = await fetch(
    `${API}/repos/${USER}/${repo}/readme`,
    {
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: "application/vnd.github.raw",
      },
    }
  );

  if (!res.ok) return null;

  return res.text();
}

// Parse metadata
function parseInfo(readme) {
  const match = readme.match(
    /<!-- PROJECT_INFO([\s\S]*?)-->/
  );

  if (!match) return null;

  const lines = match[1].trim().split("\n");

  const data = {};

  for (const line of lines) {
    const [k, v] = line.split(":").map(s => s.trim());
    if (k && v) data[k] = v;
  }

  return data;
}

// Main
async function main() {
  const repos = await getRepos();

  const projects = [];

  for (const repo of repos) {
    if (repo.private || repo.fork) continue;

    const readme = await getReadme(repo.name);
    if (!readme) continue;

    const info = parseInfo(readme);
    if (!info) continue;

    projects.push({
      name: info.name,
      desc: info.description,
      tech: info.tech,
      demo: info.demo,
      play: info.playstore,
      url: repo.html_url,
    });
  }

  let output = "";

  for (const p of projects) {
    output += `### 🔹 [${p.name}](${p.url})\n`;
    output += `> ${p.desc}\n`;
    output += `> \`${p.tech}\`\n\n`;

    if (p.demo) {
      output += `🔗 **Live Demo:** ${p.demo}\n\n`;
    }

    if (p.play) {
      output += `📱 **Play Store:** ${p.play}\n\n`;
    }

    output += "---\n\n";
  }

  return output;
}

// Update README
async function updateReadme(content) {
  const file = fs.readFileSync("README.md", "utf8");

  const start = "<!-- PROJECTS_START -->";
  const end = "<!-- PROJECTS_END -->";

  const updated =
    file.split(start)[0] +
    start +
    "\n\n" +
    content +
    "\n" +
    end +
    file.split(end)[1];

  fs.writeFileSync("README.md", updated);
}

main().then(updateReadme);
