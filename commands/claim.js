const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const staffRoles = ['1386153532318810194', '1389470092512989376', '1386153822451142706', '1386153973228240967', '1386154109853368330'];
const ticketsPath = path.join(__dirname, '..', 'tickets.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claim a ticket (Staff only)'),

  async execute(i) {
    const chId = i.channel.id;
    const db = JSON.parse(fs.readFileSync(ticketsPath));
    const isStaff = i.member.roles.cache.some(r => staffRoles.includes(r.id));

    if (!db[chId]) {
      return i.reply({ content: 'This command can only be used in a ticket channel.', ephemeral: true });
    }

    if (!isStaff) {
      return i.reply({ content: 'Only staff can use this command.', ephemeral: true });
    }

    return i.reply({ content: `${i.user} has claimed this ticket!` });
  }
};
