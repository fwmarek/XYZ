const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField
} = require('discord.js');
const fs = require('fs');
const path = require('path');

function loadServiceStatus() {
  const statusPath = path.join(__dirname, '..', 'service-status.json');
  if (!fs.existsSync(statusPath)) {
    const defaultStatus = getDefaultServiceStatus();
    saveServiceStatus(defaultStatus);
    return defaultStatus;
  }
  try {
    const data = fs.readFileSync(statusPath, 'utf8');
    return data.trim() ? JSON.parse(data) : getDefaultServiceStatus();
  } catch (error) {
    console.error('[ERROR] Failed to parse service-status.json:', error);
    return getDefaultServiceStatus();
  }
}

function saveServiceStatus(status) {
  const statusPath = path.join(__dirname, '..', 'service-status.json');
  try {
    const dir = path.dirname(statusPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('[ERROR] Failed to save service-status.json:', error);
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
    .setName('order-status')
    .setDescription('Manage the status of order services (Admin only)')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addStringOption(option =>
      option.setName('service')
        .setDescription('Select the service to toggle')
        .setRequired(true)
        .addChoices(
          { name: 'Photography', value: 'photography' },
          { name: 'Graphics', value: 'graphics' },
          { name: 'Discord', value: 'discord' }, 
          { name: 'Clothing', value: 'clothing' },
          { name: 'Livery', value: 'livery' },
          { name: 'Bot', value: 'bot' },
          { name: 'ELS', value: 'els' },
          { name: 'Alting', value: 'alting' }
        )
    )
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Set the service status')
        .setRequired(true)
        .addChoices(
          { name: 'Open', value: 'open' },
          { name: 'Closed', value: 'closed' }
        )
    )
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Additional actions')
        .setRequired(false)
        .addChoices(
          { name: 'View All Status', value: 'view' },
          { name: 'Reset All to Open', value: 'reset' }
        )
    ),

  async execute(interaction) {
    try {
      const service = interaction.options.getString('service');
      const status = interaction.options.getString('status');
      const action = interaction.options.getString('action');

      const serviceStatus = loadServiceStatus();

      if (action === 'view') {
        const statusEmbed = new EmbedBuilder()
          .setTitle('📊 Current Service Status')
          .setColor('#5865F2')
          .setTimestamp()
          .setFooter({ text: '.xyz Admin Panel', iconURL: interaction.guild?.iconURL() });

        let statusDescription = '';
        Object.entries(serviceStatus).forEach(([serviceName, isOpen]) => {
          const displayName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
          const statusIcon = isOpen ? '🟢' : '🔴';
          const statusText = isOpen ? 'Open' : 'Closed';
          statusDescription += `${statusIcon} **${displayName}**: ${statusText}\n`;
        });

        statusEmbed.setDescription(statusDescription || 'No services configured.');

        await interaction.reply({
          embeds: [statusEmbed],
          ephemeral: true
        });
        return;
      }

      if (action === 'reset') {
        const defaultStatus = getDefaultServiceStatus();
        saveServiceStatus(defaultStatus);

        const resetEmbed = new EmbedBuilder()
          .setTitle('🔄 Services Reset')
          .setDescription('All services have been reset to **Open** status.')
          .setColor('#00D4AA')
          .setTimestamp()
          .setFooter({ text: '.xyz Admin Panel', iconURL: interaction.guild?.iconURL() });

        await interaction.reply({
          embeds: [resetEmbed],
          ephemeral: true
        });
        return;
      }

      if (!service || !status) {
        await interaction.reply({
          content: '❌ Both service and status are required when not using special actions.',
          ephemeral: true
        });
        return;
      }

      const isOpen = status === 'open';
      serviceStatus[service] = isOpen;
      saveServiceStatus(serviceStatus);

      const serviceName = service.charAt(0).toUpperCase() + service.slice(1);
      const statusText = isOpen ? '🟢 Open' : '🔴 Closed';
      const statusColor = isOpen ? '#00D4AA' : '#FF6B6B';

      const embed = new EmbedBuilder()
        .setTitle('✅ Service Status Updated')
        .setDescription(`**${serviceName}** service is now **${statusText}**`)
        .addFields({
          name: 'Service',
          value: serviceName,
          inline: true
        }, {
          name: 'Status',
          value: statusText,
          inline: true
        }, {
          name: 'Updated By',
          value: `${interaction.user.tag}`,
          inline: true
        })
        .setColor(statusColor)
        .setTimestamp()
        .setFooter({ text: '.xyz Admin Panel', iconURL: interaction.guild?.iconURL() });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

      console.log(`[INFO] ${interaction.user.tag} changed ${service} service status to ${status}`);

    } catch (error) {
      console.error('[ERROR] Failed to execute order-status command:', error);
      await interaction.reply({
        content: '❌ An error occurred while updating the service status.',
        ephemeral: true
      });
    }
  }
};