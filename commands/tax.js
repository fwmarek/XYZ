const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tax')
    .setDescription('Calculate 30% tax on an amount and add it to the original')
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('The amount to calculate tax on')
        .setRequired(true)
    ),

  async execute(interaction) {
    const amount = interaction.options.getNumber('amount');

    if (amount <= 0) {
      return interaction.reply({ content: 'Please provide an amount greater than 0.', ephemeral: true });
    }

    const tax = amount * 0.3;
    const total = amount + tax;

    await interaction.reply({
      content: `Original amount: ${amount.toFixed(2)}\nTax (30%): ${tax.toFixed(2)}\nTotal after tax: ${total.toFixed(2)}`
    });
  }
};
