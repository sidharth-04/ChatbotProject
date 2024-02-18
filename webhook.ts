import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { WebhookClient } from 'dialogflow-fulfillment';

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
// This is done to disable the warning that was found in the logs
// This warning was causing delays in connecting to the database
db.settings({ timestampsInSnapshots: true });

function documentRef(agent: WebhookClient): FirebaseFirestore.DocumentReference {
  const elements: string[] = agent.session.split('/');
  const lastElement: string = elements[elements.length - 1];
  return db.collection('sessions').doc(lastElement);
}

export const dialogflowFirebaseFulfillment = functions.https.onRequest(async (request, response) => {
  const agent = new WebhookClient({ request, response });

  async function offer(agent: WebhookClient) {
    const offerValue: number = agent.parameters['number-integer'];
    const dialogflowAgentRef = documentRef(agent);
    return db.runTransaction(async t => {
      const doc = await t.get(dialogflowAgentRef);
      let myoffers: number[] = [];
      if (doc.exists) {
        const data = doc.data();
        if (data && data.offers) {
          myoffers = data.offers;
        }
      }
      myoffers.push(offerValue);
      let sum: number = 0;
      for (let i = 0; i < myoffers.length; i++) {
        sum += myoffers[i];
      }
      sum = sum / myoffers.length;
      agent.add(`${Math.round(sum * 100) / 100}`);
      t.set(dialogflowAgentRef, { offers: myoffers }, { merge: true });
      return Promise.resolve('Offer added and sum calculated');
    }).catch(err => {
      console.error(`Error updating offers and calculating sum: ${err}`);
      agent.add(`Failed to add offer "${offerValue}".`);
    });
  }

  async function informName(agent: WebhookClient) {
    const inputName: string = agent.parameters.person;
    const dialogflowAgentRef = documentRef(agent);
    return db.runTransaction(async t => {
      const doc = await t.get(dialogflowAgentRef);
      if (!doc.exists) {
        t.set(dialogflowAgentRef, { name: inputName, offers: [] });
        agent.add(`Got it!`);
      } else {
        t.set(dialogflowAgentRef, { name: inputName }, { merge: true });
        agent.add(`Got it!`);
      }
      return Promise.resolve('Write complete');
    }).catch(err => {
      console.error(`Error writing to Firestore: ${err}`);
      agent.add(`Failed to write to the Firestore database.`);
    });
  }

  async function getName(agent: WebhookClient) {
    const dialogflowAgentDoc = documentRef(agent);
    return dialogflowAgentDoc.get()
      .then(doc => {
        if (!doc.exists || !('name' in doc.data())) {
          agent.add('You haven\'t told me your name yet!');
        } else {
          agent.add("Your name is " + (doc.data()!.name as string));
        }
        return Promise.resolve('Read complete');
      }).catch(err => {
        agent.add(`Error reading entry from the Firestore database: ${err}`);
        agent.add('Please add an entry to the database first by saying, "Write <your phrase> to the database"');
      });
  }

  const intentMap = new Map();
  intentMap.set('Negotiation Offer', offer);
  intentMap.set('Inform Name', informName);
  intentMap.set('Get Name', getName);
  agent.handleRequest(intentMap);
});
