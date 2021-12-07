const needle = require('needle');
const express = require("express");
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser')
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 
const hbs = require('hbs')
app.set('view engine', 'hbs')
app.set('views','./public')
//server started at port 3000 to display the tweets of suspect in a tablular html
app.listen(3000, () => {
  console.log("Application started and Listening on port 3000");
});

// .env file has BEARER_TOKEN='my-bearer-token', .env is git ignored for security reasons
require('dotenv').config();
const bearerToken = process.env.BEARER_TOKEN;
var RQ;
// collect the userTweets in an array for later
let userTweets = [];
//collect the username of the suspect
let susName,userName;
let userId;
app.get('/',(req,res)=>{
    res.sendfile('./public/index.html');    
    app.post('/', (req, res) => {
        userName = req.body.username;
        console.log(userName);            
        getUserIDByUserName();    
    });    
    const getUserIDByUserName = async () => {
        //twitter username input from command line
        const options = {
            headers: {            
                "authorization": `Bearer ${bearerToken}`
            }
        }
        const urlName = `https://api.twitter.com/2/users/by/username/${userName}`;
        const resp = await needle('get', urlName,options);
        // this is the Name of the user's Twitter Profile
        susName = resp.body.data.name;
        // this is the userID of Twitter Profile
        userId = resp.body.data.id;    
        getSusTweets()
    }
    
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
        fs.writeFile('sus.json', json, 'utf8', (err)=>{
            if (err) console.log(err);
            else console.log('JSON completed');
        });
        
        console.dir(userTweets, {
            depth: null
        });
        /*
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
        });*/  
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
        const url = `https://api.twitter.com/2/users/${userId}/tweets`;
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
});

// to display sus tweets in a html form
app.get("/sustwitter", (req, res) => {       
    var details = {
        name : susName, 
        uname : userName,
        src1 : "user_catergory_rq.png",
        src2 : "user_trend.png",
        rq : null
    }    
    if(RQ!=undefined){
        details.rq = RQ
        res.render('suspect', {details : details});     
    }else{
        ans =`<h2>computing RQ value of the user, please wait...</h2>`
        res.send(ans)
    }       
});













