const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require('discord.js');

const SUGGEST_CHANNEL_ID = '1386157614341165066';
const voteTracker = new Map(); 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Submit a suggestion')
    .addStringOption(option =>
      option.setName('suggestion')
        .setDescription('Your suggestion')
        .setRequired(true)
    ),

  async execute(interaction) {
    const suggestion = interaction.options.getString('suggestion');
    const channel = interaction.client.channels.cache.get(SUGGEST_CHANNEL_ID);

    if (!channel) {
      return interaction.reply({
        content: '❌ Suggestion channel not found.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${interaction.user.username}'s Suggestion`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setDescription(`**Suggestion**\n${suggestion}`)
      .setColor('#5865F2')
      .setImage('https://cdn.discordapp.com/attachments/1386089533279305770/1386399292905885786/Untitled_design.png.png?ex=685ae1f5&is=68599075&hm=beab04e644bd5e97335ce8796e936c430a25c598675636058cb60a756690d977&')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('suggest_approve')
        .setLabel('0')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('suggest_deny')
        .setLabel('0')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger)
    );

    const msg = await channel.send({ embeds: [embed], components: [row] });
    voteTracker.set(msg.id, new Map());

    await interaction.reply({
      content: '✅ Your suggestion has been submitted!',
      ephemeral: true
    });
  },

  async handleInteraction(interaction) {
    if (!interaction.isButton()) return false;
    const { message, user, customId } = interaction;
    if (!['suggest_approve', 'suggest_deny'].includes(customId)) return false;

    const messageId = message.id;
    if (!voteTracker.has(messageId)) voteTracker.set(messageId, new Map());
    const userVotes = voteTracker.get(messageId);

    const previousVote = userVotes.get(user.id);
    if (previousVote === customId) {
      await interaction.reply({ content: '❌ You already voted this option.', ephemeral: true });
      return true;
    }

    const row = message.components[0];
    const buttons = row.components;
    let approveCount = parseInt(buttons[0].label);
    let denyCount = parseInt(buttons[1].label);

    if (previousVote === 'suggest_approve') approveCount--;
    if (previousVote === 'suggest_deny') denyCount--;

    if (customId === 'suggest_approve') approveCount++;
    if (customId === 'suggest_deny') denyCount++;

    userVotes.set(user.id, customId);

    const updatedRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('suggest_approve')
        .setLabel(String(approveCount))
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('suggest_deny')
        .setLabel(String(denyCount))
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger)
    );

    await message.edit({ embeds: message.embeds, components: [updatedRow] });
    await interaction.deferUpdate();
    return true;
  }
};
