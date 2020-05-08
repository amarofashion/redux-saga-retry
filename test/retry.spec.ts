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

function* brokenSaga({ payload }: AnyAction) {
  // @ts-ignore
  return yield call(dummyClient, payload.should.broke.here);
}

function stopConditionValidator(value: any) {
  if (value?.type !== 'PUT') {
    return false;
  }

  const { type, payload } = value.payload.action;

  return type.endsWith('_FAILURE') && ![401, 404, 500].includes(payload.status);
}

describe('retry', () => {
  const action = { payload: { key: 'value' }, type: 'DUMMY_REQUEST' };
  const expectedArgs = [
    'https://example.com',
    expect.objectContaining({ payload: action.payload }),
  ];
  const originalGenerator = dummySaga;

  afterEach(() => {
    dummyClient.mockReset();
    dummyClient.mockResolvedValue('Resolved');
  });

  describe('on success cases', () => {
    it('should not change flow', async () => {
      const retryableGenerator = retry(originalGenerator);

      const originalResult = await expectSaga(originalGenerator, action).run();
      const retryableResult = await expectSaga(retryableGenerator, action).run();

      expect(originalResult.toJSON()).toEqual(retryableResult.toJSON());
    });

    it('should execute once and dispatch success action', async () => {
      const retryableGenerator = retry(originalGenerator);

      const result = await expectSaga(retryableGenerator, action).run();

      expect(result.toJSON()).toMatchSnapshot();
      expect(dummyClient).toHaveBeenCalledTimes(1);
      expect(dummyClient).toHaveBeenCalledWith(...expectedArgs);
      expect(result.effects.put).toHaveLength(1);
      expect(result.effects.put[0].payload.action.type).toMatch(/_SUCCESS$/g);
    });
  });

  describe('on error cases', () => {
    it('should dispatch only 1 error and alert actions', async () => {
      dummyClient.mockRejectedValue('Rejected');
      const retryableGenerator = retry(originalGenerator);

      const result = await expectSaga(retryableGenerator, action).run();

      expect(result.effects.put).toHaveLength(2);
      expect(result.effects.put[0].payload.action.type).toMatch(/_FAILURE$/g);
      expect(result.effects.put[1].payload.action.type).toMatch(/^DUMMY_SHOW_ALERT$/g);
    });

    it('should retry N times', async () => {
      dummyClient.mockRejectedValue('Rejected');
      const n = 4;
      const retryableGenerator = retry(originalGenerator, { defaultMax: n });

      const result = await expectSaga(retryableGenerator, action).run();

      expect(result.toJSON()).toMatchSnapshot();
      expect(dummyClient).toHaveBeenCalledTimes(1 + n); // original call + n retries
      expect(dummyClient.mock.calls).toEqual(Array(1 + n).fill(expectedArgs));
      expect(result.effects.call).toHaveLength(2 * n + 1); // call(dummyClient) n+1 times + call(delay) n times
    });

    it('should use custom condition function', async () => {
      dummyClient.mockRejectedValue({ message: 'Rejected', status: 401 });
      const retryableGenerator = retry(originalGenerator, { condition: stopConditionValidator });

      const result = await expectSaga(retryableGenerator, action).run();

      expect(dummyClient).toHaveBeenCalledTimes(1);
      expect(result.toJSON()).toMatchSnapshot();
    });

    it('should not handle thrown exceptions', async () => {
      const retryableGenerator = retry(brokenSaga);

      let result: any;
      let error: any;

      try {
        result = await expectSaga(retryableGenerator, action).run();
      } catch (e) {
        error = e;
      }

      expect(result).toBeUndefined();
      expect(error).toBeInstanceOf(TypeError);
    });
  });
});
