from terminal:

$prisma login$ primsa init

update prisma.yml
update variables.env

# deploy

### when a data model is updated, run the deploy script again

\$ prisma deploy --env-file variables.env

# connect the node server with the prisma db

1. see src/db.js for how to

# create the GraphQL server

1. see src/createServer.js for how to

# start GraphQL server

1. see index.js for how to

# To create a new model

1. add the model to datamodel.prisma file
2. deploy the new model to prisma 'npm run deploy' => this step both publishes the changes to the model and updates the src/generated/prisma.graphql file
3. add mutation/query to schema.graphql
4. add the resolver for the mutation and/or query to the applicable file (mutation.js or query.js - this is where all the custom logic will be)

# To create a new mutation and or query

1. open schema.graphql
2. add the mutation and/or query
3. write the resolvers for the added mutations/queries
    1. these are written in Query.js and Mutation.js respectively

# FAQ

## What are all of these files for?

-   datamodel.graphql is for the backend, used to specify the data models
-   prisma.graphql is generated based off datamodel.graphql (automatically generated - includes all the types, enums, queries, mutations, etc.)
-   schema.graphql is public facing API - what we will be interfacing with in our client side JS
-   resolvers/Mutation.js and Query.js is the middleware that sits between the API and the database
