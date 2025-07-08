const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ChannelType,
  PermissionsBitField
} = require('discord.js');

const FORUM_CHANNEL_ID = '1386477385599160420';
const ALLOWED_ROLE_IDS = ['1386153532318810194', '1386153764150448218', '1386153973228240967', '1386153822451142706'];

const TAGS = {
  BOT: '1387544342679261376',
  DISCORD: '1386477634803863582',
  GRAPHICS: '1386477612360007874',
  PHOTOGRAPHY: '1386477810222239754',
  ELS: '1387544412514680985',
  LIVERIES: '1386477714348703785',
  CLOTHING: '1386477880476827798'
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('portfolio')
    .setDescription('Create a portfolio forum post for a user.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to create a portfolio for')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id))) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user');

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`portfolio_tags_${targetUser.id}`)
      .setPlaceholder('Select portfolio categories...')
      .setMinValues(1)
      .setMaxValues(Object.keys(TAGS).length)
      .addOptions(
        Object.entries(TAGS).map(([label, id]) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(label)
            .setValue(label)
        )
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({ content: 'Select categories for the portfolio:', components: [row], ephemeral: true });
  },

  async handleInteraction(interaction) {
    if (!interaction.isStringSelectMenu()) return false;
    if (!interaction.customId.startsWith('portfolio_tags_')) return false;

    const targetUserId = interaction.customId.split('_').pop();
    const selectedTags = interaction.values;

    const forumChannel = await interaction.client.channels.fetch(FORUM_CHANNEL_ID);
    if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
      return interaction.reply({ content: '❌ Forum channel not found or invalid.', ephemeral: true });
    }

    const appliedTags = selectedTags.map(tag => TAGS[tag]).filter(Boolean);

    const post = await forumChannel.threads.create({
      name: `Portfolio for ${interaction.client.users.cache.get(targetUserId)?.username || 'user'}`,
      message: {
        content: '.',
        embeds: [
          {
            image: {
              url: 'https://cdn.discordapp.com/attachments/1352852584423227402/1387559102208807102/DESIGNER.png?ex=685dc89d&is=685c771d&hm=666569fbf98498377a03ceefca18e4c188bbb2c64cdd3ee9aa17c69db5cfe3be&'
            }
          }
        ]
      },
      appliedTags
    });

    await post.send(`<@${targetUserId}> your portfolio has been created.`);

    await post.setLocked(false);
    await post.setArchived(false);

    const perms = [
      { id: targetUserId, allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel] },
      { id: '1386153973228240967', allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel] }
    ];

    for (const perm of perms) {
      await post.permissionOverwrites.edit(perm.id, perm.allow);
    }

    await interaction.update({ content: `✅ Portfolio created for <@${targetUserId}>`, components: [] });
    return true;
  }
};
