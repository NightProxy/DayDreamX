# Contributing to DayDreamX

First of all, thanks for taking interest in the project!

> [!IMPORTANT]
> Please use prettier with our provided config to all your changes, failure to do so will result in your changes getting rejected. Simply run `npm format` to format the code with our config

## Frontend Contributions

All frontend contributions should use the provided files, and should avoid creating new ones. There are of course exceptions, but try to fit and organize your changes across the files. Heres a guide for the purpose of the frontend files and path chart:

```
public/
├── pages/
│   ├── internal/
│   │   ├── (all of the pages and internal URLs)
│   └── index.html (main page)
├── static/
│   ├── (proxy files)
│   ├── assets/
│   │   ├── css/
│   │   │   ├── pages/
│   │   │   │   └── (page-only CSS files, for internal URLs)
│   │   │   ├── styles/
│   │   │   │   └── (separated styles for things like vertical tabs)
│   │   │   └── (all of the main CSS files)
│   │   ├── imgs/
│   │   │   ├── b/
│   │   │   │   └── (search engine icons)
│   │   │   ├── g/
│   │   │   │   └── (game icons)
│   │   │   ├── proxies/
│   │   │   │   └── (proxy icons)
│   │   │   └── (misc images)
│   │   ├── js/
│   │   │   ├── apis/
│   │   │   │   └── (global APIs used across DDX)
│   │   │   ├── lib/
│   │   │   │   └── (libraries)
│   │   │   ├── global/
│   │   │   │   └── (files used on all pages, but not an API)
│   │   │   ├── browser/
│   │   │   │   └── (browser-like APIs, controlling functionality like rendering the browser; not as vital as ../apis/)
│   │   │   └── (main files, or uncategorized)
│   │   ├── json/
│   │   │   ├── themes/
│   │   │   │   └── (JSON files for theming)
│   │   │   └── (misc JSON files)
```

## Backend Contributions

All backend changes should be reviewed by at least one or two team members to ensure compatibility and stability. If you create extra files for your changes without reason (adding a new proxy would be a good reason for extra files), then your changes will likely get rejected

## Adding Games and Apps

This should be a pretty straight forward process, simply add an entry to the end of the corresponding json file.

- g.json for games

Put your addition at the bottom of the list as they will automatically be alphabetically sorted on render.

The json files should follow this format:

```json
{
  "name": "game name",
  "link": "game url that will get proxied",
  "image": "/res/g/{name of the game without spaces}.webp",
  "categories": ["all", "cat1", "cat2"]
}
```

When you add a game or app img, add the webp version to the corresponding directory: public/static/(image path)

> [!NOTE]
> The all category is required on all additions, however more descriptive ones are optional.

If you are unsure about something or want some clarification on any of these specifications, feel free to join the [discord](https://discord.night-x.com) where a member of our team will gladly answer your questions!

### Thanks for contributing!
