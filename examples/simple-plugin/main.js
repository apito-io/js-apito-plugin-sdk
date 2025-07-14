#!/usr/bin/env node

const { init } = require('../../main');
const { 
    StringField, 
    FieldWithArgs, 
    StringArg, 
    IntArg, 
    BooleanArg,
    ObjectArg,
    ListArg,
    GETEndpoint, 
    POSTEndpoint,
    ObjectSchema, 
    StringSchema,
    IntegerSchema,
    BooleanSchema,
    ArraySchema,
    getStringArg,
    getIntArg,
    getBoolArg,
    getObjectArg,
    getArrayArg,
    getPathParam,
    getQueryParam,
    getBodyParam,
    logRESTArgs
} = require('../../helpers');

/**
 * Simple Plugin Example
 * 
 * This example demonstrates the basic usage of the Apito JavaScript Plugin SDK.
 * It includes GraphQL queries, mutations, REST APIs, and custom functions.
 */

async function main() {
    console.error('🚀 Starting Simple Plugin Example...');
    
    // Initialize the plugin
    const plugin = init('js-simple-plugin', '1.0.0', 'example-api-key');

    // ==============================================
    // GRAPHQL QUERIES
    // ==============================================

    // Simple query without arguments
    plugin.registerQuery('hello',
        StringField('Returns a simple hello message'),
        helloResolver
    );

    // Query with arguments
    plugin.registerQuery('greet',
        FieldWithArgs('String', 'Returns a personalized greeting', {
            name: StringArg('Name to greet'),
            age: IntArg('Person age (optional)'),
            formal: BooleanArg('Use formal greeting')
        }),
        greetResolver
    );

    // Query with complex object arguments
    plugin.registerQuery('processUser',
        FieldWithArgs('String', 'Process user data and return summary', {
            user: ObjectArg('User data to process', {
                id: IntArg('User ID'),
                name: StringArg('User name'),
                email: StringArg('User email'),
                active: BooleanArg('Is user active')
            }),
            tags: ListArg('String', 'User tags'),
            metadata: ObjectArg('Additional metadata', {
                department: StringArg('User department'),
                role: StringArg('User role')
            })
        }),
        processUserResolver
    );

    // ==============================================
    // GRAPHQL MUTATIONS
    // ==============================================

    plugin.registerMutation('createUser',
        FieldWithArgs('String', 'Create a new user', {
            name: StringArg('User name'),
            email: StringArg('User email'),
            age: IntArg('User age')
        }),
        createUserResolver
    );

    plugin.registerMutation('updateUser',
        FieldWithArgs('String', 'Update an existing user', {
            id: IntArg('User ID'),
            data: ObjectArg('User data to update', {
                name: StringArg('Updated name'),
                email: StringArg('Updated email'),
                active: BooleanArg('Updated active status')
            })
        }),
        updateUserResolver
    );

    // ==============================================
    // REST API ENDPOINTS
    // ==============================================

    // Simple GET endpoint
    plugin.registerRESTAPI(
        GETEndpoint('/hello', 'Simple hello endpoint')
            .withResponseSchema(ObjectSchema({
                message: StringSchema('Hello message'),
                timestamp: StringSchema('Current timestamp'),
                plugin: StringSchema('Plugin name')
            }))
            .build(),
        helloRESTHandler
    );

    // GET endpoint with path and query parameters
    plugin.registerRESTAPI(
        GETEndpoint('/users/:id', 'Get user by ID')
            .withResponseSchema(ObjectSchema({
                user: ObjectSchema({
                    id: StringSchema('User ID'),
                    name: StringSchema('User name'),
                    email: StringSchema('User email'),
                    active: BooleanSchema('User active status')
                }),
                metadata: ObjectSchema({
                    last_accessed: StringSchema('Last access time'),
                    access_count: IntegerSchema('Number of accesses')
                })
            }))
            .build(),
        getUserRESTHandler
    );

    // POST endpoint with body data
    plugin.registerRESTAPI(
        POSTEndpoint('/users', 'Create a new user')
            .withRequestSchema(ObjectSchema({
                user: ObjectSchema({
                    name: StringSchema('User name'),
                    email: StringSchema('User email'),
                    age: IntegerSchema('User age')
                }),
                preferences: ObjectSchema({
                    theme: StringSchema('UI theme preference'),
                    notifications: BooleanSchema('Enable notifications')
                }),
                tags: ArraySchema(StringSchema('User tag'))
            }))
            .withResponseSchema(ObjectSchema({
                success: BooleanSchema('Operation success'),
                user_id: StringSchema('Created user ID'),
                message: StringSchema('Response message')
            }))
            .build(),
        createUserRESTHandler
    );

    // ==============================================
    // CUSTOM FUNCTIONS
    // ==============================================

    plugin.registerFunction('validateEmail', validateEmailFunction);
    plugin.registerFunction('generateToken', generateTokenFunction);
    plugin.registerFunction('processData', processDataFunction);

    // ==============================================
    // HEALTH CHECKS
    // ==============================================

    plugin.registerHealthCheck(async (context) => {
        // Simulate checking external service
        const isServiceHealthy = Math.random() > 0.1; // 90% chance of being healthy
        
        return {
            status: isServiceHealthy ? 'healthy' : 'degraded',
            external_service: {
                available: isServiceHealthy,
                response_time: Math.floor(Math.random() * 100) + 50 // 50-150ms
            }
        };
    });

    // Start the plugin server
    console.error('🔌 Starting plugin server...');
    await plugin.serve();
}

// ==============================================
// GRAPHQL RESOLVERS
// ==============================================

async function helloResolver(context, args) {
    console.error('📝 Executing hello resolver');
    return 'Hello from JavaScript Plugin SDK!';
}

async function greetResolver(context, args) {
    console.error('📝 Executing greet resolver');
    
    const name = getStringArg(args, 'name', 'World');
    const age = getIntArg(args, 'age', 0);
    const formal = getBoolArg(args, 'formal', false);
    
    let greeting = formal ? 'Good day' : 'Hello';
    let message = `${greeting}, ${name}!`;
    
    if (age > 0) {
        message += ` You are ${age} years old.`;
    }
    
    return message;
}

async function processUserResolver(context, args) {
    console.error('📝 Executing processUser resolver');
    
    const user = getObjectArg(args, 'user', {});
    const tags = getArrayArg(args, 'tags', []);
    const metadata = getObjectArg(args, 'metadata', {});
    
    const summary = {
        user_id: user.id || 'unknown',
        user_name: user.name || 'unnamed',
        user_email: user.email || 'no-email',
        is_active: user.active || false,
        tag_count: tags.length,
        tags: tags.join(', '),
        department: metadata.department || 'unassigned',
        role: metadata.role || 'user',
        processed_at: new Date().toISOString()
    };
    
    return JSON.stringify(summary, null, 2);
}

async function createUserResolver(context, args) {
    console.error('📝 Executing createUser resolver');
    
    const name = getStringArg(args, 'name', '');
    const email = getStringArg(args, 'email', '');
    const age = getIntArg(args, 'age', 0);
    
    if (!name || !email) {
        throw new Error('Name and email are required');
    }
    
    const userId = `user_${Date.now()}`;
    
    return `Successfully created user: ${name} <${email}> (age: ${age}, id: ${userId})`;
}

async function updateUserResolver(context, args) {
    console.error('📝 Executing updateUser resolver');
    
    const id = getIntArg(args, 'id', 0);
    const data = getObjectArg(args, 'data', {});
    
    if (!id) {
        throw new Error('User ID is required');
    }
    
    const updates = [];
    if (data.name) updates.push(`name: ${data.name}`);
    if (data.email) updates.push(`email: ${data.email}`);
    if (typeof data.active === 'boolean') updates.push(`active: ${data.active}`);
    
    return `Updated user ${id} with: ${updates.join(', ')}`;
}

// ==============================================
// REST HANDLERS
// ==============================================

async function helloRESTHandler(context, args) {
    console.error('🌐 Executing hello REST handler');
    logRESTArgs('helloRESTHandler', args);
    
    return {
        message: 'Hello from REST API!',
        timestamp: new Date().toISOString(),
        plugin: 'js-simple-plugin'
    };
}

async function getUserRESTHandler(context, args) {
    console.error('🌐 Executing getUser REST handler');
    logRESTArgs('getUserRESTHandler', args);
    
    const userId = getPathParam(args, ':id');
    const includeMetadata = getQueryParam(args, 'metadata') === 'true';
    
    const user = {
        id: userId,
        name: `User ${userId}`,
        email: `user${userId}@example.com`,
        active: true
    };
    
    const response = { user };
    
    if (includeMetadata) {
        response.metadata = {
            last_accessed: new Date().toISOString(),
            access_count: Math.floor(Math.random() * 100) + 1
        };
    }
    
    return response;
}

async function createUserRESTHandler(context, args) {
    console.error('🌐 Executing createUser REST handler');
    logRESTArgs('createUserRESTHandler', args);
    
    const user = getBodyParam(args, 'user');
    const preferences = getBodyParam(args, 'preferences');
    const tags = getBodyParam(args, 'tags');
    
    if (!user || !user.name || !user.email) {
        throw new Error('User name and email are required');
    }
    
    const userId = `user_${Date.now()}`;
    
    return {
        success: true,
        user_id: userId,
        message: `User ${user.name} created with ${tags ? tags.length : 0} tags and preferences`
    };
}

// ==============================================
// CUSTOM FUNCTIONS
// ==============================================

async function validateEmailFunction(context, args) {
    console.error('⚙️ Executing validateEmail function');
    
    const email = getStringArg(args, 'email', '');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return {
        email: email,
        is_valid: emailRegex.test(email),
        timestamp: new Date().toISOString()
    };
}

async function generateTokenFunction(context, args) {
    console.error('⚙️ Executing generateToken function');
    
    const userId = getStringArg(args, 'user_id', '');
    const expiresIn = getIntArg(args, 'expires_in', 3600); // Default 1 hour
    
    const token = Buffer.from(`${userId}:${Date.now()}:${Math.random()}`).toString('base64');
    
    return {
        token: token,
        expires_in: expiresIn,
        issued_at: new Date().toISOString(),
        user_id: userId
    };
}

async function processDataFunction(context, args) {
    console.error('⚙️ Executing processData function');
    
    const data = getObjectArg(args, 'data', {});
    const operation = getStringArg(args, 'operation', 'transform');
    
    let result;
    
    switch (operation) {
        case 'count':
            result = Object.keys(data).length;
            break;
        case 'transform':
            result = Object.fromEntries(
                Object.entries(data).map(([key, value]) => [
                    key.toUpperCase(), 
                    typeof value === 'string' ? value.toUpperCase() : value
                ])
            );
            break;
        case 'validate':
            result = {
                has_data: Object.keys(data).length > 0,
                field_count: Object.keys(data).length,
                fields: Object.keys(data)
            };
            break;
        default:
            result = { error: `Unknown operation: ${operation}` };
    }
    
    return {
        operation: operation,
        input_data: data,
        result: result,
        processed_at: new Date().toISOString()
    };
}

// ==============================================
// ERROR HANDLING
// ==============================================

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the plugin
main().catch((error) => {
    console.error('💥 Failed to start plugin:', error);
    process.exit(1);
}); 