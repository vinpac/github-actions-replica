import ApolloClient from 'apollo-client'
import NextApp, { AppComponentProps, Container } from 'next/app'
import React from 'react'
import { ApolloProvider } from 'react-apollo'
import { ApolloProvider as ApolloHooksProvider } from 'react-apollo-hooks'
import ReactIntl, { addLocaleData, IntlProvider } from 'react-intl'
import withApollo from '~/lib/apollo/with-apollo'
import Head from 'next/head'

declare global {
  interface Window {
    __NEXT_DATA__: { [key: string]: any }
    ReactIntlLocaleData: { [lang: string]: ReactIntl.Locale }
  }
}

// Register React Intl's locale data for the user's locale in the browser. This
// locale data was added to the page by `pages/_document.js`. This only happens
// once, on initial page load in the browser.
if (typeof window !== 'undefined' && window.ReactIntlLocaleData) {
  Object.keys(window.ReactIntlLocaleData).forEach(lang => {
    addLocaleData(window.ReactIntlLocaleData[lang])
  })
}

interface AppProps extends AppComponentProps {
  readonly apolloClient: ApolloClient<any>
}

class App extends NextApp<AppProps> {
  public render() {
    const { Component, pageProps, apolloClient } = this.props
    const now = Date.now()

    return (
      <Container>
        <Head>
          <link href="/static/.dist/_index.css" rel="stylesheet" />
          <link href="/static/codemirror.css" rel="stylesheet" />
        </Head>
        <IntlProvider locale={'en'} messages={{}} initialNow={now}>
          <ApolloProvider client={apolloClient}>
            <ApolloHooksProvider client={apolloClient}>
              <Component {...pageProps} />
            </ApolloHooksProvider>
          </ApolloProvider>
        </IntlProvider>
      </Container>
    )
  }
}

export default withApollo(App)
