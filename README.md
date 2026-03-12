# Stupefy!
Stupefy is a card game application originally built with React and Socket.IO. This repository is now being migrated to Nuxt and Vue while preserving the original gameplay logic as a reference.

## What’s this?
This repository originally comprised the Node.js backend for the application, hosted via Google Cloud on [stupefy.fun](https://stupefy.fun/), and served a compiled build from the React [Stupefy Front-End](https://github.com/howardah/stupefy-front-end). The project is now being restructured into a Nuxt application with Nitro server routes replacing the old Express layer.

The original frontend source was recovered from the production source map and is stored in [`.recovered-react/`](/Users/innocentsmith/Sites/node/stupefy/.recovered-react) as the migration reference.

## Install & Run
To run the app on your local machine you must download the source, `cd` into the directory, then install the dependencies with:

    bun install
The application also requires connection to a [MongoDB](http://mongodb.com/) database. You can create one for free on the MongoDB website. After which you should create a .env file in your local Stupefy directory and add the lines:

    MONGO_STUPEFY_UN=<your-mongo-user>
    MONGO_STUPEFY_PW=<your-mongo-pw>
    MONGO_STUPEFY_CLUSTER=<your-mongo-cluster>
replacing the values with your own.

Now, you’re all set to run the app with:

    bun run dev

The Nuxt development server should then be available at [localhost:3000](http://localhost:3000).

At the moment, the lobby flow has been migrated into Nuxt, while the full board/gameplay UI is still being ported from the recovered React source.

## Run With Docker
The repository now includes a [`docker-config.yaml`](/Users/innocentsmith/Sites/node/stupefy/docker-config.yaml) file that starts both the app and a local MongoDB container. The app will automatically use `MONGO_URI` when it is set, so its database calls are routed to the Docker Mongo service instead of MongoDB Atlas.

Start everything with:

    docker compose -f docker-config.yaml up --build

The app will be available at [localhost:3000](http://localhost:3000) and MongoDB will be available at `localhost:27017`.

## Google Cloud
As noted above, the app is currently live, running with google cloud. I used the google cloud [websocket example](https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/master/appengine/websockets#setup) to set it up.

Two notes regarding Google Cloud and the Application’s current setup:
 1. The Application stores data for the initial waiting room in the variable `rooms`. This might cause problems as the application scales to multiple instances. I plan to try using [Redis](https://redis.io/) to deal with this issue.
 2. As the information for the environment variables, which contain my mongo login details, are stored in the “app.yaml” file, I have excluded it from this repo. “demo-app.yaml” has been include to show how the file is otherwise setup.

## Notes on the current build

The application is still in its initial development. There are some key features still missing from it. I will be addressing these over the next couple of weeks:

 - There is no end-game summary nor does the code even check for win conditions. Like playing the card game, players have to recognize the game has ended and stop on their own.
 - Because of lack of built-in resolution, the db & the room are not closed at the end of the game and therefore the room name will not be re-usable until the room expires by sitting 3 days without activity.
 - The rules and functionality are not explained anywhere.
 - Many of the characters special abilities are not yet functional.
