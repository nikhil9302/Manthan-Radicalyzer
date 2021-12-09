const Twitter = require('twitter');
const config = require('./config.js');
const express = require("express");
const fs = require('fs');
const app = express();
let T = new Twitter(config);
//WOEID for India is 23424848, hence it is used as parameter for extracting trending hashtags from twitter in India
let param = {
    id: 23424848,    
}
//parameters that are required for extracting the random tweets with trending hashtags 
let params = {  
    q: "",  
    count: 500,
    result_type: 'recent',
    lang: 'en'
}
let hashtags = "";
const trend = () =>{
    T.get('trends/place', param, (err, data, response) =>{
        if(!err){        
            for(let i = 0; i < 15; i++){  
                hashtags += data[0].trends[i].query;
                hashtags += " OR ";                 
            }
        }else{
            console.log(err);
        }  
        //slice to remove the last useless " OR " 
        hashtags = hashtags.slice(0,hashtags.length-4);
        //to check if resource limit of twitter API is exceeded. I have elevated access so i can have queries upto 500 characters
        console.log(hashtags.length)
        //initializing the query parameter needed for tweet selection with collected hashtags
        params.q = hashtags
        //doing the call back function of search, as node performs asynchronous execution by default 
        collecttweet(params);
    });
}
//the call for trend function defined above
trend();
//to collect tweet from the specified parameters
const collecttweet = (params) => {
    T.get('search/tweets', params, (err, data, response) =>{
        if(!err){    
            var obj = {      
                table : null
            }; 
            let tweets = [["UserName","User-ID","TweetData","Tweet-Time"]]  
            for(let i = 0; i < data.statuses.length; i++){  
                let tweet = []
                let uname = data.statuses[i]['user']['name'];  
                let uid= data.statuses[i]['user']['id_str'];  
                let tdata = data.statuses[i]['text']; 
                let time = data.statuses[i]['created_at']
                tweet.push(uname)
                tweet.push(uid); 
                tweet.push(tdata);
                tweet.push(time);            
                tweets.push(tweet);                    
            }
            obj.table = tweets
            var json = JSON.stringify(obj);
            fs.writeFile('random1.json', json, 'utf8', (err)=>{
                if (err) console.log(err);
                else console.log('JSON completed');
            });            
        }   
        else{
          console.log(err);    
        }  
    });
}
