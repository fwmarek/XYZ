require('dotenv').config();
const {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes,
  ActivityType,
  Events,
  ActionRowBuilder,
  ButtonBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const { PaymentChange } = require('./payment-change');
const qc = require('./qc'); 

global.payment_options = [
  ['Payment Option 1', '135567835051550'],
  ['Payment Option 2', '131228224361650'],
  ['Payment Option 3', '115109578612909'],
  ['Payment Option 4', '96167774497177'],
  ['Payment Option 5', '86831378848249'],
  ['Payment Option 6', '98508263726997']
];
global.last_payment_index = 0;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: ['CHANNEL'],
});

client.commands = new Collection();
const commands = [];

const paymentChange = new PaymentChange(client, process.env.ROBLOX_COOKIE);
commands.push(paymentChange.getSlashCommand().toJSON());
client.commands.set('edit-payment', {
  data: paymentChange.getSlashCommand(),
  execute: (interaction) => paymentChange.payment_change(interaction)
});

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      if (Array.isArray(command.data)) {
        for (const subCmd of command.data) {
          client.commands.set(subCmd.name, { ...command, data: subCmd });
          commands.push(subCmd.toJSON());
        }
      } else {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
      }
    } else {
      console.warn(`[WARN] Slash command at ${filePath} is missing "data" or "execute".`);
    }
  }
}

commands.push(qc.data.toJSON());
client.commands.set('qc', qc);

const tryLoadEvent = (file) => {
  const eventPath = path.join(__dirname, file);
  if (fs.existsSync(eventPath)) {
    const event = require(eventPath);
    if ('name' in event && 'execute' in event) {
      client.on(event.name, (...args) => event.execute(...args));
    } else {
      console.warn(`[WARN] ${file} is missing "name" or "execute".`);
    }
  }
};

tryLoadEvent('welcome.js');
tryLoadEvent('ticketEvents.js');
tryLoadEvent('dmLogger.js');

client.once('ready', async () => {
  client.user.setActivity('.gg/xyzdzn', { type: ActivityType.Watching });
  console.log(`[READY] Logged in as ${client.user.tag}`);
  paymentChange.on_ready();

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  const isDev = true;

  try {
    console.log(`[INFO] Registering ${commands.length} command(s)...`);
    if (isDev) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log('[SUCCESS] Registered guild commands.');
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log('[SUCCESS] Registered global commands.');
    }
  } catch (error) {
    console.error('[ERROR] Command registration failed:', error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) {
        await command.autocomplete(interaction);
      }
      return;
    }

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) {
        await command.execute(interaction);
      } else {
        console.warn(`[WARN] No matching command for ${interaction.commandName}`);
      }
      return;
    }

    if (interaction.isButton()) {
      const handled = await qc.handleInteraction(interaction);
      if (handled) return;

      const { customId, message } = interaction;
      if (customId === 'suggest_approve' || customId === 'suggest_deny') {
        const row = message.components[0];
        const newRow = new ActionRowBuilder();

        for (const button of row.components) {
          const currentCount = parseInt(button.label) || 0;
          const isClicked = button.customId === customId;
          const updatedCount = isClicked ? currentCount + 1 : currentCount;

          newRow.addComponents(
            new ButtonBuilder()
              .setCustomId(button.customId)
              .setLabel(String(updatedCount))
              .setEmoji(button.emoji)
              .setStyle(button.style)
          );
        }

        await message.edit({ embeds: message.embeds, components: [newRow] });
        return await interaction.deferUpdate();
      }
    }

    if (interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
      let handled = false;
      for (const [, cmd] of client.commands) {
        if (typeof cmd.handleInteraction === 'function') {
          const result = await cmd.handleInteraction(interaction);
          if (result) {
            handled = true;
            break;
          }
        }
      }
      if (!handled && !interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ This interaction is not implemented.', ephemeral: true });
      }
    }
  } catch (err) {
    console.error('[ERROR] Interaction error:', err);
    const errMsg = { content: '❌ Something went wrong.', ephemeral: true };
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errMsg);
      } else {
        await interaction.reply(errMsg);
      }
    } catch (e) {
      console.error('[ERROR] Failed to send error message:', e);
    }
  }
});

client.on('error', err => console.error('[CLIENT ERROR]', err));
process.on('unhandledRejection', err => console.error('[UNHANDLED REJECTION]', err));

client.login(process.env.TOKEN);
