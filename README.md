# redux-saga-retry

[![NPM Package](https://badge.fury.io/js/redux-saga-retry.svg)](https://www.npmjs.com/package/redux-saga-retry) [![Build Status](https://travis-ci.com/amarofashion/redux-saga-retry.svg?branch=master)](https://travis-ci.com/amarofashion/redux-saga-retry) [![Maintainability](https://api.codeclimate.com/v1/badges/c9742c793415a6dc603c/maintainability)](https://codeclimate.com/github/amarofashion/redux-saga-retry/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/c9742c793415a6dc603c/test_coverage)](https://codeclimate.com/github/amarofashion/redux-saga-retry/test_coverage)

Retry failed async sagas automatically!

```js
// before
takeLatest('GET_COFFEE', getCoffee)

// after
takeLatest('GET_COFFEE', retry(getCoffee))
```

Just wrap your saga with the retry machine and It will run it again when a failure action happens.

## Highlights

- 🏖 **Easy to use:** Simply wrap your saga
- 🔼 **Incremental adoption:** Just add to the sagas that need it
- 🛠 **Flexible and granular:** Personalize the options to fit your needs
- 🟦 **Typescript ready:** Nicely typed (but accepting improvements too)

**Demo:** https://utd8b.csb.app/

## Install

```sh
$ npm install redux-saga-retry
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

If your saga yields an action with the type ending with `_FAILURE` the machine will hold it and run the saga again.

```js
function* getCoffee(action) {
  try {
    yield call(...);

    yield put({ type: 'GET_COFFEE_SUCCESS' });
  } catch (error) {
    // This will trigger the retry machine
		yield put({ type: 'GET_COFFEE_FAILURE' });
  }
}
```

After the request resolves successfully or the retries are exhausted your saga will run through the end.


## API

## `retry(saga, [options])`

Wraps a saga function and returns a retryable version of it.

The `options` argument is an object that you can tune how the retry works.


### Options

**backoff** `(attempt: number) => number` ▶ `exponentialGrowth`

A function to sparse the retries, where `attempt` is the number of the current attempt (starting on `0`) and returns how long to wait before trying again, in milliseconds.

We provide some basic functions (`linearGrowth` and `exponentialGrowth`) but you are free to implement your own.

**condition:** `RegExp | (v: any) => boolean` ▶ `/_FAILURE$/`
The condition to tell if the retry should happen.

As a `RegExp`, it will listen for redux-saga's action that matches the regex.  
As a `function`, you are responsible to decide if it should retry the execution.

**debug:** `boolean` ▶ `false`

Dispatch an action when the retry happens.

```js
{
  type: '@@REDUX-SAGA-RETRY',
  payload: {
  	action: 'NOTES_REQUEST',
  	attempt: 1,
  },
}
```

**retries:** `number` ▶ `3`

The maximum number of retries the saga will run. Doesn't include the original run.  
You can override this value for each run by setting a `meta.retries` on the action that you dispatch to the store:

```js
dispatch({
  type: 'GET_COFFEE',
  meta: { retries: 42 }, // that's a lot of retries
});
```

## Examples

**Custom options**

- matches any action ending on `_FAIL`, `_FAILED` or `_FAILURE`
- retry up to 4 times
- sparse the tries by 400ms, 800ms, 1200ms...

```js
import { retry, linearGrowth } from 'redux-saga-retry';

...

retry(getCoffee, {
  condition: /_FAIL(ED|URE)?$/,
  backoff: linearGrowth,
  retries: 4,
})
```

**Advanced condition and backoff options**

- custom condition: checks for `PUT` effects in which the action type ends on `_FAILURE` but not if the `payload.status` is `401` (maybe you want to handle the authorization before try again).
- sparse the tries by an initial delay of 1400ms followed by 400ms, 800ms, 1200ms...

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

## License

MIT