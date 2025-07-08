const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

function save_bot_state() {
  const state = {
    last_payment_index: global.last_payment_index || 0
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

    return await this.request('POST', url, { data });
  }
}

class PaymentChange {
  constructor(bot, roblox_cookie) {
    this.bot = bot;
    this.roblox_cookie = roblox_cookie;
    this.cooldowns = {};
  }

  get_next_gamepass() {
    global.last_payment_index = (global.last_payment_index + 1) % global.payment_options.length;
    save_bot_state();
    return global.payment_options[global.last_payment_index];
  }

  on_ready() {
    console.log('PaymentChange cog is ready!');
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
    const price = interaction.options.getInteger('price');

    if (price <= 0) {
      return interaction.reply({
        content: '❌ Price must be greater than 0.',
        ephemeral: true
      });
    }

    const hasPermission = interaction.member.roles.cache.has('1386154109853368330');
    if (!hasPermission) {
      return interaction.reply({
        content: "❌ You don't have permission to change payment prices.",
        ephemeral: true
      });
    }

    const now = new Date();
    const userId = interaction.user.id;

    if (this.cooldowns[userId]) {
      const timeDiff = now - this.cooldowns[userId];
      const timeLeft = 600 - Math.floor(timeDiff / 1000); 
      if (timeLeft > 0) {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        return interaction.reply({
          content: `⏳ Please wait ${mins}m ${secs}s before using this command again.`,
          ephemeral: true
        });
      }
    }

    const [paymentOption, assetId] = this.get_next_gamepass();
    const assetLink = `https://www.roblox.com/game-pass/${assetId}`;

    try {
      const session = new RobloxSession(this.roblox_cookie);
      const response = await session.update_gamepass(assetId, price);

      if (response.status === 200 || response.status === 204) {
        this.cooldowns[userId] = now;
        return interaction.reply({
          content: `✅ Successfully updated [${paymentOption}](${assetLink}) to **R$${price}**.`
        });
      }

      return interaction.reply({
        content: `❌ Roblox API returned an error: ${JSON.stringify(response.data)}`,
        ephemeral: true
      });
    } catch (error) {
      console.error(`Update failed: ${error.message}`);
      return interaction.reply({
        content: '⚠️ Failed to update gamepass. Please try again later.',
        ephemeral: true
      });
    }
  }
}

module.exports = { RobloxSession, PaymentChange };
