const {
  SlashCommandBuilder,
  PermissionsBitField,
  AttachmentBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const { createTranscript } = require('discord-html-transcripts');

const staffRoles = ['1386153532318810194', '1389470092512989376', '1386153822451142706', '1386153973228240967', '1386154109853368330'];
const logId = '1386162572629377045';
const ticketsPath = path.join(__dirname, '..', 'tickets.json');

function deleteTicket(id) {
  const db = JSON.parse(fs.readFileSync(ticketsPath));
  delete db[id];
  fs.writeFileSync(ticketsPath, JSON.stringify(db, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close a ticket (Staff only)')
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Reason for closing the ticket')
        .setRequired(false)
    ),

  async execute(i) {
    const ch = i.channel;
    const chId = ch.id;
    const db = JSON.parse(fs.readFileSync(ticketsPath));
    const isStaff = i.member.roles.cache.some(r => staffRoles.includes(r.id));

    if (!db[chId]) {
      return i.reply({ content: 'This command can only be used in a ticket channel.', ephemeral: true });
    }

    if (!isStaff) {
      return i.reply({ content: 'Only staff can use this command.', ephemeral: true });
    }

    const reason = i.options.getString('reason') || 'No reason provided.';
    const ticketUserId = db[chId].user;
    const ticketUser = await i.guild.members.fetch(ticketUserId).catch(() => null);

    await i.reply(`${i.user} is closing this ticket. This channel will be deleted in 5 seconds.`);

    const logCh = i.client.channels.cache.get(logId)
      || await i.client.channels.fetch(logId).catch(() => null);

    try {
      const transcript = await createTranscript(ch, {
        limit: -1,
        returnBuffer: false,
        fileName: `${ch.name}-transcript.html`,
      });

      if (logCh) {
        await logCh.send({
          content: `Transcript for ticket <#${chId}> by <@${ticketUserId}>`,
          files: [transcript]
        });
      }

      if (ticketUser) {
        ticketUser.send({
          content: `Your ticket in .xyz has been closed.\nReason: ${reason}`,
          files: [transcript]
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to generate or send transcript:', err);
    }

    deleteTicket(chId);
    setTimeout(() => ch.delete().catch(() => {}), 5000);
  }
};