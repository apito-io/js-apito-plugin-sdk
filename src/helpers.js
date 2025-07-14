/**
 * Apito JavaScript Plugin SDK - Helper Functions
 * 
 * This file contains helper functions for creating GraphQL fields, REST endpoints,
 * and utility functions similar to the Go SDK.
 */

// ==============================================
// GRAPHQL TYPE CREATION HELPERS
// ==============================================

/**
 * Create a scalar type definition
 * @param {string} scalarType - The scalar type (String, Int, Boolean, Float)
 * @returns {Object} Scalar type definition
 */
function createScalarType(scalarType) {
    return {
        kind: 'scalar',
        scalarType: scalarType,
        name: scalarType
    };
}

/**
 * Create a non-null type wrapper
 * @param {Object} ofType - The type to wrap
 * @returns {Object} Non-null type definition
 */
function createNonNullType(ofType) {
    return {
        kind: 'non_null',
        ofType: ofType
    };
}

/**
 * Create a list type wrapper
 * @param {Object} ofType - The type to wrap
 * @returns {Object} List type definition
 */
function createListType(ofType) {
    return {
        kind: 'list',
        ofType: ofType
    };
}

/**
 * Create an object type definition
 * @param {string} name - Object type name
 * @param {Object} fields - Object fields
 * @returns {Object} Object type definition
 */
function createObjectType(name, fields) {
    return {
        kind: 'object',
        name: name,
        fields: fields
    };
}

// ==============================================
// GRAPHQL FIELD HELPERS
// ==============================================

/**
 * Create a basic GraphQL field
 * @param {string} fieldType - Field type (String, Int, etc.)
 * @param {string} description - Field description
 * @returns {Object} GraphQL field definition
 */
function Field(fieldType, description) {
    return {
        type: createScalarType(fieldType),
        description: description,
        args: {}
    };
}

/**
 * Create a GraphQL field with arguments
 * @param {string|Object} fieldType - Field type string or existing field object
 * @param {string|Object} description - Field description or args object (if first param is field object)
 * @param {Object} [args] - Field arguments (only used if first param is string)
 * @returns {Object} GraphQL field definition
 */
function FieldWithArgs(fieldType, description, args) {
    // Handle two usage patterns:
    // 1. FieldWithArgs('String', 'description', {args})
    // 2. FieldWithArgs(StringField('description'), {args})
    
    if (typeof fieldType === 'string') {
        // Pattern 1: Traditional usage
        return {
            type: createScalarType(fieldType),
            description: description,
            args: args || {}
        };
    } else if (typeof fieldType === 'object' && fieldType.type) {
        // Pattern 2: Field object with args to add
        return {
            type: fieldType.type,
            description: fieldType.description,
            args: description || {}  // description parameter contains args in this pattern
        };
    } else {
        throw new Error('FieldWithArgs: First parameter must be a string type or field object');
    }
}

/**
 * Create a String field
 * @param {string} description - Field description
 * @returns {Object} String field definition
 */
function StringField(description) {
    return Field('String', description);
}

/**
 * Create an Int field
 * @param {string} description - Field description
 * @returns {Object} Int field definition
 */
function IntField(description) {
    return Field('Int', description);
}

/**
 * Create a Boolean field
 * @param {string} description - Field description
 * @returns {Object} Boolean field definition
 */
function BooleanField(description) {
    return Field('Boolean', description);
}

/**
 * Create a Float field
 * @param {string} description - Field description
 * @returns {Object} Float field definition
 */
function FloatField(description) {
    return Field('Float', description);
}

/**
 * Create a List field
 * @param {string|Object} itemType - Type of items in the list (string for scalars, object for custom types)
 * @param {string} description - Field description
 * @returns {Object} List field definition
 */
function ListField(itemType, description) {
    let listItemType;
    
    if (typeof itemType === 'string') {
        // Handle scalar types like 'String', 'Int', etc.
        listItemType = createScalarType(itemType);
    } else if (itemType && itemType.typeName && itemType.fields) {
        // Handle object types created by NewObjectType - use proper object structure
        listItemType = {
            kind: 'object',
            name: itemType.typeName,
            fields: itemType.fields
        };
    } else {
        // Fallback to treating as scalar
        listItemType = createScalarType(itemType);
    }
    
    return {
        type: createListType(listItemType),
        description: description,
        args: {}
    };
}

/**
 * Create a Non-null field
 * @param {string} fieldType - Field type
 * @param {string} description - Field description
 * @returns {Object} Non-null field definition
 */
function NonNullField(fieldType, description) {
    return {
        type: createNonNullType(createScalarType(fieldType)),
        description: description,
        args: {}
    };
}

/**
 * Create a Non-null list field
 * @param {string} itemType - Type of items in the list
 * @param {string} description - Field description
 * @returns {Object} Non-null list field definition
 */
function NonNullListField(itemType, description) {
    return {
        type: createNonNullType(createListType(createNonNullType(createScalarType(itemType)))),
        description: description,
        args: {}
    };
}

/**
 * Create an Object field
 * @param {string} description - Field description
 * @param {Object} objectType - Object type definition (from NewObjectType)
 * @returns {Object} Object field definition
 */
function ObjectField(description, objectType) {
    let fieldType;
    
    if (objectType && objectType.typeName && objectType.fields) {
        // Handle object types created by NewObjectType - use proper object structure
        fieldType = {
            kind: 'object',
            name: objectType.typeName,
            fields: objectType.fields
        };
    } else {
        // Fallback to creating a generic object type
        fieldType = createObjectType('Object', objectType);
    }
    
    return {
        type: fieldType,
        description: description,
        args: {}
    };
}

/**
 * Create an Object field with arguments
 * @param {string} description - Field description
 * @param {Object} fields - Object fields
 * @param {Object} args - Field arguments
 * @returns {Object} Object field definition with arguments
 */
function ObjectFieldWithArgs(description, fields, args) {
    return {
        type: createObjectType('Object', fields),
        description: description,
        args: args || {}
    };
}

// ==============================================
// GRAPHQL ARGUMENT HELPERS
// ==============================================

/**
 * Create a String argument
 * @param {string} description - Argument description
 * @returns {Object} String argument definition
 */
function StringArg(description) {
    return {
        type: createScalarType('String'),
        description: description
    };
}

/**
 * Create an Int argument
 * @param {string} description - Argument description
 * @returns {Object} Int argument definition
 */
function IntArg(description) {
    return {
        type: createScalarType('Int'),
        description: description
    };
}

/**
 * Create a Boolean argument
 * @param {string} description - Argument description
 * @returns {Object} Boolean argument definition
 */
function BooleanArg(description) {
    return {
        type: createScalarType('Boolean'),
        description: description
    };
}

/**
 * Create a Float argument
 * @param {string} description - Argument description
 * @returns {Object} Float argument definition
 */
function FloatArg(description) {
    return {
        type: createScalarType('Float'),
        description: description
    };
}

/**
 * Create a Non-null argument
 * @param {string} argType - Argument type
 * @param {string} description - Argument description
 * @returns {Object} Non-null argument definition
 */
function NonNullArg(argType, description) {
    return {
        type: createNonNullType(createScalarType(argType)),
        description: description
    };
}

/**
 * Create a List argument
 * @param {string|Object} itemType - Type of items in the list (string for scalars, object for complex types)
 * @param {string} description - Argument description
 * @returns {Object} List argument definition
 */
function ListArg(itemType, description) {
    let listItemType;
    
    if (typeof itemType === 'string') {
        // Scalar type like 'String', 'Int', etc.
        listItemType = createScalarType(itemType);
    } else if (typeof itemType === 'object' && itemType.type) {
        // Complex type from ObjectArg, StringArg, etc.
        listItemType = itemType.type;
    } else {
        throw new Error('ListArg: First parameter must be a string type or argument object');
    }
    
    return {
        type: createListType(listItemType),
        description: description
    };
}

/**
 * Create an Object argument
 * @param {string} description - Argument description
 * @param {Object} properties - Object properties
 * @returns {Object} Object argument definition
 */
function ObjectArg(description, properties) {
    return {
        type: 'Object',
        description: description,
        properties: properties
    };
}

// ==============================================
// OBJECT TYPE BUILDER
// ==============================================

/**
 * Object Type Builder class for creating complex object types
 */
class ObjectTypeBuilder {
    constructor(typeName, description) {
        this.definition = {
            typeName: typeName,
            description: description,
            fields: {}
        };
    }

    /**
     * Add a String field to the object type
     * @param {string} name - Field name
     * @param {string} description - Field description
     * @param {boolean} nullable - Whether the field is nullable
     * @returns {ObjectTypeBuilder} Builder instance for chaining
     */
    addStringField(name, description, nullable = true) {
        this.definition.fields[name] = {
            type: nullable ? createScalarType('String') : createNonNullType(createScalarType('String')),
            description: description
        };
        return this;
    }

    /**
     * Add an Int field to the object type
     * @param {string} name - Field name
     * @param {string} description - Field description
     * @param {boolean} nullable - Whether the field is nullable
     * @returns {ObjectTypeBuilder} Builder instance for chaining
     */
    addIntField(name, description, nullable = true) {
        this.definition.fields[name] = {
            type: nullable ? createScalarType('Int') : createNonNullType(createScalarType('Int')),
            description: description
        };
        return this;
    }

    /**
     * Add a Boolean field to the object type
     * @param {string} name - Field name
     * @param {string} description - Field description
     * @param {boolean} nullable - Whether the field is nullable
     * @returns {ObjectTypeBuilder} Builder instance for chaining
     */
    addBooleanField(name, description, nullable = true) {
        this.definition.fields[name] = {
            type: nullable ? createScalarType('Boolean') : createNonNullType(createScalarType('Boolean')),
            description: description
        };
        return this;
    }

    /**
     * Add a Float field to the object type
     * @param {string} name - Field name
     * @param {string} description - Field description
     * @param {boolean} nullable - Whether the field is nullable
     * @returns {ObjectTypeBuilder} Builder instance for chaining
     */
    addFloatField(name, description, nullable = true) {
        this.definition.fields[name] = {
            type: nullable ? createScalarType('Float') : createNonNullType(createScalarType('Float')),
            description: description
        };
        return this;
    }

    /**
     * Build and return the object type definition
     * @returns {Object} Complete object type definition
     */
    build() {
        return this.definition;
    }
}

/**
 * Create a new object type builder
 * @param {string} typeName - Object type name
 * @param {string} description - Object type description
 * @returns {ObjectTypeBuilder} New object type builder
 */
function NewObjectType(typeName, description) {
    return new ObjectTypeBuilder(typeName, description);
}

// ==============================================
// REST API ENDPOINT BUILDERS
// ==============================================

/**
 * REST Endpoint Builder class
 */
class RESTEndpointBuilder {
    constructor(method, path, description) {
        this.endpoint = {
            method: method.toUpperCase(),
            path: path,
            description: description,
            schema: {}
        };
    }

    /**
     * Add request schema to the endpoint
     * @param {Object} schema - Request schema
     * @returns {RESTEndpointBuilder} Builder instance for chaining
     */
    withRequestSchema(schema) {
        this.endpoint.schema.request = schema;
        return this;
    }

    /**
     * Add response schema to the endpoint
     * @param {Object} schema - Response schema
     * @returns {RESTEndpointBuilder} Builder instance for chaining
     */
    withResponseSchema(schema) {
        this.endpoint.schema.response = schema;
        return this;
    }

    /**
     * Build and return the endpoint definition
     * @returns {Object} Complete endpoint definition
     */
    build() {
        return this.endpoint;
    }
}

/**
 * Create a GET endpoint builder
 * @param {string} path - Endpoint path
 * @param {string} description - Endpoint description
 * @returns {RESTEndpointBuilder} GET endpoint builder
 */
function GETEndpoint(path, description) {
    return new RESTEndpointBuilder('GET', path, description);
}

/**
 * Create a POST endpoint builder
 * @param {string} path - Endpoint path
 * @param {string} description - Endpoint description
 * @returns {RESTEndpointBuilder} POST endpoint builder
 */
function POSTEndpoint(path, description) {
    return new RESTEndpointBuilder('POST', path, description);
}

/**
 * Create a PUT endpoint builder
 * @param {string} path - Endpoint path
 * @param {string} description - Endpoint description
 * @returns {RESTEndpointBuilder} PUT endpoint builder
 */
function PUTEndpoint(path, description) {
    return new RESTEndpointBuilder('PUT', path, description);
}

/**
 * Create a DELETE endpoint builder
 * @param {string} path - Endpoint path
 * @param {string} description - Endpoint description
 * @returns {RESTEndpointBuilder} DELETE endpoint builder
 */
function DELETEEndpoint(path, description) {
    return new RESTEndpointBuilder('DELETE', path, description);
}

/**
 * Create a PATCH endpoint builder
 * @param {string} path - Endpoint path
 * @param {string} description - Endpoint description
 * @returns {RESTEndpointBuilder} PATCH endpoint builder
 */
function PATCHEndpoint(path, description) {
    return new RESTEndpointBuilder('PATCH', path, description);
}

// ==============================================
// REST SCHEMA HELPERS
// ==============================================

/**
 * Create an object schema
 * @param {Object} properties - Schema properties
 * @returns {Object} Object schema definition
 */
function ObjectSchema(properties) {
    return {
        type: 'object',
        properties: properties
    };
}

/**
 * Create an array schema
 * @param {Object} itemSchema - Schema for array items
 * @returns {Object} Array schema definition
 */
function ArraySchema(itemSchema) {
    return {
        type: 'array',
        items: itemSchema
    };
}

/**
 * Create a string schema
 * @param {string} description - Schema description
 * @returns {Object} String schema definition
 */
function StringSchema(description) {
    return {
        type: 'string',
        description: description
    };
}

/**
 * Create an integer schema
 * @param {string} description - Schema description
 * @returns {Object} Integer schema definition
 */
function IntegerSchema(description) {
    return {
        type: 'integer',
        description: description
    };
}

/**
 * Create a boolean schema
 * @param {string} description - Schema description
 * @returns {Object} Boolean schema definition
 */
function BooleanSchema(description) {
    return {
        type: 'boolean',
        description: description
    };
}

/**
 * Create a number schema
 * @param {string} description - Schema description
 * @returns {Object} Number schema definition
 */
function NumberSchema(description) {
    return {
        type: 'number',
        description: description
    };
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Extract string argument with default value
 * @param {Object} args - Arguments object
 * @param {string} key - Argument key
 * @param {string} defaultValue - Default value if not found
 * @returns {string} Argument value or default
 */
function getStringArg(args, key, defaultValue = '') {
    const value = args[key];
    return typeof value === 'string' ? value : defaultValue;
}

/**
 * Extract integer argument with default value
 * @param {Object} args - Arguments object
 * @param {string} key - Argument key
 * @param {number} defaultValue - Default value if not found
 * @returns {number} Argument value or default
 */
function getIntArg(args, key, defaultValue = 0) {
    const value = args[key];
    if (typeof value === 'number') {
        return Math.floor(value);
    } else if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return !isNaN(parsed) ? parsed : defaultValue;
    }
    return defaultValue;
}

/**
 * Extract boolean argument with default value
 * @param {Object} args - Arguments object
 * @param {string} key - Argument key
 * @param {boolean} defaultValue - Default value if not found
 * @returns {boolean} Argument value or default
 */
function getBoolArg(args, key, defaultValue = false) {
    const value = args[key];
    return typeof value === 'boolean' ? value : defaultValue;
}

/**
 * Extract float argument with default value
 * @param {Object} args - Arguments object
 * @param {string} key - Argument key
 * @param {number} defaultValue - Default value if not found
 * @returns {number} Argument value or default
 */
function getFloatArg(args, key, defaultValue = 0.0) {
    const value = args[key];
    if (typeof value === 'number') {
        return value;
    } else if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return !isNaN(parsed) ? parsed : defaultValue;
    }
    return defaultValue;
}

/**
 * Extract object argument with default value
 * @param {Object} args - Arguments object
 * @param {string} key - Argument key
 * @param {Object} defaultValue - Default value if not found
 * @returns {Object} Argument value or default
 */
function getObjectArg(args, key, defaultValue = {}) {
    const value = args[key];
    return typeof value === 'object' && value !== null ? value : defaultValue;
}

/**
 * Extract array argument with default value
 * @param {Object} args - Arguments object
 * @param {string} key - Argument key
 * @param {Array} defaultValue - Default value if not found
 * @returns {Array} Argument value or default
 */
function getArrayArg(args, key, defaultValue = []) {
    const value = args[key];
    return Array.isArray(value) ? value : defaultValue;
}

/**
 * Log REST arguments for debugging
 * @param {string} handlerName - Handler name
 * @param {Object} args - Arguments object
 */
function logRESTArgs(handlerName, args) {
    console.error(`SDK: [${handlerName}] REST Args:`, JSON.stringify(args, null, 2));
}

/**
 * Get path parameter from REST arguments
 * @param {Object} args - Arguments object
 * @param {string} param - Parameter name (e.g., ":id")
 * @returns {string} Parameter value or empty string
 */
function getPathParam(args, param) {
    return getStringArg(args, param, '');
}

/**
 * Get query parameter from REST arguments
 * @param {Object} args - Arguments object
 * @param {string} param - Parameter name
 * @returns {string} Parameter value or empty string
 */
function getQueryParam(args, param) {
    return getStringArg(args, `query_${param}`, '');
}

/**
 * Get body parameter from REST arguments
 * @param {Object} args - Arguments object
 * @param {string} param - Parameter name
 * @returns {any} Parameter value or undefined
 */
function getBodyParam(args, param) {
    const body = getObjectArg(args, 'body', {});
    return body[param];
}

// Export all helper functions
module.exports = {
    // Type creators
    createScalarType,
    createNonNullType,
    createListType,
    createObjectType,

    // Field helpers
    Field,
    FieldWithArgs,
    StringField,
    IntField,
    BooleanField,
    FloatField,
    ListField,
    NonNullField,
    NonNullListField,
    ObjectField,
    ObjectFieldWithArgs,

    // Argument helpers
    StringArg,
    IntArg,
    BooleanArg,
    FloatArg,
    NonNullArg,
    ListArg,
    ObjectArg,

    // Object type builder
    ObjectTypeBuilder,
    NewObjectType,

    // REST endpoint builders
    RESTEndpointBuilder,
    GETEndpoint,
    POSTEndpoint,
    PUTEndpoint,
    DELETEEndpoint,
    PATCHEndpoint,

    // Schema helpers
    ObjectSchema,
    ArraySchema,
    StringSchema,
    IntegerSchema,
    BooleanSchema,
    NumberSchema,

    // Utility functions
    getStringArg,
    getIntArg,
    getBoolArg,
    getFloatArg,
    getObjectArg,
    getArrayArg,
    logRESTArgs,
    getPathParam,
    getQueryParam,
    getBodyParam
}; 