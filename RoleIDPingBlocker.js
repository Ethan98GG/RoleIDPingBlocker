/**
 * @name RoleIDPingBlocker
 * @author Claude
 * @description Blocks ping notifications for specific roles by their IDs and hides messages containing those pings
 * @version 1.2.0
 * @website https://github.com/yourusername/RoleIDPingBlocker
 * @source https://github.com/yourusername/RoleIDPingBlocker
 * @updateUrl https://raw.githubusercontent.com/yourusername/RoleIDPingBlocker/main/RoleIDPingBlocker.plugin.js
 */

const config = {
    info: {
        name: "RoleIDPingBlocker",
        authors: [
            {
                name: "Yuyu Fumo",
                discord_id: "777616657040408606",
                github_username: "Sciencehacker45"
            }
        ],
        version: "1.2.0",
        description: "Blocks ping notifications for specific roles by their IDs and hides messages containing those pings",
        github: "https://github.com/Ethan98GG/RoleIDPingBlocker",
        github_raw: "https://raw.githubusercontent.com/Ethan98GG/RoleIDPingBlocker/main/RoleIDPingBlocker.plugin.js"
    },
    changelog: [
        {
            title: "New Features",
            items: [
                "Added intercepted message display with role name",
                "Improved visual styling for blocked messages"
            ]
        },
        {
            title: "Improvements",
            items: [
                "Better compatibility with BetterDiscord",
                "Added red styling for intercepted messages"
            ]
        }
    ],
    main: "index.js"
};

// BdApi Webpack modules
const Webpack = BdApi.Webpack;
const Filters = BdApi.Webpack.Filters;

// Module exports for BetterDiscord
module.exports = !global.ZeresPluginLibrary ? class {
    constructor() {
        this._config = config;
    }

    getName() { return config.info.name; }
    getAuthor() { return config.info.authors.map(a => a.name).join(", "); }
    getDescription() { return config.info.description; }
    getVersion() { return config.info.version; }

    load() {
        BdApi.UI.showNotice(
            `${config.info.name} requires ZeresPluginLibrary to work.`,
            {
                type: "error",
                buttons: [{
                    label: "Download",
                    onClick: () => {
                        const request = require("request");
                        const fs = require("fs");
                        const path = require("path");
                        const url = "https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js";
                        
                        request.get(url, (error, response, body) => {
                            if (error) return;
                            
                            fs.writeFileSync(
                                path.join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"),
                                body
                            );
                        });
                    }
                }]
            }
        );
    }

    start() { }
    stop() { }
} : (([Plugin, Library]) => {
    const { Patcher, Data, UI } = BdApi;
    
    return class RoleIDPingBlocker extends Plugin {
        constructor() {
            super();
            this.blockedRoleIDs = [];
            this.defaultSettings = {
                blockedRoleIDs: []
            };
            this.deletedMessageCache = new Map(); // Cache to prevent re-processing deleted messages
        }

        onStart() {
            this.loadSettings();
            this.patchMessageCreate();
            this.patchMessageComponent();
            console.log("RoleIDPingBlocker: Plugin started");
            this.showToast("RoleIDPingBlocker enabled");
        }

        onStop() {
            Patcher.unpatchAll("RoleIDPingBlocker");
            if (this.cacheCleanupInterval) {
                clearInterval(this.cacheCleanupInterval);
            }
            console.log("RoleIDPingBlocker: Plugin stopped");
            this.showToast("RoleIDPingBlocker disabled");
        }
        
        showToast(message) {
            UI.showToast(message, {
                type: "info",
                timeout: 3000
            });
        }

        loadSettings() {
            this.settings = Data.load("RoleIDPingBlocker", "settings");
            if (!this.settings) {
                this.settings = this.defaultSettings;
                Data.save("RoleIDPingBlocker", "settings", this.settings);
            }
            this.blockedRoleIDs = this.settings.blockedRoleIDs;
        }

        saveSettings() {
            Data.save("RoleIDPingBlocker", "settings", this.settings);
        }

        getSettingsPanel() {
            // Create settings panel
            const panel = document.createElement("div");
            panel.className = "roleIDPingBlocker-settings";
            panel.style.padding = "10px";

            // Title
            const title = document.createElement("h2");
            title.textContent = "Role ID Ping Blocker Settings";
            panel.appendChild(title);

            // Description
            const description = document.createElement("p");
            description.textContent = "Add role IDs that you want to block pings from. You can get a role ID by enabling Developer Mode in Discord settings, then right-clicking a role and selecting 'Copy ID'. Messages containing these pings will be hidden from your view.";
            panel.appendChild(description);

            // Current blocked roles list
            const currentList = document.createElement("div");
            currentList.style.marginBottom = "15px";
            currentList.style.border = "1px solid #3e4148";
            currentList.style.padding = "10px";
            currentList.style.borderRadius = "5px";
            currentList.style.maxHeight = "200px";
            currentList.style.overflowY = "auto";

            const listTitle = document.createElement("h3");
            listTitle.textContent = "Currently Blocked Role IDs:";
            currentList.appendChild(listTitle);

            // Refresh function for the list
            const refreshList = () => {
                // Clear existing entries except title
                while(currentList.childNodes.length > 1) {
                    currentList.removeChild(currentList.lastChild);
                }

                if (this.settings.blockedRoleIDs.length === 0) {
                    const noRoles = document.createElement("p");
                    noRoles.textContent = "No roles added yet.";
                    noRoles.style.fontStyle = "italic";
                    currentList.appendChild(noRoles);
                } else {
                    const roleList = document.createElement("ul");
                    roleList.style.listStyleType = "none";
                    roleList.style.padding = "0";
                    
                    this.settings.blockedRoleIDs.forEach((roleID, index) => {
                        const item = document.createElement("li");
                        item.style.display = "flex";
                        item.style.justifyContent = "space-between";
                        item.style.alignItems = "center";
                        item.style.margin = "5px 0";
                        item.style.padding = "5px";
                        item.style.borderRadius = "3px";
                        item.style.backgroundColor = "#2f3136";
                        
                        const roleInfo = document.createElement("span");
                        
                        // Try to get role name if possible
                        let roleName = "Unknown Role";
                        const guildId = Webpack.getModule(m => m?.getLastSelectedGuildId)?.getLastSelectedGuildId();
                        if (guildId) {
                            const roleModule = Webpack.getModule(m => m?.getRole);
                            if (roleModule) {
                                const role = roleModule.getRole(guildId, roleID);
                                if (role) {
                                    roleName = role.name;
                                }
                            }
                        }
                        
                        roleInfo.textContent = `${roleName} (${roleID})`;
                        
                        const removeBtn = document.createElement("button");
                        removeBtn.textContent = "Remove";
                        removeBtn.style.backgroundColor = "#ed4245";
                        removeBtn.style.color = "white";
                        removeBtn.style.border = "none";
                        removeBtn.style.borderRadius = "3px";
                        removeBtn.style.padding = "5px 10px";
                        removeBtn.style.cursor = "pointer";
                        
                        removeBtn.onclick = () => {
                            this.settings.blockedRoleIDs.splice(index, 1);
                            this.saveSettings();
                            this.blockedRoleIDs = this.settings.blockedRoleIDs;
                            refreshList();
                            this.showToast(`Removed role ID: ${roleID}`);
                        };
                        
                        item.appendChild(roleInfo);
                        item.appendChild(removeBtn);
                        roleList.appendChild(item);
                    });
                    
                    currentList.appendChild(roleList);
                }
            };
            
            refreshList();
            panel.appendChild(currentList);

            // Input for new role ID
            const inputContainer = document.createElement("div");
            inputContainer.style.display = "flex";
            inputContainer.style.marginBottom = "15px";
            
            const input = document.createElement("input");
            input.type = "text";
            input.placeholder = "Enter Role ID...";
            input.style.flex = "1";
            input.style.marginRight = "10px";
            input.style.padding = "8px";
            input.style.borderRadius = "3px";
            input.style.border = "1px solid #3e4148";
            input.style.backgroundColor = "#2f3136";
            input.style.color = "white";
            
            const addButton = document.createElement("button");
            addButton.textContent = "Add Role";
            addButton.style.backgroundColor = "#5865f2";
            addButton.style.color = "white";
            addButton.style.border = "none";
            addButton.style.borderRadius = "3px";
            addButton.style.padding = "8px 15px";
            addButton.style.cursor = "pointer";
            
            addButton.onclick = () => {
                const roleID = input.value.trim();
                if (roleID && !this.settings.blockedRoleIDs.includes(roleID)) {
                    this.settings.blockedRoleIDs.push(roleID);
                    this.saveSettings();
                    this.blockedRoleIDs = this.settings.blockedRoleIDs;
                    input.value = "";
                    refreshList();
                    this.showToast(`Added role ID: ${roleID}`);
                } else if (this.settings.blockedRoleIDs.includes(roleID)) {
                    this.showToast("This role ID is already in the list!");
                } else {
                    this.showToast("Please enter a valid role ID!");
                }
            };
            
            inputContainer.appendChild(input);
            inputContainer.appendChild(addButton);
            panel.appendChild(inputContainer);
            
            return panel;
        }

        getCurrentUserRoleIDs() {
            // Get the current user's role IDs
            const userModule = Webpack.getModule(m => m?.getCurrentUser);
            const memberModule = Webpack.getModule(m => m?.getMember);

            if (!userModule || !memberModule) return [];

            const currentUser = userModule.getCurrentUser();
            if (!currentUser) return [];

            const guildId = Webpack.getModule(m => m?.getLastSelectedGuildId)?.getLastSelectedGuildId();
            if (!guildId) return [];

            const member = memberModule.getMember(guildId, currentUser.id);
            if (!member) return [];

            return member.roles;
        }

        getBlockedRoleName(roleID) {
            // Try to get role name if possible
            const guildId = Webpack.getModule(m => m?.getLastSelectedGuildId)?.getLastSelectedGuildId();
            if (guildId) {
                const roleModule = Webpack.getModule(m => m?.getRole);
                if (roleModule) {
                    const role = roleModule.getRole(guildId, roleID);
                    if (role) {
                        return role.name;
                    }
                }
            }
            return null;
        }

        shouldBlockMessage(message) {
            if (!message || !message.mentionRoles || message.mentionRoles.length === 0) {
                return false;
            }

            // Get current user's roles
            const userRoleIDs = this.getCurrentUserRoleIDs();
            
            // Check if any of the mentioned roles are in our block list and user has those roles
            for (const mentionedRoleID of message.mentionRoles) {
                if (
                    this.blockedRoleIDs.includes(mentionedRoleID) && 
                    userRoleIDs.includes(mentionedRoleID)
                ) {
                    // Return the blocked role ID so we can display it
                    return mentionedRoleID;
                }
            }
            
            return false;
        }

        patchMessageCreate() {
            // Patch the notification system
            const NotificationModule = Webpack.getModule(m => m?.showNotification);
            
            if (!NotificationModule) {
                console.error("RoleIDPingBlocker: Required notification modules not found");
                return;
            }

            // Patch the showNotification method
            Patcher.before("RoleIDPingBlocker", NotificationModule, "showNotification", (thisObj, methodArgs) => {
                const [notification] = methodArgs;
                
                if (notification && notification.message) {
                    const blockedRoleID = this.shouldBlockMessage(notification.message);
                    if (blockedRoleID) {
                        // Block this notification
                        methodArgs[0] = null;
                        console.log(`RoleIDPingBlocker: Blocked ping notification for role ${blockedRoleID}`);
                    }
                }
            });
        }

        patchMessageComponent() {
            // Find message components to patch
            const MessageComponent = Webpack.getModule(m => m?.default?.displayName === "Message");
            
            if (!MessageComponent) {
                console.error("RoleIDPingBlocker: Message component not found");
                return;
            }

            // Patch message rendering to hide blocked messages
            Patcher.before("RoleIDPingBlocker", MessageComponent, "default", (_, [props]) => {
                if (!props || !props.message) return;
                
                const message = props.message;
                
                // Check if we should block this message
                const blockedRoleID = this.shouldBlockMessage(message);
                if (blockedRoleID) {
                    // Cache the message ID to avoid re-processing
                    if (!this.deletedMessageCache.has(message.id)) {
                        this.deletedMessageCache.set(message.id, true);
                        
                        // Get the blocked role name if possible
                        const roleName = this.getBlockedRoleName(blockedRoleID) || "Unknown Role";
                        console.log(`RoleIDPingBlocker: Hiding message with blocked role ping: ${roleName} (${blockedRoleID})`);
                        
                        // Create hidden replacement message element with new format
                        const hiddenMessage = {
                            ...message,
                            content: `🚫 [INTERCEPTED] 🚫 Message contained ping for blocked role: ${roleName}`,
                            embeds: [],
                            attachments: [],
                            components: [],
                            blocked: true, // Add custom property to mark it as blocked
                            _hiddenByRoleIDPingBlocker: true
                        };
                        
                        // Replace the message
                        props.message = hiddenMessage;
                    }
                }
            });
            
            // Patch to style the hidden messages
            Patcher.after("RoleIDPingBlocker", MessageComponent, "default", (_, [props], ret) => {
                if (props?.message?._hiddenByRoleIDPingBlocker) {
                    // Find the message content div and apply styles
                    const findAndStyleContent = (element) => {
                        if (!element || !element.props) return;
                        
                        if (element.props.className && 
                            typeof element.props.className === 'string' && 
                            element.props.className.includes('message-content')) {
                            
                            // Apply styles to the message
                            element.props.style = {
                                ...element.props.style,
                                fontStyle: 'italic',
                                color: '#ff5555',  // Red color for intercepted messages
                                fontWeight: 'bold' // Make text bold to stand out
                            };
                        }
                        
                        if (element.props.children) {
                            if (Array.isArray(element.props.children)) {
                                element.props.children.forEach(child => findAndStyleContent(child));
                            } else {
                                findAndStyleContent(element.props.children);
                            }
                        }
                    };
                    
                    // Style the message container to make it more noticeable as intercepted
                    if (ret && ret.props) {
                        ret.props.style = {
                            ...ret.props.style,
                            backgroundColor: 'rgba(255, 0, 0, 0.05)', // Light red background
                            borderLeft: '3px solid #ff5555',          // Red border on the left
                            marginLeft: '-3px',                       // Adjust margin for the border
                            padding: '8px'                            // Add some padding
                        };
                        
                        findAndStyleContent(ret);
                    }
                }
                
                return ret;
            });
            
            // Clean up the cache periodically to prevent memory leaks
            this.cacheCleanupInterval = setInterval(() => {
                if (this.deletedMessageCache.size > 1000) {
                    this.deletedMessageCache.clear();
                }
            }, 60000); // Clean every minute if cache gets too large
        }
    };
})(global.ZeresPluginLibrary.buildPlugin(config));
