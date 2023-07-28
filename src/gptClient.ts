require('dotenv').config();
const axios = require('axios');

export class GPTClient {
    private _url = 'https://api.openai.com/v1/chat/completions';
    private _model: string;

    /* 
    private _functions = [
        {
            name: 'send_to_gdrive',
            description: 'Send file to google drive.',
            parameters: {
                type: 'object',
                properties: {
                    data: {
                        type: 'string',
                        description:
                            "Data as an array of objects, e.g. [{'NodeId': 'value', 'NomeName': 'value', 'FromNode': 'value', 'NodeLevel': 'value'}, {'NodeId': 'value', 'NomeName': 'value', 'FromNode': 'value', 'NodeLevel': 'value'}]",
                    },
                },
                required: ['data'],
            },
        },
    ]; */

    constructor(model: string) {
        this._model = model;
    }

    async respond(gptMessages: Array<any>) {
        try {
            if (gptMessages.length === 0) {
                return {
                    text: 'No chatGPTMessages',
                };
            }

            const response = await axios.post(
                this._url,
                {
                    model: this._model,
                    messages: gptMessages
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
                    },
                }
            );

            if (!response.data || !response.data.choices) {
                return {
                    text: "The bot didn't respond. Please try again later.",
                    role: 'Assistant',
                };
            }
            console.log(response.data.usage);

            return {
                text: response.data.choices[0].message?.content,
                role: 'Assistant',
            };
        } catch (error) {
            console.log('E: ', error);
            throw new Error(error);
        }
    }
}
