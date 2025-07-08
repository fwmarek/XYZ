require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const noblox = require('noblox.js');
const axios = require('axios');

async function updateGamepass(price, collectibleId) {
    const url = `https://itemconfiguration.roblox.com/v1/collectibles/${collectibleId}`;
    const headers = {
        Cookie: `.ROBLOSECURITY=${process.env.ROBLOX_COOKIE}`,
    };
    const data = {
        saleLocationConfiguration: { saleLocationType: 1, places: [] },
        saleStatus: 0,
        quantityLimitPerUser: 0,
        resaleRestriction: 2,
        priceInRobux: price,
        priceOffset: 0,
        isFree: false,
    };

    try {
        let csrf = "";

        try {
            await axios.patch(url, data, { headers });
        } catch (e) {
            if (e.response && e.response.headers) {
                csrf = e.response.headers["x-csrf-token"];
            }
        }

        await axios.patch(url, data, {
            headers: {
                ...headers,
                "X-CSRF-TOKEN": csrf,
            },
        });

        return true;
    } catch (e) {
        console.error("Error updating gamepass price:", e);
        return false;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('payment')
        .setDescription('Manage payments')
        .addSubcommandGroup(group => 
            group.setName('edit')
                .setDescription('Edit payment details')
                .addSubcommand(subcommand =>
                    subcommand.setName('price')
                        .setDescription('Edit the price of a collectible')
                        .addStringOption(option =>
                            option.setName('payment')
                                .setDescription('Select a payment option')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'Payment 1', value: '135567835051550|5a9adeec-0236-41a4-8e43-71cf560e7d6f' },
                                    { name: 'Payment 2', value: '131228224361650|8d208431-2038-4b4a-8257-b964145fd6f7' },
                                    { name: 'Payment 3', value: '115109578612909|903d2974-bbd6-4587-8f31-30192385a920' }
                                )
                        )
                        .addIntegerOption(option =>
                            option.setName('price')
                                .setDescription('New price in Robux')
                                .setRequired(true)
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('send')
                .setDescription('Send a payment request')
                .addStringOption(option =>
                    option.setName('payment')
                        .setDescription('Select a payment option')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Payment 1', value: '135567835051550' },
                            { name: 'Payment 2', value: '131228224361650' },
                            { name: 'Payment 3', value: '115109578612909' }
                        )
                )
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('Ping the user for payment')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const subcommandGroup = interaction.options.getSubcommandGroup(false);

        if (subcommandGroup === 'edit' && subcommand === 'price') {
            const paymentOption = interaction.options.getString('payment').split('|');
            const price = interaction.options.getInteger('price');
            const collectibleId = paymentOption[1];
            await interaction.deferReply({ ephemeral: true });
            const updateSuccess = await updateGamepass(price, collectibleId);

            if (updateSuccess) {
                const productInfoready = await noblox.getProductInfo(paymentOption[0]);
                const redtitle = productInfoready.Name;

                await interaction.editReply({ content: `The price for [${redtitle}](<https://www.roblox.com/catalog/${paymentOption[0]}/${redtitle}>) has been successfully updated to **${price} Robux**.` });
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription('An error occurred while updating the price. Please try again later.')
                    .setColor('2d2d31');

                await interaction.editReply({ embeds: [errorEmbed] });
            }
        } else if (subcommand === 'send') {
            const paymentOption = interaction.options.getString('payment'); 
            const targetUser = interaction.options.getUser('target'); 

            try {
                await interaction.deferReply({ ephemeral: true, content: `Sending payment` });
                const productInfo = await noblox.getProductInfo(paymentOption);
                const title = productInfo.Name;
                const price = productInfo.PriceInRobux || 'Unknown'; 

                const purchaseLink = `https://www.roblox.com/catalog/${paymentOption}/${title}`;
                const embed = new EmbedBuilder()
                    .setDescription(`# Payment Link\n- Thank you for ordering, please pay by clicking the button below! Once done, our developer will start making the bot for you.\n## <:robux:1290209844183437355> **Price:** \`${price}R$\` \n_ _\n## <:helix_exclamation:1295625452018335775> **__Important__**\n-# <:dot:1242428962240725053>**Payment Before Work Begins:** All payments are required upfront to secure your commission.\n-# <:dot:1242428962240725053>**No Refunds:** Once development has started, no refunds will be provided unless the developer is unable to complete the order. This ensures that we are both protected for the time and effort spent.\n_ _\n### <:helix_Stop:1295633583918022688> Already Purchased? Read Below\n-# <:Dot:1240854068079886410>If you have already purchased the T-shirt, please delete it from your inventory and repurchase it. To delete a T-shirt from your Roblox inventory, follow these steps:\n-# <:one:1242426914812067890>Click the link.\n-# <:two:1242427140461297664>Click on the **three dots** (⋮) next to the T-shirt.\n-# <:three:1242427228923363430>Select **Remove from Inventory** from the options.\n-# <:dot:1242428962240725053>After deleting, you can purchase the T-shirt again.\n_ _\n-# <:Dot:1240854068079886410> If you're unable to click the button, use this link: ${purchaseLink}`)
                    .setImage("https://i.imgur.com/RNu2TAM.png")
                    .setColor('2d2d31');

                const button = new ButtonBuilder()
                    .setLabel('Pay Now')
                    .setStyle(ButtonStyle.Link)
                    .setEmoji('1295638572514414622')
                    .setURL(purchaseLink); 
                const paid = new ButtonBuilder()
                    .setLabel('Mark as paid')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('1240854110220193865')
                    .setCustomId(`paymentPaidConfirm`)
                const row = new ActionRowBuilder().addComponents(button, paid);

                let content = targetUser ? `${targetUser}` : '';
                await interaction.channel.send({
                    content: content,
                    embeds: [embed],
                    components: [row],
                });

                await interaction.reply({
                    content: `Payment link has been sent!`,
                    ephemeral: true, 
                });

            } catch (error) {
                console.error('Error fetching payment info:', error);

                const errorEmbed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription('An error occurred while retrieving the payment details. Please try again later.');

                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
