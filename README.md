# redux-saga-retry

Easily add a retry behavior to your saga!

It takes only two steps:

1 - Define a stop condition for a given yielded value:
```js
const stopCondition = value => (
  value?.type === 'PUT' && value.payload.action.type.endsWith('_FAILURE')
);
```

2 - Wrap your saga:
```js
// before
takeLatest('GET_COFFEE', getCoffee)

// after
takeLatest('GET_COFFEE', retry(getCoffee, { stopCondition }))
```
