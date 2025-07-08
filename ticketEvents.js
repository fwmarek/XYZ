const {
  Events,
  ChannelType,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const TICKET_DATA_PATH = path.join(__dirname, 'tickets.json');
if (!fs.existsSync(TICKET_DATA_PATH)) fs.writeFileSync(TICKET_DATA_PATH, '{}');

const generalCatId = '1340535673643597877';
const generalStaffRoles = ['1386153822451142706', '1386153973228240967'];
const roleIds = {
  news: '1386186700757270702',
  package: '1386187168677888130',
  orderStatus: '1386187359925571584',
  giveaway: '1386186946094825553',
};

function saveTicket(id, data) {
  try {
    const db = JSON.parse(fs.readFileSync(TICKET_DATA_PATH, 'utf8'));
    db[id] = data;
    fs.writeFileSync(TICKET_DATA_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error saving ticket data:', error);
  }
}

function removeTicket(id) {
  try {
    const db = JSON.parse(fs.readFileSync(TICKET_DATA_PATH, 'utf8'));
    delete db[id];
    fs.writeFileSync(TICKET_DATA_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error removing ticket data:', error);
  }
}

function isInteractionValid(interaction) {
  if (!interaction.isRepliable()) return false;
  if (interaction.replied || interaction.deferred) return false;
  return Date.now() - interaction.createdTimestamp <= 14 * 60 * 1000;
}

async function safeReply(interaction, options) {
  try {
    if (!interaction.isRepliable()) return;
    if (interaction.deferred) return await interaction.editReply(options);
    if (!interaction.replied) return await interaction.reply(options);
  } catch (error) {
    if (error.code !== 10062) console.error('Failed to reply to interaction:', error);
  }
}

async function safeDefer(interaction, ephemeral = true) {
  try {
    if (!interaction.isRepliable() || interaction.replied || interaction.deferred) return false;
    await interaction.deferReply({ ephemeral });
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      if (!isInteractionValid(interaction)) return;
      const guild = interaction.guild;
      const user = interaction.user;
      if (!guild) return;

      if (interaction.isButton() || interaction.isModalSubmit() || interaction.isStringSelectMenu()) {
        const packages = require('./commands/packages');
        if (typeof packages.interactionHandler === 'function') {
          const handled = await packages.interactionHandler(interaction);
          if (handled) return;
        }
      }

      if (interaction.isButton()) {
        const { customId } = interaction;

        if (customId === 'support_ticket') {
          const modal = new ModalBuilder()
            .setCustomId('ticket_modal')
            .setTitle('Support Ticket')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('reason')
                  .setLabel('What do you need help with?')
                  .setStyle(TextInputStyle.Paragraph)
                  .setRequired(true)
                  .setMaxLength(1000)
              )
            );
          return await interaction.showModal(modal);
        }

        if (customId === 'applications') {
          await interaction.deferReply({ ephemeral: true });
          const channelName = `application-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
          const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: generalCatId,
            permissionOverwrites: [
              { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
              ...generalStaffRoles.map(r => ({ id: r, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
              { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles] },
            ],
          });

          saveTicket(channel.id, { user: user.id, type: 'application', createdAt: Date.now() });

          const embed = new EmbedBuilder()
            .setTitle('.xyz - Application')
            .setDescription(`Thank you ${user} for opening an application ticket.`)
            .setColor('Orange')
            .setTimestamp()
            .setImage('https://cdn.discordapp.com/attachments/1386089533279305770/1386399292905885786/Untitled_design.png.png');

          await channel.send({
            content: `@here ${user} ${generalStaffRoles.map(id => `<@&${id}>`).join(' ')}`,
            embeds: [embed],
          });

          return await interaction.editReply({ content: `✅ Application ticket created: ${channel}`, ephemeral: true });
        }

        if (customId.startsWith('role_')) {
          const member = interaction.member;
          if (!member) return await safeReply(interaction, { content: '❌ Member not found.', ephemeral: true });

          const roleMap = {
            role_news: ['news', 'News Ping'],
            role_package: ['package', 'Package Ping'],
            role_orderstatus: ['orderStatus', 'Order Status Ping'],
            role_giveaway: ['giveaway', 'Giveaway Ping'],
          };

          const [key, name] = roleMap[customId] || [];
          const roleId = roleIds[key];

          const role = guild.roles.cache.get(roleId);
          if (!role) return await safeReply(interaction, { content: '❌ Role not found.', ephemeral: true });

          if (member.roles.cache.has(roleId)) {
            await member.roles.remove(roleId);
            return await safeReply(interaction, { content: `✅ Removed **${name}** role from you.`, ephemeral: true });
          } else {
            await member.roles.add(roleId);
            return await safeReply(interaction, { content: `✅ Added **${name}** role to you.`, ephemeral: true });
          }
        }
      }

      if (interaction.isModalSubmit() && interaction.customId === 'ticket_modal') {
        await interaction.deferReply({ ephemeral: true });
        const reason = interaction.fields.getTextInputValue('reason');
        const channelName = `general-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;

        const channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: generalCatId,
          permissionOverwrites: [
            { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            ...generalStaffRoles.map(r => ({ id: r, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
            { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles] },
          ],
        });

        saveTicket(channel.id, { user: user.id, type: 'general', reason, createdAt: Date.now() });

        const embed = new EmbedBuilder()
          .setTitle('.xyz - Support Ticket')
          .setDescription(`Thank you ${user} for creating a support ticket.\n\n**Reason:** ${reason}`)
          .setColor('Blue')
          .setTimestamp()
          .setImage('https://cdn.discordapp.com/attachments/1386089533279305770/1386399292905885786/Untitled_design.png.png');

        await channel.send({
          content: `@here ${user} ${generalStaffRoles.map(id => `<@&${id}>`).join(' ')}`,
          embeds: [embed],
        });

        return await interaction.editReply({ content: `✅ Support ticket created: ${channel}`, ephemeral: true });
      }

      if (interaction.isStringSelectMenu()) {
        const selected = interaction.values[0];
        if (interaction.customId === 'dashboard_info') {
          if (selected === 'guidelines') {
            return await safeReply(interaction, {
              ephemeral: true,
              embeds: [
                new EmbedBuilder()
                  .setColor(5559017)
                  .setImage('https://cdn.discordapp.com/attachments/1349004454501814332/1389296219934818426/image_2.png'),
                new EmbedBuilder()
                  .setTitle('.xyz Design Regulations')
                  .setDescription('Please follow all server guidelines and regulations.')
                  .setColor(5559017)
                  .setImage('https://cdn.discordapp.com/attachments/1386089533279305770/1386398141234024688/Untitled_design.png.png'),
              ],
            });
          }

          if (selected === 'reaction_roles') {
            const buttons = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId('role_news').setLabel('News Ping').setStyle(ButtonStyle.Primary),
              new ButtonBuilder().setCustomId('role_package').setLabel('Package Ping').setStyle(ButtonStyle.Primary),
              new ButtonBuilder().setCustomId('role_orderstatus').setLabel('Order-Status Ping').setStyle(ButtonStyle.Primary),
              new ButtonBuilder().setCustomId('role_giveaway').setLabel('Giveaway Ping').setStyle(ButtonStyle.Primary)
            );

            return await safeReply(interaction, {
              ephemeral: true,
              content: 'Click a button to toggle a reaction role:',
              components: [buttons],
            });
          }
        }

        if (interaction.customId === 'marketplace_select') {
          const embed = new EmbedBuilder().setColor(1040359);
          switch (selected) {
            case 'xyzplus':
              embed
                .setDescription("**.xyz - .xyz+**\nxyz+ is a premium purchase that .xyz STRONGLY recommends...")
                .setImage("https://cdn.discordapp.com/attachments/1386089533279305770/1386399292905885786/Untitled_design.png.png");
              break;
            case 'ads':
              embed
                .setDescription("**.xyz - Paid Advertisements**\n.xyz offers many options in terms of paid advertisements...")
                .addFields(
                  { name: "Sponsored Giveaway", value: "1700 <:Robux:1389506345035759688>...", inline: true },
                  { name: "@everyone Paid Ad", value: "1200 <:Robux:1389506345035759688>...", inline: true },
                  { name: "@here Paid Ad", value: "700 <:Robux:1389506345035759688>...", inline: true }
                )
                .setImage("https://cdn.discordapp.com/attachments/1386089533279305770/1386399292905885786/Untitled_design.png.png");
              break;
            case 'donations':
              embed
                .setDescription("**.xyz - Donations**\nDonating to .xyz helps us operate...")
                .addFields(
                  { name: "50$R Donation", value: "50 <:Robux:...>", inline: true },
                  { name: "100$R Donation", value: "100 <:Robux:...>", inline: true },
                  { name: "250$R Donation", value: "250 <:Robux:...>", inline: true },
                  { name: "500$R Donation", value: "500 <:Robux:...>", inline: true },
                  { name: "1000$R Donation", value: "1000 <:Robux:...>", inline: true }
                )
                .setImage("https://cdn.discordapp.com/attachments/1386089533279305770/1386399292905885786/Untitled_design.png.png");
              break;
            case 'perks':
              embed
                .setDescription("**.xyz - Perks**")
                .addFields(
                  { name: ".xyz+", value: "- 10% Off all orders...", inline: true },
                  { name: "Donations until 500$R", value: "- 100 In-Store Credit...", inline: true },
                  { name: "1000$R Donation", value: "- 150 In-Store Credit...", inline: true }
                )
                .setFooter({ text: "Create a ticket to claim perks" })
                .setImage("https://cdn.discordapp.com/attachments/1386089533279305770/1386399292905885786/Untitled_design.png.png");
              break;
            default:
              return await safeReply(interaction, { content: '❌ Unknown selection.', ephemeral: true });
          }

          return await safeReply(interaction, { embeds: [embed], ephemeral: true });
        }
      }
    } catch (error) {
      console.error('Interaction handler error:', error);
      if (error.code === 10062) return;
      try {
        const msg = '❌ There was an error while processing your interaction. Please try again.';
        if (interaction.deferred && !interaction.replied) {
          await interaction.editReply({ content: msg, ephemeral: true });
        } else if (!interaction.replied && interaction.isRepliable()) {
          await interaction.reply({ content: msg, ephemeral: true });
        }
      } catch (replyError) {
        console.error('Failed to send fallback error:', replyError);
      }
    }
  }
};
