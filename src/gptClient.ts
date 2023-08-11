require('dotenv').config();
const axios = require('axios');

export class GPTClient {
    private _url = 'https://api.openai.com/v1/chat/completions';
    private _model: string;

    constructor(model: string) {
        this._model = model;
    }

    async respond(gptMessages: Array<any>) {
        try {
            if (gptMessages.length === 0) {
                return {
                    text: 'No gptMessages',
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

            // Print for debugging purposes
            console.log('Finish Reason: ' + response.data.choices[0].finish_reason)
            console.log(response.data.usage)
            console.log('\n\n')

            return {
                text: response.data.choices[0].message?.content,
                role: 'Assistant',
            };
        } catch (error: any) {
            console.log('E: ', error);
            throw new Error(error);
        }
    }
}
