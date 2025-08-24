# Changelog

All notable changes to the Apito JavaScript Plugin SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.4] - 2025-01-03

### Added

- **GraphQL Error Support** - Added comprehensive GraphQL error handling for proper error responses
- **Error Types and Constructors** - Added GraphQLError class and error creation functions
- **Structured Error Extensions** - Support for error codes, fields, and custom extension data
- **Helper Functions** - Added convenience functions for throwing GraphQL errors from resolvers

### New Error Functions

**Error Constructors:**
- `createGraphQLError()` - Create GraphQL error with extensions
- `createValidationError()` - VALIDATION_ERROR with field support
- `createAuthenticationError()` - UNAUTHENTICATED error
- `createAuthorizationError()` - FORBIDDEN error
- `createNotFoundError()` - NOT_FOUND error
- `createInternalError()` - INTERNAL_ERROR for server errors
- `createBadUserInputError()` - BAD_USER_INPUT with field support

**Resolver Helper Functions:**
- `throwValidationError()` - Throw validation error from resolver
- `throwAuthenticationError()` - Throw auth error from resolver
- `throwAuthorizationError()` - Throw authorization error from resolver
- `throwNotFoundError()` - Throw not found error from resolver
- `throwInternalError()` - Throw internal error from resolver
- `throwBadUserInputError()` - Throw bad input error from resolver

**Utility Functions:**
- `isGraphQLError()` - Check if error is GraphQL error
- `validateRequired()` - Validate required fields with auto-error
- `validateField()` - Custom field validation with auto-error
- `handleGraphQLErrors()` - Convert promise errors to GraphQL errors

### Enhanced Error Handling

- **GraphQL Operations** - Errors in GraphQL queries/mutations now return proper GraphQL error structure
- **Protobuf Compatibility** - GraphQL errors are serialized as JSON strings for transport
- **Engine Integration** - Engine detects `is_graphql_error` flag and formats errors properly
- **Backward Compatibility** - Non-GraphQL operations continue to use existing error handling

### Usage Examples

```javascript
// Throw validation error from resolver
if (!tenantId) {
    throwValidationError('Tenant ID is required', 'tenant_id');
}

// Throw authorization error
if (!hasPermission) {
    throwAuthorizationError('You cannot change other employees passwords');
}

// Create custom GraphQL error
throw createGraphQLErrorWithCode('Custom error', 'CUSTOM_CODE', { userId: 123 });
```

### Breaking Changes

None - This is a fully backward-compatible addition. Existing error handling continues to work unchanged.

## [0.2.3] - 2025-01-15

### Fixed

- 🐛 **Critical Type System Bug** - Fixed missing `scalarType` field in protobuf serialization
- ✅ **GraphQL Schema Registration** - Boolean, Int, Float, and other scalar types now properly register instead of defaulting to String
- 🔧 **Argument Type Handling** - Query/mutation arguments now maintain correct types (Int arguments show as Int, not String)
- 📋 **Schema Introspection** - GraphQL introspection now shows correct field types (e.g., `active: Boolean!` instead of `active: String!`)
- 📖 **Documentation** - Fixed incorrect package name in README.md installation instructions

### Technical Details

- Added `scalarType` field to `convertTypeToProtobuf` method in main.js
- This ensures the Go engine receives complete type information for proper GraphQL schema generation
- Resolves issue where all plugin-defined types appeared as String in GraphQL schema

## [1.0.0] - 2024-07-14

### Added

- 🎉 **Initial Release** - Complete JavaScript SDK for Apito Engine HashiCorp plugins
- 🔌 **Plugin Class** - Core plugin functionality with clean API
- 📝 **GraphQL Support** - Easy registration of queries, mutations, and resolvers
- 🌐 **REST API Support** - Builder pattern for REST endpoints with schema validation
- ⚙️ **Custom Functions** - Register and execute custom business logic
- 🏥 **Health Checks** - Built-in and custom health monitoring
- 🛠️ **Helper Functions** - Comprehensive set of field, argument, and utility helpers
- 🔧 **Type System** - Structured GraphQL type definitions matching Go SDK
- 📦 **gRPC Integration** - Seamless HashiCorp go-plugin protocol support
- 🧪 **Testing Suite** - Complete Jest test coverage
- 📚 **Documentation** - Comprehensive README with examples
- 🏗️ **Object Type Builder** - Fluent interface for complex object types
- 🔄 **Argument Extraction** - Clean utilities for parameter handling
- 🎯 **Error Handling** - Robust error management and logging
- ⚡ **Performance** - Optimized for production use
- 🔐 **Security** - Proper input validation and error boundaries

### Features

- **Schema Registration**: GraphQL queries, mutations, and custom types
- **REST APIs**: GET, POST, PUT, DELETE, PATCH endpoints with schemas
- **Function Execution**: Custom business logic with context support
- **Health Monitoring**: Built-in health checks with custom extensions
- **Type Safety**: Structured type definitions for GraphQL compatibility
- **SDK Compatibility**: Drop-in replacement for raw plugin implementation
- **Developer Experience**: Clean API similar to Go SDK with JavaScript idioms

### Examples

- **Simple Plugin**: Complete example demonstrating all SDK features
- **Hello World Plugin**: Refactored from raw implementation to SDK usage
- **Test Suite**: Comprehensive testing examples

### Documentation

- **README**: Complete API documentation with examples
- **Helpers Guide**: Detailed helper function documentation
- **Examples**: Working plugin examples
- **Test Coverage**: Full test suite with mocking examples

### Performance

- **Memory Efficient**: Optimized object creation and cleanup
- **Fast Startup**: Quick plugin initialization and registration
- **Scalable**: Handles multiple concurrent requests efficiently

### Developer Tools

- **Jest Testing**: Complete test framework integration
- **ESLint Support**: Code quality and style checking
- **TypeScript Ready**: Can be used with TypeScript projects
- **Debugging**: Built-in logging and error reporting

---

## Future Releases

### Planned Features

- **TypeScript Support** - Native TypeScript definitions and examples
- **Advanced Validation** - Schema validation and runtime type checking
- **Middleware System** - Plugin middleware for request/response processing
- **Caching Layer** - Built-in caching for resolvers and functions
- **Metrics Collection** - Performance metrics and monitoring
- **Plugin Templates** - CLI tool for generating plugin boilerplate
- **Hot Reload** - Development mode with hot reloading
- **Database Integrations** - Built-in database connection helpers

### Version Compatibility

- **Engine Compatibility**: Works with Apito Engine v2.0+
- **Node.js Support**: Node.js 16+ (recommended: Node.js 18+)
- **gRPC Compatibility**: @grpc/grpc-js 1.8+

---

_This SDK was created to provide JavaScript developers with the same clean, powerful plugin development experience available in the Go SDK. The transformation from raw plugin implementation to SDK usage reduces boilerplate code by ~80% while maintaining full feature parity._
