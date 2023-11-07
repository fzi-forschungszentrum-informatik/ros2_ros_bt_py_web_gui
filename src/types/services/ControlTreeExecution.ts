export enum TreeExecutionCommands {
  DO_NOTHING = 0,
  TICK_ONCE = 1,
  TICK_PERIODICALLY = 2,
  TICK_UNTIL_RESULT = 3,
  STOP = 4,
  RESET = 5,
  SHUTDOWN = 6,
  SETUP_AND_SHUTDOWN = 7
}

export type ControlTreeExecutionRequest = {
  command: TreeExecutionCommands
  tick_frequency_hz: number
}

export type ControlTreeExecutionResponse = {
  success: boolean
  error_message: string
  tree_state: string
}
