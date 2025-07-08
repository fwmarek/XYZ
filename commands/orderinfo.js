const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('orderinfo')
    .setDescription('Displays order pricing and service information.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), 

  async execute(interaction) {
    await interaction.reply({ content: '✅ Success!', ephemeral: true });

    const embed1 = new EmbedBuilder()
      .setColor(5368575)
      .setImage('https://cdn.discordapp.com/attachments/1349004454501814332/1389296219934818426/image_2.png?ex=68641a6e&is=6862c8ee&hm=36d0890ebc29656c3e20ae988dd6b7cf5adfb0a19c287de2dc20fd0e634093aa&');

    const embed2 = new EmbedBuilder()
      .setColor(5368575)
      .addFields(
        {
          name: 'Clothing',
          value: 'Pants: 50+ Robux\nShirts: 50+ Robux\nSet: 95+ Robux',
          inline: true
        },
        {
          name: 'Liveries',
          value: 'LEO: 100+ Robux\nFD: 150+ Robux\nMisc: 175+ Robux',
          inline: true
        },
        {
          name: 'Graphics',
          value: 'Logo: 350+ Robux\nBanner: 150+ Robux\nGFX: 400+ Robux',
          inline: true
        },
        {
          name: 'Discord Services',
          value: 'Embeds: 100+ Robux\nServer Package: 500+ Robux\nServer Role, Channel, Bot setup: 300+ Robux',
          inline: true
        },
        {
          name: 'Photography Services',
          value: 'Take & Edit a Photo: 100+ Robux\nPhoto Package: 600+ Robux',
          inline: true
        },
        {
          name: 'Bot Services',
          value: 'Full Bot: 700+ Robux\n(custom)',
          inline: true
        }
      )
      .setFooter({ text: 'These prices are purely estimates. Final decisions are up to the .xyz team.' })
      .setImage('https://cdn.discordapp.com/attachments/1386089533279305770/1386399292905885786/Untitled_design.png.png?ex=685c3375&is=685ae1f5&hm=7412dbc6e60625f15a106f75d97b1e1cc71759fd20f877ca1ecf16425d1c331d&');

    const button = new ButtonBuilder()
      .setLabel('Order TOS')
      .setStyle(ButtonStyle.Link)
      .setURL('https://discord.com');

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.channel.send({
      embeds: [embed1, embed2],
      components: [row]
    });
  }
};
