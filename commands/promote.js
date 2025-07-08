const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require('discord.js');

const roleOptions = [
  { label: 'Junior Creative', value: 'Junior Creative' },
  { label: 'Creative', value: 'Creative' },
  { label: 'Sr Creative', value: 'Sr Creative' },
  { label: 'Head Creative', value: 'Head Creative' },
  { label: 'Jr Supervisory', value: 'Jr Supervisory' },
  { label: 'Supervisory', value: 'Supervisory' },
  { label: 'Sr Supervisor', value: 'sr Supervisor' },
  { label: 'Head Supervisor', value: 'Head Supervisor' },
  { label: 'Jr Ops', value: 'Jr Ops' },
  { label: 'Ops', value: 'Ops' },
  { label: 'Sr Ops', value: 'Sr Ops' },
  { label: 'Head Ops', value: 'Head ops' },

];

const HR_ROLE_IDS = ['1386153871566438520', '1386153532318810194'];
const PROMO_CHANNEL_ID = '1387282050863595670';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promote')
    .setDescription('Announce a staff promotion')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('The user being promoted')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('old_rank')
        .setDescription('Their old rank')
        .setRequired(true)
        .addChoices(...roleOptions.map(r => ({ name: r.label, value: r.value })))
    )
    .addStringOption(opt =>
      opt.setName('new_rank')
        .setDescription('Their new rank')
        .setRequired(true)
        .addChoices(...roleOptions.map(r => ({ name: r.label, value: r.value })))
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Why are they being promoted?')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction) {
    const hasHRRole = HR_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
    if (!hasHRRole) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('user');
    const oldRank = interaction.options.getString('old_rank');
    const newRank = interaction.options.getString('new_rank');
    const reason = interaction.options.getString('reason');

    const embed = new EmbedBuilder()
      .setColor(0x00AE86)
      .setImage('https://cdn.discordapp.com/attachments/1386089533279305770/1386399292905885786/Untitled_design.png.png')
      .setDescription(
        `**Staff Promotion**\n\n` +
        `**User:** ${user}\n` +
        `**Old Rank:** ${oldRank}\n` +
        `**New Rank:** ${newRank}\n` +
        `**Reason:** ${reason}`
      );

    const button = new ButtonBuilder()
      .setLabel(`Issuer: ${interaction.user.username}`)
      .setStyle(ButtonStyle.Secondary)
      .setCustomId('issuer-button')
      .setDisabled(true);

    const row = new ActionRowBuilder().addComponents(button);

    let promoChannel;
    try {
      promoChannel = await interaction.client.channels.fetch(PROMO_CHANNEL_ID);
    } catch (err) {
      console.error('❌ Failed to fetch promotion channel:', err);
    }

    if (!promoChannel || !promoChannel.isTextBased()) {
      return interaction.reply({
        content: '❌ Could not find or access the promotion channel.',
        ephemeral: true
      });
    }

    await promoChannel.send({ content: `${user}`, embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Promotion announced for ${user}.`, ephemeral: true });
  },
};
