const { Events } = require('discord.js');

const LOG_CHANNEL_ID = '1340595001931071508';

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;
    if (message.guild) return; 

    try {
      const client = message.client;
      const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
      if (!logChannel) return console.warn(`Log channel ${LOG_CHANNEL_ID} not found.`);

      let content = `📩 **DM from:** ${message.author.tag} (${message.author.id})\n\n`;
      if (message.content) content += `**Message:**\n${message.content}\n\n`;

      if (message.attachments.size > 0) {
        content += '**Attachments:**\n';
        for (const attachment of message.attachments.values()) {
          content += `${attachment.url}\n`;
        }
      }

      const messages = [];
      while (content.length > 0) {
        messages.push(content.slice(0, 2000));
        content = content.slice(2000);
      }

      for (const msg of messages) {
        await logChannel.send(msg);
      }
    } catch (error) {
      console.error('Error logging DM:', error);
    }
  }
};
