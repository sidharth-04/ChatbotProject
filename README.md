# DialogFlow CLI Tool

This is my attempt at creating a chatbot using the Google DialogFlow CLI with Firestore integration.

## Installation
- Download the service account key from the google drive project and export the variable `GOOGLE_APPLICATION_CREDENTIALS` to point to the location of the key
- run `npm install` to download dependencies
- run `tsc cli.ts` to build the javascript file
- run `node cli.js` to start the command line tool

## Relevant Files
- The cli.ts file is the command line tool in typescript
- As the webhooks could be created using only javascript through GCP, I created my own typescript version of the webhook which can found at webhook.ts
