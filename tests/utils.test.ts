import { expect, test } from 'vitest'
import { getMessageType } from '../src/utils.ts'

test('getMessageType_correct', () => {
  const msg = getMessageType('std_msgs.msg.Bool')
  expect(msg.message_type).toBeDefined()
  expect(msg.message_type).toBe('std_msgs/msg/Bool')
  expect(msg.action).toBeFalsy()
  expect(msg.service).toBeFalsy()
})

test('getMessageType_false', () => {
  const msg = getMessageType('')
  expect(msg.message_type).toBeUndefined()
})
