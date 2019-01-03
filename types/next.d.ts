import next from 'next'
import { AnyAction, Store as ReduxStore } from 'redux'
import { ThunkDispatch } from 'redux-thunk'
import ApolloClient from 'apollo-client'

interface Store<S = any, A extends Action<any> = AnyAction>
  extends ReduxStore<S, A> {
  dispatch: ThunkDispatch<S, any, A>
}

declare module 'next' {
  export interface NextContext {
    store: Store
    apollo: ApolloClient<any>
  }
}
