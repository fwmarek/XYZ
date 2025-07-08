const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const CREDITS_PATH = path.join(__dirname, '..', 'data', 'credits.json');
const ALLOWED_ROLE_IDS = ['1386153764150448218', '1386153532318810194', '1386153902440841309', '1386153871566438520'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('credit-add')
    .setDescription('Add credits to a user.')
    .addUserOption(opt => opt.setName('user').setDescription('User to add credits to').setRequired(true))
    .addIntegerOption(opt => opt.setName('amt').setDescription('Amount to add').setRequired(true)),

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

    data[user.id] = (data[user.id] || 0) + amt;

    fs.mkdirSync(path.dirname(CREDITS_PATH), { recursive: true });
    fs.writeFileSync(CREDITS_PATH, JSON.stringify(data, null, 2));

    console.log(`[skib log] ${interaction.user.tag} added ${amt} credits to ${user.tag}. New total: ${data[user.id]}`);

    await interaction.reply({ content: `✅ Added **${amt} credits** to ${user.username}.`, ephemeral: true });
  }
};
