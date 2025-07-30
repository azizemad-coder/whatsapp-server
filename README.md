# WhatsApp API Server

A RESTful API server that integrates with WhatsApp Web using [whatsapp-web.js](https://wwebjs.dev/).

## Features

- Authentication with WhatsApp via QR code scanning
- Send text messages
- Send media (images, documents, etc.)
- Retrieve chat lists
- Session persistence using LocalAuth

## Installation

1. Clone this repository:
```
git clone https://github.com/azizemad-coder/whatsapp-server
```
2. Install dependencies:
   ```
   pnpm install
   ```
3. Create a `.env` file in the root directory with:
   ```
   PORT=3000
   ```

## Usage

1. Start the server:
   ```
   node server.js
   ```
2. Open `http://localhost:3000/qrcode` in your browser
3. Scan the QR code with your WhatsApp mobile app
4. Once authenticated, you can use the API endpoints

## API Endpoints

### Authentication

- `GET /qrcode` - Get the QR code for WhatsApp authentication

### Messages

- `POST /send-message` - Send a text message

  ```json
  {
    "number": "1234567890", // Phone number with country code
    "message": "Hello from WhatsApp API"
  }
  ```

- `POST /send-media` - Send media (image, document, etc.)
  ```json
  {
    "number": "1234567890", // Phone number with country code
    "url": "https://example.com/image.jpg", // URL of media
    "caption": "Optional caption" // Optional
  }
  ```

### Chats and Contacts

- `GET /chats` - Get all chats
- `GET /contact/:number` - Get information about a specific contact (replace :number with phone number)

### Groups

- `GET /groups` - Get all groups
- `GET /group-messages/:groupId` - Get recent messages from a specific group
  - Optional query parameter: `limit` (default: 20) - Number of messages to retrieve

## Important Notes

- WhatsApp does not officially support bots or unofficial clients. Use at your own risk.
- This API server relies on the WhatsApp Web interface, which may change without notice.
- Always ensure your use of WhatsApp automation complies with WhatsApp's Terms of Service.

## License

MIT
