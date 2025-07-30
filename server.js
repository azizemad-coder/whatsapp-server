const express = require("express");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode");
require("dotenv").config();

// Initialize Express app
const app = express();
app.use(express.json());

// Set up WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox"],
  },
});

let qrCodeData = null;
// Store recent group messages
const groupMessages = {};
const MAX_STORED_MESSAGES = 50;

// WhatsApp client events
client.on("qr", (qr) => {
  console.log("QR RECEIVED", qr);
  qrCodeData = qr;
  qrcode.toDataURL(qr, (err, url) => {
    if (err) {
      console.error("Error generating QR code:", err);
      return;
    }
    console.log("QR code generated. Scan with your WhatsApp app.");
  });
});

client.on("ready", () => {
  console.log("Client is ready!");
  qrCodeData = null;
});

// Listen for all messages and store group messages
client.on("message", async (msg) => {
  try {
    // Check if the message is from a group
    const chat = await msg.getChat();
    if (chat.isGroup) {
      const sender = await msg.getContact();

      // Initialize array for this group if it doesn't exist
      if (!groupMessages[chat.id._serialized]) {
        groupMessages[chat.id._serialized] = [];
      }

      // Add message to the group's messages
      const messageData = {
        id: msg.id._serialized,
        body: msg.body,
        timestamp: msg.timestamp,
        from: {
          id: sender.id._serialized,
          name: sender.name || sender.pushname || "Unknown",
          number: sender.number,
        },
        chat: {
          id: chat.id._serialized,
          name: chat.name,
        },
      };

      // Add message to front of array (newest first)
      groupMessages[chat.id._serialized].unshift(messageData);

      // Limit number of stored messages per group
      if (groupMessages[chat.id._serialized].length > MAX_STORED_MESSAGES) {
        groupMessages[chat.id._serialized] = groupMessages[
          chat.id._serialized
        ].slice(0, MAX_STORED_MESSAGES);
      }

      console.log(`Group message in ${chat.name}: ${msg.body}`);
    }
  } catch (err) {
    console.error("Error processing message:", err);
  }
});

client.on("authenticated", () => {
  console.log("Authenticated");
});

client.on("auth_failure", (msg) => {
  console.error("Authentication failure:", msg);
});

client.on("disconnected", (reason) => {
  console.log("Client was disconnected:", reason);
  // Reconnect
  client.initialize();
});

// Initialize WhatsApp client
client.initialize();

// API routes
app.get("/", (req, res) => {
  res.send("WhatsApp API Server is running!");
});

// Get QR Code endpoint
app.get("/qrcode", async (req, res) => {
  if (qrCodeData) {
    try {
      const url = await qrcode.toDataURL(qrCodeData);
      res.send(`
                <html>
                    <body style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
                        <h1>Scan QR Code with WhatsApp</h1>
                        <img src="${url}" alt="QR Code">
                    </body>
                </html>
            `);
    } catch (err) {
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  } else {
    res
      .status(404)
      .json({ error: "QR code not available, client already authenticated" });
  }
});

// Send message endpoint
app.post("/send-message", async (req, res) => {
  try {
    const { number, message } = req.body;

    if (!number || !message) {
      return res.status(400).json({ error: "Number and message are required" });
    }

    // Format number by removing any non-digit characters and ensuring it has country code
    let formattedNumber = number.replace(/\D/g, "");

    // Send message
    const chat = await client.getChatById(formattedNumber + "@c.us");
    await chat.sendMessage(message);

    res
      .status(200)
      .json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
});

// Send media endpoint
app.post("/send-media", async (req, res) => {
  try {
    const { number, url, caption } = req.body;

    if (!number || !url) {
      return res
        .status(400)
        .json({ error: "Number and media URL are required" });
    }

    let formattedNumber = number.replace(/\D/g, "");
    const chat = await client.getChatById(formattedNumber + "@c.us");

    const media = await client.pupPage.evaluate(async (url) => {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      return buffer;
    }, url);

    const messageMedia = new MessageMedia(
      url.match(/\.jpg|\.jpeg$/i)
        ? "image/jpeg"
        : url.match(/\.png$/i)
        ? "image/png"
        : url.match(/\.pdf$/i)
        ? "application/pdf"
        : "application/octet-stream",
      Buffer.from(media).toString("base64"),
      url.split("/").pop()
    );

    await chat.sendMessage(messageMedia, { caption: caption || "" });

    res.status(200).json({ success: true, message: "Media sent successfully" });
  } catch (error) {
    console.error("Error sending media:", error);
    res.status(500).json({ success: false, error: "Failed to send media" });
  }
});

// Get all chats endpoint
app.get("/chats", async (req, res) => {
  try {
    const chats = await client.getChats();
    res.status(200).json({ success: true, chats });
  } catch (error) {
    console.error("Error getting chats:", error);
    res.status(500).json({ success: false, error: "Failed to get chats" });
  }
});

// Get contact information endpoint
app.get("/contact/:number", async (req, res) => {
  try {
    const number = req.params.number;
    if (!number) {
      return res.status(400).json({ error: "Number parameter is required" });
    }

    // Format number by removing any non-digit characters
    let formattedNumber = number.replace(/\D/g, "");
    const contactId = formattedNumber + "@c.us";

    // Get contact info
    const contact = await client.getContactById(contactId);

    // Check if contact exists
    if (!contact) {
      return res
        .status(404)
        .json({ success: false, error: "Contact not found" });
    }

    // Return relevant contact info
    res.status(200).json({
      success: true,
      contact: {
        id: contact.id._serialized,
        name: contact.name,
        shortName: contact.shortName,
        pushname: contact.pushname,
        number: formattedNumber,
        isGroup: contact.isGroup,
        isWAContact: contact.isWAContact,
        profilePictureUrl: await contact.getProfilePicUrl(),
      },
    });
  } catch (error) {
    console.error("Error getting contact:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to get contact information" });
  }
});

// Get recent messages from a specific group
app.get("/group-messages/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { limit = 20 } = req.query;

    // Check if groupId is provided
    if (!groupId) {
      return res
        .status(400)
        .json({ success: false, error: "Group ID is required" });
    }

    // Format groupId (ensure it ends with @g.us for group chats)
    const formattedGroupId = groupId.endsWith("@g.us")
      ? groupId
      : `${groupId}@g.us`;

    // Try to get the group chat to verify it exists
    try {
      await client.getChatById(formattedGroupId);
    } catch (err) {
      return res.status(404).json({ success: false, error: "Group not found" });
    }

    // Get stored messages for this group
    const messages = groupMessages[formattedGroupId] || [];

    // Return messages (limited by the query parameter)
    res.status(200).json({
      success: true,
      groupId: formattedGroupId,
      messages: messages.slice(0, parseInt(limit)),
    });
  } catch (error) {
    console.error("Error getting group messages:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to get group messages" });
  }
});

// List all groups endpoint
app.get("/groups", async (req, res) => {
  try {
    const chats = await client.getChats();
    const groups = chats
      .filter((chat) => chat.isGroup)
      .map((group) => ({
        id: group.id._serialized,
        name: group.name,
        participants: group.participants.length,
        hasNewMessages: group.hasNewMessages,
      }));

    res.status(200).json({ success: true, groups });
  } catch (error) {
    console.error("Error getting groups:", error);
    res.status(500).json({ success: false, error: "Failed to get groups" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}/qrcode to scan the QR code`);
});
