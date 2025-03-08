# RoleIDPingBlocker

## Overview
RoleIDPingBlocker is a BetterDiscord plugin that allows you to block ping notifications from specific roles by their IDs and hide messages containing those pings. It's particularly useful for servers where certain role pings are frequent but not relevant to you.

## Features
- Blocks ping notifications for specific roles by their IDs
- Hides messages containing blocked role pings
- Shows intercepted messages in a distinctive red style with information about the blocked role
- Easy-to-use settings panel to add and remove blocked role IDs
- Visual indicators for intercepted messages
- Automatic role name detection when available

## Installation
1. Make sure you have [BetterDiscord](https://betterdiscord.app/) installed
2. Download the `RoleIDPingBlocker.plugin.js` file
3. Place it in your BetterDiscord plugins folder:
   - Windows: `%appdata%\BetterDiscord\plugins\`
   - Mac: `~/Library/Application Support/BetterDiscord/plugins/`
   - Linux: `~/.config/BetterDiscord/plugins/`
4. Enable the plugin in the BetterDiscord settings

## Requirements
- [ZeresPluginLibrary](https://github.com/rauenzi/BDPluginLibrary/tree/master) - Will prompt for installation if not found

## Usage
1. Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
2. Right-click on a role in the server and select "Copy ID"
3. Open the RoleIDPingBlocker settings panel in BetterDiscord plugins section
4. Paste the role ID in the input field and click "Add Role"
5. The plugin will now block pings from that role and hide messages containing those pings

## Settings
- **Add Role**: Add a role ID to the block list
- **Remove**: Remove a role ID from the block list
- Role names will be displayed when available

## How It Works
When a message contains a ping for a role that is on your block list and you have that role, the plugin will:
1. Block the notification from appearing
2. Hide the original message content
3. Replace it with a styled message indicating it was intercepted
4. Show which role was pinged

## Changelog
### Version 1.2.0
- Added intercepted message display with role name
- Improved visual styling for blocked messages
- Better compatibility with BetterDiscord
- Added red styling for intercepted messages

## Support
For issues, questions, or feature requests, please open an issue on the [GitHub repository](https://github.com/yourusername/RoleIDPingBlocker).

## License
This plugin is licensed under MIT. See the LICENSE file for details.

## Credits
- Created by Ethan98GG
- Uses the ZeresPluginLibrary by Zerebos
