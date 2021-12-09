from fbprophet import Prophet
forecaster = Prophet()

def forecast(df, period):
    forecaster.fit(df)
    future = forecaster.make_future_dataframe(periods=period, freq='MS')
    forecast = forecaster.predict(future)
    forecast.yhat = forecast.yhat.apply(lambda x: 0 if x<0 else x)
    plt = m.plot(forecast, xlabel='Months', ylabel='RQ', uncertainty=False)
    return plt