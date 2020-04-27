import type { AnyAction } from 'redux';
import { call, put } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import { retry } from '../src/retry';

jest.mock('../src/backoff-functions', () => ({
  exponentialGrowth: () => 0,
}));

const dummyClient = jest.fn().mockResolvedValue('Resolved');

function* dummySaga({ payload }: AnyAction) {
  try {
    const result = yield call(dummyClient, 'https://example.com', { payload });

    yield put({
      type: 'DUMMY_SUCCESS',
      payload: { result },
    });
  } catch ({ message, status }) {
    yield put({
      type: 'DUMMY_FAILURE',
      payload: { message, status },
    });
    yield put({
      type: 'DUMMY_SHOW_ALERT',
      payload: { message, status, type: 'error' },
    });
  }
}

// function* brokenSaga() {
//   // @ts-ignore
//   return yield call(dummyClient, {}.should.broke.here);
// }

function stopConditionValidator(value: any) {
  if (value?.type !== 'PUT') {
    return false;
  }

  const { type, payload } = value.payload.action;

  return type.endsWith('_FAILURE') && ![401, 404, 500].includes(payload.status);
}

describe('retry', () => {
  const action = { payload: { key: 'value' }, type: 'DUMMY_REQUEST' };
  // const expectedArgs = [
  //   'https://example.com',
  //   expect.objectContaining({ payload: action.payload }),
  // ];
  const originalGenerator = dummySaga;

  describe('on success cases', () => {
    it('should not change flow', async () => {
      const retryableGenerator = retry(originalGenerator, {
        stopCondition: stopConditionValidator,
      });

      const originalResult = await expectSaga(originalGenerator, action).run();

      const retryableResult = await expectSaga(retryableGenerator, action).run();

      expect(originalResult.toJSON()).toEqual(retryableResult.toJSON());
    });
  });
});
