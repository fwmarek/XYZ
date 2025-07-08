const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const forumIds = {
  Assets: '1386170633141878904',
  Liveries: '1386170466422624376',
  Clothing: '1386170501482676295',
  Archive: '1389724267263823873',
};
const packageCategory = '1386170153804496996';
const pingRoleId = '1386187168677888130';
const allowedRole = '1389626851520938239';
const TICKET_PATH = path.join(__dirname, '../tickets.json');
if (!fs.existsSync(TICKET_PATH)) fs.writeFileSync(TICKET_PATH, '{}');
const userTracker = new Map();

function saveTicket(id, data) {
  const db = JSON.parse(fs.readFileSync(TICKET_PATH));
  db[id] = data;
  fs.writeFileSync(TICKET_PATH, JSON.stringify(db, null, 2));
}

function removeTicket(id) {
  const db = JSON.parse(fs.readFileSync(TICKET_PATH));
  delete db[id];
  fs.writeFileSync(TICKET_PATH, JSON.stringify(db, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('package')
    .setDescription('Create a package listing')
    .addSubcommand(sub =>
      sub.setName('create').setDescription('Post a package')
        .addStringOption(opt =>
          opt.setName('type').setDescription('Package type').setRequired(true)
            .addChoices(
              { name: 'Assets', value: 'Assets' },
              { name: 'Liveries', value: 'Liveries' },
              { name: 'Clothing', value: 'Clothing' }
            ))
        .addStringOption(opt => opt.setName('name').setDescription('Package name').setRequired(true))
        .addStringOption(opt => opt.setName('designer').setDescription('Select designer').setRequired(true))
        .addStringOption(opt => opt.setName('price').setDescription('Enter price').setRequired(true))
        .addStringOption(opt => opt.setName('products').setDescription('Comma-separated product list').setRequired(true))
        .addAttachmentOption(opt => opt.setName('post_images').setDescription('Post image(s)').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const member = interaction.member;
    if (!member.roles.cache.has(allowedRole)) {
      return await interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const userId = interaction.user.id;
    if (userTracker.has(userId)) {
      return await interaction.reply({ content: '❌ You already created a package. Wait until it resets.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    if (sub === 'create') {
      const type = interaction.options.getString('type');
      const name = interaction.options.getString('name');
      const designer = interaction.options.getString('designer');
      const price = interaction.options.getString('price');
      const products = interaction.options.getString('products');
      const postImg = interaction.options.getAttachment('post_images');

      const forumId = forumIds[type];
      if (!forumId) return await interaction.reply({ content: 'Invalid forum ID.', ephemeral: true });

      const forum = interaction.guild.channels.cache.get(forumId);
      if (!forum || forum.type !== ChannelType.GuildForum)
        return await interaction.reply({ content: 'Forum channel not found.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle(`.xyz - ${name}`)
        .setColor('Blue')
        .setImage(postImg.url)
        .setDescription([
          `**Designer:** ${designer}`,
          `**Price:** ${price}`,
          `**Product List:**\n${products.split(',').map(p => `• ${p.trim()}`).join('\n')}`
        ].join('\n\n'));

      const button = new ButtonBuilder()
        .setLabel('Purchase a Package')
        .setCustomId(`purchase_package`)
        .setStyle(ButtonStyle.Success);

      const thread = await forum.threads.create({
        name: name,
        message: {
          content: `<@&${pingRoleId}>`,
          embeds: [embed],
          components: [new ActionRowBuilder().addComponents(button)],
        },
      });

      try {
        await interaction.user.send({
          content: `📦 Your package "${name}" has been posted successfully!

Please reply to this DM with the asset files (attachments or links). We will forward them to the appropriate vault.`
        });
      } catch {
        return await interaction.reply({
          content: '❌ Failed to DM you. Please enable DMs and try again.',
          ephemeral: true,
        });
      }

      userTracker.set(userId, true);
      setTimeout(() => userTracker.delete(userId), 60 * 5 * 1000);

      await interaction.reply({
        content: `✅ Package post created: ${thread}`,
        ephemeral: true,
      });
    }
  },

  async handlePurchase(interaction) {
    const user = interaction.user;
    const ch = await interaction.guild.channels.create({
      name: `package-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      type: ChannelType.GuildText,
      parent: packageCategory,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone, deny: ['ViewChannel'] },
        { id: user.id, allow: ['ViewChannel', 'SendMessages', 'EmbedLinks', 'AttachFiles'] },
        { id: interaction.guild.roles.cache.get(allowedRole)?.id || '', allow: ['ViewChannel', 'SendMessages'] }
      ],
    });

    saveTicket(ch.id, { user: user.id, type: 'package' });

    const embed = new EmbedBuilder()
      .setTitle('.xyz - Package Ticket')
      .setColor('Blue')
      .setDescription(`Thank you for your consideration to purchase a package. Please wait while we get a staff member to assist you. In the meantime, please follow the format;\n\n\`\`\`Username:\nLink to package:\`\`\``)
      .setImage('https://cdn.discordapp.com/attachments/1386089533279305770/1386399292905885786/Untitled_design.png.png?ex=68656df5&is=68641c75&hm=eeefc3b4ac0b70f282536e0b5035914a86dc43c27bb8105d73e224bc20529892&');

    const msg = await ch.send({ embeds: [embed] });
    await msg.pin();
    await interaction.reply({ content: `✅ Ticket created: ${ch}`, ephemeral: true });
  }
};
