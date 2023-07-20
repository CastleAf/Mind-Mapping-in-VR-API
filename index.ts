require('dotenv').config();
const express =  require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
const { generatePrompt, formatData, sendToGDrive } = require('./src/appService.ts');

// App Init
let app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

// OpenAI configuration
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Main Endpoint
app.post("/request/:fileName", async (req: any, res: any) => {

    const fileTitle = req.params.fileName
    console.log('> Requested to build Mind Map on file \'' + fileTitle + '.csv\'...')

    if (!configuration.apiKey) {
        res.status(500).json({
            error: {
                message: "OpenAI API key not configured, please follow instructions in README.md",
            }
        });
        return;
    }

    const inputText = req.body.val || '';
    if (inputText.trim().length === 0) {
        res.status(400).json({
            error: {
                message: "Please enter a valid input",
            }
        });
        return;
    }

    try {

        // OpenAI text completion call
        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: generatePrompt(inputText),
            temperature: 0.6,
            max_tokens: 1500
        });

        // Pass result to a JSON format
        const myResult = JSON.parse(completion.data.choices[0].text);

        // Format into csv file data
        const formattedCSV = formatData(myResult, fileTitle)

        // Save and send file to Google Drive
        sendToGDrive(fileTitle, formattedCSV)
        // TODO: Maybe implement error handling logic here ??

        // Return data to FE for table rendering
        res.status(200).json({
            result: myResult
        });
    } catch (error) {
        // Consider adjusting the error handling logic for your use case
        if (error.response) {
            console.error(error.response.status, error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            console.error(`Error with OpenAI API request: ${error.message}`);
            res.status(500).json({
                error: {
                    message: 'An error occurred during your request.',
                }
            });
        }
    }
})

// Initiate listening
app.listen(port, () => {
    console.log('Server running on port ' + port + '.\n');
});
