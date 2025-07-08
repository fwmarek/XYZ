const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');

const REVIEW_CHANNEL_ID = '1386302949474566154';
const STAFF_ROLE_IDS = [
  '1386154109853368330',
  '1386153973228240967',
  '1386153822451142706',
  '1386153532318810194',
  '1386154214249599098'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('review')
    .setDescription('Submit a staff review')
    .addUserOption(option =>
      option.setName('staff')
        .setDescription('Select a staff member')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('rating')
        .setDescription('Select a rating')
        .setRequired(true)
        .addChoices(
          { name: '⭐️', value: '⭐️' },
          { name: '⭐️⭐️', value: '⭐️⭐️' },
          { name: '⭐️⭐️⭐️', value: '⭐️⭐️⭐️' },
          { name: '⭐️⭐️⭐️⭐️', value: '⭐️⭐️⭐️⭐️' },
          { name: '⭐️⭐️⭐️⭐️⭐️', value: '⭐️⭐️⭐️⭐️⭐️' }
        )
    )
    .addStringOption(option =>
      option.setName('feedback')
        .setDescription('Write your feedback')
        .setRequired(true)
    ),

  async execute(interaction) {
    const staff = interaction.options.getUser('staff');
    const rating = interaction.options.getString('rating');
    const feedback = interaction.options.getString('feedback');
    const channel = interaction.client.channels.cache.get(REVIEW_CHANNEL_ID);

    if (!STAFF_ROLE_IDS.some(roleId => interaction.guild.members.cache.get(staff.id)?.roles.cache.has(roleId))) {
      return interaction.reply({
        content: '❌ Selected user is not a staff member.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${interaction.user.username}'s Review`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setDescription(`**Reviewee**\n<@${staff.id}>\n\n**Rating**\n${rating}\n\n**Feedback**\n${feedback}`)
      .setColor('#00A8E8')
      .setImage('https://cdn.discordapp.com/attachments/1386089533279305770/1386399292905885786/Untitled_design.png.png?ex=685ae1f5&is=68599075&hm=beab04e644bd5e97335ce8796e936c430a25c598675636058cb60a756690d977&')
      .setTimestamp();

    await channel.send({ embeds: [embed] });

    await interaction.reply({
      content: '✅ Your review has been submitted!',
      ephemeral: true
    });
  }
};
