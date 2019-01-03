import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloClient } from 'apollo-client'
import { ApolloLink } from 'apollo-link'
import { createHttpLink } from 'apollo-link-http'
import { WebSocketLink } from 'apollo-link-ws'
import fetch from 'isomorphic-unfetch'
import { NextAppContext } from 'next/app'
import Head from 'next/head'
import * as React from 'react'
import { getDataFromTree } from 'react-apollo'
import { SubscriptionClient } from 'subscriptions-transport-ws'

declare global {
  namespace NodeJS {
    interface Process {
      browser: boolean
    }
  }
}
// Polyfill fetch() on the server (used by apollo-client)
if (!process.browser) {
  // @ts-ignore
  global.fetch = fetch
}

function createApolloClient(initialState) {
  let apolloLink: WebSocketLink | ApolloLink | undefined
  if (process.browser) {
    const client = new SubscriptionClient('ws://localhost:3002/graphql', {
      reconnect: true,
    })

    apolloLink = new WebSocketLink(client)
  } else {
    apolloLink = createHttpLink({ uri: 'http://localhost:3002/graphql' })
  }

  return new ApolloClient({
    connectToDevTools: process.browser,
    // Disables forceFetch on the server (so queries are only run once)
    ssrMode: !process.browser,
    link: apolloLink,
    cache: new InMemoryCache().restore(initialState || {}),
  })
}

let apolloClient: ApolloClient<any> | undefined

function getApolloClient(initialState?: any): ApolloClient<any> {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (!process.browser) {
    return createApolloClient(initialState)
  }

  // Reuse client on the client-side
  if (!apolloClient) {
    apolloClient = createApolloClient(initialState)
  }

  return apolloClient
}

export default App => {
  return class Apollo extends React.Component<{ initialProps: any }> {
    public static displayName: string = 'withApollo(App)'
    public static async getInitialProps(context: NextAppContext) {
      let initialProps = {}
      if ('getInitialProps' in App) {
        initialProps = await App.getInitialProps.call(App, context)
      }

      const apollo = getApolloClient()
      context.ctx.apollo = apollo

      // Run all GraphQL queries in the component tree
      // and extract the resulting data
      if (!process.browser) {
        try {
          // Run all GraphQL queries
          await getDataFromTree(
            <App
              {...initialProps}
              Component={context.Component}
              router={context.router}
              apolloClient={apollo}
            />,
          )
        } catch (error) {
          if (error instanceof Promise) {
            await error
          } else {
            // Prevent Apollo Client GraphQL errors from crashing SSR.
            // Handle them in components via the data.error prop:
            // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
            console.error('Error while running `getDataFromTree`', error)
          }
        }

        // getDataFromTree does not call componentWillUnmount
        // head side effect therefore need to be cleared manually
        Head.rewind()
      }

      const initialApolloState = apollo.cache.extract()

      return {
        initialProps,
        initialApolloState,
      }
    }

    public apollo: ApolloClient<any>

    constructor(props) {
      super(props)

      this.apollo = getApolloClient(props.initialApolloState)
    }

    public render() {
      const { initialProps, ...props } = this.props

      return <App {...props} {...initialProps} apolloClient={this.apollo} />
    }
  }
}
