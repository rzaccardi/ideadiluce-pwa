import { redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ room: string }>
}

export default async function AmbienteRoomPage({ params }: PageProps) {
  const { room } = await params
  redirect(`/catalog?world=design&category=${encodeURIComponent(room)}`)
}
