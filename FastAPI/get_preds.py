import json
from detoxify import Detoxify
from tqdm.auto import tqdm
from clean_data import normalizeTweet
import pandas as pd
month_rq = {}
model = Detoxify('unbiased')

def get_rq(fpath):
    with open(fpath, 'r') as f:
        data = json.loads(f.read())

    data = pd.DataFrame.from_records(data['table'], columns=['id', 'tweet', 'time'])[3:]
    data.reset_index(drop = True, inplace = True)
    data.tweet = data.tweet.apply(normalizeTweet)
    data = data.sort_values('time', ascending=True).reset_index(drop = True)
    data.insert(3, 'month', [int(i.split('-')[1]) for i in data.time.values])
    data.insert(4, 'year', [int(i.split('-')[0]) for i in data.time.values])


    for i in tqdm(list(set(data.year.values))):
        df_year = data.loc[data.year == i].drop(['id', 'time'], axis = 1)
        for j in list(set(df_year.month.values)):
            df_month = df_year.loc[data.month == j]
            results = model.predict(list(df_month.tweet.values))
            for k in results:
                results[k] = sum(results[k])/len(results[k])
            month_rq[f"{j}-{i}"] = results



    params = pd.DataFrame(month_rq).T
    trend = pd.DataFrame(params.max(axis = 1))
    rq = (trend.sum(axis = 0)/len(trend)).values[0]

    return rq
