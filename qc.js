const {
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const DESIGNER_ROLE_ID = '1386154109853368330';
const QC_ROLE_ID = '1391995394229272626';
const QC_CHANNEL_ID = '1387282387846565988';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('qc')
    .setDescription('Submit a Quality Control request')
    .addChannelOption(option =>
      option.setName('ticket')
        .setDescription('Select the order ticket channel')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(DESIGNER_ROLE_ID)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const ticketChannel = interaction.options.getChannel('ticket');
    const requester = interaction.user;

    const embed1 = new EmbedBuilder().setImage(
      'https://cdn.discordapp.com/attachments/1349004454501814332/1389296219934818426/image_2.png'
    );

    const embed2 = new EmbedBuilder()
      .setAuthor({
        name: 'Quality Control Request',
        iconURL: 'https://cdn.discordapp.com/emojis/1386169632662098011.png'
      })
      .setDescription(
        `**<@${requester.id}> has requested Quality Control -** please evaluate their work in the thread below. After discussing, if it meets our standards, please click *“Mark as Approved”*. If not, please provide constructive feedback and click *“Deny”*.`
      )
      .addFields(
        { name: 'Designer', value: `<@${requester.id}>`, inline: false },
        { name: 'Order Ticket', value: `<#${ticketChannel.id}>`, inline: false },
        { name: 'QC Status', value: '*Pending*', inline: false }
      )
      .setImage(
        'https://cdn.discordapp.com/attachments/1386089533279305770/1386399292905885786/Untitled_design.png.png'
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('qc_approve').setLabel('Mark As Approved').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('qc_deny').setLabel('Deny').setStyle(ButtonStyle.Secondary)
    );

    const qcChannel = await interaction.client.channels.fetch(QC_CHANNEL_ID);
    const qcMsg = await qcChannel.send({
      content: `<@&${QC_ROLE_ID}> <@${requester.id}>`,
      embeds: [embed1, embed2],
      components: [row]
    });

    const thread = await qcMsg.startThread({
      name: `Quality Control Discussion for ${requester.username}`,
      autoArchiveDuration: 60
    });

    interaction.client.qcCache ??= {};
    interaction.client.qcCache[qcMsg.id] = {
      requesterId: requester.id,
      threadId: thread.id,
      messageId: qcMsg.id,
      channelId: QC_CHANNEL_ID
    };

    await interaction.reply({ content: 'QC request submitted.', ephemeral: true });
  },

  async handleInteraction(interaction) {
    const valid = ['qc_approve', 'qc_deny'];
    if (!valid.includes(interaction.customId)) return false;

    const cache = interaction.client.qcCache?.[interaction.message.id];
    if (!cache) return false;

    if (!interaction.member.roles.cache.has(QC_ROLE_ID)) {
      await interaction.reply({ content: 'You are not an authorized QC Member.', ephemeral: true });
      return true;
    }

    const isApproved = interaction.customId === 'qc_approve';
    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[1]);
    updatedEmbed.data.fields = updatedEmbed.data.fields.map(f =>
      f.name === 'QC Status'
        ? { name: 'QC Status', value: `**${isApproved ? 'Approved' : 'Denied'} by <@${interaction.user.id}>**`, inline: false }
        : f
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('qc_approve').setLabel('Mark As Approved').setStyle(ButtonStyle.Primary).setDisabled(true),
      new ButtonBuilder().setCustomId('qc_deny').setLabel('Deny').setStyle(ButtonStyle.Secondary).setDisabled(true)
    );

    await interaction.update({
      embeds: [interaction.message.embeds[0], updatedEmbed],
      components: [row]
    });

    const thread = await interaction.client.channels.fetch(cache.threadId);
    await thread.send(`<@${interaction.user.id}> has ${isApproved ? 'approved' : 'denied'} this QC.\n<@${cache.requesterId}> your QC has been **${isApproved ? 'approved' : 'denied'}**.`);
    await thread.setLocked(true);

    const requester = await interaction.client.users.fetch(cache.requesterId);
    await requester.send(
      `<@${interaction.user.id}> has ${isApproved ? 'approved' : 'denied'} your QC.\nMessage: https://discord.com/channels/${interaction.guild.id}/${cache.channelId}/${cache.messageId}`
    );

    return true;
  }
};
