const DATA_ENTITY = 'masterclass_notify_me_NM'
const PAGE_SIZE = 20
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function builderSchema(ctx: Context): string {
  const version = process.env.VTEX_APP_VERSION ?? '0.1.1'
  const workspace = ctx.vtex.workspace

  if (!workspace || workspace === 'master') {
    return version
  }

  // Builder publishes `{version}-{workspace}` (not schema.json title).
  return `${version}-${workspace}`
}

interface NotifyMeRecord {
  id?: string
  email: string
  skuid: string
  status: 'pending' | 'notified'
  createdAt?: string
}

function asString(value: unknown): string {
  if (Array.isArray(value)) {
    return asString(value[0])
  }

  return typeof value === 'string' ? value.trim() : ''
}

function parseUnknownBody(raw: unknown): Record<string, unknown> | null {
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return null
    }
  }

  if (Buffer.isBuffer(raw)) {
    return parseUnknownBody(raw.toString('utf8'))
  }

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }

  return null
}

async function requestBody(ctx: Context): Promise<Record<string, unknown>> {
  const fromRequest = parseUnknownBody((ctx.request as unknown as { body?: unknown }).body)

  if (fromRequest) {
    return fromRequest
  }

  const fromState = parseUnknownBody((ctx.state as { body?: unknown }).body)

  if (fromState) {
    return fromState
  }

  const chunks: Buffer[] = []

  try {
    for await (const chunk of ctx.req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
  } catch {
    return {}
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim()

  return parseUnknownBody(raw) ?? {}
}

export async function notifyMe(ctx: Context, next: () => Promise<void>) {
  if (ctx.method === 'POST') {
    await createNotifyMe(ctx)
  } else if (ctx.method === 'GET') {
    await listPending(ctx)
  } else {
    ctx.status = 405
    ctx.body = { message: 'Method not allowed' }
  }

  await next()
}

async function createNotifyMe(ctx: Context) {
  const body = await requestBody(ctx)
  const email = asString(body.email)
  const skuId = asString(body.skuId)

  if (!email || !EMAIL_PATTERN.test(email)) {
    ctx.status = 400
    ctx.body = { message: 'Missing or invalid body field: email' }

    return
  }

  if (!skuId) {
    ctx.status = 400
    ctx.body = { message: 'Missing body field: skuId' }

    return
  }

  const document: NotifyMeRecord = {
    email,
    skuid: skuId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  const created = await ctx.clients.masterdata.createDocument({
    dataEntity: DATA_ENTITY,
    schema: builderSchema(ctx),
    fields: document,
  })

  ctx.status = 201
  ctx.body = {
    id: created.DocumentId ?? created.Id,
    email,
    skuId,
    status: document.status,
    createdAt: document.createdAt,
  }
}

async function listPending(ctx: Context) {
  const skuId = asString(ctx.query.skuId)

  if (!skuId) {
    ctx.status = 400
    ctx.body = { message: 'Missing query param: skuId' }

    return
  }

  const pageRaw = asString(ctx.query.page)
  const page = Math.max(1, Number.parseInt(pageRaw || '1', 10) || 1)

  const documents = await ctx.clients.masterdata.searchDocuments<NotifyMeRecord>({
    dataEntity: DATA_ENTITY,
    schema: builderSchema(ctx),
    fields: ['id', 'email', 'skuid', 'status', 'createdAt'],
    where: `skuid=${skuId} AND status=pending`,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
    },
  })

  ctx.status = 200
  ctx.body = {
    skuId,
    page,
    pageSize: PAGE_SIZE,
    data: documents.map((doc) => ({
      id: doc.id,
      email: doc.email,
      skuId: doc.skuid,
      status: doc.status,
      createdAt: doc.createdAt,
    })),
  }
}

