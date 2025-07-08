const { Events, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

const WELCOME_CHANNEL_ID = '1340535743604592673';

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,

  async execute(member) {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID)
      || await member.guild.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null);

    if (!channel) return;

    const welcomeMessage = `<:xyz_nobg:1386169632662098011> | Welcome ${member} to **.xyz**! You are member ${member.guild.memberCount}.`;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Order-Here')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.com/channels/1340534861592531015/1340780134579310693'), 

      new ButtonBuilder()
        .setLabel('Dashboard')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.com/channels/1340534861592531015/1340535704735977472')
    );

    channel.send({ content: welcomeMessage, components: [row] });
  },
};
