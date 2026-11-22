# Scribbl

A real-time multiplayer drawing and guessing game — inspired by [skribbl.io](https://skribbl.io). One player draws a word while others race to guess it in the chat. Built with Next.js, Socket.IO, and Zustand.

![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-purple)
![React](https://img.shields.io/badge/React-19-cyan)

## Features

- **Real-time multiplayer** — WebSocket-powered gameplay with instant draw synchronization
- **Room system** — Create private rooms and share the code with friends
- **Lobby with configurable settings** — Adjust rounds (2–8), draw time (40–150s), and max players (4–12)
- **Smooth drawing engine** — Quadratic Bézier curve smoothing for natural-looking strokes
- **Live chat with auto-guessing** — Type your guess in chat; correct answers are detected automatically
- **Scoring system** — Time-based points for guessers, participation-based points for the drawer
- **Turn-based rounds** — Each player takes a turn drawing, with 3 word choices per turn
- **Late join support** — Players joining mid-game receive stroke replay and time synchronization
- **Game over celebration** — Confetti animation and final leaderboard

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev) |
| Language | [TypeScript 5](https://typescriptlang.org) |
| Real-time | [Socket.IO 4](https://socket.io) |
| State Management | [Zustand 5](https://zustand.docs.pmnd.rs) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| UI Components | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://radix-ui.com) |
| Icons | [Lucide React](https://lucide.dev) |
| Notifications | [Sonner](https://sonner.emilkowal.dev) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+ or [Bun](https://bun.sh)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/scribbl.git
cd scribbl

# Install dependencies
bun install
# or
npm install
```

### Development

```bash
bun run dev
# or
npm run dev
```

The app starts at [http://localhost:3000](http://localhost:3000). The dev command uses `tsx` to run the custom server (`server.ts`) which handles both Next.js page serving and Socket.IO connections.

### Production

```bash
# Build the Next.js app
bun run build

# Start the production server
bun run start
```

## How to Play

1. **Enter a nickname** on the landing page
2. **Create a room** or **join** an existing one with a room code
3. **Share the room code** with friends (copy button in the lobby)
4. **Host starts the game** when at least 2 players are present
5. **Drawer selects a word** from 3 random choices (15-second timer)
6. **Drawer draws** the word on the canvas while others guess in chat
7. **Guessers type their answers** — correct guesses are auto-detected
8. **Points are awarded** based on how quickly guessers answer
9. **Rounds repeat** until all rounds are complete, then the winner is announced!

## Project Structure

```
scribbl/
├── server.ts                      # Custom Node.js server (HTTP + Socket.IO)
├── app/
│   ├── layout.tsx                 # Root layout with font config & store provider
│   ├── page.tsx                   # Landing page route
│   ├── socket.ts                  # Socket.IO client singleton
│   ├── globals.css                # Tailwind + custom theme variables
│   ├── providers/
│   │   ├── game-store-provider.tsx    # Zustand context provider
│   │   └── socket-listeners.client.tsx # All Socket.IO event listeners
│   ├── room/[roomId]/page.tsx     # Dynamic room page
│   └── stores/game-store.ts      # Zustand store definition
├── components/
│   ├── canvas/
│   │   ├── Canvas.tsx             # Drawing canvas with DPR handling
│   │   └── ToolBar.tsx            # Color picker, brush size, clear button
│   ├── landing/
│   │   └── HomePage.client.tsx    # Nickname input, create/join room
│   ├── lobby/
│   │   ├── LobbyContent.client.tsx        # Lobby layout (players + settings + chat)
│   │   ├── LobbySettingsPanel.client.tsx   # Game settings UI
│   │   └── LobbySettingsControl.client.tsx # Reusable option-pill selector
│   ├── room/
│   │   ├── RoomContent.client.tsx  # Game room layout (canvas + chat + players)
│   │   └── GameOverlay.client.tsx  # Word choice, scoreboard, and game-over overlays
│   ├── ChatPanel.client.tsx        # Chat messages and input
│   ├── PlayerList.client.tsx       # Player list with scores, roles, and status
│   ├── CountdownTimer.tsx          # Server-synced countdown with clock offset
│   └── Confetti.tsx                # Victory confetti animation
├── lib/
│   ├── drawingcanvas/
│   │   ├── DrawingEngine.ts       # Canvas event handling, stroke I/O
│   │   └── SmoothBrush.ts         # Bézier curve smoothing algorithm
│   ├── gamelogic/
│   │   └── GameEngine.tsx         # Server-side game state machine
│   ├── types/types.ts             # Shared TypeScript types
│   ├── utils.ts                   # Helpers (cn, canvasStrokes)
│   └── wordBank.ts               # 3,690-word bank for drawing prompts
└── package.json
```

## Architecture

The app uses a **custom Next.js server** (`server.ts`) that wraps the standard Next.js request handler with a Node HTTP server, adding Socket.IO on top for real-time communication.

- **State management**: A single Zustand store (`game-store.ts`) holds all client-side game state. Socket events are translated into store actions via a centralized listener component (`socket-listeners.client.tsx`).
- **Game engine**: Each room gets its own `GameEngine` instance on the server, managing players, turn order, scoring, and word selection.
- **Drawing pipeline**: The `DrawingEngine` captures mouse events → emits them via Socket.IO → server validates the sender is the drawer → relays to all other clients → `SmoothBrush` renders with quadratic Bézier curves.
- **Clock sync**: The server sends `turnEndsAt` timestamps alongside `Date.now()` so clients can calculate clock offset and display accurate countdowns.

## License

MIT
