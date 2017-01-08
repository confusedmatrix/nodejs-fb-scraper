# NodeJS Facebook Data Scraper

This code allows you to gather Facebook posts, comments and reactions for any Facebook page.

# Pre-requisites

- Docker
- Docker compose
- Node / NPM
- Postgres (if running locally - not via docker)

# Configuration

In order to use this code, you first need to create a Facebook application at: https://developers.facebook.com/apps/. Once that is set up, you need to copy `src/congig.example.js` to `src/config.js` and set the `appId` and `appSecret` to those of your Facebook application you just set up.

Also in the `src/config.js` file you need to specify at least one Facebook page (id and name) that you want to gather data for. There are other settings in this file too - they are all documented in the file.

# Build the node app:
To run the application locally, ensure that Postgres is running and copy `.env.example` to `.env` and update your Postgres connection settings.

Then run `npm install && npm run build` - this will compile the code to into the `build` directory.

The application should now be built and ready to run:

## Options

To run the application, run: `node ./build/index.js`. This command should be followed by one or more options:

- To set up the DB schema: `node ./build/index.js schema:create`
- To drop the DB schema: `node ./build/index.js schema:drop`

- To gather posts for a specific page: `node ./build/index.js run:posts`

The following relies on posts already gathered by the `run:posts` command:

- To gather comments for a posts: `node ./build/index.js run:comments`
- To gather comments for a specific page's post comments: `node ./build/index.js run:replies`
- To gather reactions for a specific page's posts: `node ./build/index.js run:reactions`

All the `run:` commands above require a page parameter to be set. This is passed in the form `--page=facebook`, e.g.:

`node ./build/index.js run:posts --page=facebook`

The page name is taken from the `pages` (`name` key) setting in `src/config.js`

# To run via Docker

The Dockerfile allows you to run the code as a self contained application. This `crontab` file allows you periodically run the code to gather new data over time. Update this file to run specific commands for the Facebook pages you have set up in `src/config.js`.

To build the docker container for the node app, as well as run both this container and a postgres container, simply run:

`make`

This will run `npm install` and `npm run build:prod` as well as setting up supervisord to keep the container alive between cron jobs.
