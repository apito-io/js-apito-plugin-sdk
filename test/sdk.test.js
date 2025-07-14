/**
 * Apito JavaScript Plugin SDK - Test Suite
 * 
 * Comprehensive tests for the JavaScript SDK functionality.
 */

const { init } = require('../src/main');
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
    ArraySchema,
    getStringArg,
    getIntArg,
    getBoolArg,
    getObjectArg,
    getArrayArg,
    createScalarType,
    createNonNullType,
    createListType,
    NewObjectType
} = require('../src/helpers');

describe('Apito JavaScript Plugin SDK', () => {
    let plugin;

    beforeEach(() => {
        plugin = init('test-plugin', '1.0.0', 'test-api-key');
    });

    afterEach(() => {
        // Clean up any resources if needed
        if (plugin && plugin.server) {
            try {
                plugin.server.forceShutdown();
            } catch (error) {
                // Ignore shutdown errors in tests
            }
        }
    });

    describe('Plugin Initialization', () => {
        test('should initialize plugin with correct properties', () => {
            expect(plugin.name).toBe('test-plugin');
            expect(plugin.version).toBe('1.0.0');
            expect(plugin.apiKey).toBe('test-api-key');
            expect(plugin.queries).toBeInstanceOf(Map);
            expect(plugin.mutations).toBeInstanceOf(Map);
            expect(plugin.restAPIs).toBeInstanceOf(Array);
            expect(plugin.resolvers).toBeInstanceOf(Map);
            expect(plugin.restHandlers).toBeInstanceOf(Map);
            expect(plugin.functions).toBeInstanceOf(Map);
        });

        test('should auto-register health check function', () => {
            expect(plugin.functions.has('health_check')).toBe(true);
        });
    });

    describe('GraphQL Schema Registration', () => {
        test('should register a simple query', () => {
            const resolver = jest.fn();
            const field = StringField('Test field');

            plugin.registerQuery('testQuery', field, resolver);

            expect(plugin.queries.has('testQuery')).toBe(true);
            expect(plugin.resolvers.has('testQuery')).toBe(true);
            expect(plugin.queries.get('testQuery')).toEqual({
                ...field,
                resolve: 'testQuery'
            });
        });

        test('should register a query with arguments', () => {
            const resolver = jest.fn();
            const field = FieldWithArgs('String', 'Test field with args', {
                name: StringArg('Name argument'),
                age: IntArg('Age argument')
            });

            plugin.registerQuery('testQueryWithArgs', field, resolver);

            expect(plugin.queries.has('testQueryWithArgs')).toBe(true);
            const registeredField = plugin.queries.get('testQueryWithArgs');
            expect(registeredField.args).toHaveProperty('name');
            expect(registeredField.args).toHaveProperty('age');
        });

        test('should register multiple queries at once', () => {
            const queries = {
                query1: StringField('Query 1'),
                query2: StringField('Query 2')
            };
            const resolvers = {
                query1: jest.fn(),
                query2: jest.fn()
            };

            plugin.registerQueries(queries, resolvers);

            expect(plugin.queries.has('query1')).toBe(true);
            expect(plugin.queries.has('query2')).toBe(true);
            expect(plugin.resolvers.has('query1')).toBe(true);
            expect(plugin.resolvers.has('query2')).toBe(true);
        });

        test('should register mutations', () => {
            const resolver = jest.fn();
            const field = FieldWithArgs('String', 'Create user', {
                name: StringArg('User name')
            });

            plugin.registerMutation('createUser', field, resolver);

            expect(plugin.mutations.has('createUser')).toBe(true);
            expect(plugin.resolvers.has('createUser')).toBe(true);
        });
    });

    describe('REST API Registration', () => {
        test('should register a GET endpoint', () => {
            const handler = jest.fn();
            const endpoint = GETEndpoint('/test', 'Test endpoint').build();

            plugin.registerRESTAPI(endpoint, handler);

            expect(plugin.restAPIs).toHaveLength(1);
            expect(plugin.restAPIs[0]).toEqual({
                ...endpoint,
                handler: 'GET_/test'
            });
            expect(plugin.restHandlers.has('GET_/test')).toBe(true);
        });

        test('should register a POST endpoint with schema', () => {
            const handler = jest.fn();
            const endpoint = POSTEndpoint('/users', 'Create user')
                .withRequestSchema(ObjectSchema({
                    name: StringSchema('User name')
                }))
                .withResponseSchema(ObjectSchema({
                    id: StringSchema('User ID')
                }))
                .build();

            plugin.registerRESTAPI(endpoint, handler);

            expect(plugin.restAPIs).toHaveLength(1);
            expect(plugin.restAPIs[0].schema).toHaveProperty('request');
            expect(plugin.restAPIs[0].schema).toHaveProperty('response');
        });

        test('should register multiple REST APIs at once', () => {
            const endpoints = [
                GETEndpoint('/test1', 'Test 1').build(),
                POSTEndpoint('/test2', 'Test 2').build()
            ];
            const handlers = {
                'GET_/test1': jest.fn(),
                'POST_/test2': jest.fn()
            };

            plugin.registerRESTAPIs(endpoints, handlers);

            expect(plugin.restAPIs).toHaveLength(2);
            expect(plugin.restHandlers.has('GET_/test1')).toBe(true);
            expect(plugin.restHandlers.has('POST_/test2')).toBe(true);
        });
    });

    describe('Function Registration', () => {
        test('should register a custom function', () => {
            const func = jest.fn();

            plugin.registerFunction('testFunction', func);

            expect(plugin.functions.has('testFunction')).toBe(true);
            expect(plugin.functions.get('testFunction')).toBe(func);
        });

        test('should register multiple functions at once', () => {
            const functions = {
                func1: jest.fn(),
                func2: jest.fn()
            };

            plugin.registerFunctions(functions);

            expect(plugin.functions.has('func1')).toBe(true);
            expect(plugin.functions.has('func2')).toBe(true);
        });

        test('should register health check', () => {
            const healthCheck = jest.fn();

            plugin.registerHealthCheck(healthCheck);

            expect(plugin.healthChecks).toContain(healthCheck);
        });
    });

    describe('Built-in Health Check', () => {
        test('should return health status', async () => {
            const context = { plugin_id: 'test', project_id: 'test-project' };
            const health = await plugin.performHealthCheck(context);

            expect(health).toHaveProperty('status');
            expect(health).toHaveProperty('plugin_id', 'test-plugin');
            expect(health).toHaveProperty('version', '1.0.0');
            expect(health).toHaveProperty('timestamp');
            expect(health).toHaveProperty('uptime');
            expect(health).toHaveProperty('capabilities');
            expect(health).toHaveProperty('environment');
        });

        test('should run custom health checks', async () => {
            const customHealthCheck = jest.fn().mockResolvedValue({
                status: 'healthy',
                custom: true
            });

            plugin.registerHealthCheck(customHealthCheck);

            const context = { plugin_id: 'test' };
            const health = await plugin.performHealthCheck(context);

            expect(customHealthCheck).toHaveBeenCalledWith(context);
            expect(health).toHaveProperty('custom_health_checks');
            expect(health.status).toBe('healthy');
        });

        test('should handle failed health checks', async () => {
            const failingHealthCheck = jest.fn().mockRejectedValue(new Error('Health check failed'));

            plugin.registerHealthCheck(failingHealthCheck);

            const context = { plugin_id: 'test' };
            const health = await plugin.performHealthCheck(context);

            expect(health.status).toBe('degraded');
            expect(health.custom_health_checks.custom_check_0).toHaveProperty('status', 'error');
        });
    });

    describe('Utility Functions', () => {
        test('should extract struct data correctly', () => {
            const struct = {
                fields: {
                    name: { stringValue: 'John' },
                    age: { numberValue: 30 },
                    active: { boolValue: true },
                    tags: {
                        listValue: {
                            values: [
                                { stringValue: 'tag1' },
                                { stringValue: 'tag2' }
                            ]
                        }
                    },
                    metadata: {
                        structValue: {
                            fields: {
                                department: { stringValue: 'Engineering' }
                            }
                        }
                    }
                }
            };

            const result = plugin.structToObject(struct);

            expect(result).toEqual({
                name: 'John',
                age: 30,
                active: true,
                tags: ['tag1', 'tag2'],
                metadata: {
                    department: 'Engineering'
                }
            });
        });

        test('should handle empty struct', () => {
            const result = plugin.structToObject(null);
            expect(result).toEqual({});

            const result2 = plugin.structToObject({});
            expect(result2).toEqual({});
        });
    });
});

describe('Helper Functions', () => {
    describe('Type Creators', () => {
        test('should create scalar types', () => {
            const stringType = createScalarType('String');
            expect(stringType).toEqual({
                kind: 'scalar',
                scalarType: 'String',
                name: 'String'
            });
        });

        test('should create non-null types', () => {
            const stringType = createScalarType('String');
            const nonNullType = createNonNullType(stringType);
            expect(nonNullType).toEqual({
                kind: 'non_null',
                ofType: stringType
            });
        });

        test('should create list types', () => {
            const stringType = createScalarType('String');
            const listType = createListType(stringType);
            expect(listType).toEqual({
                kind: 'list',
                ofType: stringType
            });
        });
    });

    describe('Field Helpers', () => {
        test('should create basic fields', () => {
            const field = StringField('Test string field');
            expect(field).toHaveProperty('type');
            expect(field).toHaveProperty('description', 'Test string field');
            expect(field).toHaveProperty('args', {});
            expect(field.type.kind).toBe('scalar');
            expect(field.type.scalarType).toBe('String');
        });

        test('should create fields with arguments', () => {
            const field = FieldWithArgs('String', 'Test field', {
                name: StringArg('Name argument')
            });
            expect(field).toHaveProperty('args');
            expect(field.args).toHaveProperty('name');
            expect(field.args.name.type.scalarType).toBe('String');
        });
    });

    describe('Object Type Builder', () => {
        test('should build object type with fields', () => {
            const userType = NewObjectType('User', 'A user object')
                .addStringField('id', 'User ID', false)
                .addStringField('name', 'User name', true)
                .addIntField('age', 'User age', true)
                .addBooleanField('active', 'Is active', false)
                .build();

            expect(userType.typeName).toBe('User');
            expect(userType.description).toBe('A user object');
            expect(userType.fields).toHaveProperty('id');
            expect(userType.fields).toHaveProperty('name');
            expect(userType.fields).toHaveProperty('age');
            expect(userType.fields).toHaveProperty('active');

            // Required field should be non-null
            expect(userType.fields.id.type.kind).toBe('non_null');
            // Optional field should be scalar
            expect(userType.fields.name.type.kind).toBe('scalar');
        });
    });

    describe('Argument Extraction', () => {
        const testArgs = {
            name: 'John',
            age: 30,
            active: true,
            score: 95.5,
            user: { id: 1, name: 'John' },
            tags: ['tag1', 'tag2']
        };

        test('should extract string arguments', () => {
            expect(getStringArg(testArgs, 'name')).toBe('John');
            expect(getStringArg(testArgs, 'missing', 'default')).toBe('default');
        });

        test('should extract integer arguments', () => {
            expect(getIntArg(testArgs, 'age')).toBe(30);
            expect(getIntArg(testArgs, 'missing', 25)).toBe(25);
        });

        test('should extract boolean arguments', () => {
            expect(getBoolArg(testArgs, 'active')).toBe(true);
            expect(getBoolArg(testArgs, 'missing', false)).toBe(false);
        });

        test('should extract object arguments', () => {
            expect(getObjectArg(testArgs, 'user')).toEqual({ id: 1, name: 'John' });
            expect(getObjectArg(testArgs, 'missing', {})).toEqual({});
        });

        test('should extract array arguments', () => {
            expect(getArrayArg(testArgs, 'tags')).toEqual(['tag1', 'tag2']);
            expect(getArrayArg(testArgs, 'missing', [])).toEqual([]);
        });
    });

    describe('REST Endpoint Builders', () => {
        test('should build GET endpoint', () => {
            const endpoint = GETEndpoint('/test', 'Test endpoint').build();
            expect(endpoint).toEqual({
                method: 'GET',
                path: '/test',
                description: 'Test endpoint',
                schema: {}
            });
        });

        test('should build POST endpoint with schemas', () => {
            const endpoint = POSTEndpoint('/users', 'Create user')
                .withRequestSchema({ type: 'object' })
                .withResponseSchema({ type: 'object' })
                .build();

            expect(endpoint.method).toBe('POST');
            expect(endpoint.schema.request).toEqual({ type: 'object' });
            expect(endpoint.schema.response).toEqual({ type: 'object' });
        });
    });

    describe('Schema Helpers', () => {
        test('should create object schema', () => {
            const schema = ObjectSchema({
                name: StringSchema('User name'),
                age: { type: 'integer' }
            });

            expect(schema).toEqual({
                type: 'object',
                properties: {
                    name: StringSchema('User name'),
                    age: { type: 'integer' }
                }
            });
        });

        test('should create array schema', () => {
            const schema = ArraySchema(StringSchema('Item'));
            expect(schema).toEqual({
                type: 'array',
                items: StringSchema('Item')
            });
        });
    });
});

describe('Error Handling', () => {
    test('should handle resolver errors gracefully', async () => {
        const plugin = init('test-plugin', '1.0.0', 'test-key');
        const errorResolver = jest.fn().mockRejectedValue(new Error('Resolver error'));

        plugin.registerQuery('errorQuery', StringField('Error query'), errorResolver);

        // Mock the handleGraphQLExecution method to test error handling
        const context = { plugin_id: 'test' };
        const args = {};

        await expect(plugin.handleGraphQLExecution('errorQuery', args, context))
            .rejects.toThrow('Resolver error');
    });

    test('should handle unknown resolver', async () => {
        const plugin = init('test-plugin', '1.0.0', 'test-key');
        const context = { plugin_id: 'test' };
        const args = {};

        await expect(plugin.handleGraphQLExecution('unknownQuery', args, context))
            .rejects.toThrow('Unknown GraphQL resolver: unknownQuery');
    });

    test('should handle unknown function', async () => {
        const plugin = init('test-plugin', '1.0.0', 'test-key');
        const context = { plugin_id: 'test' };
        const args = {};

        await expect(plugin.handleFunctionExecution('unknownFunction', args, context))
            .rejects.toThrow('Unknown function: unknownFunction');
    });
});

// Mock console.error to reduce noise in tests
beforeAll(() => {
    global.console.error = jest.fn();
});

afterAll(() => {
    global.console.error.mockRestore();
}); 