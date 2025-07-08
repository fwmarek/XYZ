const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionsBitField,
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const ORDER_CONFIG = {
  photography: {
    category: '1386165692881047663',
    staffRoles: ['1386153822451142706', '1386153973228240967', '1386154422924476446']
  },
  graphics: {
    category: '1386165468469137450',
    staffRoles: ['1386153822451142706', '1386153973228240967', '1386154353760669746']
  },
  discord: {
    category: '1386165577105543209',
    staffRoles: ['1386153822451142706', '1386153973228240967', '1386154454465646712']
  },
  clothing: {
    category: '1386165284167094363',
    staffRoles: ['1386153822451142706', '1386153973228240967', '1386154398530404483']
  },
  livery: {
    category: '1386164914883924110',
    staffRoles: ['1386153822451142706', '1386153973228240967', '1386154379165306950']
  },
  bot: {
    category: '1386539043218657361',
    staffRoles: ['1386153822451142706', '1386153973228240967', '1386154335532224645']
  },
  els: {
    category: '1386539073191280670',
    staffRoles: ['1386153822451142706', '1386153973228240967', '1386154316930482186']
  },
  alting: {
    category: '1386166088236007455',
    staffRoles: [
      '1386154302191435787',
      '1386154277440983050',
      '1386154263486533792',
      '1386154246084362240',
      '1386154230896918648',
      '1386153973228240967',
      '1386153822451142706'
    ]
  }
};

function loadTickets() {
  const ticketsPath = path.join(__dirname, '..', 'tickets.json');
  if (!fs.existsSync(ticketsPath)) {
    const emptyTickets = {};
    saveTickets(emptyTickets);
    return emptyTickets;
  }
  try {
    const data = fs.readFileSync(ticketsPath, 'utf8');
    return data.trim() ? JSON.parse(data) : {};
  } catch (error) {
    console.error('[ERROR] Failed to parse tickets.json:', error);
    return {};
  }
}

function saveTickets(tickets) {
  const ticketsPath = path.join(__dirname, '..', 'tickets.json');
  try {
    const dir = path.dirname(ticketsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2));
  } catch (error) {
    console.error('[ERROR] Failed to save tickets.json:', error);
  }
}

function loadServiceStatus() {
  const statusPath = path.join(__dirname, '..', 'service-status.json');
  if (!fs.existsSync(statusPath)) {
    return getDefaultServiceStatus();
  }
  try {
    const data = fs.readFileSync(statusPath, 'utf8');
    return data.trim() ? JSON.parse(data) : getDefaultServiceStatus();
  } catch (error) {
    console.error('[ERROR] Failed to parse service-status.json:', error);
    return getDefaultServiceStatus();
  }
}

function getDefaultServiceStatus() {
  return {
    photography: true,
    graphics: true,
    discord: true,
    clothing: true,
    livery: true,
    bot: true,
    els: true,
    alting: true
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('orders')
    .setDescription('Display the order system')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    try {
      const serviceStatus = loadServiceStatus();

      const imageEmbed = new EmbedBuilder()
        .setImage(
          'https://cdn.discordapp.com/attachments/1349004454501814332/1389296219934818426/image_2.png?ex=68641a6e&is=6862c8ee&hm=36d0890ebc29656c3e20ae988dd6b7cf5adfb0a19c287de2dc20fd0e634093aa&'
        )
        .setColor('#5865F2');

      const embed = new EmbedBuilder()
        .setTitle('.xyz Services')
        .setDescription(
          'Thank you for choosing .xyz designs. We have a team of designers ready to assist with your design needs. Upon opening a ticket, please follow the format provided in the channel. Review <#1369052441177489519> for pricing and info. We accept USD and Robux. Enjoy your experience with .xyz!'
        )
        .setColor('#5865F2')
      .setImage('https://cdn.discordapp.com/attachments/1386089533279305770/1386399292905885786/Untitled_design.png.png?ex=685ae1f5&is=68599075&hm=beab04e644bd5e97335ce8796e936c430a25c598675636058cb60a756690d977&')
        .setTimestamp()
        .setFooter({ text: '© .xyz Designs 2025 Copyright' });

      const availableOptions = [
        {
          label: 'Photography',
          value: 'photography',
          description: serviceStatus.photography ? 'Professional photography services' : 'Professional photography services',
          emoji: serviceStatus.photography ? '📸' : '📸'
        },
        {
          label: 'Graphics',
          value: 'graphics',
          description: serviceStatus.graphics ? 'Custom graphic design, logos, banners, GFX, embeds' : 'Custom graphic design, logos, banners, GFX, embeds',
          emoji: serviceStatus.graphics ? '🎨' : '🎨'
        },
        {
          label: 'Discord',
          value: 'discord',
          description: serviceStatus.discord ? 'Discord setup, management, embeds' : 'Discord setup, management, embeds',
          emoji: serviceStatus.discord ? '💬' : '💬'
        },
        {
          label: 'Livery',
          value: 'livery',
          description: serviceStatus.livery ? 'Vehicle livery design' : 'Vehicle livery design',
          emoji: serviceStatus.livery ? '🚗' : '🚗'
        },
        {
          label: 'Clothing',
          value: 'clothing',
          description: serviceStatus.clothing ? 'Custom clothing design' : 'Custom clothing design',
          emoji: serviceStatus.clothing ? '👕' : '👕'
        },
        {
          label: 'ELS',
          value: 'els',
          description: serviceStatus.els ? 'Emergency lighting systems' : 'Emergency lighting systems',
          emoji: serviceStatus.els ? '💡' : '💡'
        },
        {
          label: 'Bot',
          value: 'bot',
          description: serviceStatus.bot ? 'Discord bot development' : 'Discord bot development',
          emoji: serviceStatus.bot ? '🤖' : '🤖'
        },
        {
          label: 'Alting',
          value: 'alting',
          description: serviceStatus.alting ? 'Alting Services' : 'Alting Services',
          emoji: serviceStatus.alting ? '⚠️' : '⚠️'
        }
      ];

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('order_type_select')
          .setPlaceholder('🎯 Select a service type...')
          .addOptions(availableOptions)
      );

      await interaction.reply({ content: 'Success!', ephemeral: true });

      await interaction.followUp({
        embeds: [imageEmbed, embed],
        components: [row]
      });
    } catch (error) {
      console.error('[ERROR] Failed to execute orders command:', error);
      await interaction.reply({ 
        content: '❌ An error occurred while setting up the order system.', 
        ephemeral: true 
      });
    }
  },

  async handleInteraction(interaction) {
    if (!interaction.isStringSelectMenu() || interaction.customId !== 'order_type_select') return false;

    try {
      const selectedValue = interaction.values[0];
      const user = interaction.user;
      const guild = interaction.guild;
      const config = ORDER_CONFIG[selectedValue];

      if (!config) {
        await interaction.reply({ content: '❌ Invalid selection.', ephemeral: true });
        return true;
      }

      const serviceStatus = loadServiceStatus();
      if (!serviceStatus[selectedValue]) {
        await interaction.reply({
          content: `❌ The ${selectedValue} service is currently closed. Please try again later.`,
          ephemeral: true
        });
        return true;
      }

      const tickets = loadTickets();
      const existingTicket = Object.values(tickets).find(
        (t) => t.userId === user.id && t.type === selectedValue && t.guildId === guild.id
      );

      if (existingTicket) {
        const existingChannel = guild.channels.cache.get(existingTicket.channelId);
        if (existingChannel) {
          await interaction.reply({
            content: `❌ You already have an active ${selectedValue} ticket: ${existingChannel}`,
            ephemeral: true
          });
          return true;
        } else {
          delete tickets[existingTicket.channelId];
          saveTickets(tickets);
        }
      }

      const category = guild.channels.cache.get(config.category);
      if (!category) {
        console.error(`[ERROR] Category ${config.category} not found for ${selectedValue}`);
        await interaction.reply({
          content: '❌ Service category not found. Please contact an administrator.',
          ephemeral: true
        });
        return true;
      }

      const permissionOverwrites = [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks
          ]
        }
      ];

      config.staffRoles.forEach((roleId) => {
        const role = guild.roles.cache.get(roleId);
        if (role) {
          permissionOverwrites.push({
            id: roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageMessages,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.EmbedLinks
            ]
          });
        }
      });

      const cleanUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
      const channelName = `${selectedValue}-${cleanUsername || user.id}`;

      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: config.category,
        permissionOverwrites: permissionOverwrites,
        topic: `${selectedValue.charAt(0).toUpperCase() + selectedValue.slice(1)} order for ${user.tag} (${user.id})`
      });

      const isAlting = selectedValue === 'alting';
      const ticketEmbed = new EmbedBuilder()
        .setTitle(isAlting ? '⚠️ Alting Report' : `🎯 ${selectedValue.charAt(0).toUpperCase() + selectedValue.slice(1)} Order`)
        .setDescription(
          isAlting
            ? `Thank you for creating an alting ticket, ${user}!\n\nPlease provide:\n\n\`\`\`\nServer Code:\Amount Needed:\nBudget\nAdditional Details:\n\`\`\``
            : `Thank you for choosing our ${selectedValue} services, ${user}!\n\nPlease fill out:\n\n\`\`\`\nRoblox Username:\nBudget:\nDetails:\n\`\`\``
        )
        .setColor(isAlting ? '#FF6B6B' : '#00D4AA')
        .setTimestamp()
        .setFooter({ text: '© .xyz Designs 2025 Copyright' });

      await ticketChannel.send({ embeds: [ticketEmbed] });

      // Save ticket data
      tickets[ticketChannel.id] = {
        channelId: ticketChannel.id,
        userId: user.id,
        username: user.username,
        type: selectedValue,
        guildId: guild.id,
        createdAt: new Date().toISOString()
      };
      saveTickets(tickets);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('✅ Ticket Created!')
            .setDescription(`Your ${selectedValue} ticket has been created: ${ticketChannel}`)
            .setColor('#00D4AA')
            .setTimestamp()
        ],
        ephemeral: true
      });

      console.log(`[INFO] Created ${selectedValue} ticket for ${user.tag} (${user.id})`);
      return true;

    } catch (error) {
      console.error('[ERROR] Failed to handle interaction:', error);
      try {
        await interaction.reply({
          content: '❌ An error occurred while creating your ticket. Please try again later.',
          ephemeral: true
        });
      } catch (replyError) {
        console.error('[ERROR] Failed to send error message:', replyError);
      }
      return true;
    }
  },

  handleTicketDeletion(channelId) {
    try {
      const tickets = loadTickets();
      if (tickets[channelId]) {
        delete tickets[channelId];
        saveTickets(tickets);
        console.log(`[INFO] Removed ticket ${channelId} from tickets.json`);
      }
    } catch (error) {
      console.error('[ERROR] Failed to handle ticket deletion:', error);
    }
  }
};