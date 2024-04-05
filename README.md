# OxplorerGUI - WIP

A frontend for oxplorer to easily visualize and edit paths in real time as well as visiualizing and editing autos.

## Installation

Download the binary for your platform from the [latest release](https://github.com/FRCTeam3044/OxplorerGUI/releases/latest) and install it.
You will need java installed on your machine for the application to run.

Note: On windows, you may have to click "More Info" then "Run Anyway" on the SmartScreen prompt.

OxplorerGUI currently does not run on arm macs, as arm macs require code signing and the intel mac build does not include the correct java binding libraries to run on arm. As a workaround, you can clone the repo and run the development application.

## Development

1. Clone the repository
2. Install dependencies

```bash
yarn
```

3. Start the development server

```bash
yarn start
```

4. Build the app

```bash
yarn make
```

### Credits

- Made using [GoJS](https://gojs.net/latest/index.html), with permission.
- Bundles [Oxplorer](https://github.com/FRCTeam3044/Oxplorer)
- Uses code from [AdvantageScope](https://github.com/Mechanical-Advantage/AdvantageScope) to render the field and handle updates
- Field Images from [Chiefdelphi](https://www.chiefdelphi.com/t/2024-crescendo-top-down-field-renders/447764)

Roadmap:

- [ ] Optionally render obstacles on field
- [ ] Import path settings
- [ ] Path Waypoints
- [ ] Export Built paths
- [ ] Improved autonomous parameter validation
- [ ] Hot reload autos without code push
- [ ] Add 2023 fields
