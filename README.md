# DayDream X
<div align="center">
    <img src="https://github.com/NightProxy/DayDreamX/blob/main/assets/DDXBanner.png" style="width: 1200px"/>
    <h2>Explore the Web with DayDream X</h2>
</div>

![inpreview](https://github.com/NightProxy/DayDreamX/blob/main/assets/daydreamx.png)

> [!IMPORTANT]
> Please consider giving the original repository a star if you fork this project.

## Features

- Cloaking
- Tabs
- History
- Theming
- Bookmarks
- Proxies
- Games

## Deployment

> [!WARNING]
> DayDream X cannot be hosted on static web hosting platforms such as Netlify, Github Pages, or Cloudflare Pages.

### Installation & Setup

DayDream X supports multiple package managers (has lockfiles for npm, pnpm, and bun) with Bun being recommended. To enable Bun using Corepack:


```bash
# Enable Corepack if not already enabled
corepack enable

# Set Bun as the preferred package manager
corepack prepare bun@1.2.0 --activate
```

If you do not wish to use Corepack due to its experimental status, you may install Bun manually, or use pnpm or npm as your package manager.

### Hosting Instructions

```bash
git clone https://github.com/NightProxy/DayDreamX.git
cd DayDreamX
bun install
bun start
```

Alternative package managers:
```bash
# For npm
npm install
npm start

# For pnpm
pnpm install
pnpm start
```

### Updating

```bash
git pull --force --allow-unrelated-histories
```

<a target="_blank" href="https://app.koyeb.com/deploy?type=git&repository=github.com/NightProxy/DayDreamX"><img alt="Deploy to Koyeb" src="https://binbashbanana.github.io/deploy-buttons/buttons/remade/koyeb.svg"></a>

## Support

For assistance, deployment methods, or to access links, join our [Discord Server](https://discord.night-x.com) or open a discussion on GitHub.

## Contributing

To contribute, fork the repository, implement your changes, and submit a pull request. Please test your code thoroughly before submission. For detailed contribution guidelines, refer to [CONTRIB.md](https://github.com/NightProxy/DayDreamX/blob/main/CONTRIB.md).

## Contributors

[![Contributors](https://contrib.rocks/image?repo=nightproxy/daydreamx)](https://github.com/NightProxy/DayDreamX/graphs/contributors)

## Community

Join our Discord community for support, access to our Link Archive, and to connect with other users.

[![Discord](https://invidget.switchblade.xyz/QmWUfvm4bn?theme=dark)](https://discord.night-x.com)