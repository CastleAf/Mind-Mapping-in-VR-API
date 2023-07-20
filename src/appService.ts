const { GoogleDriveService } = require('./googleDriveService.ts');
const path = require('path');
const fs = require('fs');

export async function sendToGDrive() {

    const driveClientId = process.env.GOOGLE_DRIVE_CLIENT_ID || '';
    const driveClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || '';
    const driveRedirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || '';
    const driveRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '';

    const googleDriveService = new GoogleDriveService(driveClientId, driveClientSecret, driveRedirectUri, driveRefreshToken);

    const finalPath = path.resolve(__dirname, '../public/spacexpic.jpg');
    const folderName = 'Tese';

    if (!fs.existsSync(finalPath)) {
        throw new Error('File not found!');
    }

    let folder = await googleDriveService.searchFolder(folderName).catch((error) => {
        console.error(error);
        return null;
    });

    if (!folder) {
        folder = await googleDriveService.createFolder(folderName);
    }

    // Sending test image
    await googleDriveService.saveFile('SpaceX', finalPath, 'image/jpg', folder.id).catch((error) => {
        console.error(error);
    });

    // Sending csv file
    await googleDriveService.saveFile('poop', finalPath, 'application/csv', folder.id).catch((error) => {
        console.error(error);
    });
    
    console.info('Files uploaded successfully!');

    // Delete the file on the server
    // fs.unlinkSync(finalPath);
}

export function generatePrompt(inputText: string) {

      return `
      Please create a Mind Map on a .csv file format that will be imported into Noda.io. Each Node Name field should have a maximum of 6 words. The Mind Map should summarize the following text:
      "${inputText}"

      The response format should be only an array of objects describing each node, as a json format, without any words or newlines before the array.
      Example output:
      [{"NodeId": "value", "NomeName": "value", "FromNode": "value", "NodeLevel": "value"}, {"NodeId": "value", "NomeName": "value", "FromNode": "value", "NodeLevel": "value"}]`
}

export function formatData(dataRows: Array<object>, title: string) {

    const emptyObj = {
        "Uuid": "",
        "Title": "",
        "Notes": "",
        "ImageURL": "",
        "PageURL": "",
        "Color": "",
        "Opacity": 1,
        "Shape": "",
        "Size": "",
        "PositionX": "",
        "PositionY": "",
        "PositionZ": "",
        "Collapsed": "No",
        "Type": "",
        "FromUuid": "",
        "ToUuid": ""
    }

    let links = []
    let finalData = []
    let finalId = 0

    dataRows.forEach((element: any) => {
        if (element.FromNode) {
            links.push([element.FromNode, element.NodeId])
        }

        let elemObj = {
            "Uuid": "",
            "Title": "",
            "Notes": "",
            "ImageURL": "",
            "PageURL": "",
            "Color": "",
            "Opacity": 1,
            "Shape": "Ball",
            "Size": "",
            "PositionX": "",
            "PositionY": "",
            "PositionZ": "",
            "Collapsed": "No",
            "Type": "",
            "FromUuid": "",
            "ToUuid": ""
        }
        elemObj.Uuid = element.NodeId
        elemObj.Title = element.NodeName

        if (element.NodeLevel === 1) {
            elemObj.Size = '15'
            elemObj.Color = 'E91E63'
            elemObj.Shape = 'Box'
        }
        else if (element.NodeLevel === 2) {
            elemObj.Size = '9.5'
            elemObj.Color = 'FFEB3B'
        }
        else if (element.NodeLevel === 3) {
            elemObj.Size = '7.5'
            elemObj.Color = '4CAF50'
        }
        else if (element.NodeLevel === 4) {
            elemObj.Size = '6.5'
            elemObj.Color = '00BCD4'
        }
        else {
            elemObj.Size = '5'
            elemObj.Color = 'F44336'
        }
        finalData.push(elemObj)
        finalId = +element.NodeId

    });

    links.forEach(el => {
        finalId += 1
        finalData.push({
            "Uuid": JSON.stringify(finalId),
            "Title": "",
            "Notes": "",
            "ImageURL": "",
            "PageURL": "",
            "Color": '171717',
            "Opacity": 1,
            "Shape": 'Solid',
            "Size": 1,
            "PositionX": "",
            "PositionY": "",
            "PositionZ": "",
            "Collapsed": "",
            "Type": "",
            "FromUuid": el[0],
            "ToUuid": el[1]
        })
    });

    // FORMAT TO CSV
    let fields = Object.keys(finalData[0])
    let replacer = function(key, value) { return value === null ? '' : value } 
    let csv: any = finalData.map(function(row){
      return fields.map(function(fieldName){
        return JSON.stringify(row[fieldName], replacer)
      }).join(',')
    })
    csv.unshift(fields.join(',')) // add header column
    csv = csv.join('\r\n');
    // console.log(csv)

    const fileName = title + '.csv'
    fs.writeFileSync(fileName, csv)
    console.log('Saved ' + fileName + '.')

    // console.log(finalData)
    // TODO:
    // Assign colours, assign shape box to level 0, map params



}
