type JsonObject = Record<string, unknown>

const blackKeys = new Set([
  'options',
  'api',
  'data',
  'source',
  'className',
  'headerClassName',
  'footerClassName',
  'itemClassName',
  'labelClassName',
  'inputClassName',
  'bodyClassName',
  'style',
  'css',
  'asideClassName',
  'asideStyle',
  'messages',
  'placeholder',
  'value',
  'initApi',
  'rules',
  'initAsyncApi',
  'asyncApi',
  'themeCss',
])

export function getPureSchema<T>(schema: T): T {
  const schemaToProcess = cloneSchema(schema)
  if (Array.isArray(schemaToProcess)) {
    schemaToProcess.forEach((item) => pureSchemaHelper(item))
  } else {
    pureSchemaHelper(schemaToProcess)
  }
  return schemaToProcess
}

function cloneSchema<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneSchema(item)) as T
  }
  if (isJsonObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneSchema(entry)]),
    ) as T
  }
  return value
}

function pureSchemaHelper(
  schema: unknown,
  usedIds: Set<string> | null = null,
  collectedSchemas: JsonObject[] | null = null,
): void {
  if (!isJsonObject(schema) || schema instanceof RegExp) {
    return
  }
  const rootCollectedSchemas = collectedSchemas ?? []
  const rootUsedIds = usedIds ?? new Set<string>()
  const id = schema.id

  if (
    typeof id === 'string'
    && id.startsWith('u:')
    && !schema.themeCss
    && !schema.wrapperCustomStyle
  ) {
    rootCollectedSchemas.push(schema)
  }

  if (typeof schema.componentId === 'string') {
    rootUsedIds.add(schema.componentId)
  }

  for (const [key, value] of Object.entries(schema)) {
    if ((typeof value !== 'object' && typeof value !== 'function') || value instanceof RegExp) {
      continue
    }
    if (blackKeys.has(key)) {
      continue
    }
    if (Array.isArray(value)) {
      value.forEach((item) => pureSchemaHelper(item, rootUsedIds, rootCollectedSchemas))
    } else {
      pureSchemaHelper(value, rootUsedIds, rootCollectedSchemas)
    }
  }

  if (usedIds !== null) {
    return
  }

  rootCollectedSchemas.forEach((item) => {
    if (typeof item.id === 'string' && rootUsedIds.has(item.id)) {
      return
    }
    delete item.id
  })
}

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
