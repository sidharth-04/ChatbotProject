import * as dialogflow from '@google-cloud/dialogflow';

const projectId: string = 'negoti-414622';
const languageCode: string = 'en';
const prompt = require('prompt-sync')({sigint: true});

const sessionClient: dialogflow.SessionsClient = new dialogflow.SessionsClient();

async function detectIntent(
  projectId: string,
  sessionId: string,
  query: string,
  contexts: string[],
  languageCode: string
): Promise<any> {
  // The path to identify the agent that owns the created intent.
  const sessionPath: string = sessionClient.projectAgentSessionPath(
    projectId,
    sessionId
  );

  // The text query request.
  const request: any = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
        languageCode: languageCode,
      },
    },
  };

  if (contexts && contexts.length > 0) {
    request.queryParams = {
      contexts: contexts,
    };
  }

  const responses: any[] = await sessionClient.detectIntent(request);
  return responses[0];
}

async function executeQuery(projectId: string, sessionId: string, query: string, languageCode: string): Promise<void> {
  let context: string[];
  let intentResponse: any;
  try {
    intentResponse = await detectIntent(
      projectId,
      sessionId,
      query,
      context,
      languageCode
    );
    console.log(
      `${intentResponse.queryResult.fulfillmentText}`
    );
    // Use the context from this response for next queries
    context = intentResponse.queryResult.outputContexts;
  } catch (error) {
    console.log(error);
  }
}

async function queryEndpoint(projectId: string, sessionId: string, languageCode: string): Promise<void> {
    console.log("Entering prompt... (Type exit to leave)");
  while (true) {
    const query: string = prompt(">>> ");
	if (query == "exit") {
		break;
	}
    await executeQuery(projectId, sessionId, query, languageCode);
  }
}

function generateRandomString(length: number): string {
  let result = '';
  const characters = '0123456789';
  const charactersLength = characters.length;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
}

interface CLI {
  projectId: string;
  languageCode: string;
  activate: () => Promise<void>;
}

const cli: CLI = {
  projectId: projectId,
  languageCode: languageCode,
  activate: async function() {
	  console.log("Welcome to the Chatbot CLI Tool!");
	  while (true) {
		  console.log("Options: \n\t[1] Start a new session \n\t[2] Connect to an existing session \n\t[3] Exit");
		  const result: string = prompt();
		  if (!(result == "1" || result == "2" || result == "3")) {
			  console.log("Unexpected input");
			  continue;
		  }
		  if (result == "1") {
			  const sessionId: string = generateRandomString(6);
			  console.log();
			  console.log("---------------------------------------");
			  console.log("Your session ID is: "+sessionId);
			  console.log("Save this if you want to return to the session later");
			  await queryEndpoint(this.projectId, sessionId, this.languageCode);
			  console.log("---------------------------------------");
			  console.log();
		  } else if (result == "2") {
			  const sessionId: string = prompt("Enter the session id: ");
			  console.log();
			  console.log("---------------------------------------");
			  console.log("Restoring session...");
			  await queryEndpoint(this.projectId, sessionId, this.languageCode);
			  console.log("---------------------------------------");
			  console.log();
		  } else {
			  break;
		  }
	  }
  }
};

cli.activate();
