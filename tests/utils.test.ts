import { expect, test } from 'vitest'
import { getMessageType } from '../src/utils.ts'

test('getMessageType_correct', () => {
  const msg = getMessageType('std_msgs.msg.Bool')
  expect(msg.message_type, 'Check msg.message_type defined').toBeDefined()
  expect(msg.message_type, 'Check correct message_type').toBe('std_msgs/msg/Bool')
  expect(msg.action, 'Check result not an action').toBeFalsy()
  expect(msg.service, 'Check result not a service').toBeFalsy()
})

test('getMessageType_false', () => {
  const msg = getMessageType('')
  expect(msg.message_type, 'Check msg.message_type undefined').toBeUndefined()
})
