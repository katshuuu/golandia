export type ApiFieldError = {
  field: string
  message: string
}

export type ApiValidationBody = {
  error?: string
  fields?: ApiFieldError[]
}

export class ApiValidationError extends Error {
  fields: ApiFieldError[]

  constructor(message: string, fields: ApiFieldError[]) {
    super(message)
    this.name = 'ApiValidationError'
    this.fields = fields
  }

  messageForField(field: string): string | undefined {
    return this.fields.find((f) => f.field === field)?.message
  }
}

export async function parseApiErrorResponse(res: Response): Promise<never> {
  const body = (await res.json().catch(() => ({}))) as ApiValidationBody
  if (body.fields?.length) {
    throw new ApiValidationError(body.error || 'Ошибка валидации', body.fields)
  }
  throw new Error(body.error || `Ошибка запроса (${res.status})`)
}
