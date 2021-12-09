import json
from detoxify import Detoxify
from tqdm.auto import tqdm
from clean_data import normalizeTweet
import pandas as pd
import datetime
month_rq = {}
model = Detoxify('unbiased')

def get_sus_users(rq_base):     
    with open("../NodeJS-API/random.json", 'r',errors='ignore') as f:
        data = json.loads(f.read())

    data = pd.DataFrame.from_records(data['table'], columns=['username', 'id', 'tweet', 'time'])[3:]
    data.reset_index(drop = True, inplace = True)
    data.tweet = data.tweet.apply(normalizeTweet)
    data = data.sort_values('time', ascending=True).reset_index(drop = True)
    data.insert(4, 'month', [datetime.datetime.strptime(i.split(' ')[1], "%b").month for i in data.time.values])
    data.insert(5, 'year', [int(i.split(' ')[-1]) for i in data.time.values])

    result = model.predict(list(data.tweet.values))

    sus_user = []
    for j in range(len(data.tweet.values)):
        for i in result:
            user = data.id.loc[j]
            if result[i][j] > rq_base:
                if user not in sus_user:sus_user.append(user)
    
    return json.dumps(sus_user)

print(get_sus_users(0.03))