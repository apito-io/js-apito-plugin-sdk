#!/usr/bin/env node

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const fs = require('fs');

/**
 * Apito JavaScript Plugin SDK
 * 
 * A simplified SDK for building HashiCorp plugins for the Apito Engine.
 * This SDK abstracts away all the boilerplate code and provides a clean,
 * easy-to-use interface for plugin developers.
 */

// Type definitions for better documentation
/**
 * @typedef {Object} GraphQLField
 * @property {Object} type - GraphQL type definition
 * @property {string} description - Field description
 * @property {Object} [args] - Field arguments
 * @property {string} resolve - Resolver function name
 */

/**
 * @typedef {Object} RESTEndpoint
 * @property {string} method - HTTP method (GET, POST, etc.)
 * @property {string} path - Endpoint path
 * @property {string} description - Endpoint description
 * @property {Object} [schema] - Request/response schema
 * @property {string} handler - Handler function name
 */

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

/**
 * Main Plugin class that handles all plugin functionality
 */
class Plugin {
    constructor(name, version, apiKey) {
        this.name = name;
        this.version = version;
        this.apiKey = apiKey;
        
        // Registry maps
        this.queries = new Map();
        this.mutations = new Map();
        this.restAPIs = [];
        this.resolvers = new Map();
        this.restHandlers = new Map();
        this.functions = new Map();
        this.healthChecks = [];
        
        // gRPC server instance
        this.server = null;
        this.protoDefinition = null;
        
        // Auto-register health check
        this.registerFunction('health_check', this.performHealthCheck.bind(this));
    }

    /**
     * Register a GraphQL query
     * @param {string} name - Query name
     * @param {GraphQLField} field - Field definition
     * @param {ResolverFunc} resolver - Resolver function
     */
    registerQuery(name, field, resolver) {
        field.resolve = name;
        this.queries.set(name, field);
        this.resolvers.set(name, resolver);
        // Use stderr for plugin logs to avoid interfering with stdout handshake
        process.stderr.write(`SDK: Registered query '${name}'\n`);
    }

    /**
     * Register a GraphQL mutation
     * @param {string} name - Mutation name
     * @param {GraphQLField} field - Field definition
     * @param {ResolverFunc} resolver - Resolver function
     */
    registerMutation(name, field, resolver) {
        field.resolve = name;
        this.mutations.set(name, field);
        this.resolvers.set(name, resolver);
        process.stderr.write(`SDK: Registered mutation '${name}'\n`);
    }

    /**
     * Register multiple queries at once
     * @param {Object<string, GraphQLField>} queries - Queries map
     * @param {Object<string, ResolverFunc>} resolvers - Resolvers map
     */
    registerQueries(queries, resolvers) {
        for (const [name, field] of Object.entries(queries)) {
            if (resolvers[name]) {
                this.registerQuery(name, field, resolvers[name]);
            }
        }
    }

    /**
     * Register multiple mutations at once
     * @param {Object<string, GraphQLField>} mutations - Mutations map
     * @param {Object<string, ResolverFunc>} resolvers - Resolvers map
     */
    registerMutations(mutations, resolvers) {
        for (const [name, field] of Object.entries(mutations)) {
            if (resolvers[name]) {
                this.registerMutation(name, field, resolvers[name]);
            }
        }
    }

    /**
     * Register a REST API endpoint
     * @param {RESTEndpoint} endpoint - Endpoint definition
     * @param {RESTHandlerFunc} handler - Handler function
     */
    registerRESTAPI(endpoint, handler) {
        endpoint.handler = `${endpoint.method}_${endpoint.path}`;
        this.restAPIs.push(endpoint);
        this.restHandlers.set(endpoint.handler, handler);
        process.stderr.write(`SDK: Registered REST API ${endpoint.method} ${endpoint.path}\n`);
    }

    /**
     * Register multiple REST APIs at once
     * @param {RESTEndpoint[]} endpoints - Endpoints array
     * @param {Object<string, RESTHandlerFunc>} handlers - Handlers map
     */
    registerRESTAPIs(endpoints, handlers) {
        for (const endpoint of endpoints) {
            const handlerKey = `${endpoint.method}_${endpoint.path}`;
            if (handlers[handlerKey]) {
                this.registerRESTAPI(endpoint, handlers[handlerKey]);
            }
        }
    }

    /**
     * Register a custom function
     * @param {string} name - Function name
     * @param {FunctionHandlerFunc} func - Function implementation
     */
    registerFunction(name, func) {
        this.functions.set(name, func);
        process.stderr.write(`SDK: Registered function '${name}'\n`);
    }

    /**
     * Register multiple functions at once
     * @param {Object<string, FunctionHandlerFunc>} functions - Functions map
     */
    registerFunctions(functions) {
        for (const [name, func] of Object.entries(functions)) {
            this.registerFunction(name, func);
        }
    }

    /**
     * Register a health check function
     * @param {Function} healthCheck - Health check function
     */
    registerHealthCheck(healthCheck) {
        this.healthChecks.push(healthCheck);
        process.stderr.write(`SDK: Registered health check\n`);
    }

    /**
     * Built-in health check implementation
     * @param {Object} context - Request context
     * @returns {Object} Health status
     */
    async performHealthCheck(context) {
        const healthInfo = {
            status: 'healthy',
            plugin_id: this.name,
            version: this.version,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory_usage: process.memoryUsage(),
            capabilities: {
                graphql_queries: this.queries.size > 0,
                graphql_mutations: this.mutations.size > 0,
                rest_endpoints: this.restAPIs.length > 0,
                custom_functions: this.functions.size > 0,
                health_checks: this.healthChecks.length > 0
            },
            environment: {
                pid: process.pid,
                node_version: process.version,
                platform: process.platform,
                arch: process.arch
            }
        };

        // Run custom health checks
        const customHealthResults = {};
        let overallStatus = 'healthy';

        for (let i = 0; i < this.healthChecks.length; i++) {
            const checkName = `custom_check_${i}`;
            try {
                const checkResult = await this.healthChecks[i](context);
                customHealthResults[checkName] = checkResult;
                
                if (checkResult.status && checkResult.status !== 'healthy') {
                    overallStatus = 'degraded';
                }
            } catch (error) {
                customHealthResults[checkName] = {
                    status: 'error',
                    error: error.message
                };
                overallStatus = 'degraded';
            }
        }

        if (Object.keys(customHealthResults).length > 0) {
            healthInfo.custom_health_checks = customHealthResults;
        }

        healthInfo.status = overallStatus;
        return healthInfo;
    }

    /**
     * Start the plugin server
     */
    async serve() {
        // Validate magic cookie first
        if (!process.env.APITO_PLUGIN || process.env.APITO_PLUGIN !== 'apito_plugin_magic_cookie_v1') {
            process.stderr.write('SDK: ERROR - Magic cookie not set or invalid. Expected APITO_PLUGIN=apito_plugin_magic_cookie_v1\n');
            process.exit(1);
        }

        try {
            // Load protobuf definition
            await this.loadProtoDefinition();
            
            // Create gRPC server
            this.server = new grpc.Server();
            
            // Access the service from the proper package structure
            const pluginService = this.protoDefinition.apito?.plugin?.v1?.PluginService || 
                                   this.protoDefinition.PluginService;
            
            if (!pluginService) {
                throw new Error('PluginService not found in protobuf definition. Available services: ' + 
                               Object.keys(this.protoDefinition));
            }

            // Add plugin service
            this.server.addService(pluginService.service, {
                Init: this.handleInit.bind(this),
                Migration: this.handleMigration.bind(this),
                SchemaRegister: this.handleSchemaRegister.bind(this),
                RESTApiRegister: this.handleRESTApiRegister.bind(this),
                GetVersion: this.handleGetVersion.bind(this),
                Execute: this.handleExecute.bind(this)
            });

            // Start server
            await this.startServer();
        } catch (error) {
            process.stderr.write(`SDK: Failed to start plugin server: ${error}\n`);
            process.exit(1);
        }
    }

    /**
     * Load protobuf definition
     */
    async loadProtoDefinition() {
        // Look for plugin.proto in various locations
        const protoPaths = [
            path.join(__dirname, 'plugin.proto'),                                    // SDK package root
            path.join(__dirname, '..', 'plugin.proto'),                             // Parent directory
            path.join(__dirname, '..', '..', 'plugin.proto'),                       // Two levels up
            path.join(__dirname, '..', 'buffers', 'plugin.proto'),                  // Buffers sibling
            path.join(process.cwd(), 'plugin.proto'),                               // Current working directory
            '/Users/diablo/go/src/gitlab.com/apito.io/buffers/plugin.proto'         // Absolute path
        ];

        let protoPath = null;
        for (const testPath of protoPaths) {
            if (fs.existsSync(testPath)) {
                protoPath = testPath;
                break;
            }
        }

        if (!protoPath) {
            throw new Error('Could not find plugin.proto file');
        }

        process.stderr.write(`SDK: Loading proto definition from: ${protoPath}\n`);

        const packageDefinition = protoLoader.loadSync(protoPath, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true
        });

        this.protoDefinition = grpc.loadPackageDefinition(packageDefinition);
    }

    /**
     * Start the gRPC server
     */
    async startServer() {
        return new Promise((resolve, reject) => {
            const port = process.env.PLUGIN_GRPC_PORT || '0';
            const address = `127.0.0.1:${port}`;

            // Use insecure credentials for now (AutoMTLS disabled for JS plugins)
            this.server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, assignedPort) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Start the server
                this.server.start();
                
                process.stderr.write(`SDK: Plugin server listening on port ${assignedPort}\n`);
                
                // Output the handshake protocol for go-plugin to stdout (CRITICAL: no other stdout output before this)
                process.stdout.write(`1|1|tcp|127.0.0.1:${assignedPort}|grpc\n`);
                
                // Handle graceful shutdown
                this.setupGracefulShutdown();
                
                resolve(assignedPort);
            });
        });
    }

    /**
     * Setup graceful shutdown handlers
     */
    setupGracefulShutdown() {
        const shutdown = (signal) => {
            process.stderr.write(`SDK: Received ${signal}, shutting down gracefully...\n`);
            if (this.server) {
                this.server.tryShutdown((err) => {
                    if (err) {
                        process.stderr.write(`SDK: Error during shutdown: ${err}\n`);
                        process.exit(1);
                    }
                    process.stderr.write(`SDK: Shutdown complete\n`);
                    process.exit(0);
                });
            } else {
                process.exit(0);
            }
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }

    // gRPC Service Handlers
    async handleInit(call, callback) {
        process.stderr.write(`SDK: Initializing plugin '${this.name}'...\n`);
        
        try {
            const request = call.request;
            
            // Set environment variables
            if (request.envVars) {
                for (const env of request.envVars) {
                    process.env[env.key] = env.value;
                    process.stderr.write(`SDK: Set env ${env.key}=${env.value}\n`);
                }
            }

            callback(null, {
                success: true,
                message: `Plugin '${this.name}' initialized successfully`
            });
        } catch (error) {
            process.stderr.write(`SDK: Init error: ${error}\n`);
            callback(null, {
                success: false,
                message: `Initialization failed: ${error.message}`
            });
        }
    }

    async handleMigration(call, callback) {
        process.stderr.write(`SDK: Running migration for plugin '${this.name}'...\n`);
        
        try {
            callback(null, {
                success: true,
                message: `No migration needed for plugin '${this.name}'`
            });
        } catch (error) {
            process.stderr.write(`SDK: Migration error: ${error}\n`);
            callback(null, {
                success: false,
                message: `Migration failed: ${error.message}`
            });
        }
    }

    async handleSchemaRegister(call, callback) {
        process.stderr.write(`SDK: Registering GraphQL schema for plugin '${this.name}'...\n`);
        
        try {
            // Convert Maps to objects for serialization
            const queriesObj = Object.fromEntries(this.queries);
            const mutationsObj = Object.fromEntries(this.mutations);

            // Proper protobuf.Struct conversion that handles field definitions with arguments
            const convertToProtobufStruct = (data) => {
                const fields = {};
                for (const [key, value] of Object.entries(data)) {
                    fields[key] = {
                        structValue: {
                            fields: this.convertFieldToProtobuf(value)
                        }
                    };
                }
                return { fields };
            };

            const schema = {
                queries: convertToProtobufStruct(queriesObj),
                mutations: convertToProtobufStruct(mutationsObj),
                subscriptions: convertToProtobufStruct({})
            };

            // Debug logging to show schema structure
            process.stderr.write(`SDK: DEBUG - Schema structure:\n`);
            process.stderr.write(`SDK: DEBUG - Queries: ${JSON.stringify(schema.queries, null, 2)}\n`);
            process.stderr.write(`SDK: DEBUG - Mutations: ${JSON.stringify(schema.mutations, null, 2)}\n`);

            process.stderr.write(`SDK: Registered ${this.queries.size} queries, ${this.mutations.size} mutations\n`);
            callback(null, { schema });
        } catch (error) {
            process.stderr.write(`SDK: Schema registration error: ${error}\n`);
            // Fallback empty schema structure
            const emptyStruct = { fields: {} };
            callback(null, {
                schema: {
                    queries: emptyStruct,
                    mutations: emptyStruct,
                    subscriptions: emptyStruct
                }
            });
        }
    }

    // Helper method to properly convert field definitions to protobuf format
    convertFieldToProtobuf(fieldDef) {
        const fields = {};
        
        // Convert basic field properties
        if (fieldDef.type) {
            fields.type = {
                structValue: {
                    fields: this.convertTypeToProtobuf(fieldDef.type)
                }
            };
        }
        
        if (fieldDef.description) {
            fields.description = {
                stringValue: fieldDef.description
            };
        }
        
        // Convert arguments if they exist
        if (fieldDef.args && Object.keys(fieldDef.args).length > 0) {
            fields.args = {
                structValue: {
                    fields: this.convertArgsToProtobuf(fieldDef.args)
                }
            };
        }
        
        // Add resolve property
        if (fieldDef.resolve) {
            fields.resolve = {
                stringValue: fieldDef.resolve
            };
        }
        
        return fields;
    }

    // Helper method to convert argument definitions to protobuf format
    convertArgsToProtobuf(args) {
        const fields = {};
        
        for (const [argName, argDef] of Object.entries(args)) {
            fields[argName] = {
                structValue: {
                    fields: {}
                }
            };
            
            // Convert argument type
            if (argDef.type) {
                fields[argName].structValue.fields.type = {
                    structValue: {
                        fields: this.convertTypeToProtobuf(argDef.type)
                    }
                };
            }
            
            // Convert argument description
            if (argDef.description) {
                fields[argName].structValue.fields.description = {
                    stringValue: argDef.description
                };
            }
            
            // Convert argument properties if they exist (for object types)
            // Check both argDef.properties (direct) and argDef.type.fields (ObjectArg structure)
            if (argDef.properties) {
                fields[argName].structValue.fields.properties = {
                    structValue: {
                        fields: this.convertArgsToProtobuf(argDef.properties)
                    }
                };
            } else if (argDef.type && argDef.type.fields) {
                fields[argName].structValue.fields.properties = {
                    structValue: {
                        fields: this.convertArgsToProtobuf(argDef.type.fields)
                    }
                };
            }
        }
        
        return fields;
    }

    // Helper method to convert type definitions to protobuf format
    convertTypeToProtobuf(typeDef) {
        const fields = {};
        
        if (typeof typeDef === 'string') {
            // Simple scalar type
            fields.name = {
                stringValue: typeDef
            };
        } else if (typeDef && typeof typeDef === 'object') {
            // Complex type definition
            if (typeDef.name) {
                fields.name = {
                    stringValue: typeDef.name
                };
            }
            
            if (typeDef.kind) {
                fields.kind = {
                    stringValue: typeDef.kind
                };
            }
            
            // CRITICAL FIX: Add scalarType field for scalar types
            if (typeDef.scalarType) {
                fields.scalarType = {
                    stringValue: typeDef.scalarType
                };
            }
            
            if (typeDef.ofType) {
                fields.ofType = {
                    structValue: {
                        fields: this.convertTypeToProtobuf(typeDef.ofType)
                    }
                };
            }
            
            // Handle custom object types with fields
            if (typeDef.fields) {
                fields.fields = {
                    structValue: {
                        fields: {}
                    }
                };
                
                for (const [fieldName, fieldDef] of Object.entries(typeDef.fields)) {
                    fields.fields.structValue.fields[fieldName] = {
                        structValue: {
                            fields: this.convertFieldToProtobuf(fieldDef)
                        }
                    };
                }
            }
        }
        
        return fields;
    }

    async handleRESTApiRegister(call, callback) {
        process.stderr.write(`SDK: Registering REST APIs for plugin '${this.name}'...\n`);
        
        try {
            const apis = this.restAPIs.map(endpoint => ({
                method: endpoint.method,
                path: endpoint.path,
                description: endpoint.description,
                schema: endpoint.schema || {}
            }));

            process.stderr.write(`SDK: Registered ${apis.length} REST endpoints\n`);
            callback(null, { apis });
        } catch (error) {
            process.stderr.write(`SDK: REST API registration error: ${error}\n`);
            callback(null, { apis: [] });
        }
    }

    async handleGetVersion(call, callback) {
        process.stderr.write(`SDK: Getting version for plugin '${this.name}'...\n`);
        
        try {
            callback(null, { version: this.version });
        } catch (error) {
            process.stderr.write(`SDK: Get version error: ${error}\n`);
            callback(null, { version: 'unknown' });
        }
    }

    async handleExecute(call, callback) {
        process.stderr.write(`SDK: Executing function...\n`);
        
        try {
            const request = call.request;
            const functionName = request.function_name;
            const functionType = request.function_type;
            
            // Safe debug logging without JSON.stringify of complex objects
            process.stderr.write(`SDK: Function: ${functionType}:${functionName}\n`);
            process.stderr.write(`SDK: Has args: ${!!request.args}\n`);
            process.stderr.write(`SDK: Has context: ${!!request.context}\n`);
            
            const args = request.args ? this.structToObject(request.args) : {};
            const context = request.context ? this.structToObject(request.context) : {};

            process.stderr.write(`SDK: Args keys: [${Object.keys(args).join(', ')}]\n`);
            process.stderr.write(`SDK: Context keys: [${Object.keys(context).join(', ')}]\n`);

            let result;
            
            if (functionType === 'graphql_query') {
                if (this.resolvers.has(functionName)) {
                    process.stderr.write(`SDK: Calling query resolver for ${functionName}\n`);
                    result = await this.resolvers.get(functionName)(context, args);
                } else {
                    throw new Error(`Query resolver not found: ${functionName}`);
                }
            } else if (functionType === 'graphql_mutation') {
                if (this.resolvers.has(functionName)) {
                    process.stderr.write(`SDK: Calling mutation resolver for ${functionName}\n`);
                    result = await this.resolvers.get(functionName)(context, args);
                } else {
                    throw new Error(`Mutation resolver not found: ${functionName}`);
                }
            } else if (functionType === 'rest_api') {
                if (this.restHandlers.has(functionName)) {
                    process.stderr.write(`SDK: Calling REST handler for ${functionName}\n`);
                    result = await this.restHandlers.get(functionName)(context, args);
                } else {
                    throw new Error(`REST handler not found: ${functionName}`);
                }
            } else if (functionType === 'custom_function') {
                if (this.functions.has(functionName)) {
                    process.stderr.write(`SDK: Calling custom function for ${functionName}\n`);
                    result = await this.functions.get(functionName)(context, args);
                } else {
                    throw new Error(`Custom function not found: ${functionName}`);
                }
            } else if (functionType === 'system') {
                // Handle system functions like health checks
                process.stderr.write(`SDK: Handling system function: ${functionName}\n`);
                if (functionName === 'health_check') {
                    // Simple health check response
                    result = {
                        status: 'healthy',
                        plugin: this.name,
                        version: this.version,
                        timestamp: new Date().toISOString()
                    };
                } else {
                    throw new Error(`Unknown system function: ${functionName}`);
                }
            } else {
                throw new Error(`Unknown function type: ${functionType}`);
            }

            process.stderr.write(`SDK: Resolver returned: ${typeof result}\n`);

            // Convert result to protobuf format - handle arrays and objects correctly
            let protobufResult;
            if (Array.isArray(result)) {
                // For arrays, convert directly to protobuf value format
                protobufResult = this.convertValueToProtobuf(result);
            } else if (typeof result === 'object' && result !== null) {
                // For objects, use struct format
                protobufResult = this.convertToProtobufStruct(result);
            } else {
                // For primitives, convert to value format
                protobufResult = this.convertValueToProtobuf(result);
            }
            process.stderr.write(`SDK: Converted to protobuf format\n`);

            // Determine correct typeUrl based on result type
            const typeUrl = Array.isArray(result) || typeof result !== 'object' || result === null
                ? 'type.googleapis.com/google.protobuf.Value'
                : 'type.googleapis.com/google.protobuf.Struct';

            callback(null, {
                success: true,
                result: {
                    typeUrl: typeUrl,
                    value: Buffer.from(JSON.stringify(protobufResult))
                },
                error: ''
            });

        } catch (error) {
            process.stderr.write(`SDK: Error executing function: ${error.message}\n`);
            process.stderr.write(`SDK: Error stack: ${error.stack}\n`);
            
            callback(null, {
                success: false,
                result: null,
                error: error.message
            });
        }
    }

    // Utility methods
    structToObject(struct) {
        if (!struct) {
            process.stderr.write(`SDK: structToObject received null/undefined\n`);
            return {};
        }
        
        if (!struct.fields) {
            process.stderr.write(`SDK: structToObject received struct without fields\n`);
            return {};
        }

        process.stderr.write(`SDK: Converting struct with ${Object.keys(struct.fields).length} fields: [${Object.keys(struct.fields).join(', ')}]\n`);

        const result = {};
        for (const [key, value] of Object.entries(struct.fields)) {
            process.stderr.write(`SDK: Converting field '${key}'\n`);
            result[key] = this.valueToJS(value);
            process.stderr.write(`SDK: Field '${key}' -> ${typeof result[key]}\n`);
        }
        
        process.stderr.write(`SDK: Converted object keys: [${Object.keys(result).join(', ')}]\n`);
        return result;
    }

    valueToJS(value) {
        if (!value) {
            return null;
        }
        
        if (value.stringValue !== undefined) {
            process.stderr.write(`SDK: String: "${value.stringValue}"\n`);
            return value.stringValue;
        } else if (value.numberValue !== undefined) {
            process.stderr.write(`SDK: Number: ${value.numberValue}\n`);
            return value.numberValue;
        } else if (value.boolValue !== undefined) {
            process.stderr.write(`SDK: Boolean: ${value.boolValue}\n`);
            return value.boolValue;
        } else if (value.structValue !== undefined) {
            process.stderr.write(`SDK: Object (recursing)\n`);
            return this.structToObject(value.structValue);
        } else if (value.listValue !== undefined && value.listValue.values) {
            process.stderr.write(`SDK: Array[${value.listValue.values.length}]\n`);
            return value.listValue.values.map(v => this.valueToJS(v));
        } else if (value.nullValue !== undefined) {
            process.stderr.write(`SDK: Null\n`);
            return null;
        } else {
            process.stderr.write(`SDK: Unknown type: [${Object.keys(value).join(', ')}]\n`);
            return null;
        }
    }

    convertToProtobufStruct(data) {
        const fields = {};
        for (const [key, value] of Object.entries(data)) {
            fields[key] = this.convertValueToProtobuf(value);
        }
        return { fields };
    }

    convertValueToProtobuf(value) {
        if (value === null || value === undefined) {
            return { nullValue: 0 };
        } else if (typeof value === 'string') {
            return { stringValue: value };
        } else if (typeof value === 'number') {
            return { numberValue: value };
        } else if (typeof value === 'boolean') {
            return { boolValue: value };
        } else if (Array.isArray(value)) {
            return {
                listValue: {
                    values: value.map(item => this.convertValueToProtobuf(item))
                }
            };
        } else if (typeof value === 'object') {
            const fields = {};
            for (const [prop, propValue] of Object.entries(value)) {
                fields[prop] = this.convertValueToProtobuf(propValue);
            }
            return { structValue: { fields } };
        } else {
            // Fallback to string representation
            return { stringValue: String(value) };
        }
    }
}

// Import all helper functions
const helpers = require('./helpers');

// Export the Plugin class, init function, and all helpers
module.exports = {
    Plugin,
    init: function(name, version, apiKey) {
        // Use stderr for initialization logs
        process.stderr.write(`SDK: Initializing plugin '${name}' v${version}\n`);
        return new Plugin(name, version, apiKey);
    },
    // Re-export all helper functions
    ...helpers
};
