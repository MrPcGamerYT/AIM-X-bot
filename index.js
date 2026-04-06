const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const admin = require('firebase-admin');

// 🔒 CONFIG
const TOKEN = "MTQ5MDU2NDgwMzkzNTA4MDUzOA.GFAccS.areGKnaUPpmV2psvW8-0fHKLD2AJ-PmSROS_yo";
const ROLE_ID = "1465560227285041162";
const CHANNEL_ID = "1490567125532803162";
const GUILD_ID = "1380048834876674108"; 

// 🔥 FIREBASE
admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccount.json"))
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// 🔥 WHEN BOT READY
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

    // 🧠 Prevent duplicate button spam
    const messages = await channel.messages.fetch({ limit: 10 });
    const alreadyExists = messages.some(msg =>
      msg.author.id === client.user.id &&
      msg.components.length > 0
    );

    if (alreadyExists) {
      console.log("⚠️ Button already exists, skipping...");
      return;
    }

    const button = new ButtonBuilder()
      .setCustomId("create_account")
      .setLabel("Create Account")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await channel.send({
      content: "🔥 Click below to create your account",
      components: [row]
    });

  } catch (err) {
    console.log("Channel error:", err);
  }
});

// 🔥 HANDLE INTERACTIONS
client.on('interactionCreate', async interaction => {

  // 🔒 BLOCK OTHER SERVERS
  if (interaction.guild && interaction.guild.id !== GUILD_ID) {
    return interaction.reply({
      content: "❌ This bot is private.",
      ephemeral: true
    });
  }

  // BUTTON CLICK
  if (interaction.isButton()) {
    if (interaction.customId === "create_account") {

      const modal = new ModalBuilder()
        .setCustomId("account_modal")
        .setTitle("Create Account");

      const email = new TextInputBuilder()
        .setCustomId("email")
        .setLabel("Email")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const password = new TextInputBuilder()
        .setCustomId("password")
        .setLabel("Password")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(email),
        new ActionRowBuilder().addComponents(password)
      );

      await interaction.showModal(modal);
    }
  }

  // FORM SUBMIT
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "account_modal") {

      // 🔒 ROLE CHECK
      if (!interaction.member.roles.cache.has(ROLE_ID)) {
        return interaction.reply({
          content: "❌ You don't have permission.",
          ephemeral: true
        });
      }

      const email = interaction.fields.getTextInputValue("email");
      const password = interaction.fields.getTextInputValue("password");

      // 🔒 BASIC VALIDATION
      if (password.length < 6) {
        return interaction.reply({
          content: "❌ Password must be at least 6 characters.",
          ephemeral: true
        });
      }

      try {
        await admin.auth().createUser({
          email,
          password
        });

        await interaction.reply({
          content: "✅ Account created successfully!",
          ephemeral: true
        });

      } catch (err) {
        console.log(err);

        let msg = "❌ Error creating account.";

        if (err.code === 'auth/email-already-exists') {
          msg = "❌ Email already exists.";
        }

        await interaction.reply({
          content: msg,
          ephemeral: true
        });
      }
    }
  }
});

client.login(TOKEN);