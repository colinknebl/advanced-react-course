# withData.js

## Imports

1. bring in ApolloClient from 'apollo-boost' (npm package)
2. bring in withApollo from 'next-with-apollo' (npm package)

# \_app.js (create Apollo client)

## Imports

1. bring in ApolloProvider from 'react-apollo'
2. bring in withData from '../lib/withData'

## Implement

1. wrap app with the ApolloProvider
2. ApolloProvider needs a client
3. write getItitialProps func (this is a next.js function, not react. because next.js is server rendered, this method is needed)
4. pass page props to rendered Component

# To set up a query from a page or component (see components/Items.js for example)

## import

1. import { Query } from 'react-apollo';
2. import gql from 'graphql-tag';

## Other steps

1. write the query outside of the class
2. add Query component (from react-apollo), and pass it the query (e.x. query={ALL_ITEMS_QUERY} )
3. NOTE: the only child of a Query component can be a function with a single argument - 'payload' - that includes the fetched data, any error, and if loading boolean (as well as other things)

# To set up a mutation from a page or component (see components/CreateItem.js for example)

## import

1. import { Mutation } from 'react-apollo';
2. import gql from 'graphql-tag';

## Other steps

1. write mutation outside of the class
2. add Mutation component to jsx, passing it the mutation and variables (e.x. mutation={CREATE_ITEM_MUTATION} variables={this.state})
3. NOTE: the only child of a Mutation component can be a function with 2 arguments, the mutation and a 'payload. the payload includes loading and error (as well as other things) - the jsx that needs access to the qgl mutation goes within this function.

# To set up a mutation and query on the same page, see UpdateItem.js
