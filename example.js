/**
 * Example client for the WhatsApp API server
 * This demonstrates how to interact with the API using Node.js
 */

const axios = require("axios");
const readline = require("readline");

const API_BASE_URL = "http://localhost:3000";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to ask questions in the console
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to display the main menu
async function showMenu() {
  console.log("\n===== WhatsApp API Client =====");
  console.log("1. Send a text message");
  console.log("2. Send a media message");
  console.log("3. Get all chats");
  console.log("4. Get contact information");
  console.log("5. List all groups");
  console.log("6. Get group messages");
  console.log("7. Exit");

  const choice = await askQuestion("\nSelect an option (1-7): ");

  switch (choice) {
    case "1":
      await sendTextMessage();
      break;
    case "2":
      await sendMediaMessage();
      break;
    case "3":
      await getAllChats();
      break;
    case "4":
      await getContactInfo();
      break;
    case "5":
      await listGroups();
      break;
    case "6":
      await getGroupMessages();
      break;
    case "7":
      console.log("Exiting...");
      rl.close();
      return;
    default:
      console.log("Invalid option. Please try again.");
  }

  // Return to menu after action completes
  showMenu();
}

// Function to send a text message
async function sendTextMessage() {
  try {
    const number = await askQuestion(
      "Enter phone number (with country code, no +): "
    );
    const message = await askQuestion("Enter your message: ");

    console.log("Sending message...");
    const response = await axios.post(`${API_BASE_URL}/send-message`, {
      number,
      message,
    });

    console.log("Response:", response.data);
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response?.data || error.message
    );
  }
}

// Function to send a media message
async function sendMediaMessage() {
  try {
    const number = await askQuestion(
      "Enter phone number (with country code, no +): "
    );
    const url = await askQuestion("Enter media URL: ");
    const caption = await askQuestion("Enter caption (optional): ");

    console.log("Sending media...");
    const response = await axios.post(`${API_BASE_URL}/send-media`, {
      number,
      url,
      caption,
    });

    console.log("Response:", response.data);
  } catch (error) {
    console.error(
      "Error sending media:",
      error.response?.data || error.message
    );
  }
}

// Function to get all chats
async function getAllChats() {
  try {
    console.log("Fetching chats...");
    const response = await axios.get(`${API_BASE_URL}/chats`);

    console.log("Chats:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(
      "Error getting chats:",
      error.response?.data || error.message
    );
  }
}

// Function to get contact information
async function getContactInfo() {
  try {
    const number = await askQuestion(
      "Enter phone number (with country code, no +): "
    );

    console.log("Fetching contact information...");
    const response = await axios.get(`${API_BASE_URL}/contact/${number}`);

    console.log("Contact Information:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(
      "Error getting contact:",
      error.response?.data || error.message
    );
  }
}

// Function to list all groups
async function listGroups() {
  try {
    console.log("Fetching groups...");
    const response = await axios.get(`${API_BASE_URL}/groups`);

    console.log("Groups:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(
      "Error getting groups:",
      error.response?.data || error.message
    );
  }
}

// Function to get messages from a specific group
async function getGroupMessages() {
  try {
    const groupId = await askQuestion("Enter group ID: ");
    const limit = await askQuestion(
      "Enter number of messages to retrieve (default: 20): "
    );

    console.log("Fetching group messages...");

    const url = limit
      ? `${API_BASE_URL}/group-messages/${groupId}?limit=${limit}`
      : `${API_BASE_URL}/group-messages/${groupId}`;

    const response = await axios.get(url);

    console.log("Group Messages:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(
      "Error getting group messages:",
      error.response?.data || error.message
    );
  }
}

// Start the application
console.log("Welcome to the WhatsApp API Client");
console.log(
  "Make sure the WhatsApp API server is running at http://localhost:3000"
);
console.log(
  "Visit http://localhost:3000/qrcode to scan the QR code if you haven't done so yet"
);

showMenu();

// Handle process exit
process.on("exit", () => {
  rl.close();
});
