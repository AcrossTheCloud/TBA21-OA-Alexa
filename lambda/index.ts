import {
  ErrorHandler,
  HandlerInput,
  RequestHandler,
  SkillBuilders,
} from 'ask-sdk-core';
import {
  Response,
  SessionEndedRequest,
} from 'ask-sdk-model';
const axios = require('axios').default;

const LaunchRequestHandler : RequestHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput : HandlerInput) : Response {
    const speechText = 'Welcome to the Ocean Archive! You can ask Ocean Archive to search for something, e.g. "Alexa, ask Ocean Archive to search for humpback."';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Ocean Archive', speechText)
      .getResponse();
  },
};

const SearchIntentHandler : RequestHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'SearchIntent';
  },
  async handle(handlerInput : HandlerInput) : Promise<Response> {
    const searchTerm = (handlerInput.requestEnvelope.request as any).intent.slots.SearchTerm.value;
    let speechText = `Sorry, no search results found matching ${searchTerm}`;
    let cardText = speechText;
    console.log(handlerInput.requestEnvelope.request);
    console.log(searchTerm);
    const response = await axios.post('https://demo-api.ocean-archive.org/pages/search',
      {"criteria":[{"field":"title","value":searchTerm}],"limit":50,"focus_arts":false,"focus_action":false,"focus_scitech":false});

    response.data.results.forEach((element: any) => {
      console.log(element);
      if (element.type==='Audio' && element.s3_key.endsWith(".mp3")) {
        const url='https://alexa-audio.ocean-archive.org/'+element.s3_key.substring(0, element.s3_key.lastIndexOf('.')) + '_Alexa_audio.mp3'
        speechText=`Found an item for ${searchTerm}. Now playing ${element.title}. <audio src="${url}" />`;
        cardText=`Found an item for ${searchTerm}. Now playing ${element.title}.`;
        console.log(speechText);
      }
    });

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Ocean Archive', cardText)
      .withShouldEndSession(false)
      .getResponse();
  },
};

const HelpIntentHandler : RequestHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput : HandlerInput) : Response {
    const speechText = 'To use the Ocean Archive Alexa skill, ask the ocean archive to search for a keyword, e.g. Alexa, ask Ocean Archive to search for humpback.';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Ocean Archive', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler : RequestHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput : HandlerInput) : Response {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Ocean Archive', speechText)
      .withShouldEndSession(true)      
      .getResponse();
  },
};

const SessionEndedRequestHandler : RequestHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput : HandlerInput) : Response {
    console.log(`Session ended with reason: ${(handlerInput.requestEnvelope.request as SessionEndedRequest).reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler : ErrorHandler = {
  canHandle(handlerInput : HandlerInput, error : Error ) : boolean {
    return true;
  },
  handle(handlerInput : HandlerInput, error : Error) : Response {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

let skill: any;

exports.handler = async (event: any, context: any) => {
  console.log(`REQUEST++++${JSON.stringify(event)}`);
  if (!skill) {
    skill = SkillBuilders.custom()
      .addRequestHandlers(
        LaunchRequestHandler,
        SearchIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
      )
      .addErrorHandlers(ErrorHandler)
      .create();
  }

  const response = await skill.invoke(event, context);
  console.log(`RESPONSE++++${JSON.stringify(response)}`);

  return response;
};

exports.handler = SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    SearchIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();