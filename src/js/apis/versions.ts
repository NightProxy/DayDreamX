class VersionsAPI {
  constructor() {}

  async fetchLastCommitDate(tag: HTMLElement) {
    try {
      const response = await fetch(
        "https://api.github.com/repos/NightProxy/DayDreamX/commits",
      );
      const commits = await response.json();
      const lastCommitDate = new Date(commits[0].commit.committer.date);
      const formattedDate = lastCommitDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      tag.textContent = formattedDate;
    } catch (error) {
      console.error("Error fetching the last commit date:", error);
    }
  }

  async fetchLatestVersionNumber(tag: HTMLElement) {
    try {
      const response = await fetch(
        "https://api.github.com/repos/NightProxy/DayDreamX/releases/latest",
      );
      const release = await response.json();
      tag.textContent = release.tag_name;
    } catch (error) {
      console.error("Error fetching the latest version number:", error);
    }
  }
}

export { VersionsAPI };
