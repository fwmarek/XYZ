const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'infractions.json');
const HR_ROLE_IDS = [
  '1386153532318810194',
  '1386153822451142706',
  '1389470092512989376',
  '1386153764150448218',
];
const LOG_CHANNEL_ID = '1387281952188403862';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('infract')
    .setDescription('Staff infraction')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to punish').setRequired(true))
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Why?').setRequired(true))
    .addStringOption(opt =>
      opt.setName('punishment').setDescription('Type').setRequired(true).addChoices(
        { name: 'Strike I', value: 'Strike I' },
        { name: 'Strike II', value: 'Strike II' },
        { name: 'Strike III', value: 'Strike III' },
        { name: 'Warning I', value: 'Warning I' },
        { name: 'Warning II', value: 'Warning II' },
        { name: 'Warning III', value: 'Warning III' },
        { name: 'Suspension', value: 'Suspension' },
        { name: 'Termination', value: 'Termination' },
        { name: 'Staff Blacklist', value: 'Staff Blacklist' },
        { name: 'Under Investigation', value: 'Under Investigation' },
      ))
    .addStringOption(opt =>
      opt.setName('duration').setDescription('e.g. 24h, 7d').setRequired(false))
    .addStringOption(opt =>
      opt.setName('notes').setDescription('Optional').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const issuer = await interaction.guild.members.fetch(interaction.user.id);
    const isHR = HR_ROLE_IDS.some(id => issuer.roles.cache.has(id));
    if (!isHR) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const punishment = interaction.options.getString('punishment');
    const rawDuration = interaction.options.getString('duration');
    const notes = interaction.options.getString('notes') || 'None';

    let durationFormatted = 'N/A';
    if (rawDuration) {
      const match = rawDuration.match(/^(\d+)([hd])$/i);
      if (!match) {
        return interaction.reply({ content: '❌ Invalid duration format. Use like `24h`, `7d`.', ephemeral: true });
      }
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase() === 'h' ? 3600 : 86400;
      const expiresAt = Math.floor(Date.now() / 1000) + value * unit;
      durationFormatted = `<t:${expiresAt}:R>`;
    }

    let data = [];
    if (fs.existsSync(file)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
        data = Array.isArray(parsed) ? parsed : [];
      } catch {
        data = [];
      }
    }

    const caseId = data.length + 1;

    const infraction = {
      caseId,
      userId: targetUser.id,
      issuerId: interaction.user.id,
      reason,
      punishment,
      duration: durationFormatted,
      notes,
      date: new Date().toISOString(),
      voided: false
    };

    data.push(infraction);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));

    const embed = new EmbedBuilder()
      .setColor('#ff4500')
      .setDescription(
        `**Staff Disciplinary Action - .xyz**\n\n` +
        `> **User:** ${targetUser.tag}\n` +
        `> **Reason:** ${reason}\n` +
        `> **Punishment:** ${punishment}\n` +
        `> **Duration:** ${durationFormatted}\n\n` +
        `> **Case ID:** ${caseId}\n` +
        `> **Notes:** ${notes}`
      )
      .setImage('https://cdn.discordapp.com/attachments/1386089533279305770/1386399292905885786/Untitled_design.png.png?ex=685c3375&is=685ae1f5&hm=7412dbc6e60625f15a106f75d97b1e1cc71759fd20f877ca1ecf16425d1c331d&');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('issuer')
        .setLabel(`Issuer: ${interaction.user.username}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    try {
      await targetUser.send({ embeds: [embed] });
    } catch {}

    try {
      const logChannel = await interaction.client.channels.fetch(LOG_CHANNEL_ID);
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({ embeds: [embed], components: [row] });
      } else {
        console.warn('❗ Could not log to infraction channel (not text-based).');
      }
    } catch (err) {
      console.error('❌ Failed to send log message:', err);
    }

    await interaction.reply({ content: `✅ <@${targetUser.id}> has been infracted.`, ephemeral: false });
  }
};
