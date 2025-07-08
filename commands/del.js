const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const CREDITS_PATH = path.join(__dirname, '..', 'data', 'credits.json');
const ALLOWED_ROLE_IDS = ['1386153764150448218', '1386153532318810194', '1386153902440841309', '1386153871566438520'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('credit-del')
    .setDescription('Remove credits from a user.')
    .addUserOption(opt => opt.setName('user').setDescription('User to remove credits from').setRequired(true))
    .addIntegerOption(opt => opt.setName('amt').setDescription('Amount to remove').setRequired(true)),

  async execute(interaction) {
    const hasRole = interaction.member.roles.cache.some(r => ALLOWED_ROLE_IDS.includes(r.id));
    if (!hasRole) {
      return interaction.reply({ content: '❌ You do not have permission.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const amt = interaction.options.getInteger('amt');

    let data = {};
    if (fs.existsSync(CREDITS_PATH)) {
      data = JSON.parse(fs.readFileSync(CREDITS_PATH, 'utf8'));
    }

    data[user.id] = Math.max((data[user.id] || 0) - amt, 0);

    fs.mkdirSync(path.dirname(CREDITS_PATH), { recursive: true });
    fs.writeFileSync(CREDITS_PATH, JSON.stringify(data, null, 2));

    console.log(`[skib logs] ${interaction.user.tag} removed ${amt} credits from ${user.tag}. New total: ${data[user.id]}`);

    await interaction.reply({ content: `✅ Removed **${amt} credits** from ${user.username}.`, ephemeral: true });
  }
};
