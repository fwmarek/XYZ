const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  AttachmentBuilder
} = require('discord.js');

const LOG_CHANNEL_ID = '1387282438027477012';
const ALLOWED_ROLE_IDS = ['1386154109853368330', '1386154214249599098'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('orderlog')
    .setDescription('Log a completed design order')
    .addStringOption(opt =>
      opt.setName('designer_roblox')
        .setDescription('Designer\'s Roblox username')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('customer_roblox')
        .setDescription('Customer\'s Roblox username')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('service')
        .setDescription('What service was provided?')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('price')
        .setDescription('What was the price?')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('proof_of_purchase')
        .setDescription('Paste the proof of purchase (link, ID, etc.)')
        .setRequired(true)
    )
    .addAttachmentOption(opt =>
      opt.setName('attachment')
        .setDescription('Optional image or file proof')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const hasAccess = ALLOWED_ROLE_IDS.some(role => member.roles.cache.has(role));
    if (!hasAccess) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const designer = interaction.options.getString('designer_roblox');
    const customer = interaction.options.getString('customer_roblox');
    const service = interaction.options.getString('service');
    const price = interaction.options.getString('price');
    const proof = interaction.options.getString('proof_of_purchase');
    const attachment = interaction.options.getAttachment('attachment');

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🧾 Order Log')
      .setDescription(
        `**Order-Log for ${interaction.user}**\n\n` +
        `**Designer’s Roblox:** ${designer}\n` +
        `**Customer’s Roblox:** ${customer}\n` +
        `**Service:** ${service}\n` +
        `**Price:** ${price}\n` +
        `**Proof Of Purchase:** ${proof}\n` +
        `**Date:** <t:${Math.floor(Date.now() / 1000)}:F>`
      );

    try {
      const logChannel = await interaction.client.channels.fetch(LOG_CHANNEL_ID);
      if (!logChannel || !logChannel.isTextBased()) {
        return interaction.reply({ content: '❌ Unable to send to log channel.', ephemeral: true });
      }

      const messagePayload = { embeds: [embed] };
      if (attachment) {
        messagePayload.files = [attachment];
      }

      await logChannel.send(messagePayload);
      await interaction.reply({ content: '✅ Order logged successfully.', ephemeral: true });
    } catch (err) {
      console.error('Error sending order log:', err);
      await interaction.reply({ content: '❌ Something went wrong while logging the order.', ephemeral: true });
    }
  }
};
