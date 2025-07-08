const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders'); 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('execute')
    .setDescription('Admin-only: Send an embed via JSON.')
    .addStringOption(option =>
      option.setName('json')
        .setDescription('Embed JSON')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const raw = interaction.options.getString('json');

    try {
      const parsed = JSON.parse(raw);

      const embeds = Array.isArray(parsed)
        ? parsed.map(obj => new EmbedBuilder(obj))
        : [new EmbedBuilder(parsed)];

      await interaction.reply({ content: '✅ Embed sent.', ephemeral: true });
      await interaction.channel.send({ embeds });
    } catch (err) {
      console.error('Embed JSON error:', err);
      await interaction.reply({
        content: '❌ Invalid embed JSON. Please ensure it\'s valid and formatted correctly.',
        ephemeral: true,
      });
    }
  }
};
