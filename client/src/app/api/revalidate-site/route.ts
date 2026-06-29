import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const tag = req.nextUrl.searchParams.get('tag')
  const slug = req.nextUrl.searchParams.get('slug')

  if (tag === 'product' && slug) {
    revalidateTag(`catalog-product:${slug}`)
    return NextResponse.json({ revalidated: true, tag: `catalog-product:${slug}`, now: Date.now() })
  }

  if (tag === 'category' && slug) {
    revalidateTag(`catalog-category:${slug}`)
    return NextResponse.json({ revalidated: true, tag: `catalog-category:${slug}`, now: Date.now() })
  }

  revalidateTag('site-cms')
  return NextResponse.json({ revalidated: true, tag: 'site-cms', now: Date.now() })
}
