# Stupefy!

Stupefy is a card game application built with Nuxt 4, Vue 3, and Socket.IO. The application is a digital version of a game developed by Hanna Hutchinson, Bethany Shorey-Fennell, Peter Myers, Jordan Howard, Kelsey Howard, Henry Fennell, Chloe Fennell, Dan Hutchinson, and Adam Howard.

## What's this?

The original app was a Node.js backend hosted on Google Cloud at [stupefy.fun](https://stupefy.fun/), serving a compiled React build. It has been restructured into a Nuxt application with Nitro server routes replacing the old Express layer and Vue components replacing the React frontend.

The lobby flow, waiting room, and gameplay board are all running in Vue. Some character special abilities are still being implemented.

The original frontend source was recovered from the production source map and is stored in [`.recovered-react/`](.recovered-react) as the migration reference.

## Install & Run

Download the source, `cd` into the directory, then install dependencies:

    bun install

The application requires a [MongoDB](http://mongodb.com/) database. Create a `.env` file in the project root with:

    MONGO_STUPEFY_UN=<your-mongo-user>
    MONGO_STUPEFY_PW=<your-mongo-pw>
    MONGO_STUPEFY_CLUSTER=<your-mongo-cluster>

Start the development server:

    bun run dev

The app will be available at [localhost:3000](http://localhost:3000).

## Run With Docker

A [`docker-config.yaml`](docker-config.yaml) file starts both the app and a local MongoDB container. When `MONGO_URI` is set, database calls are routed to the Docker Mongo service instead of MongoDB Atlas.

    docker compose -f docker-config.yaml up --build

The app will be available at [localhost:3000](http://localhost:3000) and MongoDB at `localhost:27017`.

## Other Scripts

    bun run build       # Production build
    bun run preview     # Preview production build
    bun run typecheck   # TypeScript type checking
    bun run lint        # Lint with oxlint
    bun run lint:fix    # Auto-fix lint issues
    bun run fmt         # Format with oxfmt
    bun test            # Run tests

## Google Cloud

The app is currently live on Google Cloud. Setup followed the Google Cloud [websocket example](https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/master/appengine/websockets#setup).

Two notes regarding the current setup:

1. The application stores waiting room data in MongoDB, but active game rooms are partially held in memory, which may cause issues across multiple instances. Redis is a planned improvement.
2. The `app.yaml` file containing environment variables is excluded from this repo. [`demo-app.yaml`](demo-app.yaml) shows the expected structure.

## Notes on the current status

Some features are still in progress:

- The game is currently in active development and provides the ability to see all players' hands during gameplay. If you are wanting to play the game, this should be disabled per-player before starting.
- There is no end-game summary, nor does the code check for win conditions. Players must recognize when the game has ended.
- Rooms do not auto-close after a game ends. The room name will not be reusable until the room expires after 3 days of inactivity.
- Rules and functionality are not explained in the UI.
- Some character special abilities are not yet functional. See [`docs/character-power-audit.md`](docs/character-power-audit.md) for the current status.
