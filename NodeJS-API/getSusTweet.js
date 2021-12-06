const needle = require('needle');
const express = require("express");
const app = express();
const fs = require('fs');

//server started at port 3000 to display the tweets of suspect in a tablular html
app.listen(3000, () => {
  console.log("Application started and Listening on port 3000");
});

// this is the ID for suspect @karynaur_, can be found using POSTMAN or Twitter Profile
const userId = "1101517747945725952";
const url = `https://api.twitter.com/2/users/${userId}/tweets`;

// .env file has BEARER_TOKEN='my-bearer-token', .env is git ignored for security reasons
require('dotenv').config();
const bearerToken = process.env.BEARER_TOKEN;

// collect the userTweets in an array for later
let userTweets = [];
//collect the username of the suspect
let susName = "_karynaur";
const getSusTweets = async () => {    
    // paramters requested for getPage and we request the author_id expansion so that we can print out the user name later
    let params = {
        "max_results": 100,
        "tweet.fields": "created_at",                    
    }

    const options = {
        headers: {
            "User-Agent": "v2UserTweetsJS",
            "authorization": `Bearer ${bearerToken}`
        }
    }

    let hasNextPage = true;
    let nextToken = null;    
    console.log("Fetching Suspect Tweets...");   
    var obj = {      
        table : []
    }; 
    
    while (hasNextPage) {
        let resp = await getPage(params, options, nextToken);             
        if (resp && resp.meta && resp.meta.result_count && resp.meta.result_count > 0) {
            //susName = resp.includes.users[0].username;
            if (resp.data) {
                userTweets.push.apply(userTweets, resp.data);
            }
            if (resp.meta.next_token) {
                nextToken = resp.meta.next_token;
            } else {
                hasNextPage = false;
            }
        } else {
            hasNextPage = false;
        }
    }
    row = [];
    row.push("Suspect UserName: ",susName);    
    obj.table.push(row);
    row = [];
    row.push("Suspect UserID: ",userId);
    obj.table.push(row);
    row = [];
    row.push('Tweet-ID', 'Tweet Data', 'Tweet-Time');
    obj.table.push(row);   
    for(let i=0;i<userTweets.length;i++){
        row = [];
        let val1 = userTweets[i]['id'];
        let val2 = userTweets[i]['text'];       
        let val3 = userTweets[i]['created_at']; 
        row.push(val1);
        row.push(val2);  
        row.push(val3); 
        obj.table.push(row);
    }
    //sus.json file creation
    var json = JSON.stringify(obj);
    fs.writeFile('../FastAPI/sus.json', json, 'utf8', (err)=>{
        if (err) console.log(err);
        else console.log('JSON completed');
    });
    console.dir(userTweets, {
        depth: null
    });
    //for dynamic gsheet creation
    const { google } = require("googleapis");
    app.set("view engine", "ejs");
    const auth = new google.auth.GoogleAuth({
        keyFile: "./keys.json", //the key file
        //url to spreadsheets API
        scopes: "https://www.googleapis.com/auth/spreadsheets", 
    });    
    rows = []
    const authClientObject = auth.getClient();
    const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });
    const spreadsheetId = "1n5SIlYEiHHA4_czDoEE5HROrkEreHSGGjIsfP4kq-T0";    
    rows = [["Suspect UserName: ",`${susName}`],["Suspect UserID: ", `${userId}`],["Tweet-ID","Tweet Data","Tweet-Time"]];
    for(let i=0;i<userTweets.length;i++){
        row = [];
        let val1 = userTweets[i]['id'];
        let val2 = userTweets[i]['text'];       
        let val3 = userTweets[i]['created_at']; 
        row.push(val1);
        row.push(val2);  
        row.push(val3); 
        rows.push(row);    
    }    
    googleSheetsInstance.spreadsheets.values.append({
        auth, //auth object
        spreadsheetId, //spreadsheet id
        range: "Sheet1!A:B", //sheet name and range of cells
        valueInputOption: "USER_ENTERED", // The information will be passed according to what the usere passes in as date, number or text
        resource: {
            values: rows,
        },
    });    
    var RQ;
    const {spawn} = require('child_process');
    const python = spawn('python', ['../FastAPI/get_preds.py']);
    python.stdout.on('data', function (data) {
        console.log('Running the python script model');
        RQ = data.toString();
       });
    
    python.on('close', (code) => {
       console.log(`RQ Output: ${RQ}`);
    });
}

const getPage = async (params, options, nextToken) => {
    if (nextToken) {
        params.pagination_token = nextToken;
    }

    try {
        const resp = await needle('get', url, params, options);
        if (resp.statusCode != 200) {            
            console.log(`${resp.statusCode} ${resp.statusMessage}:\n${resp.body}`);
            return;
        }
        return resp.body;
    } catch (err) {
        throw new Error(`Request failed: ${err}`);
    }
}
getSusTweets();
//ips = []
// to display sus tweets in a html form
app.get("/suspecttweets", (req, res) => {      
    /*app.set('trust proxy', true)
    ips.push("Hostname: "+ req.hostname+" IP addr: "+req.ip)*/    
    ans = `<h1>${susName}</h1><table>`;
    for(let i = 0;i<userTweets.length;i++){
        ans += `<tr><td>Tweet ${i+1}: ${userTweets[i]['text'].trim('\n')}</td></tr>`;
    }
    res.send(ans)
});










