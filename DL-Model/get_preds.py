import json
from detoxify import Detoxify
from tqdm.auto import tqdm
from clean_data import normalizeTweet
import pandas as pd
from forecaster import forecast

month_rq = {}
model = Detoxify('unbiased')

def get_rq():     
    with open("../NodeJS-API/suspect.json", 'r',errors='ignore') as f:
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
            month_rq[f"{i}-{j}-{21}"] = results

    params = pd.DataFrame(month_rq).T
    params.plot(ylim = (-0.1, 1)).figure.savefig('../NodeJS-API/public/user_category_rq.png',format='png')
    trend = pd.DataFrame(params.max(axis = 1))
    trend.plot(color = 'green', ylim = (-0.1, 1), label = 'toxicity').figure.savefig('../NodeJS-API/public/user_trend.png',format='png')
    rq = (trend.sum(axis = 0)/len(trend)).values[0]
    print(rq)
    df = pd.DataFrame({'ds': trend.to_dict()[0].keys(), 'y':trend.to_dict()[0].values()})
    df.ds = pd.to_datetime(df.ds, infer_datetime_format=True)

    plt = forecast(df, 20)
    plt.savefig('../NodeJS-API/public/user_forecast.png')

    return rq

print(get_rq())
