from fbprophet import Prophet
forecaster = Prophet()


def isMonotonic(A):
  txt = 'Suspect' if (all(A[i] < A[i + 1] for i in range(len(A) - 1))) else 'Not a Suspect'
  print(txt)


def forecast(df, period):
    forecaster.fit(df)
    future = forecaster.make_future_dataframe(periods=period, freq='MS')
    forecast = forecaster.predict(future)
    forecast.yhat = forecast.yhat.apply(lambda x: 0 if x<0 else x)
    isMonotonic(list(forecast.yhat.values))
    plt = forecaster.plot(forecast, xlabel='Months', ylabel='RQ', uncertainty=False)
    return plt
