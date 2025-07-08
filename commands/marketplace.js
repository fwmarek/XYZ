const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('marketplace')
    .setDescription('Opens the .xyz marketplace.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.reply({ content: 'Success!', ephemeral: true });

    const embeds = [
      {
        color: 1040359,
        image: {
          url: 'https://cdn.discordapp.com/attachments/1349004454501814332/1389296219934818426/image_2.png?ex=6864c32e&is=686371ae&hm=dd796bcbcf2682816400a732f9a96c0f6aa7878fca9f92cb7b8c714ffdd8ac18&'
        }
      },
      {
        description: 'Welcome to the .xyz Marketplace. Here you can find many items, varying from .xyz+ to a SPG! We strongly encourage you to purchase from us, and look forward to your consideration!',
        color: 1040359,
        image: {
          url: 'https://cdn.discordapp.com/attachments/1386089533279305770/1386399292905885786/Untitled_design.png.png?ex=6864c535&is=686373b5&hm=252be80dcdcf83931cb3aa9ad451202b9300debd721d5ec3bdfb9f1cec3a390c&'
        }
      }
    ];

    const menu = new StringSelectMenuBuilder()
      .setCustomId('marketplace_select')
      .setPlaceholder('Marketplace')
      .addOptions(
        {
          label: '.xyz+',
          value: 'xyzplus'
        },
        {
          label: 'Paid Advertisements',
          value: 'ads'
        },
        {
          label: 'Donations',
          value: 'donations'
        },
        {
          label: 'Perks',
          value: 'perks'
        }
      );

    const row = new ActionRowBuilder().addComponents(menu);
    await interaction.channel.send({ embeds, components: [row] });
  }
};
