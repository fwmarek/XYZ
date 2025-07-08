const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const CREDITS_PATH = path.join(__dirname, '..', 'data', 'credits.json');
const ALLOWED_ROLE_IDS = ['1386153764150448218', '1386153532318810194', '1386153973228240967', '1386154109853368330', '1386153822451142706'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('credit-view')
    .setDescription('View user credits.')
    .addUserOption(opt => opt.setName('user').setDescription('User to view').setRequired(true)),

  async execute(interaction) {
    const hasRole = interaction.member.roles.cache.some(r => ALLOWED_ROLE_IDS.includes(r.id));
    if (!hasRole) {
      return interaction.reply({ content: '❌ You do not have permission.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    let data = {};

    if (fs.existsSync(CREDITS_PATH)) {
      data = JSON.parse(fs.readFileSync(CREDITS_PATH, 'utf8'));
    }

    const amount = data[user.id] || 0;

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle(`${user.username}'s Credit Balance`)
      .setDescription(`💰 **${amount} credits**`)
      .setTimestamp();

    console.log(`[log sigma] ${interaction.user.tag} viewed ${user.tag}'s credits (${amount})`);

    await interaction.reply({ embeds: [embed] });
  }
};
