const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionsBitField,
  Events,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Show the .xyz Dashboard')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const emptyEmbed = new EmbedBuilder()
        .setImage('https://cdn.discordapp.com/attachments/1349004454501814332/1389296219934818426/image_2.png')
        .setColor('Blue');

      const mainEmbed = new EmbedBuilder()
        .setDescription('Welcome to the .xyz Dashboard! .xyz is one of the largest design servers on the platform, specializing with all your ER:LC needs, branding solutions, or even discord bots & servers. We pride ourselves over our reasonable prices, and amazing quality. Enjoy your stay, enjoy .xyz')
        .setColor('Blue')
        .setImage('https://cdn.discordapp.com/attachments/1386089533279305770/1386399292905885786/Untitled_design.png.png');

      const infoMenu = new StringSelectMenuBuilder()
        .setCustomId('dashboard_info')
        .setPlaceholder('Info')
        .addOptions([
          {
            label: 'Guidelines',
            value: 'guidelines',
            emoji: '📘',
          },
          {
            label: 'Reaction Roles',
            value: 'reaction_roles',
            emoji: '🎭',
          },
        ]);

      const infoRow = new ActionRowBuilder().addComponents(infoMenu);

      const supportButton = new ButtonBuilder()
        .setCustomId('support_ticket')
        .setLabel('Support')
        .setStyle(ButtonStyle.Primary);

      const applicationsButton = new ButtonBuilder()
        .setCustomId('applications')
        .setLabel('Applications')
        .setStyle(ButtonStyle.Secondary);

      const buttonRow = new ActionRowBuilder().addComponents(supportButton, applicationsButton);

      await interaction.channel.send({
        embeds: [emptyEmbed, mainEmbed],
        components: [infoRow, buttonRow],
      });

      await interaction.editReply({
        content: '✅ Dashboard has been posted successfully!',
        ephemeral: true,
      });

    } catch (error) {
      console.error('Dashboard command error:', error);
      const errorMsg = '❌ Failed to post dashboard. Please try again.';
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMsg, ephemeral: true });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMsg, ephemeral: true });
      }
    }
  },

  async handleSelect(interaction) {
    if (interaction.customId !== 'dashboard_info') return;

    const choice = interaction.values[0];

    if (choice === 'guidelines') {
      await interaction.reply({
        ephemeral: true,
        embeds: [
          new EmbedBuilder()
            .setColor(5559017)
            .setImage('https://cdn.discordapp.com/attachments/1349004454501814332/1389296219934818426/image_2.png?ex=68641a6e&is=6862c8ee&hm=36d0890ebc29656c3e20ae988dd6b7cf5adfb0a19c287de2dc20fd0e634093aa&'),
          new EmbedBuilder()
            .setTitle('.xyz Design Regulations')
            .setDescription(
              ">>> 1. Respect\nYou must show respect to everyone in the server.\n\n2. Drama\nDo not start any drama whether it is from a different server or if it's political.\n\n3. Spamming\nWe do not tolerate spamming and it will be moderated, so please refrain from 5+ sentences.\n\n4. Raiding\nRaiding is a serious offense and if talked about weather joke or not you will be moderated. If you do raid us you will be banned.\n\n5. False Reports\nWe do not tolerate false reports against staff members or against community members. Please do not create false reports as that creates drama.\n\n6. NSFW\nWe do not tolerate anything related to NSFW (Not Safe For Work) if you post something about this it will be taken down and you will receive a ban.\n\n7. Advertising/Links\nThis includes discord links, link shorteners, IP grabbers or anything that may be deemed suspicious.\n\n8. English\nRefrain from speaking other languages. This is so we can moderate the server accordingly.\n\n9. Common Sense\nWe ask that you please use your common sense and ask yourself if you should say something before saying it, please and thank you.\n\n10. Discord ToS\nIt is required that you follow [Discord's Terms of Service](https://discord.com/terms)"
            )
            .setColor(5559017)
            .setImage('https://cdn.discordapp.com/attachments/1386089533279305770/1386398141234024688/Untitled_design.png.png'),
        ]
      });
    } else if (choice === 'reaction_roles') {
      await interaction.reply({
        ephemeral: true,
        content: '📌 Reaction roles menu coming soon.',
      });
    }
  }
};
