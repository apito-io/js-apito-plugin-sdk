# Apito JavaScript Plugin SDK

A simplified JavaScript/Node.js SDK for building HashiCorp plugins for the Apito Engine. This SDK abstracts away all the boilerplate code and provides a clean, easy-to-use interface for plugin developers.

## Installation

```bash
npm install @apito/js-plugin-sdk
# or
yarn add @apito/js-plugin-sdk
```

## Quick Start

### Basic Plugin Structure

```javascript
const { init } = require('@apito/js-plugin-sdk');
const { StringField, FieldWithArgs, StringArg, GETEndpoint, ObjectSchema, StringSchema } = require('@apito/js-plugin-sdk/helpers');

async function main() {
    // Initialize the plugin
    const plugin = init('my-awesome-plugin', '1.0.0', 'your-api-key');

    // Register GraphQL queries
    plugin.registerQuery('hello',
        FieldWithArgs('String', 'Returns a greeting', {
            name: StringArg('Name to greet')
        }),
        helloResolver
    );

    // Register GraphQL mutations
    plugin.registerMutation('createUser',
        FieldWithArgs('String', 'Creates a new user', {
            name: StringArg('User name'),
            email: StringArg('User email')
        }),
        createUserResolver
    );

    // Register REST API endpoints
    plugin.registerRESTAPI(
        GETEndpoint('/hello', 'Simple hello endpoint')
            .withResponseSchema(ObjectSchema({
                message: StringSchema('Hello message'),
                timestamp: StringSchema('Current timestamp')
            }))
            .build(),
        helloRESTHandler
    );

    // Register custom functions
    plugin.registerFunction('processData', processDataFunction);

    // Start the plugin server
    await plugin.serve();
}

// GraphQL Resolvers
async function helloResolver(context, args) {
    const name = args.name || 'World';
    return `Hello, ${name}!`;
}

async function createUserResolver(context, args) {
    const { name, email } = args;
    return `Created user: ${name} <${email}>`;
}

// REST Handlers
async function helloRESTHandler(context, args) {
    return {
        message: 'Hello from REST API!',
        timestamp: new Date().toISOString()
    };
}

// Custom Functions
async function processDataFunction(context, args) {
    return 'Data processed successfully';
}

// Start the plugin
main().catch(console.error);
```

## API Reference

### Plugin Initialization

#### `init(name, version, apiKey)`

Initializes a new plugin instance.

- `name`: Plugin name (string)
- `version`: Plugin version (string)
- `apiKey`: API key for authentication (string)

Returns a `Plugin` instance.

### GraphQL Schema Registration

#### Individual Registration

```javascript
// Register a single query
plugin.registerQuery(name, field, resolver);

// Register a single mutation
plugin.registerMutation(name, field, resolver);
```

#### Batch Registration

```javascript
// Register multiple queries at once
const queries = {
    getUser: FieldWithArgs('String', 'Get user by ID', {
        id: StringArg('User ID')
    }),
    getUsers: StringField('Get all users')
};

const resolvers = {
    getUser: getUserResolver,
    getUsers: getUsersResolver
};

plugin.registerQueries(queries, resolvers);
```

### GraphQL Field Helpers

#### Basic Fields

```javascript
const { StringField, IntField, BooleanField, FloatField, ListField, NonNullField } = require('@apito/js-plugin-sdk/helpers');

StringField('Description')                    // String
IntField('Description')                       // Int
BooleanField('Description')                   // Boolean
FloatField('Description')                     // Float
ListField('String', 'Description')            // [String]
NonNullField('String', 'Description')         // String!
NonNullListField('String', 'Description')     // [String!]!
```

#### Fields with Arguments

```javascript
const { FieldWithArgs, StringArg, IntArg, BooleanArg } = require('@apito/js-plugin-sdk/helpers');

FieldWithArgs('String', 'Get user greeting', {
    name: StringArg('User name'),
    age: IntArg('User age'),
    active: BooleanArg('Is user active')
})
```

#### Object Fields

```javascript
const { ObjectField, ObjectArg } = require('@apito/js-plugin-sdk/helpers');

ObjectField('User object', {
    id: StringArg('User ID'),
    name: StringArg('User name'),
    email: StringArg('User email')
})
```

#### Complex Object Types

```javascript
const { NewObjectType } = require('@apito/js-plugin-sdk/helpers');

// Define a complex object type
const userType = NewObjectType('User', 'A user in the system')
    .addStringField('id', 'User ID', false)        // Required field
    .addStringField('name', 'User name', false)    // Required field
    .addStringField('email', 'User email', true)   // Optional field
    .addBooleanField('active', 'Is user active', false)
    .build();

// Use in GraphQL queries
plugin.registerQuery('getUserProfile',
    FieldWithArgs('User', 'Get user profile', {
        userId: StringArg('User ID to fetch')
    }),
    getUserProfileResolver
);
```

### REST API Registration

#### Individual Registration

```javascript
const { GETEndpoint, POSTEndpoint, ObjectSchema, StringSchema } = require('@apito/js-plugin-sdk/helpers');

const endpoint = GETEndpoint('/users', 'Get all users')
    .withResponseSchema(ObjectSchema({
        users: ArraySchema(ObjectSchema({
            id: StringSchema('User ID'),
            name: StringSchema('User name')
        }))
    }))
    .build();

plugin.registerRESTAPI(endpoint, getUsersHandler);
```

#### Batch Registration

```javascript
const endpoints = [
    GETEndpoint('/health', 'Health check').build(),
    POSTEndpoint('/users', 'Create user').build()
];

const handlers = {
    'GET_/health': healthHandler,
    'POST_/users': createUserHandler
};

plugin.registerRESTAPIs(endpoints, handlers);
```

### REST Endpoint Builders

```javascript
const { GETEndpoint, POSTEndpoint, PUTEndpoint, DELETEEndpoint, PATCHEndpoint } = require('@apito/js-plugin-sdk/helpers');

GETEndpoint(path, description)
POSTEndpoint(path, description)
PUTEndpoint(path, description)
DELETEEndpoint(path, description)
PATCHEndpoint(path, description)
```

### REST Schema Helpers

```javascript
const { ObjectSchema, ArraySchema, StringSchema, IntegerSchema, BooleanSchema } = require('@apito/js-plugin-sdk/helpers');

ObjectSchema(properties)            // Object schema
ArraySchema(itemSchema)             // Array schema
StringSchema(description)           // String schema
IntegerSchema(description)          // Integer schema
BooleanSchema(description)          // Boolean schema
```

### Function Registration

#### Individual Registration

```javascript
plugin.registerFunction('processData', async (context, args) => {
    // Function logic here
    return 'result';
});
```

#### Batch Registration

```javascript
const functions = {
    processData: processDataFunction,
    validateData: validateDataFunction,
    transformData: transformDataFunction
};

plugin.registerFunctions(functions);
```

### Utility Functions

#### Argument Extraction

```javascript
const { getStringArg, getIntArg, getBoolArg, getObjectArg, getArrayArg } = require('@apito/js-plugin-sdk/helpers');

async function myResolver(context, args) {
    const name = getStringArg(args, 'name', 'Default Name');
    const age = getIntArg(args, 'age', 0);
    const active = getBoolArg(args, 'active', true);
    const user = getObjectArg(args, 'user', {});
    const tags = getArrayArg(args, 'tags', []);
    
    return { name, age, active, user, tags };
}
```

#### REST Parameter Extraction

```javascript
const { getPathParam, getQueryParam, getBodyParam, logRESTArgs } = require('@apito/js-plugin-sdk/helpers');

async function myRESTHandler(context, args) {
    // Debug log all arguments
    logRESTArgs('myHandler', args);
    
    // Extract different parameter types
    const userId = getPathParam(args, ':id');              // Path parameter
    const search = getQueryParam(args, 'search');          // Query parameter
    const userData = getBodyParam(args, 'user');           // Body parameter
    
    return { userId, search, userData };
}
```

### Function Signatures

```javascript
/**
 * @typedef {Function} ResolverFunc
 * @param {Object} context - Request context
 * @param {Object} args - Function arguments
 * @returns {Promise<any>} Resolver result
 */

/**
 * @typedef {Function} RESTHandlerFunc
 * @param {Object} context - Request context
 * @param {Object} args - Function arguments
 * @returns {Promise<any>} Handler result
 */

/**
 * @typedef {Function} FunctionHandlerFunc
 * @param {Object} context - Request context
 * @param {Object} args - Function arguments
 * @returns {Promise<any>} Function result
 */
```

## Advanced Examples

### Complex GraphQL Query with Nested Objects

```javascript
const { FieldWithArgs, ObjectArg, ListArg } = require('@apito/js-plugin-sdk/helpers');

plugin.registerQuery('processComplexData',
    FieldWithArgs('String', 'Process complex input data', {
        user: ObjectArg('Single user', {
            id: IntArg('User ID'),
            name: StringArg('User name'),
            email: StringArg('User email'),
            active: BooleanArg('Is user active')
        }),
        tags: ListArg('String', 'Array of tags'),
        users: ListArg('Object', 'Array of user objects')
    }),
    processComplexDataResolver
);

async function processComplexDataResolver(context, args) {
    const { user, tags, users } = args;
    
    // Process the complex data
    const result = {
        processedUser: user,
        tagCount: tags.length,
        userCount: users.length,
        timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(result);
}
```

### REST API with Complex Schema

```javascript
const { POSTEndpoint, ObjectSchema, ArraySchema } = require('@apito/js-plugin-sdk/helpers');

const endpoint = POSTEndpoint('/api/users', 'Create new user')
    .withRequestSchema(ObjectSchema({
        user: ObjectSchema({
            name: StringSchema('User name'),
            email: StringSchema('User email'),
            age: IntegerSchema('User age'),
            metadata: ObjectSchema({
                department: StringSchema('User department'),
                role: StringSchema('User role')
            })
        }),
        tags: ArraySchema(StringSchema('Tag name'))
    }))
    .withResponseSchema(ObjectSchema({
        success: BooleanSchema('Operation success'),
        user_id: StringSchema('Created user ID'),
        message: StringSchema('Response message')
    }))
    .build();

plugin.registerRESTAPI(endpoint, createUserWithMetadataHandler);

async function createUserWithMetadataHandler(context, args) {
    const { logRESTArgs, getBodyParam } = require('@apito/js-plugin-sdk/helpers');
    
    logRESTArgs('createUserWithMetadata', args);
    
    const user = getBodyParam(args, 'user');
    const tags = getBodyParam(args, 'tags');
    
    // Create user logic here
    const userId = `user_${Date.now()}`;
    
    return {
        success: true,
        user_id: userId,
        message: `User ${user.name} created successfully with ${tags.length} tags`
    };
}
```

### Health Checks

```javascript
// Register custom health checks
plugin.registerHealthCheck(async (context) => {
    // Check database connection
    const dbStatus = await checkDatabase();
    
    return {
        status: dbStatus.connected ? 'healthy' : 'unhealthy',
        database: {
            connected: dbStatus.connected,
            latency: dbStatus.latency
        }
    };
});

plugin.registerHealthCheck(async (context) => {
    // Check external API
    const apiStatus = await checkExternalAPI();
    
    return {
        status: apiStatus.available ? 'healthy' : 'degraded',
        external_api: {
            available: apiStatus.available,
            response_time: apiStatus.responseTime
        }
    };
});
```

## Error Handling

All resolver functions, REST handlers, and custom functions should handle errors gracefully:

```javascript
async function myResolver(context, args) {
    try {
        // Validate input
        const name = getStringArg(args, 'name');
        if (!name) {
            throw new Error('Name is required');
        }

        // Process data
        const result = await processData(name);
        return result;
    } catch (error) {
        console.error('Resolver error:', error);
        throw error; // Re-throw to be handled by the SDK
    }
}
```

## Context Usage

The context parameter provides access to the request context:

```javascript
async function myResolver(context, args) {
    // Access context information
    const pluginId = context.plugin_id;
    const projectId = context.project_id;
    
    console.log(`Processing request for plugin ${pluginId} in project ${projectId}`);
    
    // Use context for request-scoped operations
    return processWithContext(context, args);
}
```

## Building and Running

1. Create your plugin using the SDK
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run your plugin:
   ```bash
   node main.js
   ```
4. The Apito Engine will execute your plugin as a HashiCorp plugin

## Environment Variables

The SDK automatically handles environment variables passed by the engine:

- `PLUGIN_GRPC_PORT`: gRPC server port (automatically assigned)
- Custom environment variables from the engine configuration

## Debugging

Enable debug logging by setting environment variables:

```bash
NODE_ENV=development node main.js
```

The SDK provides structured logging for:
- Plugin initialization
- Schema registration
- Function execution
- Error handling

## Best Practices

1. **Use descriptive names** for GraphQL fields and REST endpoints
2. **Validate input data** in your resolvers and handlers
3. **Handle errors gracefully** and return meaningful error messages
4. **Use the utility functions** for consistent argument extraction
5. **Add proper JSDoc comments** for better IDE support
6. **Test your plugins** thoroughly before deployment
7. **Use async/await** for better error handling and readability

## TypeScript Support

While this SDK is written in JavaScript, you can use it with TypeScript:

```typescript
import { init } from '@apito/js-plugin-sdk';
import { StringField, FieldWithArgs, StringArg } from '@apito/js-plugin-sdk/helpers';

interface ResolverContext {
    plugin_id: string;
    project_id: string;
}

interface HelloArgs {
    name?: string;
}

async function helloResolver(context: ResolverContext, args: HelloArgs): Promise<string> {
    const name = args.name || 'World';
    return `Hello, ${name}!`;
}

// Rest of your plugin code...
```

## License

This SDK is part of the Apito Engine project.

## Support

For questions and support, please visit the [Apito Documentation](https://docs.apito.io) or contact our support team. 