const {
  SlashCommandBuilder,
  PermissionsBitField,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say a message')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('The message to say')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    const msg = interaction.options.getString('message');

    await interaction.reply({ content: '✅ Success!', ephemeral: true });
    await interaction.channel.send(msg);
  },
};
