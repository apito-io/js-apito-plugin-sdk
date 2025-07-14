#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Clean and create dist directory
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy source files to dist
const srcDir = path.join(__dirname, 'src');
const files = fs.readdirSync(srcDir);

files.forEach(file => {
  const srcFile = path.join(srcDir, file);
  const destFile = path.join(distDir, file);
  
  if (fs.statSync(srcFile).isFile()) {
    let content = fs.readFileSync(srcFile, 'utf8');
    
    // For index.js, create both CommonJS and ESM versions
    if (file === 'index.js') {
      // Create CommonJS version (index.js)
      fs.writeFileSync(destFile, content);
      
      // Create ESM version (index.mjs)
      const esmContent = content
        .replace(/const \{ ([^}]+) \} = require\('([^']+)'\);/g, 'import { $1 } from \'$2\';')
        .replace(/module\.exports = \{/, 'export {')
        .replace(/\};$/, '};');
      
      fs.writeFileSync(path.join(distDir, 'index.mjs'), esmContent);
      
      // Create TypeScript definitions
      const dtsContent = generateTypeDefinitions();
      fs.writeFileSync(path.join(distDir, 'index.d.ts'), dtsContent);
    } else {
      // Copy other files as-is
      fs.writeFileSync(destFile, content);
    }
  }
});

function generateTypeDefinitions() {
  return `// Type definitions for @apito-io/js-apito-plugin-sdk
// Generated automatically by build script

export interface PluginConfig {
  name: string;
  version: string;
  apiKey: string;
}

export interface GraphQLField {
  type: any;
  description?: string;
  args?: Record<string, any>;
}

export interface RESTEndpoint {
  path: string;
  method: string;
  description?: string;
  requestSchema?: any;
  responseSchema?: any;
}

export interface Plugin {
  registerQuery(name: string, field: GraphQLField, resolver: Function): void;
  registerMutation(name: string, field: GraphQLField, resolver: Function): void;
  registerQueries(queries: Record<string, { field: GraphQLField; resolver: Function }>): void;
  registerMutations(mutations: Record<string, { field: GraphQLField; resolver: Function }>): void;
  registerRESTAPI(endpoint: RESTEndpoint, handler: Function): void;
  registerFunction(name: string, func: Function): void;
  registerFunctions(functions: Record<string, Function>): void;
  registerHealthCheck(healthCheckFn: Function): void;
  serve(): Promise<void>;
}

export function init(name: string, version: string, apiKey: string): Plugin;

// GraphQL field helpers
export function StringField(description?: string): GraphQLField;
export function IntField(description?: string): GraphQLField;
export function BooleanField(description?: string): GraphQLField;
export function FloatField(description?: string): GraphQLField;
export function IDField(description?: string): GraphQLField;
export function ListField(type: any, description?: string): GraphQLField;
export function NonNullField(type: any, description?: string): GraphQLField;
export function FieldWithArgs(type: any, args: Record<string, any>, description?: string): GraphQLField;

// GraphQL argument helpers
export function StringArg(description?: string): any;
export function IntArg(description?: string): any;
export function BooleanArg(description?: string): any;
export function FloatArg(description?: string): any;
export function IDArg(description?: string): any;
export function ObjectArg(description?: string): any;
export function ListArg(type: any, description?: string): any;
export function NonNullArg(type: any, description?: string): any;

// Type system helpers
export function createScalarType(name: string): any;
export function createNonNullType(type: any): any;
export function createListType(type: any): any;
export function createObjectType(name: string, fields: Record<string, any>): any;

// Object builder
export function NewObjectType(name: string): any;

// REST endpoint helpers
export function GETEndpoint(path: string, description?: string): any;
export function POSTEndpoint(path: string, description?: string): any;
export function PUTEndpoint(path: string, description?: string): any;
export function DELETEEndpoint(path: string, description?: string): any;
export function PATCHEndpoint(path: string, description?: string): any;

// Schema helpers
export function ObjectSchema(properties: Record<string, any>): any;
export function ArraySchema(items: any): any;
export function StringSchema(): any;
export function IntegerSchema(): any;
export function BooleanSchema(): any;
export function NumberSchema(): any;

// Utility functions
export function getStringArg(args: any, name: string, defaultValue?: string): string;
export function getIntArg(args: any, name: string, defaultValue?: number): number;
export function getBoolArg(args: any, name: string, defaultValue?: boolean): boolean;
export function getFloatArg(args: any, name: string, defaultValue?: number): number;
export function getObjectArg(args: any, name: string, defaultValue?: any): any;
export function getArrayArg(args: any, name: string, defaultValue?: any[]): any[];
export function getPathParam(req: any, name: string): string;
export function getQueryParam(req: any, name: string, defaultValue?: string): string;
export function getBodyParam(req: any, name: string, defaultValue?: any): any;
export function logRESTArgs(req: any): void;
`;
}

console.log('✅ Build completed successfully!');
console.log('📁 Files created in dist/:');
console.log('   - index.js (CommonJS)');
console.log('   - index.mjs (ESM)');
console.log('   - index.d.ts (TypeScript definitions)');
console.log('   - main.js');
console.log('   - helpers.js'); 