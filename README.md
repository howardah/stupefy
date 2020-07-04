# Stupefy!
Stupefy is a React/Socket.io built application counter-part to a game developed by Hanna Hutchinson, Bethany Shorey-Fennell, Peter Myers, Jordan Howard, Kelsey Howard, Henry Fennell, Chloe Fennell, Dan Hutchinson, and Adam Howard.

## What’s this?
This repository comprises the Node.js backend for the application, hosted via Google Cloud on [stupefy.fun](https://stupefy.fun/), which contains a build from the React [Stupefy Front-End](https://github.com/howardah/stupefy-front-end).

## Install & Run
To run the app on your local machine you must download the source, `cd` into the directory, then install the dependencies with:

    npm install
The application also requires connection to a [MongoDB](http://mongodb.com/) database. You can create one for free on the MongoDB website. After which you should create a .env file in your local Stupefy directory and add the lines:

    MONGO_STUPEFY_UN=<your-mongo-user>
    MONGO_STUPEFY_PW=<your-mongo-pw>
    MONGO_STUPEFY_CLUSTER=<your-mongo-cluster>
replacing the values with your own.

Now, you’re all set to run the app with:

    npm start
You should then see `Server running on port 3000` in your console and you can navigate to [localhost:3000](http://localhost:3000).

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

