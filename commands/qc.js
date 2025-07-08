const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  AttachmentBuilder
} = require('discord.js');

const STAFF_ROLE_IDS = ['1386153822451142706', '1386153973228240967'];
const QC_SUBMITTER_ROLE = '1386154109853368330';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('qc')
    .setDescription('Submit a Quality Control request')
    .addAttachmentOption(opt =>
      opt.setName('file')
        .setDescription('Upload the QC attachment')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(QC_SUBMITTER_ROLE)) {
      return interaction.reply({ content: '❌ You are not authorized to use this command.', ephemeral: true });
    }

    const attachment = interaction.options.getAttachment('file');
    if (!attachment || !attachment.contentType?.startsWith('image/') && !attachment.contentType?.startsWith('application/')) {
      return interaction.reply({ content: '❌ Please upload a valid attachment.', ephemeral: true });
    }

    const staffPing = STAFF_ROLE_IDS.map(id => `<@&${id}>`).join(' ');
    const msg = `📌 **New Quality Control Submission**\n\nNew quality control for ${interaction.user}. Please review this and **ping the person that submitted the QC, with the results**.`;

    await interaction.channel.send({
      content: `${staffPing}\n\n${msg}`,
      files: [attachment.url]
    });

    await interaction.reply({ content: '✅ QC submitted successfully.', ephemeral: true });
  }
};
