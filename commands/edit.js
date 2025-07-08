
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

// const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE; // Your Roblox cookie
// let payment_options = []; // Array of [gamepass_name, gamepass_id] pairs

function save_bot_state() {
    const state = {
        last_payment_index: last_payment_index
    };
    fs.writeFileSync('bot_state.json', JSON.stringify(state, null, 2));
}

class RobloxSession {
    constructor(cookie) {
        this.cookie = cookie;
        this.headers = {};
        this.axiosInstance = axios.create({
            headers: {
                'Cookie': `.ROBLOSECURITY=${cookie}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            withCredentials: true
        });
    }

    async request(method, url, options = {}) {
        try {
            const originalData = options.data || null;
            
            const config = {
                method: method.toLowerCase(),
                url: url,
                headers: {
                    ...this.headers,
                    'Cookie': `.ROBLOSECURITY=${this.cookie}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                ...options
            };

            let response = await axios(config);

            if (['post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
                if (response.headers['x-csrf-token']) {
                    this.headers['X-CSRF-TOKEN'] = response.headers['x-csrf-token'];
                    
                    if (response.status === 403) {
                        config.headers['X-CSRF-TOKEN'] = response.headers['x-csrf-token'];
                        if (originalData !== null) {
                            config.data = originalData;
                        }
                        response = await axios(config);
                    }
                }
            }

            return response;
        } catch (error) {
            console.log(`Request failed: ${error.message}`);
            throw error;
        }
    }

    async update_gamepass(gamepass_id, price, is_for_sale = true) {
        const url = `https://apis.roblox.com/game-passes/v1/game-passes/${gamepass_id}/details`;
        const data = {
            IsForSale: is_for_sale,
            Price: price.toString()
        };
        
        return await this.request('POST', url, { data: data });
    }
}

class PaymentChange {
    constructor(bot) {
        this.bot = bot;
        this.roblox_cookie = ROBLOX_COOKIE;
        this.cooldowns = {};
    }

    get_next_gamepass() {
        global.last_payment_index = (global.last_payment_index + 1) % payment_options.length;
        save_bot_state();
        return payment_options[global.last_payment_index];
    }

    on_ready() {
        console.log("PaymentChange cog is ready!");
    }

    getSlashCommand() {
        return new SlashCommandBuilder()
            .setName('edit-payment')
            .setDescription('Edit the price of a payment option.')
            .addIntegerOption(option =>
                option.setName('price')
                    .setDescription('The new price for the gamepass')
                    .setRequired(true)
            );
    }

    async payment_change(interaction) {
        try {
            const price = interaction.options.getInteger('price');

            if (price <= 0) {
                await interaction.reply({
                    content: "Price must be greater than 0",
                    ephemeral: true
                });
                return;
            }

            const hasPermission = interaction.member.roles.cache.has('1386154109853368330');
            if (!hasPermission) {
                await interaction.reply({
                    content: "You don't have permission to change payment prices.",
                    ephemeral: true
                });
                return;
            }

            const current_time = new Date();
            const user_id = interaction.user.id;
            
            if (this.cooldowns[user_id]) {
                const time_diff = current_time - this.cooldowns[user_id];
                const time_diff_seconds = time_diff / 1000;
                
                if (time_diff_seconds < 600) { 
                    const remaining = 600 - Math.floor(time_diff_seconds);
                    const minutes = Math.floor(remaining / 60);
                    const seconds = remaining % 60;
                    
                    await interaction.reply({
                        content: `Please wait ${minutes}m ${seconds}s before using this command again.`,
                        ephemeral: true
                    });
                    return;
                }
            }

            const [payment_option, asset_id] = this.get_next_gamepass();
            const asset_link = `https://www.roblox.com/game-pass/${asset_id}`;

            try {
                const session = new RobloxSession(this.roblox_cookie);
                const response = await session.update_gamepass(asset_id, price);

                if (response.status === 200) {
                    this.cooldowns[user_id] = current_time;
                    await interaction.reply({
                        content: `You have **successfully** changed the price of [${payment_option}](${asset_link}) to **R$${price}**`
                    });
                } else {
                    await interaction.reply({
                        content: `There was an error while updating the price. Response: ${response.data}`,
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.log(`Error: ${error.message}`);
                await interaction.reply({
                    content: "There was an error while updating the price. Please try again later.",
                    ephemeral: true
                });
            }
        } catch (error) {
            if (error.code && error.code.includes('NETWORK')) {
                await interaction.reply({
                    content: `Failed to connect to Roblox API: ${error.message}`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: `An unexpected error occurred: ${error.message}`,
                    ephemeral: true
                });
            }
        }
    }
}

module.exports = { RobloxSession, PaymentChange };

