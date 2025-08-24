// Main SDK exports
const { Plugin, init } = require('./main');

// Helper functions exports
const {
  // GraphQL field helpers
  StringField,
  IntField,
  BooleanField,
  FloatField,
  IDField,
  ListField,
  NonNullField,
  FieldWithArgs,
  
  // GraphQL argument helpers
  StringArg,
  IntArg,
  BooleanArg,
  FloatArg,
  IDArg,
  ObjectArg,
  ListArg,
  NonNullArg,
  
  // Type system helpers
  createScalarType,
  createNonNullType,
  createListType,
  createObjectType,
  
  // Object builder
  NewObjectType,
  
  // REST endpoint helpers
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
  getPathParam,
  getQueryParam,
  getBodyParam,
  logRESTArgs,
  
  // GraphQL Error types and constructors
  GraphQLError,
  createGraphQLError,
  createGraphQLErrorWithCode,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createInternalError,
  createBadUserInputError,
  
  // GraphQL Error helper functions for resolvers
  throwGraphQLError,
  throwValidationError,
  throwAuthenticationError,
  throwAuthorizationError,
  throwNotFoundError,
  throwInternalError,
  throwBadUserInputError,
  isGraphQLError,
  validateRequired,
  validateField,
  handleGraphQLErrors
} = require('./helpers');

module.exports = {
  // Main SDK
  Plugin,
  init,
  
  // GraphQL field helpers
  StringField,
  IntField,
  BooleanField,
  FloatField,
  IDField,
  ListField,
  NonNullField,
  FieldWithArgs,
  
  // GraphQL argument helpers
  StringArg,
  IntArg,
  BooleanArg,
  FloatArg,
  IDArg,
  ObjectArg,
  ListArg,
  NonNullArg,
  
  // Type system helpers
  createScalarType,
  createNonNullType,
  createListType,
  createObjectType,
  
  // Object builder
  NewObjectType,
  
  // REST endpoint helpers
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
  getPathParam,
  getQueryParam,
  getBodyParam,
  logRESTArgs,
  
  // GraphQL Error types and constructors
  GraphQLError,
  createGraphQLError,
  createGraphQLErrorWithCode,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createInternalError,
  createBadUserInputError,
  
  // GraphQL Error helper functions for resolvers
  throwGraphQLError,
  throwValidationError,
  throwAuthenticationError,
  throwAuthorizationError,
  throwNotFoundError,
  throwInternalError,
  throwBadUserInputError,
  isGraphQLError,
  validateRequired,
  validateField,
  handleGraphQLErrors
}; 