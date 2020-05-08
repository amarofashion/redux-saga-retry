# redux-saga-retry

Quickly add a retry behavior to your saga!

Just wrap it:
```js
// before
takeLatest('GET_COFFEE', getCoffee)

// after
takeLatest('GET_COFFEE', retry(getCoffee))
```

and we will stop your saga and start it over as soon as it dispatches a failure action.


## Features

- 🏖 **Easy to use:** Simply wrap your saga;
- 🔼 **Incremental adoption:** Just to the sagas that need it;
- 🛠 **Flexible and granular:** Personalize the options to fit your needs for each saga, or just embrace the defaults;
- 🟦 **Typescript ready:** Nicely typed (but accepting improvements too);


## Install
```sh
$ npm install redux-saga-retry
```

or

```sh
$ yarn add redux-saga-retry
```


## Usage

Import the module and wrap your saga:
```js
import { retry } from 'redux-saga-retry';

function* getCoffee(action) { ... }

export default function* root() {
  yield all([
    takeLatest('GET_COFFEE', retry(getCoffee)),
  ]);
}
```

As soon as your saga yields an action with the type ending with `_FAILURE` we stop that execution and start it over:

```js
function* getCoffee(action) {
  ...
  if (!success) {
    // stops the execution here
    yield put({ type: 'GET_COFFEE_FAILURE' });
  }

  // executed only on success, or on the last try
  yield put({ type: 'EXIT_KITCHEN' });
}
```

Please note that the last try will not stop the execution, and your saga will run as usual: until its end.


## API

## `retry(saga, [options])`

Wraps `saga` (a saga function) and returns a retryable version of that saga.

The `options` argument is an object, so you can tune how the retry should work.


### Options description

#### condition: `RegExp | (v: any) => boolean`

The condition to tell if the retry should happen.

_Default: `/_FAILURE$/`_

As a `RegExp`, we listen for redux-saga's `yield put(action)` calls and check if the `action.type` matches the provided regex.

As a `function`, you are free to inspect every yielded value and decide if we should start over the execution of that saga.


#### defaultMax: `number`

The maximum number of **retries**, so the saga will run at most (1 + defaultMax) times.

_Default: `3`_

It accepts `Infinity` as value.

You can override this value for each run by setting a `meta.retries` on the action that you dispatch to the store:
```js
dispatch({
  type: 'GET_COFFEE',
  meta: { retries: 42 }, // that's a lot of retries
});
```


#### backoff: `(attempt: number) => number`

A function to sparse the retries, where `attempt` is the number of the current attempt (starting on `0`) and returns how long to wait before trying again, in milliseconds.

We provide some basic backoff functions but you are free to implement your own.

_Default: `exponentialGrowth`_


## Detailed Usage

### Example 1

- matches any action ending on `_FAIL`, `_FAILED` or `_FAILURE`
- retry up to 4 times
- sparse the tries by 400ms, 800ms, 1200ms...

```js
import { retry, linearGrowth } from 'redux-saga-retry';

...

retry(getCoffee, {
  condition: /_FAIL(ED|URE)?$/,
  defaultMax: 4,
  backoff: linearGrowth,
})
```


### Example 2

- custom condition: checks for `PUT` effects in which the action type ends on `_FAILURE` but not if the `payload.status` is `401` (maybe you want to handle the authorization before try again).
- retry up to 3 times (default)
- sparse the tries by 1400, 400ms, 800ms, 1200ms...

```js
import { retry } from 'redux-saga-retry';

function conditionFn(value) {
  if (value?.type !== 'PUT') {
    return false;  // not interested in other effects
  }

  const { type, payload } = value.payload.action;

  return type.endsWith('_FAILURE') && payload.status !== 401;
}

const backoffFn = i => i === 0 ? 1400 : 400 * i;

...

retry(getCoffee, {
  condition: conditionFn,
  backoff: backoffFn,
})
```
