import { createMachine, assign } from 'xstate'

export const timeMachine = createMachine({
  context: {
    past: [],
    present: [],
    future: []
  },
  initial: 'idle',
  states: {
    idle: {
      on: {
        UPDATE_TIME_MACHINE: {
          actions: ['updatePast', 'updatePresent']
        },
        UNDO: {
          actions: ['undo']
        },
        REDO: {
          actions: ['redo']
        }
      }
    }
  }
},
{
  actions: {
    updatePresent: assign({
      present: (ctx, evt) => [...ctx.present, evt.data]
    }),

    updatePast: assign({
      past: ctx => [...ctx.past, ctx.present],
      future: []
    }),

    undo: assign((ctx) => {
      const previous = ctx.past[ctx.past.length - 1]

      if (previous.length < 1) {
        return ctx
      }

      const newPast = ctx.past.slice(0, ctx.past.length - 1)
      return {
        past: newPast,
        present: previous,
        future: [ctx.present, ...ctx.future]
      }
    }),

    redo: assign(ctx => {
      const next = ctx.future[0]

      if (!next || !next.length) return ctx

      const newFuture = ctx.future.slice(1)
      return {
        present: next,
        past: [...ctx.past, ctx.present],
        future: newFuture
      }
    })
  }
})
