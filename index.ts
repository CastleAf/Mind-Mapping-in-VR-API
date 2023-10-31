const express = require('express');
const cors = require('cors');
const { formatData, sendToGDrive } = require('./src/appService.ts');
import { GPTClient } from './src/gptClient';
import { ChatCompletionRequestMessageRoleEnum } from 'openai';

// App Init
let app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

// Endpoint to build .csv file and send it to google drive
app.post('/request/google-drive/:fileName', async (req: any, res: any) => {
    const fileName = req.params.fileName;
    const mindMap = req.body;

    console.log(
        "> Requested to build Mind Map on file '" + fileName + ".csv'..."
    );

    try {
        // Format into csv file data
        const formattedCSV = formatData(mindMap);

        // Save and send file to Google Drive
        await sendToGDrive(fileName, formattedCSV);

        // Return data to FE for table rendering
        res.status(200).json({
            result: 'File sent successfully!',
        });
    } catch (error) {
        if (error.response) {
            console.error(error.response.status, error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            console.error(
                `Error while sending file to Google Drive: ${error.message}`
            );
            res.status(500).json({
                error: {
                    message: 'An error occurred during your request.',
                },
            });
        }
    }
});

// Main endpoint - exchange messages with GPT model
app.post('/request/gpt', async (req: any, res: any) => {
    console.log('Sending message to GPT.');

    try {
        const client = new GPTClient('gpt-3.5-turbo-16k');

        let gptMessages: Array<{
            role: ChatCompletionRequestMessageRoleEnum;
            content: string;
        }> = [];
        gptMessages = req.body;

        const gptAnswer = await client.respond(gptMessages);
        console.log('GPT Answer:');
        console.log(gptAnswer);
        console.log('\n');

        res.status(200).json({
            answer: gptAnswer,
        });
    } catch (error) {
        if (error.response) {
            console.error(error.response.status, error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            console.error(`Error with OpenAI API request: ${error.message}`);
            res.status(500).json({
                error: {
                    message: 'An error occurred during your request.',
                },
            });
        }
    }
});

// Initiate listening
app.listen(port, () => {
    console.log('Server running on port ' + port + '.\n');
});
